// SHA-256 helper for client-side secret word hashing (Anti-cheat privacy)
export async function hashWord(word: string): Promise<string> {
  const normalized = word.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate unpredictable room code (e.g. DRW-8K4P)
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'DRW-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate unique player ID
export function generatePlayerId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Format word string into blank placeholders (e.g., "APPLE" -> "_ _ _ _ _")
export function formatWordBlanks(wordLength: number): string {
  return Array(wordLength).fill('_').join(' ');
}

// Fun avatar list
export const AVATARS = [
  '🦊', '🐼', '🦄', '🚀', '🎨', '🦁', 
  '🤖', '🍕', '🐱', '🐶', '👻', '⚡'
];

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
