import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import type { WordOption } from '../types/game';

interface WordSelectorProps {
  words: WordOption[];
  onSelectWord: (wordOption: WordOption) => void;
  isOpen: boolean;
}

export const WordSelector: React.FC<WordSelectorProps> = ({ words, onSelectWord, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2520]/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg retro-card p-6 flex flex-col items-center text-center space-y-6">
        <div className="p-3 bg-[#E05A47] text-white rounded-full border-3 border-[#2B2520] shadow-[3px_3px_0px_#2B2520]">
          <Sparkles className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-retro-heading text-[#2B2520] tracking-wide uppercase">
            YOUR TURN TO SKETCH!
          </h2>
          <p className="text-xs font-bold text-[#5C5247] mt-1 font-typewriter">
            Select a secret word to draw on the vintage easel:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full">
          {words.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onSelectWord(option)}
              className="retro-btn py-3.5 px-4 bg-[#FFFDF9] hover:bg-[#3B8B88] text-[#2B2520] hover:text-white border-3 border-[#2B2520] rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[#E05A47] group-hover:text-white uppercase tracking-wider font-retro-heading">
                  {option.category} • {option.difficulty}
                </span>
                <span className="text-lg font-typewriter font-extrabold tracking-wide uppercase">
                  {option.word}
                </span>
              </div>

              <div className="w-8 h-8 rounded-lg bg-[#EAE0CF] group-hover:bg-[#2A6B68] border-2 border-[#2B2520] flex items-center justify-center text-[#2B2520] group-hover:text-white">
                <HelpCircle className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
