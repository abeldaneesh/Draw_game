import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check localStorage override for dynamic configuration
const customUrl = localStorage.getItem('drawrush_supabase_url');
const customKey = localStorage.getItem('drawrush_supabase_key');
if (customUrl) supabaseUrl = customUrl;
if (customKey) supabaseAnonKey = customKey;

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('drawrush_supabase_url', url.trim());
  else localStorage.removeItem('drawrush_supabase_url');

  if (key) localStorage.setItem('drawrush_supabase_key', key.trim());
  else localStorage.removeItem('drawrush_supabase_key');

  window.location.reload();
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
