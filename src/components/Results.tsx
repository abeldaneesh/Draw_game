import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, PlusCircle } from 'lucide-react';
import type { Player } from '../types/game';
import { soundManager } from '../lib/audio';

interface ResultsProps {
  players: Player[];
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onCreateNewRoom: () => void;
}

export const Results: React.FC<ResultsProps> = ({
  players,
  isHost,
  onPlayAgain,
  onReturnToLobby,
  onCreateNewRoom,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  useEffect(() => {
    soundManager.playVictorySound();
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.55 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2520]/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl retro-card p-6 sm:p-8 flex flex-col items-center text-center my-auto space-y-5">
        {/* Vintage Trophy Header */}
        <div className="p-4 bg-[#E5A93C] text-[#2B2520] rounded-full border-3 border-[#2B2520] shadow-[4px_4px_0px_#2B2520] mb-1">
          <Trophy className="w-12 h-12 animate-bounce" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-retro-heading text-[#2B2520] tracking-wide uppercase">
          VICTORY CHAMPION!
        </h1>
        <p className="text-xs font-bold text-[#E05A47] tracking-widest font-retro-heading uppercase">
          FINAL VINTAGE LEADERBOARD
        </p>

        {/* Winner Stamp Card */}
        {winner && (
          <div className="w-full my-2 p-4 bg-[#FFF6DF] border-3 border-[#2B2520] rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_#2B2520]">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{winner.avatar}</span>
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#E05A47] uppercase font-retro-heading tracking-widest block">
                  👑 GRAND WINNER
                </span>
                <span className="text-xl font-typewriter font-black text-[#2B2520]">{winner.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-typewriter text-2xl font-black text-[#2B2520]">
                {winner.score}
              </span>
              <span className="text-xs font-bold text-[#5C5247] block font-retro-heading">PTS</span>
            </div>
          </div>
        )}

        {/* Player Ranks List */}
        <div className="w-full space-y-2 max-h-56 overflow-y-auto pr-1">
          {sorted.map((player, index) => {
            const isWinner = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520] transition-all ${
                  isWinner
                    ? 'bg-[#FFF6DF] text-[#2B2520]'
                    : isSecond
                    ? 'bg-[#D2ECE9] text-[#2B2520]'
                    : isThird
                    ? 'bg-[#FADED9] text-[#2B2520]'
                    : 'bg-[#FFFDF9] text-[#2B2520]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                    {isWinner ? (
                      <span className="text-xl">🥇</span>
                    ) : isSecond ? (
                      <span className="text-xl">🥈</span>
                    ) : isThird ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="font-typewriter text-[#8C7B6B]">#{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xl">{player.avatar}</span>
                  <span className="font-bold text-sm font-typewriter text-[#2B2520]">{player.name}</span>
                </div>

                <span className="font-typewriter font-extrabold text-sm text-[#2B2520]">
                  {player.score} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Retro Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2">
          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="py-3 retro-btn text-xs tracking-wider flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
          ) : (
            <button
              onClick={onReturnToLobby}
              className="py-3 retro-btn text-xs tracking-wider flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" /> LOBBY
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="py-3 retro-btn-gold text-xs tracking-wider flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" /> LOBBY ROOM
          </button>

          <button
            onClick={onCreateNewRoom}
            className="py-3 retro-btn-coral text-xs tracking-wider flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> NEW ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
