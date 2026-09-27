import type { RoomState, Player, GuessMessage, RoomSettings } from '../types/game';

import { generateRoomCode, hashWord } from './crypto';
import { isSupabaseConfigured, supabase } from './supabase';

const ROOM_STORAGE_KEY_PREFIX = 'drawrush_room_';
const PLAYER_STORAGE_KEY_PREFIX = 'drawrush_player_';
const MESSAGES_STORAGE_KEY_PREFIX = 'drawrush_msg_';

// Helper for LocalStorage state (for Local Tab Sync Mode)
export function getLocalRoom(roomCode: string): RoomState | null {
  const data = localStorage.getItem(ROOM_STORAGE_KEY_PREFIX + roomCode);
  return data ? JSON.parse(data) : null;
}

export function saveLocalRoom(room: RoomState): void {
  localStorage.setItem(ROOM_STORAGE_KEY_PREFIX + room.roomCode, JSON.stringify(room));
}

export function getLocalPlayers(roomCode: string): Player[] {
  const data = localStorage.getItem(PLAYER_STORAGE_KEY_PREFIX + roomCode);
  return data ? JSON.parse(data) : [];
}

export function saveLocalPlayers(roomCode: string, players: Player[]): void {
  localStorage.setItem(PLAYER_STORAGE_KEY_PREFIX + roomCode, JSON.stringify(players));
}

export function getLocalMessages(roomCode: string): GuessMessage[] {
  const data = localStorage.getItem(MESSAGES_STORAGE_KEY_PREFIX + roomCode);
  return data ? JSON.parse(data) : [];
}

export function saveLocalMessages(roomCode: string, msgs: GuessMessage[]): void {
  localStorage.setItem(MESSAGES_STORAGE_KEY_PREFIX + roomCode, JSON.stringify(msgs));
}

// -------------------------------------------------------------
// ROOM MANAGEMENT
// -------------------------------------------------------------

export async function createGameRoom(
  hostName: string,
  avatar: string,
  hostPlayerId: string,
  settings: RoomSettings
): Promise<{ room: RoomState; player: Player }> {
  const roomCode = generateRoomCode();
  const now = Date.now();

  const room: RoomState = {
    id: 'r_' + Math.random().toString(36).substring(2, 9),
    roomCode,
    hostPlayerId,
    status: 'LOBBY',
    maxPlayers: settings.maxPlayers,
    rounds: settings.rounds,
    turnDuration: settings.turnDuration,
    difficulty: settings.difficulty,
    customWords: settings.customWords || [],
    currentRound: 1,
    currentTurn: 0,
    currentDrawerId: null,
    wordHash: null,
    wordLength: null,
    wordCategory: null,
    secretWordReveal: null,
    turnStartedAt: null,
    turnEndsAt: null,
    createdAt: now,
  };

  const hostPlayer: Player = {
    id: hostPlayerId,
    roomId: room.id,
    name: hostName,
    avatar,
    score: 0,
    isHost: true,
    isConnected: true,
    hasGuessedCorrect: false,
    joinedAt: now,
  };

  // 1. If Supabase configured, write to Postgres DB
  if (isSupabaseConfigured() && supabase) {
    const { data: dbRoom, error: roomErr } = await supabase
      .from('rooms')
      .insert([
        {
          room_code: room.roomCode,
          host_player_id: hostPlayer.id,
          status: room.status,
          max_players: room.maxPlayers,
          rounds: room.rounds,
          turn_duration: room.turnDuration,
          difficulty: room.difficulty,
          custom_words: room.customWords,
          current_round: 1,
          current_turn: 0,
        },
      ])
      .select()
      .single();

    if (roomErr) {
      console.error('Failed to insert room in Supabase:', roomErr);
    } else if (dbRoom) {
      room.id = dbRoom.id;
      hostPlayer.roomId = dbRoom.id;
      await supabase.from('players').insert([
        {
          id: hostPlayer.id,
          room_id: dbRoom.id,
          name: hostPlayer.name,
          avatar: hostPlayer.avatar,
          score: 0,
          is_host: true,
          is_connected: true,
        },
      ]);
    }
  }

  // Save to local storage for instant multi-tab fallback
  saveLocalRoom(room);
  saveLocalPlayers(roomCode, [hostPlayer]);
  saveLocalMessages(roomCode, []);

  return { room, player: hostPlayer };
}

