import React, { useState } from 'react';
import { Palette, MessageSquare, Users } from 'lucide-react';
import type { RoomState, Player, GuessMessage, WordOption } from '../types/game';
import { MultiplayerChannel } from '../lib/broadcast';
import { DrawingCanvas } from './DrawingCanvas';
import { PlayerList } from './PlayerList';
import { Chat } from './Chat';
import { Timer } from './Timer';
import { WordSelector } from './WordSelector';
import { TurnRecapModal } from './TurnRecapModal';
import { AudioToggle } from './AudioToggle';
import { formatWordBlanks } from '../lib/crypto';

interface GameBoardProps {
  room: RoomState;
  players: Player[];
  currentPlayer: Player;
  channel: MultiplayerChannel | null;
  messages: GuessMessage[];
  secretWordOptions: WordOption[];
  drawerSecretWord: string | null;
  isChoosingWord: boolean;
  isTurnRecap: boolean;
  recapSecretWord: string;
  onSelectWord: (option: WordOption) => void;
  onSendGuess: (guess: string) => void;
  onKickPlayer: (playerId: string) => void;
  onTurnTimeUp: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  room,
  players,
  currentPlayer,
  channel,
  messages,
  secretWordOptions,
  drawerSecretWord,
  isChoosingWord,
  isTurnRecap,
  recapSecretWord,
  onSelectWord,
  onSendGuess,
  onKickPlayer,
  onTurnTimeUp,
}) => {
  const [mobileTab, setMobileTab] = useState<'canvas' | 'chat' | 'players'>('canvas');

  const currentDrawer = players.find((p) => p.id === room.currentDrawerId);
  const isDrawer = currentPlayer.id === room.currentDrawerId;
  const correctPlayers = players.filter((p) => p.hasGuessedCorrect);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2B2520] flex flex-col h-screen overflow-hidden select-none">
      {/* 1. TOP RETRO NAVBAR */}
      <header className="px-4 py-2 bg-[#FAF6EE] border-b-4 border-[#3A342B] flex items-center justify-between gap-4 z-20 shadow-[0_4px_0_rgba(0,0,0,0.05)]">
        {/* Round Counter */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#3B8B88] text-white border-2 border-[#2B2520] rounded-xl flex flex-col items-center shadow-[2px_2px_0px_#2B2520]">
            <span className="text-[9px] font-bold uppercase tracking-wider font-retro-heading">
              ROUND
            </span>
            <span className="font-typewriter font-black text-sm">
              {room.currentRound} / {room.rounds}
            </span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-retro-heading uppercase text-[#2B2520]">DRAW RUSH</span>
            <span className="text-[10px] font-bold text-[#5C5247] font-typewriter">CODE: {room.roomCode}</span>
          </div>
        </div>

        {/* Central Secret Word / Blanks Banner */}
        <div className="flex flex-col items-center justify-center text-center">
          {isDrawer ? (
            <div className="flex flex-col items-center bg-[#FFF6DF] border-2 border-[#2B2520] px-4 py-1 rounded-xl shadow-[2px_2px_0px_#2B2520]">
              <span className="text-[10px] font-bold text-[#E05A47] uppercase tracking-widest font-retro-heading flex items-center gap-1">
                <Palette className="w-3 h-3" /> YOUR SECRET WORD
              </span>
              <span className="text-base font-typewriter font-extrabold text-[#2B2520] uppercase tracking-widest">
                {drawerSecretWord || 'CHOOSING WORD...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-1 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-xl shadow-[2px_2px_0px_#2B2520]">
              <span className="text-[10px] font-bold text-[#5C5247] uppercase tracking-widest font-retro-heading">
                {currentDrawer?.name || 'Drawer'} is sketching ({room.wordCategory || 'Word'})
              </span>
              <span className="text-lg font-typewriter font-black tracking-[0.3em] text-[#E05A47]">
                {room.wordLength ? formatWordBlanks(room.wordLength) : '_ _ _ _'}
              </span>
            </div>
          )}
        </div>

        {/* Timer & Sound Toggle */}
        <div className="flex items-center gap-3">
          <Timer
            turnEndsAt={room.turnEndsAt}
            totalDurationSec={room.turnDuration}
            onTimeUp={onTurnTimeUp}
          />
          <AudioToggle />
        </div>
      </header>

      {/* 2. MAIN RETRO LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left Column: Player List Sidebar (Desktop) */}
        <div
          className={`lg:col-span-3 h-full min-h-0 ${
            mobileTab === 'players' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PlayerList
            players={players}
            currentDrawerId={room.currentDrawerId}
            currentPlayerId={currentPlayer.id}
            hostPlayerId={room.hostPlayerId}
            onKickPlayer={onKickPlayer}
            maxPlayers={room.maxPlayers}
          />
        </div>

        {/* Center Column: Interactive Canvas */}
        <div
          className={`lg:col-span-6 h-full min-h-0 flex flex-col ${
            mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
          }`}
        >
          <DrawingCanvas
            isDrawer={isDrawer}
            channel={channel}
            drawerName={currentDrawer?.name}
          />
        </div>

        {/* Right Column: Chat & Guesses */}
        <div
          className={`lg:col-span-3 h-full min-h-0 ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          <Chat
            messages={messages}
            onSendGuess={onSendGuess}
            isDrawer={isDrawer}
            hasGuessedCorrect={currentPlayer.hasGuessedCorrect}
          />
        </div>
      </div>

      {/* 3. MOBILE TAB SWITCHER BAR */}
      <div className="lg:hidden flex items-center justify-around bg-[#FAF6EE] border-t-3 border-[#3A342B] p-2 z-20">
        <button
          onClick={() => setMobileTab('players')}
          className={`flex flex-col items-center gap-1 text-xs font-retro-heading py-1 px-4 rounded-lg transition-colors ${
            mobileTab === 'players' ? 'text-white bg-[#3B8B88] border-2 border-[#2B2520]' : 'text-[#5C5247]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players ({players.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex flex-col items-center gap-1 text-xs font-retro-heading py-1 px-4 rounded-lg transition-colors ${
            mobileTab === 'canvas' ? 'text-white bg-[#3B8B88] border-2 border-[#2B2520]' : 'text-[#5C5247]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex flex-col items-center gap-1 text-xs font-retro-heading py-1 px-4 rounded-lg transition-colors ${
            mobileTab === 'chat' ? 'text-white bg-[#3B8B88] border-2 border-[#2B2520]' : 'text-[#5C5247]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat & Guesses</span>
        </button>
      </div>

      {/* 4. MODALS & INTERMISSIONS */}
      <WordSelector
        isOpen={isDrawer && isChoosingWord}
        words={secretWordOptions}
        onSelectWord={onSelectWord}
      />

      <TurnRecapModal
        isOpen={isTurnRecap}
        secretWord={recapSecretWord}
        drawerName={currentDrawer?.name || 'Drawer'}
        correctPlayers={correctPlayers}
      />
    </div>
  );
};
