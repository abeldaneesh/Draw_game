-- ==========================================
-- DRAW RUSH DATABASE SCHEMA FOR SUPABASE
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_player_id TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'PLAYING', 'ENDED'
    max_players INTEGER NOT NULL DEFAULT 8,
    rounds INTEGER NOT NULL DEFAULT 3,
    turn_duration INTEGER NOT NULL DEFAULT 60, -- seconds
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'mixed'
    custom_words TEXT[] DEFAULT '{}',
    current_round INTEGER NOT NULL DEFAULT 1,
    current_turn INTEGER NOT NULL DEFAULT 0,
    current_drawer_id TEXT,
    word_hash TEXT, -- SHA-256 hash of secret word for anti-cheat
    word_length INTEGER,
    word_category TEXT,
    secret_word_reveal TEXT, -- set only after turn finishes
    turn_started_at TIMESTAMPTZ,
    turn_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY, -- client generated unique id or auth id
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

-- 3. GUESSES / CHAT TABLE
CREATE TABLE IF NOT EXISTS public.guesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    player_name VARCHAR(50) NOT NULL,
    guess TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST REALTIME READS
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_players_room ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_guesses_room ON public.guesses(room_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- ANONYMOUS POLICIES (Allow public access for casual room creation and gameplay)
DROP POLICY IF EXISTS "Allow public select on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public insert on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public update on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public select on players" ON public.players;
DROP POLICY IF EXISTS "Allow public insert on players" ON public.players;
DROP POLICY IF EXISTS "Allow public update on players" ON public.players;
DROP POLICY IF EXISTS "Allow public delete on players" ON public.players;
DROP POLICY IF EXISTS "Allow public select on guesses" ON public.guesses;
DROP POLICY IF EXISTS "Allow public insert on guesses" ON public.guesses;
DROP POLICY IF EXISTS "Allow all on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all on players" ON public.players;
DROP POLICY IF EXISTS "Allow all on guesses" ON public.guesses;

CREATE POLICY "Allow all on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guesses" ON public.guesses FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION SETUP (Safe re-execution)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms, public.players, public.guesses;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
