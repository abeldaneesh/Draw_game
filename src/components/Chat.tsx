import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import type { GuessMessage } from '../types/game';

interface ChatProps {
  messages: GuessMessage[];
  onSendGuess: (text: string) => void;
  isDrawer: boolean;
  hasGuessedCorrect: boolean;
  disabled?: boolean;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendGuess,
  isDrawer,
  hasGuessedCorrect,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isDrawer || hasGuessedCorrect || disabled) return;

    onSendGuess(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full retro-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#EAE0CF] border-b-3 border-[#3A342B]">
        <div className="p-1.5 bg-[#3B8B88] text-white rounded-lg border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]">
          <MessageSquare className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-retro-heading text-[#2B2520] uppercase tracking-wider">
          CHAT & GUESS FEED
        </h3>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#FFFDF9]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8C7B6B] text-xs font-typewriter">
            <Sparkles className="w-6 h-6 mb-2 text-[#3B8B88]" />
            <p className="font-bold text-[#2B2520]">No guesses yet!</p>
            <p>Type your guess below when drawing starts.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem || msg.isCorrect) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-[#D2ECE9] border-2 border-[#3B8B88] text-[#2A6B68] text-xs font-bold font-typewriter flex items-center gap-2 shadow-[2px_2px_0px_#3B8B88]"
                >
                  <span>🎉</span>
                  <span>{msg.guess}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="flex flex-col p-2 rounded-xl bg-[#FAF6EE] border-2 border-[#3A342B] text-xs font-typewriter text-[#2B2520] shadow-[2px_2px_0px_#3A342B]"
              >
                <span className="font-bold text-[#3B8B88] text-[11px]">
                  {msg.playerName}:
                </span>
                <span className="break-words font-medium text-[#2B2520]">{msg.guess}</span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#EAE0CF] border-t-3 border-[#3A342B]">
        {isDrawer ? (
          <div className="w-full py-2 px-3 bg-[#FFF6DF] border-2 border-[#2B2520] rounded-xl text-center text-xs font-bold text-[#E05A47] font-retro-heading uppercase">
            🎨 YOU ARE SKETCHING!
          </div>
        ) : hasGuessedCorrect ? (
          <div className="w-full py-2 px-3 bg-[#D2ECE9] border-2 border-[#3B8B88] rounded-xl text-center text-xs font-bold text-[#2A6B68] font-retro-heading uppercase">
            ✅ YOU GUESSED CORRECTLY!
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your guess..."
              value={input}
              disabled={disabled}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-xl text-xs font-typewriter text-[#2B2520] placeholder-[#8C7B6B] focus:outline-none focus:ring-2 focus:ring-[#3B8B88]"
            />
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="p-2 retro-btn text-white rounded-xl shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