export async function joinGameRoom(
  roomCode: string,
  playerName: string,
  avatar: string,
  playerId: string
): Promise<{ room: RoomState; player: Player; players: Player[] }> {
  const formattedCode = roomCode.toUpperCase().trim();

  let room: RoomState | null = null;
  let players: Player[] = [];

  // Fetch room state from Supabase or LocalStorage
  if (isSupabaseConfigured() && supabase) {
    const { data: dbRoom, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', formattedCode)
      .single();

    if (error || !dbRoom) {
      throw new Error('This room code does not exist. Please check the code and try again.');
    }

    if (dbRoom.status === 'ENDED') {
      throw new Error('This game has already ended.');
    }

    const { data: dbPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', dbRoom.id);

    const activePlayers = dbPlayers || [];
    if (activePlayers.length >= dbRoom.max_players && !activePlayers.some((p) => p.id === playerId)) {
      throw new Error('This room is currently full (' + dbRoom.max_players + '/' + dbRoom.max_players + ').');
    }

    room = {
      id: dbRoom.id,
      roomCode: dbRoom.room_code,
      hostPlayerId: dbRoom.host_player_id,
      status: dbRoom.status as any,
      maxPlayers: dbRoom.max_players,
      rounds: dbRoom.rounds,
      turnDuration: dbRoom.turn_duration,
      difficulty: dbRoom.difficulty as any,
      customWords: dbRoom.custom_words || [],
      currentRound: dbRoom.current_round,
      currentTurn: dbRoom.current_turn,
      currentDrawerId: dbRoom.current_drawer_id,
      wordHash: dbRoom.word_hash,
      wordLength: dbRoom.word_length,
      wordCategory: dbRoom.word_category,
      secretWordReveal: dbRoom.secret_word_reveal,
      turnStartedAt: dbRoom.turn_started_at ? new Date(dbRoom.turn_started_at).getTime() : null,
      turnEndsAt: dbRoom.turn_ends_at ? new Date(dbRoom.turn_ends_at).getTime() : null,
      createdAt: new Date(dbRoom.created_at).getTime(),
    };

    players = activePlayers.map((p) => ({
      id: p.id,
      roomId: p.room_id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isHost: p.is_host,
      isConnected: p.is_connected,
      hasGuessedCorrect: p.has_guessed_correct || false,
      joinedAt: new Date(p.joined_at).getTime(),
    }));
  } else {
    room = getLocalRoom(formattedCode);
    if (!room) {
      throw new Error('Room not found! You are currently in "Local Tab Mode". To join rooms across different devices/phones over the internet, please set your Supabase environment variables on Vercel!');
    }

    if (room.status === 'ENDED') {
      throw new Error('This game has already ended.');
    }
    players = getLocalPlayers(formattedCode);
    if (players.length >= room.maxPlayers && !players.some((p) => p.id === playerId)) {
      throw new Error(`This room is full (${room.maxPlayers}/${room.maxPlayers}).`);
    }
  }

  // Check if player already exists in room (reconnection flow)
  const existingPlayer = players.find((p) => p.id === playerId);
  let player: Player;

  if (existingPlayer) {
    player = { ...existingPlayer, name: playerName, avatar, isConnected: true };
    players = players.map((p) => (p.id === playerId ? player : p));
  } else {
    player = {
      id: playerId,
      roomId: room.id,
      name: playerName,
      avatar,
      score: 0,
      isHost: players.length === 0,
      isConnected: true,
      hasGuessedCorrect: false,
      joinedAt: Date.now(),
    };
    players.push(player);
  }

  // If room had no host, assign host
  if (!players.some((p) => p.isHost)) {
    player.isHost = true;
    room.hostPlayerId = player.id;
  }

  // Update DB or LocalStorage
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('players').upsert({
      id: player.id,
      room_id: room.id,
      name: player.name,
      avatar: player.avatar,
      score: player.score,
      is_host: player.isHost,
      is_connected: true,
    });
  }

  saveLocalRoom(room);
  saveLocalPlayers(formattedCode, players);

  return { room, player, players };
}

// Check guess string against anti-cheat word hash
export async function verifyGuess(guessText: string, wordHash: string | null): Promise<boolean> {
  if (!wordHash || !guessText) return false;
  const hash = await hashWord(guessText);
  return hash === wordHash;
}
