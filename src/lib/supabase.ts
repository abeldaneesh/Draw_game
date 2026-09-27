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

