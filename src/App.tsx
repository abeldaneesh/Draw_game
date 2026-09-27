import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomState, Player, GuessMessage, WordOption, RoomSettings } from './types/game';
import { generatePlayerId, hashWord } from './lib/crypto';
import { getRandomWords } from './data/words';
import { calculateGuesserScore, calculateDrawerBonus } from './lib/scoring';
import {
  createGameRoom,
  joinGameRoom,
  verifyGuess,
  saveLocalRoom,
  saveLocalPlayers,
  fetchCloudPlayers,
  fetchCloudRoom,
  updateCloudRoom,
} from './lib/gameLogic';
import { isSupabaseConfigured } from './lib/supabase';

import { MultiplayerChannel } from './lib/broadcast';
import { soundManager } from './lib/audio';

import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Results } from './components/Results';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export const App: React.FC = () => {
  // Session Player ID
  const [playerId] = useState<string>(() => {
    let id = sessionStorage.getItem('drawrush_player_id');
    if (!id) {
      id = generatePlayerId();
      sessionStorage.setItem('drawrush_player_id', id);
    }
    return id;
  });

  // Game Engine Core State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<GuessMessage[]>([]);

  // Channel & Realtime Sync
  const [channel, setChannel] = useState<MultiplayerChannel | null>(null);

  // Turn Execution State
  const [secretWordOptions, setSecretWordOptions] = useState<WordOption[]>([]);
  const [drawerSecretWord, setDrawerSecretWord] = useState<string | null>(null);
  const [isChoosingWord, setIsChoosingWord] = useState<boolean>(false);
  const [isTurnRecap, setIsTurnRecap] = useState<boolean>(false);
  const [recapSecretWord, setRecapSecretWord] = useState<string>('');

  // UI Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Ref tracking current active state for callbacks
  const roomRef = useRef<RoomState | null>(room);
  roomRef.current = room;
  const playersRef = useRef<Player[]>(players);
  playersRef.current = players;
  const drawerSecretWordRef = useRef<string | null>(drawerSecretWord);
  drawerSecretWordRef.current = drawerSecretWord;

  // 1. Check URL Hash for direct Room Link (e.g. #room=DRW-8K4P)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('room=')) {
      const code = hash.split('room=')[1].split('&')[0];
      if (code) setInitialRoomCode(code.toUpperCase());
    }
  }, []);

  // 2. Setup Broadcast Channel Subscription for Room
  const setupChannel = useCallback((roomCode: string) => {
    if (channel) channel.close();

    const ch = new MultiplayerChannel(roomCode);

    // Sync Room State
    ch.on('room_state_update', (newRoom: RoomState) => {
      setRoom(newRoom);
      roomRef.current = newRoom;
    });

    // Sync Players List
    ch.on('players_update', (newPlayers: Player[]) => {
      if (newPlayers && Array.isArray(newPlayers)) {
        setPlayers((prev) => {
          if (newPlayers.length > prev.length) soundManager.playJoinSound();
          return newPlayers;
        });
      }
    });

    // Player Joined Event
    ch.on('player_joined', ({ players: updatedPlayers }) => {
      if (updatedPlayers && Array.isArray(updatedPlayers)) {
        setPlayers((prev) => {
          if (updatedPlayers.length > prev.length) soundManager.playJoinSound();
          return updatedPlayers;
        });
      }
    });

    // Host Transferred Event
    ch.on('host_transferred', ({ newHostId, players: updatedPlayers }) => {
      setRoom((prev) => (prev ? { ...prev, hostPlayerId: newHostId } : null));
      if (updatedPlayers && Array.isArray(updatedPlayers)) {
        setPlayers(updatedPlayers);
      }
    });

    // Cloud Database Change Event
    ch.on('cloud_db_change', async () => {
      if (roomRef.current) {
        const cloudRoom = await fetchCloudRoom(roomRef.current.id);
        const hostId = cloudRoom ? cloudRoom.hostPlayerId : roomRef.current.hostPlayerId;
        const cloudPlayers = await fetchCloudPlayers(roomRef.current.id, hostId);

        if (cloudPlayers.length > 0) {
          const freshPlayers = cloudPlayers.map((p) => ({
            ...p,
            isHost: p.id === hostId,
          }));
          setPlayers((prev) => {
            if (freshPlayers.length > prev.length) soundManager.playJoinSound();
            return freshPlayers;
          });
        }
        if (cloudRoom) {
          setRoom(cloudRoom);
          roomRef.current = cloudRoom;
        }
      }
    });

    // Sync Chat Messages
    ch.on('chat_message', (msg: GuessMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.isCorrect) {
        soundManager.playCorrectGuessSound();
      }
    });

    // Drawer Chosen Secret Word Prompt
    ch.on('drawer_word_chosen', ({ wordLength, wordCategory, turnEndsAt }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              wordLength,
              wordCategory,
              turnEndsAt,
              turnStartedAt: Date.now(),
            }
          : null
      );
      setIsChoosingWord(false);
    });

    // Turn Recap Trigger
    ch.on('turn_ended', ({ secretWord }) => {
      setRecapSecretWord(secretWord);
      setIsTurnRecap(true);
      soundManager.playTurnEndSound();

      setTimeout(() => {
        setIsTurnRecap(false);
      }, 4000);
    });

    // Player Kicked Notice
    ch.on('player_kicked', ({ kickedPlayerId }) => {
      if (kickedPlayerId === playerId) {
        alert('You were removed from the room by the host.');
        window.location.reload();
      }
    });

    setChannel(ch);
    return ch;
  }, [playerId]);

  // Periodic Cloud Sync Polling while inside a room
  useEffect(() => {
    if (!room || !isSupabaseConfigured()) return;

    const syncState = async () => {
      if (!room.id) return;

      const cloudRoom = await fetchCloudRoom(room.id);
      const hostId = cloudRoom ? cloudRoom.hostPlayerId : room.hostPlayerId;
      const cloudPlayers = await fetchCloudPlayers(room.id, hostId);

      if (cloudPlayers.length > 0) {
        const freshPlayers = cloudPlayers.map((p) => ({
          ...p,
          isHost: p.id === hostId,
        }));
        setPlayers((prev) => {
          if (freshPlayers.length > prev.length) soundManager.playJoinSound();
          return freshPlayers;
        });
      }

      if (cloudRoom) {
        setRoom((prev) => {
          if (!prev) return cloudRoom;
          if (
            prev.status !== cloudRoom.status ||
            prev.currentDrawerId !== cloudRoom.currentDrawerId ||
            prev.currentRound !== cloudRoom.currentRound ||
            prev.hostPlayerId !== cloudRoom.hostPlayerId
          ) {
            return cloudRoom;
          }
          return prev;
        });
      }
    };

    const interval = setInterval(syncState, 2000);
    return () => clearInterval(interval);
  }, [room?.id]);

  // Cleanup Channel on Unmount
  useEffect(() => {
    return () => {
      if (channel) channel.close();
    };
  }, [channel]);

  // -------------------------------------------------------------------
  // GAME ACTION HANDLERS
  // -------------------------------------------------------------------

  // 1. Create Room
  const handleCreateRoom = async (name: string, avatar: string, settings: RoomSettings) => {
    try {
      const { room: newRoom, player } = await createGameRoom(name, avatar, playerId, settings);
      roomRef.current = newRoom;
      playersRef.current = [player];
      setRoom(newRoom);
      setCurrentPlayer(player);
      setPlayers([player]);

      setupChannel(newRoom.roomCode);
      window.location.hash = `room=${newRoom.roomCode}`;

    } catch (err: any) {
      alert(err.message || 'Failed to create room.');
    }
  };

  // 2. Join Room
  const handleJoinRoom = async (name: string, avatar: string, code: string) => {
    try {
      const { room: joinedRoom, player, players: roomPlayers } = await joinGameRoom(
        code,
        name,
        avatar,
        playerId
      );

      roomRef.current = joinedRoom;
      playersRef.current = roomPlayers;
      setRoom(joinedRoom);
      setCurrentPlayer(player);
      setPlayers(roomPlayers);

      const ch = setupChannel(joinedRoom.roomCode);
      ch.send('player_joined', { player, players: roomPlayers });
      ch.send('players_update', roomPlayers);

      window.location.hash = `room=${joinedRoom.roomCode}`;
    } catch (err: any) {
      alert(err.message || 'Failed to join room.');
    }
  };

  // 3. Update Host Settings
  const handleUpdateSettings = async (newSettings: Partial<RoomState>) => {
    if (!room || currentPlayer?.id !== room.hostPlayerId) return;

    const updatedRoom: RoomState = { ...room, ...newSettings };
    setRoom(updatedRoom);
    saveLocalRoom(updatedRoom);
    channel?.send('room_state_update', updatedRoom);
    await updateCloudRoom(room.id, newSettings);
  };

  // 4. Kick Player (Host action)
  const handleKickPlayer = (kickedId: string) => {
    if (!room || currentPlayer?.id !== room.hostPlayerId) return;

    const updatedPlayers = players.filter((p) => p.id !== kickedId);
    setPlayers(updatedPlayers);
    saveLocalPlayers(room.roomCode, updatedPlayers);

    channel?.send('players_update', updatedPlayers);
    channel?.send('player_kicked', { kickedPlayerId: kickedId });
  };

  // 5. Start Game (Host action)
  const handleStartGame = async () => {
    if (!room || currentPlayer?.id !== room.hostPlayerId || players.length < 2) return;

    // Reset scores & status
    const resetPlayers = players.map((p) => ({
      ...p,
      score: 0,
      hasGuessedCorrect: false,
    }));

    const firstDrawer = resetPlayers[0];

    const startedRoom: RoomState = {
      ...room,
      status: 'PLAYING',
      currentRound: 1,
      currentTurn: 0,
      currentDrawerId: firstDrawer.id,
      turnStartedAt: null,
      turnEndsAt: null,
    };

    setRoom(startedRoom);
    setPlayers(resetPlayers);
    saveLocalRoom(startedRoom);
    saveLocalPlayers(room.roomCode, resetPlayers);

    channel?.send('room_state_update', startedRoom);
    channel?.send('players_update', resetPlayers);

    await updateCloudRoom(room.id, {
      status: 'PLAYING',
      currentRound: 1,
      currentTurn: 0,
      currentDrawerId: firstDrawer.id,
    });

    // Trigger first turn word choice
    prepareTurnWordChoice(startedRoom, resetPlayers);
  };

  // 6. Turn Preparation: Word Choice Prompt
  const prepareTurnWordChoice = async (activeRoom: RoomState, activePlayers: Player[]) => {
    const drawer = activePlayers.find((p) => p.id === activeRoom.currentDrawerId);
    if (!drawer) return;

    // Reset player turn correct statuses
    const turnPlayers = activePlayers.map((p) => ({ ...p, hasGuessedCorrect: false }));
    setPlayers(turnPlayers);
    channel?.send('players_update', turnPlayers);

    if (playerId === drawer.id) {
      // Generate 3 word choices for drawer
      const wordChoices = getRandomWords(3, activeRoom.difficulty, activeRoom.customWords);
      setSecretWordOptions(wordChoices);
      setIsChoosingWord(true);
    }
  };

  // 7. Drawer Selects Word
  const handleSelectWord = async (option: WordOption) => {
    if (!room || currentPlayer?.id !== room.currentDrawerId) return;

    const secretWord = option.word.toUpperCase().trim();
    const hash = await hashWord(secretWord);
    const turnEndsAt = Date.now() + room.turnDuration * 1000;

    setDrawerSecretWord(secretWord);
    setIsChoosingWord(false);

    const updatedRoom: RoomState = {
      ...room,
      wordHash: hash,
      wordLength: secretWord.length,
      wordCategory: option.category,
      turnStartedAt: Date.now(),
      turnEndsAt,
    };

    setRoom(updatedRoom);
    saveLocalRoom(updatedRoom);

    channel?.send('room_state_update', updatedRoom);
    channel?.send('drawer_word_chosen', {
      wordLength: secretWord.length,
      wordCategory: option.category,
      turnEndsAt,
    });
  };

  // 8. Handle Guesses
  const handleSendGuess = async (guessText: string) => {
    if (!room || !currentPlayer || currentPlayer.id === room.currentDrawerId) return;

    // Verify guess against anti-cheat hash
    const isCorrect = await verifyGuess(guessText, room.wordHash);

    if (isCorrect) {
      // Calculate score points for guesser
      const correctCountSoFar = players.filter((p) => p.hasGuessedCorrect).length + 1;
      const now = Date.now();
      const timeRemaining = room.turnEndsAt ? Math.max(0, Math.ceil((room.turnEndsAt - now) / 1000)) : 0;
      const pointsEarned = calculateGuesserScore(correctCountSoFar, timeRemaining, room.turnDuration);

      // Award points to guesser and bonus to drawer
      const drawerBonus = calculateDrawerBonus();
      const updatedPlayers = players.map((p) => {
        if (p.id === currentPlayer.id) {
          return { ...p, score: p.score + pointsEarned, hasGuessedCorrect: true };
        }
        if (p.id === room.currentDrawerId) {
          return { ...p, score: p.score + drawerBonus };
        }
        return p;
      });

      setPlayers(updatedPlayers);
      setCurrentPlayer((prev) => (prev ? { ...prev, hasGuessedCorrect: true, score: prev.score + pointsEarned } : null));
      saveLocalPlayers(room.roomCode, updatedPlayers);

      channel?.send('players_update', updatedPlayers);

      // Broadcast system correct guess chat notification
      const correctMsg: GuessMessage = {
        id: Math.random().toString(36).substring(2, 9),
        roomId: room.id,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        guess: `${currentPlayer.name} guessed the word! (+${pointsEarned} pts)`,
        isCorrect: true,
        isSystem: true,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, correctMsg]);
      channel?.send('chat_message', correctMsg);

      // If ALL non-drawer players have guessed correct, finish turn early!
      const nonDrawers = updatedPlayers.filter((p) => p.id !== room.currentDrawerId);
      if (nonDrawers.every((p) => p.hasGuessedCorrect)) {
        handleTurnEnd();
      }
    } else {
      // Normal incorrect chat message
      const wrongMsg: GuessMessage = {
        id: Math.random().toString(36).substring(2, 9),
        roomId: room.id,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        guess: guessText,
        isCorrect: false,
        isSystem: false,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, wrongMsg]);
      soundManager.playWrongGuessSound();
      channel?.send('chat_message', wrongMsg);
    }
  };

  // 9. Handle Turn End (Timer expired or everyone guessed)
  const handleTurnEnd = useCallback(() => {
    const currentRoom = roomRef.current;
    if (!currentRoom || currentRoom.status !== 'PLAYING') return;

    const secretWord = drawerSecretWordRef.current || 'SECRET WORD';

    // Broadcast reveal & turn recap
    channel?.send('turn_ended', { secretWord });
    setRecapSecretWord(secretWord);
    setIsTurnRecap(true);
    soundManager.playTurnEndSound();

    setTimeout(() => {
      setIsTurnRecap(false);
      setDrawerSecretWord(null);

      // Rotate Drawer / Increment Turn
      const activePlayers = playersRef.current;
      const currentTurnIndex = currentRoom.currentTurn;
      const nextTurnIndex = currentTurnIndex + 1;

      if (nextTurnIndex < activePlayers.length) {
        // Next player in current round
        const nextDrawer = activePlayers[nextTurnIndex];
        const nextRoom: RoomState = {
          ...currentRoom,
          currentTurn: nextTurnIndex,
          currentDrawerId: nextDrawer.id,
          wordHash: null,
          wordLength: null,
          wordCategory: null,
          turnStartedAt: null,
          turnEndsAt: null,
        };
        setRoom(nextRoom);
        saveLocalRoom(nextRoom);
        channel?.send('room_state_update', nextRoom);
        prepareTurnWordChoice(nextRoom, activePlayers);
      } else {
        // Round Complete! Check if more rounds remain
        const nextRound = currentRoom.currentRound + 1;
        if (nextRound <= currentRoom.rounds) {
          const firstDrawer = activePlayers[0];
          const nextRoom: RoomState = {
            ...currentRoom,
            currentRound: nextRound,
            currentTurn: 0,
            currentDrawerId: firstDrawer.id,
            wordHash: null,
            wordLength: null,
            wordCategory: null,
            turnStartedAt: null,
            turnEndsAt: null,
          };
          setRoom(nextRoom);
          saveLocalRoom(nextRoom);
          channel?.send('room_state_update', nextRoom);
          prepareTurnWordChoice(nextRoom, activePlayers);
        } else {
          // GAME OVER! Final Leaderboard
          const endedRoom: RoomState = {
            ...currentRoom,
            status: 'ENDED',
          };
          setRoom(endedRoom);
          saveLocalRoom(endedRoom);
          channel?.send('room_state_update', endedRoom);
        }
      }
    }, 4000);
  }, [channel]);

  // 10. Play Again / Restart Game
  const handlePlayAgain = () => {
    if (!room) return;
    const restartedRoom: RoomState = {
      ...room,
      status: 'LOBBY',
      currentRound: 1,
      currentTurn: 0,
      currentDrawerId: null,
      wordHash: null,
      wordLength: null,
      wordCategory: null,
      turnStartedAt: null,
      turnEndsAt: null,
    };
    setRoom(restartedRoom);
    saveLocalRoom(restartedRoom);
    channel?.send('room_state_update', restartedRoom);
  };

  // Return to Lobby
  const handleReturnToLobby = () => {
    if (!room) return;
    const lobbyRoom: RoomState = { ...room, status: 'LOBBY' };
    setRoom(lobbyRoom);
    saveLocalRoom(lobbyRoom);
    channel?.send('room_state_update', lobbyRoom);
  };

  // Create New Room
  const handleCreateNewRoom = () => {
    window.location.hash = '';
    setRoom(null);
    setPlayers([]);
    setMessages([]);
  };

  // -------------------------------------------------------------------
  // VIEW ROUTER
  // -------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans">
      {!room ? (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialRoomCode={initialRoomCode}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />
      ) : room.status === 'LOBBY' ? (
        <Lobby
          room={room}
          players={players}
          currentPlayer={currentPlayer!}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          onKickPlayer={handleKickPlayer}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />
      ) : room.status === 'PLAYING' ? (
        <GameBoard
          room={room}
          players={players}
          currentPlayer={currentPlayer!}
          channel={channel}
          messages={messages}
          secretWordOptions={secretWordOptions}
          drawerSecretWord={drawerSecretWord}
          isChoosingWord={isChoosingWord}
          isTurnRecap={isTurnRecap}
          recapSecretWord={recapSecretWord}
          onSelectWord={handleSelectWord}

          onSendGuess={handleSendGuess}
          onKickPlayer={handleKickPlayer}
          onTurnTimeUp={handleTurnEnd}
        />
      ) : (
        <Results
          players={players}
          isHost={currentPlayer?.id === room.hostPlayerId}
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={handleReturnToLobby}
          onCreateNewRoom={handleCreateNewRoom}
        />
      )}

      {/* Supabase Config / Credentials Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};

export default App;



