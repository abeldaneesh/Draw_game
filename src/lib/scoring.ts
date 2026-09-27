/**
 * Scoring System for DrawRush
 */

export function calculateGuesserScore(correctCount: number, timeRemainingSec: number, totalTurnSec: number): number {
  let baseScore = 100;
  if (correctCount === 1) baseScore = 300;
  else if (correctCount === 2) baseScore = 250;
  else if (correctCount === 3) baseScore = 200;
  else if (correctCount === 4) baseScore = 150;

  // Add time bonus (up to +50 bonus points if guessed early)
  const timeRatio = Math.max(0, Math.min(1, timeRemainingSec / (totalTurnSec || 60)));
  const timeBonus = Math.round(timeRatio * 50);

  return baseScore + timeBonus;
}

export function calculateDrawerBonus(): number {
  return 75; // Points awarded to drawer per player who guesses correctly
}
