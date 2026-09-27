import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Shield, ArrowRight } from 'lucide-react';

import { AVATARS, getRandomAvatar } from '../lib/crypto';
import type { RoomSettings, WordDifficulty } from '../types/game';
import { isSupabaseConfigured } from '../lib/supabase';
import { AudioToggle } from './AudioToggle';

interface HomeProps {
  onCreateRoom: (playerName: string, avatar: string, settings: RoomSettings) => void;
  onJoinRoom: (playerName: string, avatar: string, roomCode: string) => void;
  initialRoomCode?: string;
  onOpenConfig: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
  onOpenConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('drawrush_name') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
  const [roomCode, setRoomCode] = useState(initialRoomCode);

  // Game Settings State
  const [rounds, setRounds] = useState<number>(3);
  const [turnDuration, setTurnDuration] = useState<number>(60);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [difficulty, setDifficulty] = useState<WordDifficulty>('medium');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setActiveTab('join');
    }
  }, [initialRoomCode]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) {
      setErrorMessage('Please enter your display name.');
      return;
    }
    localStorage.setItem('drawrush_name', name);
    onCreateRoom(name, selectedAvatar, {
      rounds,
      turnDuration,
      maxPlayers,
      difficulty,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();
    if (!name) {
      setErrorMessage('Please enter your display name.');
      return;
    }
    if (!code) {
      setErrorMessage('Please enter a 4-digit room code (e.g. DRW-8K4P).');
      return;
    }
    localStorage.setItem('drawrush_name', name);
    onJoinRoom(name, selectedAvatar, code);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2B2520] flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden relative select-none">
      {/* Vintage Decorative Header Ribbon */}
      <nav className="w-full max-w-4xl flex items-center justify-between py-4 border-b-4 border-[#3A342B] pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#E05A47] border-3 border-[#2B2520] flex items-center justify-center text-2xl shadow-[3px_3px_0px_#2B2520]">
            🎨
          </div>
          <div>
            <h1 className="text-2xl font-retro-heading tracking-wider text-[#2B2520] uppercase">
              DrawRush
            </h1>
            <span className="text-[11px] font-bold text-[#3B8B88] tracking-widest block -mt-1 uppercase">
              ★ Retro Multiplayer Drawing Game ★
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AudioToggle />
          <button
            onClick={onOpenConfig}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520] transition-all flex items-center gap-1.5 ${
              isSupabaseConfigured()
                ? 'bg-[#3B8B88] text-white hover:bg-[#2A6B68]'
                : 'bg-[#E5A93C] text-[#2B2520] hover:bg-[#d6982b]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="font-retro-heading">
              {isSupabaseConfigured() ? 'Supabase Connected' : 'Local Tab Mode'}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Vintage Card */}
      <main className="w-full max-w-md my-auto z-10 space-y-5 animate-fade-in py-6">
        {/* Title Tagline Banner */}
        <div className="text-center space-y-1">
          <div className="inline-block px-4 py-1 bg-[#E5A93C] text-[#2B2520] border-2 border-[#2B2520] rounded-full text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_#2B2520] mb-1">
            EST. 2026 • ORIGINAL GAME
          </div>
          <h2 className="text-3xl sm:text-4xl font-retro-serif font-black text-[#2B2520] tracking-tight italic">
            Draw it. Guess it.
          </h2>
          <p className="text-[#E05A47] font-retro-heading text-sm tracking-widest uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Race the Vintage Clock!
          </p>
        </div>

        {/* Parchment Setup Card */}
        <div className="retro-card p-6 space-y-5">
          {!isSupabaseConfigured() && (
            <div className="p-3 bg-[#FFF6DF] border-2 border-[#E5A93C] rounded-xl text-xs text-[#2B2520] font-typewriter flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-bold font-retro-heading text-[#2B2520] uppercase text-[11px]">
                  Local Tab Mode Active
                </p>
                <p className="text-[11px] text-[#5C5247] mt-0.5">
                  Rooms work between browser tabs on this device. For cross-device play across the internet, click <strong>"Local Tab Mode"</strong> above to enter your Supabase keys!
                </p>
              </div>
            </div>
          )}
          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-bold text-[#2B2520] uppercase tracking-wider mb-2 font-retro-heading">
              Choose Persona Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-11 h-11 rounded-xl text-2xl flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedAvatar === av
                      ? 'bg-[#3B8B88] text-white border-2 border-[#2B2520] shadow-[3px_3px_0px_#2B2520] scale-105'
                      : 'bg-[#EAE0CF] hover:bg-[#DFD2BC] border-2 border-[#8C7B6B] text-[#2B2520]'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#2B2520] uppercase tracking-wider mb-1 font-retro-heading">
              Player Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              maxLength={18}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-4 py-3 bg-[#FFFDF9] border-3 border-[#2B2520] rounded-xl text-[#2B2520] font-bold font-typewriter placeholder-[#8C7B6B] focus:outline-none focus:ring-2 focus:ring-[#3B8B88] shadow-inner text-base"
            />
          </div>

          {/* Action Tabs: Create Room vs Join Room */}
          <div className="flex p-1 bg-[#EAE0CF] border-2 border-[#2B2520] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 font-retro-heading text-xs uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-[#3B8B88] text-white border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]'
                  : 'text-[#5C5247] hover:text-[#2B2520]'
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 font-retro-heading text-xs uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'join'
                  ? 'bg-[#3B8B88] text-white border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]'
                  : 'text-[#5C5247] hover:text-[#2B2520]'
              }`}
            >
              Join Room
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#FADED9] border-2 border-[#E05A47] text-[#C84432] rounded-xl text-xs font-bold text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* CREATE ROOM FORM */}
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Rounds */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1">Rounds</label>
                  <select
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-bold"
                  >
                    <option value={1}>1 Round</option>
                    <option value={2}>2 Rounds</option>
                    <option value={3}>3 Rounds</option>
                    <option value={5}>5 Rounds</option>
                  </select>
                </div>

                {/* Turn Time */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1">Turn Duration</label>
                  <select
                    value={turnDuration}
                    onChange={(e) => setTurnDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-bold"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                  </select>
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-bold"
                  >
                    {[2, 4, 6, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} Players
                      </option>
                    ))}
                  </select>
                </div>

                {/* Word Difficulty */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1">Word Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as WordDifficulty)}
                    className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-bold capitalize"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed Deck</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 retro-btn-coral text-base tracking-wider flex items-center justify-center gap-2">
                <Play className="w-5 h-5 fill-current" /> CREATE ROOM
              </button>
            </form>
          ) : (
            /* JOIN ROOM FORM */
            <form onSubmit={handleJoinSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#2B2520] uppercase tracking-wider mb-1 font-retro-heading">
                  Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DRW-8K4P"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setErrorMessage('');
                  }}
                  className="w-full px-4 py-3 bg-[#FFFDF9] border-3 border-[#2B2520] rounded-xl text-[#2B2520] font-typewriter font-extrabold text-center tracking-widest placeholder-[#8C7B6B] focus:outline-none uppercase text-lg"
                />
              </div>

              <button type="submit" className="w-full py-3.5 retro-btn text-base tracking-wider flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> JOIN ROOM
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="w-full max-w-3xl text-center py-3 border-t-2 border-dashed border-[#8C7B6B] z-10 text-xs text-[#5C5247] font-bold">
        <p>🎨 Sketch secret words • 💡 Guess in real time • 🏆 Score points & win the vintage trophy!</p>
      </footer>
    </div>
  );
};
