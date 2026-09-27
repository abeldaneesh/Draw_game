import type { RoomState, Player, GuessMessage, RoomSettings } from '../types/game';

import { generateRoomCode, hashWord, generatePlayerId } from './crypto';
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
      throw new Error(`Cloud Room Creation Error: ${roomErr.message}. Make sure table schemas exist in your Supabase SQL Editor!`);
    } else if (dbRoom) {
      room.id = dbRoom.id;
      hostPlayer.roomId = dbRoom.id;
    const { error: playerErr } = await supabase.from('players').upsert(
      [
        {
          id: hostPlayer.id,
          room_id: dbRoom.id,
          name: hostPlayer.name,
          avatar: hostPlayer.avatar,
          score: 0,
          is_host: true,
          is_connected: true,
        },
      ],
      { onConflict: 'id' }
    );
      if (playerErr) {
        console.error('Failed to insert host player in Supabase:', playerErr);
        throw new Error(`Cloud Player Insertion Error: ${playerErr.message}`);
      }
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
  let cleanCode = roomCode.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  if (cleanCode.length === 4 && !cleanCode.startsWith('DRW')) {
    cleanCode = 'DRW' + cleanCode;
  }
  const formattedCode = cleanCode.length >= 7
    ? cleanCode.slice(0, 3) + '-' + cleanCode.slice(3, 7)
    : cleanCode;

  let room: RoomState | null = null;
  let players: Player[] = [];

  // Fetch room state from Supabase or LocalStorage
  if (isSupabaseConfigured() && supabase) {
    const { data: dbRoom, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', formattedCode)
      .maybeSingle();

    if (error || !dbRoom) {
      // Fallback to local storage if room was created locally
      const localRoom = getLocalRoom(formattedCode);
      if (!localRoom) {
        if (error && error.code === '42P01') {
          throw new Error('Database Error: Table "public.rooms" does not exist! Please execute supabase/schema.sql in your Supabase SQL Editor.');
        }
        throw new Error(`Room code "${formattedCode}" does not exist. Note: Incognito windows cannot share LocalStorage with normal tabs. To test across Incognito/devices, please click "Configure Supabase Cloud Sync"!`);
      }
      room = localRoom;
      players = getLocalPlayers(formattedCode);
    } else {
      if (dbRoom.status === 'ENDED') {
        throw new Error('This game has already ended.');
      }

      // Expiration check: If room was created > 24 hours ago and is still in LOBBY, auto-expire it
      const createdAtMs = new Date(dbRoom.created_at).getTime();
      if (Date.now() - createdAtMs > 24 * 60 * 60 * 1000 && dbRoom.status === 'LOBBY') {
        await supabase.from('rooms').update({ status: 'ENDED' }).eq('id', dbRoom.id);
        throw new Error(`Room "${formattedCode}" has expired.`);
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

      const { data: dbPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', dbRoom.id);

      const activePlayers = dbPlayers || [];

      // Safeguard: Prevent player ID collision with existing room players (e.g. cloned tab testing)
      let finalPlayerId = playerId;
      const existingSameIdPlayer = activePlayers.find((p) => p.id === finalPlayerId);
      if (
        existingSameIdPlayer &&
        existingSameIdPlayer.name.trim().toLowerCase() !== playerName.trim().toLowerCase()
      ) {
        finalPlayerId = generatePlayerId();
      }

      if (activePlayers.length >= dbRoom.max_players && !activePlayers.some((p) => p.id === finalPlayerId)) {
        throw new Error('This room is currently full (' + dbRoom.max_players + '/' + dbRoom.max_players + ').');
      }

      const existingInDb = activePlayers.find((p) => p.id === finalPlayerId);
      const isPlayerHost = finalPlayerId === dbRoom.host_player_id;

      const joiningPlayer: Player = {
        id: finalPlayerId,
        roomId: dbRoom.id,
        name: playerName,
        avatar: avatar,
        score: existingInDb ? existingInDb.score : 0,
        isHost: isPlayerHost,
        isConnected: true,
        hasGuessedCorrect: false,
        joinedAt: existingInDb && existingInDb.joined_at ? new Date(existingInDb.joined_at).getTime() : Date.now(),
      };

      const { error: playerUpsertErr } = await supabase.from('players').upsert(
        {
          id: finalPlayerId,
          room_id: dbRoom.id,
          name: playerName,
          avatar: avatar,
          score: joiningPlayer.score,
          is_host: isPlayerHost,
          is_connected: true,
        },
        { onConflict: 'id' }
      );

      if (playerUpsertErr) {
        console.error('[DrawRush] Failed to insert player in Supabase:', playerUpsertErr);
        throw new Error(`Cloud Join Error: ${playerUpsertErr.message}. Make sure RLS policies are enabled in your Supabase SQL Editor!`);
      }

      const { data: updatedDbPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', dbRoom.id)
        .order('joined_at', { ascending: true });

      let fetchedPlayers = (updatedDbPlayers || []).map((p) => ({
        id: p.id,
        roomId: p.room_id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.id === dbRoom.host_player_id,
        isConnected: p.is_connected,
        hasGuessedCorrect: p.has_guessed_correct || false,
        joinedAt: p.joined_at ? new Date(p.joined_at).getTime() : Date.now(),
      }));

      if (!fetchedPlayers.some((p) => p.id === finalPlayerId)) {
        fetchedPlayers.push(joiningPlayer);
      }
      players = fetchedPlayers;
    }
  } else {
    room = getLocalRoom(formattedCode);
    if (!room) {
      throw new Error('Room not found! You are currently in "Local Tab Mode". To join rooms across different devices/phones over the internet, please set your Supabase environment variables on Vercel!');
    }

    if (room.status === 'ENDED') {
      throw new Error('This game has already ended.');
    }
    players = getLocalPlayers(formattedCode);

    // Safeguard: Prevent player ID collision in local storage mode
    let finalPlayerId = playerId;
    const hostPlayerInLocal = players.find((p) => p.id === room!.hostPlayerId);
    if (
      hostPlayerInLocal &&
      hostPlayerInLocal.id === finalPlayerId &&
      hostPlayerInLocal.name.trim().toLowerCase() !== playerName.trim().toLowerCase()
    ) {
      finalPlayerId = generatePlayerId();
    }

    if (players.length >= room!.maxPlayers && !players.some((p) => p.id === finalPlayerId)) {
      throw new Error(`This room is full (${room!.maxPlayers}/${room!.maxPlayers}).`);
    }

    const existingIndex = players.findIndex((p) => p.id === finalPlayerId);
    if (existingIndex >= 0) {
      players[existingIndex] = {
        ...players[existingIndex],
        name: playerName,
        avatar,
        isConnected: true,
        isHost: finalPlayerId === room!.hostPlayerId,
      };
    } else {
      players.push({
        id: finalPlayerId,
        roomId: room!.id,
        name: playerName,
        avatar,
        score: 0,
        isHost: finalPlayerId === room!.hostPlayerId,
        isConnected: true,
        hasGuessedCorrect: false,
        joinedAt: Date.now(),
      });
    }
  }

  // Ensure isHost on all player objects is strictly derived from room.hostPlayerId
  players = players.map((p) => ({
    ...p,
    isHost: p.id === room!.hostPlayerId,
  }));

  const player = players.find((p) => p.id === playerId) || {
    id: playerId,
    roomId: room.id,
    name: playerName,
    avatar,
    score: 0,
    isHost: playerId === room.hostPlayerId,
    isConnected: true,
    hasGuessedCorrect: false,
    joinedAt: Date.now(),
  };

  saveLocalRoom(room);
  saveLocalPlayers(formattedCode, players);

  return { room, player, players };
}

export async function leaveGameRoom(
  room: RoomState,
  playerId: string
): Promise<{ newHostId: string | null; remainingPlayers: Player[] }> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('players').delete().eq('id', playerId).eq('room_id', room.id);
  }

  let remaining = isSupabaseConfigured()
    ? (await fetchCloudPlayers(room.id, room.hostPlayerId)).filter((p) => p.id !== playerId)
    : getLocalPlayers(room.roomCode).filter((p) => p.id !== playerId);

  let newHostId: string | null = room.hostPlayerId;

  // Perform host transfer ONLY if the host left
  if (playerId === room.hostPlayerId) {
    if (remaining.length > 0) {
      // Deterministic transfer to earliest remaining player
      remaining.sort((a, b) => a.joinedAt - b.joinedAt);
      newHostId = remaining[0].id;
      room.hostPlayerId = newHostId;

      if (isSupabaseConfigured() && supabase) {
        await supabase.from('rooms').update({ host_player_id: newHostId }).eq('id', room.id);
        await supabase.from('players').update({ is_host: true }).eq('id', newHostId);
      }
    } else {
      newHostId = null;
    }
  }

  const updatedPlayers = remaining.map((p) => ({
    ...p,
    isHost: p.id === newHostId,
  }));

  saveLocalRoom(room);
  saveLocalPlayers(room.roomCode, updatedPlayers);

  return { newHostId, remainingPlayers: updatedPlayers };
}

// Check guess string against anti-cheat word hash
export async function verifyGuess(guessText: string, wordHash: string | null): Promise<boolean> {
  if (!wordHash || !guessText) return false;
  const hash = await hashWord(guessText);
  return hash === wordHash;
}

export async function fetchCloudPlayers(roomId: string, hostPlayerId?: string): Promise<Player[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id,
    roomId: p.room_id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    isHost: hostPlayerId ? p.id === hostPlayerId : p.is_host,
    isConnected: p.is_connected,
    hasGuessedCorrect: p.has_guessed_correct || false,
    joinedAt: new Date(p.joined_at).getTime(),
  }));
}

