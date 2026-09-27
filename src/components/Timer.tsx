import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { soundManager } from '../lib/audio';

interface TimerProps {
  turnEndsAt: number | null;
  totalDurationSec: number;
  onTimeUp?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ turnEndsAt, totalDurationSec, onTimeUp }) => {
  const [remainingSec, setRemainingSec] = useState<number>(totalDurationSec);

  useEffect(() => {
    if (!turnEndsAt) {
      setRemainingSec(totalDurationSec);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = turnEndsAt - now;
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSec(secondsLeft);

      if (secondsLeft > 0 && secondsLeft <= 10) {
        soundManager.playTickSound();
      }

      if (secondsLeft <= 0) {
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turnEndsAt, totalDurationSec, onTimeUp]);

  const progressPercent = Math.max(0, Math.min(100, (remainingSec / totalDurationSec) * 100));
  const isUrgent = remainingSec <= 10;

  return (
    <div className="flex flex-col items-center justify-center min-w-[80px]">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520] transition-all ${
          isUrgent
            ? 'bg-[#FADED9] text-[#C84432] animate-bounce-short'
            : remainingSec <= 20
            ? 'bg-[#FFF6DF] text-[#2B2520]'
            : 'bg-[#EAE0CF] text-[#2B2520]'
        }`}
      >
        <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin text-[#E05A47]' : 'text-[#3B8B88]'}`} />
        <span className="font-typewriter font-black text-xl">
          {remainingSec}
        </span>
        <span className="text-[10px] font-bold uppercase font-retro-heading text-[#5C5247]">s</span>
      </div>

      {/* Retro Vintage Progress Meter */}
      <div className="w-full bg-[#DFD2BC] h-2 rounded-full overflow-hidden mt-1 border border-[#2B2520]">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-[#E05A47]' : remainingSec <= 20 ? 'bg-[#E5A93C]' : 'bg-[#3B8B88]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
