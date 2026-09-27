export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED';
export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  turnDuration: number; // in seconds
  difficulty: WordDifficulty;
  customWords?: string[];
}

export interface RoomState extends RoomSettings {
  id: string;
  roomCode: string;
  hostPlayerId: string;
  status: RoomStatus;
  currentRound: number;
  currentTurn: number; // index of turn in current round
  currentDrawerId: string | null;
  wordHash: string | null;
  wordLength: number | null;
  wordCategory: string | null;
  secretWordReveal: string | null;
  turnStartedAt: number | null; // timestamp ms
  turnEndsAt: number | null; // timestamp ms
  createdAt: number;
}

export interface Player {
  id: string;
  roomId: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  hasGuessedCorrect: boolean;
  joinedAt: number;
}

export interface GuessMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  guess: string;
  isCorrect: boolean;
  isSystem?: boolean;
  createdAt: number;
}

export type CanvasTool = 'pencil' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'fill';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  id: string;
  tool: CanvasTool;
  color: string;
  width: number;
  points: Point[]; // For freehand pencil/eraser
  startPoint?: Point; // For shape drawing
  endPoint?: Point; // For shape drawing
  fillPoint?: Point; // For bucket fill
}

export interface DrawingEvent {
  type: 'stroke' | 'shape' | 'fill' | 'undo' | 'clear' | 'full_sync';
  stroke?: StrokeData;
  drawingDataUrl?: string; // fallback full sync image for catchup
  senderId?: string;
  timestamp: number;
}

export interface WordOption {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
