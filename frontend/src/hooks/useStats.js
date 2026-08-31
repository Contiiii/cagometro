import {
  calculateStreak,
  calculateBestStreak,
} from "../utils/stats";

export function useStats(entries) {
  const streak = calculateStreak(entries);

  const bestStreak =
    calculateBestStreak(entries);

  return {
    streak,
    bestStreak,
  };
}