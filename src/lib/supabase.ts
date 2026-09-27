import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  // Remove trailing /rest/v1 or /rest/v1/ or trailing slashes
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

let supabaseUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check localStorage override for dynamic configuration
const customUrl = localStorage.getItem('drawrush_supabase_url');
const customKey = localStorage.getItem('drawrush_supabase_key');
if (customUrl) supabaseUrl = cleanSupabaseUrl(customUrl);
if (customKey) supabaseAnonKey = customKey.trim();

export function isSupabaseConfigured(): boolean {
  const isConfigured = 
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10;

  return isConfigured;
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('drawrush_supabase_url', cleanSupabaseUrl(url));
  else localStorage.removeItem('drawrush_supabase_url');

  if (key) localStorage.setItem('drawrush_supabase_key', key.trim());
  else localStorage.removeItem('drawrush_supabase_key');

  window.location.reload();
}

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured()) {
    console.log('[DrawRush] Supabase client initialized with URL:', supabaseUrl);
  } else {
    console.warn('[DrawRush] Running in Local Tab Mode. Supabase environment variables not detected.');
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 60,
        },
      },
    })
  : null;

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase URL or Anon Key is not configured.' };
  }

  try {
    // 1. Test query on rooms table
    const { error: roomsErr } = await supabase.from('rooms').select('id').limit(1);
    if (roomsErr) {
      if (roomsErr.code === '42P01') {
        return { success: false, message: 'Table "public.rooms" does not exist! Please run SQL Schema in Supabase SQL Editor.' };
      }
      return { success: false, message: `Rooms table error: ${roomsErr.message}` };
    }

    // 2. Test query on players table
    const { error: playersErr } = await supabase.from('players').select('id').limit(1);
    if (playersErr) {
      if (playersErr.code === '42P01') {
        return { success: false, message: 'Table "public.players" does not exist! Please run SQL Schema in Supabase SQL Editor.' };
      }
      return { success: false, message: `Players table error: ${playersErr.message}` };
    }

    // 3. Test query on guesses table
    const { error: guessesErr } = await supabase.from('guesses').select('id').limit(1);
    if (guessesErr) {
      if (guessesErr.code === '42P01') {
        return { success: false, message: 'Table "public.guesses" does not exist! Please run SQL Schema in Supabase SQL Editor.' };
      }
      return { success: false, message: `Guesses table error: ${guessesErr.message}` };
    }

    return { success: true, message: 'Connected to Supabase! All database tables (rooms, players, guesses) are ready and operational.' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || String(err)}` };
  }
}

