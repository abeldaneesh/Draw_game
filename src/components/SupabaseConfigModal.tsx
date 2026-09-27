import React, { useState } from 'react';
import { Database, Check, X, Shield, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, saveSupabaseConfig, testSupabaseConnection } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('drawrush_supabase_url') || '');
  const [key, setKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('drawrush_supabase_key') || '');
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
  };

  const handleClear = () => {
    saveSupabaseConfig('', '');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setTesting(false);
  };

  const sqlSchema = `-- Copy and paste this into your Supabase SQL Editor:

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_player_id TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOBBY',
    max_players INTEGER NOT NULL DEFAULT 8,
    rounds INTEGER NOT NULL DEFAULT 3,
    turn_duration INTEGER NOT NULL DEFAULT 60,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    custom_words TEXT[] DEFAULT '{}',
    current_round INTEGER NOT NULL DEFAULT 1,
    current_turn INTEGER NOT NULL DEFAULT 0,
    current_drawer_id TEXT,
    word_hash TEXT,
    word_length INTEGER,
    word_category TEXT,
    secret_word_reveal TEXT,
    turn_started_at TIMESTAMPTZ,
    turn_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(20) NOT NULL DEFAULT '🦊',
    score INTEGER NOT NULL DEFAULT 0,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    has_guessed_correct BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    player_name VARCHAR(50) NOT NULL,
    guess TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- ANONYMOUS POLICIES (Allow public select/insert/update/delete for casual gameplay)
DROP POLICY IF EXISTS "Allow all on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all on players" ON public.players;
DROP POLICY IF EXISTS "Allow all on guesses" ON public.guesses;

CREATE POLICY "Allow all on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guesses" ON public.guesses FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms, public.players, public.guesses;
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2520]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl retro-card overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#EAE0CF] border-b-3 border-[#3A342B]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3B8B88] text-white rounded-xl border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-retro-heading text-[#2B2520] flex items-center gap-2 uppercase">
                Supabase Cloud Setup
                {isSupabaseConfigured() ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-[#3B8B88] text-white border border-[#2B2520] rounded-full flex items-center gap-1 font-retro-heading">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-[#E5A93C] text-[#2B2520] border border-[#2B2520] rounded-full flex items-center gap-1 font-retro-heading">
                    <Sparkles className="w-3 h-3" /> Local Tab Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#5C5247] font-typewriter">
                Configure real-time Supabase cloud backend or use default local multi-tab mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5C5247] hover:text-[#2B2520] bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-[#3A342B] bg-[#EAE0CF]/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 font-retro-heading text-xs uppercase tracking-wider border-b-3 transition-colors ${
              activeTab === 'config'
                ? 'border-[#3B8B88] text-[#3B8B88] font-bold'
                : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
            }`}
          >
            API Credentials
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 font-retro-heading text-xs uppercase tracking-wider border-b-3 transition-colors ${
              activeTab === 'sql'
                ? 'border-[#3B8B88] text-[#3B8B88] font-bold'
                : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
            }`}
          >
            Database SQL Schema
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#FFFDF9]">
          {activeTab === 'config' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3.5 bg-[#FFF6DF] border-2 border-[#2B2520] rounded-xl text-xs text-[#2B2520] font-typewriter leading-relaxed space-y-2">
                <p className="font-bold text-[#E05A47] flex items-center gap-1.5 font-retro-heading uppercase">
                  <Shield className="w-4 h-4" />
                  Multiplayer Engine Modes:
                </p>
                <p>
                  • <strong>Local Tab Sync Mode (Active by default):</strong> Test real-time multiplayer immediately by opening 2 or more browser tabs or windows on your machine!
                </p>
                <p>
                  • <strong>Supabase Cloud Backend:</strong> Enter your Supabase URL and Anon Key below to enable cross-device internet rooms worldwide.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2520] font-retro-heading uppercase mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-typewriter text-xs focus:outline-none focus:ring-2 focus:ring-[#3B8B88]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2520] font-retro-heading uppercase mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <textarea
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  rows={3}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-[#2B2520] rounded-lg text-[#2B2520] font-typewriter text-xs focus:outline-none focus:ring-2 focus:ring-[#3B8B88]"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 border-2 rounded-xl text-xs font-typewriter ${
                    testResult.success
                      ? 'bg-[#D2ECE9] border-[#3B8B88] text-[#1B5250]'
                      : 'bg-[#FADED9] border-[#E05A47] text-[#C84432]'
                  }`}
                >
                  {testResult.success ? '✅ ' : '❌ '}
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3 py-1.5 text-xs font-bold bg-[#EAE0CF] hover:bg-[#DFD2BC] text-[#2B2520] rounded-lg border-2 border-[#2B2520] font-retro-heading transition-colors"
                  >
                    {testing ? 'Testing Connection...' : '🔍 Test Database Connection'}
                  </button>
                  {isSupabaseConfigured() && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-1.5 text-xs font-bold text-[#C84432] hover:bg-[#FADED9] rounded-lg transition-colors font-retro-heading"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-[#5C5247] hover:text-[#2B2520] bg-[#EAE0CF] rounded-xl border-2 border-[#2B2520]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 retro-btn text-xs"
                  >
                    Save & Reload
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#2B2520] font-typewriter">
                Run this SQL script in your Supabase SQL Editor to create tables and enable Realtime:
              </p>
              <div className="relative">
                <pre className="p-4 bg-[#2B2520] border-2 border-[#3A342B] rounded-xl text-xs font-typewriter text-[#3B8B88] overflow-x-auto max-h-72 select-all">
                  {sqlSchema}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
