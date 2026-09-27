import React, { useState } from 'react';
import {
  Copy,
  Check,
  Play,
  Crown,
  Users,
  Clock,
  RotateCcw,
  Zap,
  Sliders,
  UserX,
  FileText,
} from 'lucide-react';

import type { RoomState, Player, WordDifficulty } from '../types/game';
import { AudioToggle } from './AudioToggle';

interface LobbyProps {
  room: RoomState;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => void;
  onUpdateSettings: (newSettings: Partial<RoomState>) => void;
  onKickPlayer: (playerId: string) => void;
  onOpenConfig: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  players,
  currentPlayer,
  onStartGame,
  onUpdateSettings,
  onKickPlayer,
}) => {
  const [copied, setCopied] = useState(false);
  const [customWordsText, setCustomWordsText] = useState(
    room.customWords ? room.customWords.join(', ') : ''
  );

  const isHost = currentPlayer.id === room.hostPlayerId;
  const inviteUrl = `${window.location.origin}/#room=${room.roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCustomWordsBlur = () => {
    const wordList = customWordsText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    onUpdateSettings({ customWords: wordList });
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2B2520] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Main Vintage Lobby Container */}
      <div className="relative w-full max-w-4xl retro-card p-6 sm:p-8 space-y-6">
        {/* Vintage Banner Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b-3 border-[#3A342B]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E05A47] border-3 border-[#2B2520] flex items-center justify-center text-2xl shadow-[3px_3px_0px_#2B2520]">
              🎨
            </div>
            <div>
              <h1 className="text-2xl font-retro-heading text-[#2B2520] uppercase tracking-wide">
                DRAW RUSH LOBBY
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-[#5C5247] uppercase font-retro-heading">ROOM CODE:</span>
                <span className="px-3 py-0.5 bg-[#E5A93C] text-[#2B2520] font-typewriter font-extrabold rounded-md text-sm border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]">
                  {room.roomCode}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AudioToggle />

            {/* Copy Invite Link */}
            <div className="flex flex-col items-end">
              <button
                onClick={handleCopyLink}
                className="retro-btn text-xs px-4 py-2 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Joined Players List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-retro-heading text-[#2B2520] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3B8B88]" />
                Players in Room ({players.length} / {room.maxPlayers})
              </h3>
              {players.length < 2 && (
                <span className="text-xs font-bold text-[#C84432] bg-[#FADED9] px-2.5 py-1 rounded-md border-2 border-[#E05A47]">
                  ⚠️ Need at least 2 players to start
                </span>
              )}
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {players.map((p) => {
                const playerIsHost = p.id === room.hostPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 border-[#2B2520] shadow-[3px_3px_0px_#2B2520] transition-all ${
                      playerIsHost
                        ? 'bg-[#FFF6DF] text-[#2B2520]'
                        : p.id === currentPlayer.id
                        ? 'bg-[#D2ECE9] text-[#2B2520]'
                        : 'bg-[#FFFDF9] text-[#2B2520]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAE0CF] border-2 border-[#2B2520] flex items-center justify-center text-xl shadow-inner">
                        {p.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-sm font-typewriter block">{p.name}</span>
                        {playerIsHost && (
                          <span className="text-[10px] font-extrabold text-[#E05A47] flex items-center gap-1 font-retro-heading">
                            <Crown className="w-3 h-3 fill-current" /> ROOM HOST
                          </span>
                        )}
                      </div>
                    </div>

                    {isHost && !playerIsHost && (
                      <button
                        onClick={() => onKickPlayer(p.id)}
                        title="Kick player"
                        className="p-1.5 text-[#8C7B6B] hover:text-[#C84432] hover:bg-[#FADED9] rounded-lg transition-colors border border-transparent hover:border-[#E05A47]"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Room Settings Panel */}
          <div className="bg-[#EAE0CF] border-3 border-[#2B2520] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-[4px_4px_0px_#2B2520]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#2B2520] pb-2">
                <h3 className="text-sm font-retro-heading text-[#2B2520] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#3B8B88]" />
                  Room Rules
                </h3>
                {isHost && (
                  <span className="text-[10px] font-bold bg-[#E5A93C] text-[#2B2520] px-2 py-0.5 rounded border border-[#2B2520] font-retro-heading">
                    HOST
                  </span>
                )}
              </div>

              {/* Settings Controls */}
              <div className="space-y-3 text-xs">
                {/* Rounds */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#3B8B88]" /> Rounds
                  </label>
                  {isHost ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 5].map((r) => (
                        <button
                          key={r}
                          onClick={() => onUpdateSettings({ rounds: r })}
                          className={`py-1.5 font-bold rounded-lg border-2 border-[#2B2520] transition-all font-retro-heading ${
                            room.rounds === r
                              ? 'bg-[#3B8B88] text-white shadow-[2px_2px_0px_#2B2520]'
                              : 'bg-[#FFFDF9] text-[#2B2520] hover:bg-[#F4EFE6]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="font-bold text-[#2B2520]">{room.rounds} Rounds</span>
                  )}
                </div>

                {/* Turn Duration */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#3B8B88]" /> Turn Duration
                  </label>
                  {isHost ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[30, 45, 60, 90].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => onUpdateSettings({ turnDuration: sec })}
                          className={`py-1.5 font-bold rounded-lg border-2 border-[#2B2520] transition-all font-retro-heading ${
                            room.turnDuration === sec
                              ? 'bg-[#3B8B88] text-white shadow-[2px_2px_0px_#2B2520]'
                              : 'bg-[#FFFDF9] text-[#2B2520] hover:bg-[#F4EFE6]'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="font-bold text-[#2B2520]">{room.turnDuration} Seconds</span>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-[#5C5247] font-bold mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#3B8B88]" /> Word Deck
                  </label>
                  {isHost ? (
                    <select
                      value={room.difficulty}
                      onChange={(e) => onUpdateSettings({ difficulty: e.target.value as WordDifficulty })}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-bold"
                    >
                      <option value="easy">Easy Words</option>
                      <option value="medium">Medium Words</option>
                      <option value="hard">Hard Words</option>
                      <option value="mixed">Mixed Deck</option>
                    </select>
                  ) : (
                    <span className="font-bold text-[#2B2520] capitalize">{room.difficulty}</span>
                  )}
                </div>

                {/* Custom Words */}
                {isHost && (
                  <div>
                    <label className="block text-[#5C5247] font-bold mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#3B8B88]" /> Custom Words
                    </label>
                    <textarea
                      placeholder="football, kerala, computer..."
                      value={customWordsText}
                      onChange={(e) => setCustomWordsText(e.target.value)}
                      onBlur={handleCustomWordsBlur}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-typewriter text-xs placeholder-[#8C7B6B]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Host Start Game Button vs Non-host Waiting Notice */}
            <div className="pt-2">
              {isHost ? (
                <button
                  onClick={onStartGame}
                  disabled={players.length < 2}
                  className="w-full py-3.5 retro-btn-coral text-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6 fill-current" /> START GAME
                </button>
              ) : (
                <div className="w-full py-3 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-xl text-center text-xs font-bold text-[#E05A47] flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E05A47] animate-ping" />
                  Waiting for host to start the game...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
