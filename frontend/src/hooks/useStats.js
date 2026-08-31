import { calculateStreak } from "../utils/stats";
import {
  getBestStreak,
  saveBestStreak,
} from "../utils/storage";

export function useStats(entries) {
  const streak = calculateStreak(entries);

  const storedBestStreak = getBestStreak();

  const bestStreak =
    streak > storedBestStreak
      ? streak
      : storedBestStreak;

  if (bestStreak > storedBestStreak) {
    saveBestStreak(bestStreak);
  }

  return {
    streak,
    bestStreak,
  };
}
