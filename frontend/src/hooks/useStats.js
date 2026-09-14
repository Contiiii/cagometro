import { useMemo } from "react";

import {
  calculateStreak,
  calculateBestStreak,
} from "../utils/stats";

export function useStats(entries) {
  const streak = useMemo(() => calculateStreak(entries), [entries]);

  const bestStreak = useMemo(
    () => calculateBestStreak(entries),
    [entries],
  );

  return {
    streak,
    bestStreak,
  };
}