export async function fetchCloudRoom(roomId: string): Promise<RoomState | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data: dbRoom, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();
  if (error || !dbRoom) return null;
  return {
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
}

export async function updateCloudRoom(roomId: string, updates: Partial<RoomState>): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.currentRound !== undefined) payload.current_round = updates.currentRound;
  if (updates.currentTurn !== undefined) payload.current_turn = updates.currentTurn;
  if (updates.currentDrawerId !== undefined) payload.current_drawer_id = updates.currentDrawerId;
  if (updates.wordHash !== undefined) payload.word_hash = updates.wordHash;
  if (updates.wordLength !== undefined) payload.word_length = updates.wordLength;
  if (updates.wordCategory !== undefined) payload.word_category = updates.wordCategory;
  if (updates.turnStartedAt !== undefined) payload.turn_started_at = updates.turnStartedAt ? new Date(updates.turnStartedAt).toISOString() : null;
  if (updates.turnEndsAt !== undefined) payload.turn_ends_at = updates.turnEndsAt ? new Date(updates.turnEndsAt).toISOString() : null;
  if (updates.rounds !== undefined) payload.rounds = updates.rounds;
  if (updates.turnDuration !== undefined) payload.turn_duration = updates.turnDuration;
  if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
  if (updates.customWords !== undefined) payload.custom_words = updates.customWords;

  if (Object.keys(payload).length > 0) {
    await supabase.from('rooms').update(payload).eq('id', roomId);
  }
}
