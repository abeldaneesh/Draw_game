import React from 'react';
import { Eye, Trophy, Sparkles } from 'lucide-react';
import type { Player } from '../types/game';

interface TurnRecapModalProps {
  secretWord: string;
  drawerName: string;
  correctPlayers: Player[];
  isOpen: boolean;
}

export const TurnRecapModal: React.FC<TurnRecapModalProps> = ({
  secretWord,
  drawerName,
  correctPlayers,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2520]/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md retro-card p-6 flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-[#E5A93C] text-[#2B2520] rounded-full border-3 border-[#2B2520] shadow-[3px_3px_0px_#2B2520]">
          <Eye className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-retro-heading text-[#E05A47] uppercase tracking-widest block">
            TIME'S UP!
          </span>
          <h3 className="text-sm font-bold text-[#2B2520] font-typewriter mt-0.5">
            {drawerName}'s secret word was:
          </h3>
          <div className="mt-2 px-6 py-2.5 bg-[#FFFDF9] border-3 border-[#2B2520] rounded-xl inline-block shadow-[3px_3px_0px_#2B2520]">
            <span className="text-2xl font-black text-[#E05A47] uppercase tracking-widest font-typewriter">
              {secretWord}
            </span>
          </div>
        </div>

        {/* Correct Guessers Summary */}
        <div className="w-full bg-[#EAE0CF] border-2 border-[#2B2520] rounded-xl p-3 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-xs font-retro-heading text-[#2B2520] mb-2 uppercase">
            <Trophy className="w-4 h-4 text-[#E5A93C]" />
            <span>Guessed Correctly ({correctPlayers.length})</span>
          </div>

          {correctPlayers.length === 0 ? (
            <p className="text-xs text-[#5C5247] italic font-typewriter">Nobody guessed the word this round!</p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {correctPlayers.map((p) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 bg-[#3B8B88] text-white border border-[#2B2520] rounded-lg text-xs font-bold font-typewriter flex items-center gap-1.5 shadow-[1px_1px_0px_#2B2520]"
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-retro-heading text-[#3B8B88]">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>PREPARING NEXT ROUND...</span>
        </div>
      </div>
    </div>
  );
};
