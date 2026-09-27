import React from 'react';
import { Crown, Palette, CheckCircle2, UserX, Users } from 'lucide-react';
import type { Player } from '../types/game';

interface PlayerListProps {
  players: Player[];
  currentDrawerId: string | null;
  currentPlayerId: string;
  hostPlayerId: string;
  onKickPlayer?: (playerId: string) => void;
  maxPlayers?: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentDrawerId,
  currentPlayerId,
  hostPlayerId,
  onKickPlayer,
  maxPlayers = 12,
}) => {
  const isHost = currentPlayerId === hostPlayerId;

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full retro-card p-4 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b-3 border-[#3A342B] mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#3B8B88] text-white rounded-lg border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-retro-heading text-[#2B2520] tracking-wider uppercase">
              LEADERBOARD
            </h3>
            <p className="text-[11px] text-[#5C5247] font-typewriter font-bold">
              {players.length} / {maxPlayers} Players
            </p>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedPlayers.map((player) => {
          const isDrawer = player.id === currentDrawerId;
          const isMe = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={`relative group flex items-center justify-between p-2.5 rounded-xl border-2 border-[#2B2520] shadow-[3px_3px_0px_#2B2520] transition-all ${
                isDrawer
                  ? 'bg-[#FFF6DF] text-[#2B2520]'
                  : player.hasGuessedCorrect
                  ? 'bg-[#D2ECE9] text-[#2B2520]'
                  : isMe
                  ? 'bg-[#FFFDF9] text-[#2B2520]'
                  : 'bg-[#FAF6EE] text-[#2B2520]'
              }`}
            >
              {/* Left Side: Avatar + Name + Badges */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-[#EAE0CF] border-2 border-[#2B2520] flex items-center justify-center text-lg shadow-inner">
                    {player.avatar}
                  </div>
                  {player.isHost && (
                    <div
                      title="Room Host"
                      className="absolute -top-1.5 -right-1.5 bg-[#E05A47] text-white p-0.5 rounded-full border border-[#2B2520] shadow"
                    >
                      <Crown className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs font-typewriter truncate max-w-[100px]">
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="px-1 py-0.2 text-[9px] font-bold bg-[#3B8B88] text-white rounded border border-[#2B2520] font-retro-heading">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1 text-[10px] font-bold font-retro-heading">
                    {isDrawer && (
                      <span className="text-[#E05A47] flex items-center gap-1 uppercase">
                        <Palette className="w-3 h-3 animate-bounce" /> Sketching
                      </span>
                    )}
                    {player.hasGuessedCorrect && (
                      <span className="text-[#3B8B88] flex items-center gap-1 uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Guessed!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Score & Host Kick Control */}
              <div className="flex items-center gap-1.5">
                <span className="font-typewriter font-extrabold text-xs text-[#2B2520] bg-[#EAE0CF] px-2 py-0.5 rounded-md border border-[#2B2520]">
                  {player.score}
                </span>

                {isHost && !player.isHost && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    title={`Kick ${player.name}`}
                    className="p-1 text-[#8C7B6B] hover:text-[#C84432] rounded-md transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
