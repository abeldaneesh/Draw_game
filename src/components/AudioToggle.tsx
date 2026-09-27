import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../lib/audio';

export const AudioToggle: React.FC = () => {
  const [muted, setMuted] = useState(soundManager.getMuted());

  const toggleAudio = () => {
    const nextMuted = !muted;
    soundManager.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playJoinSound();
    }
  };

  return (
    <button
      onClick={toggleAudio}
      title={muted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
      className={`p-2 rounded-xl border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520] transition-all flex items-center justify-center ${
        muted
          ? 'bg-[#EAE0CF] text-[#8C7B6B] hover:text-[#2B2520]'
          : 'bg-[#3B8B88] text-white hover:bg-[#2A6B68]'
      }`}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
};
