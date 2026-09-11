import { useState } from "react";

import {
  getShownAchievements,
  saveShownAchievements,
} from "../utils/storage";

import {
  ACHIEVEMENTS,
  getAchievementProgress,
} from "../config/achievements.js";

export function useAchievements() {
  const [achievementQueue, setAchievementQueue] = useState([]);

  const unlockedAchievement =
    achievementQueue[0] ?? null;

  function checkAchievements(
    total,
    currentStreak,
  ) {
    const shownAchievements =
      getShownAchievements();

    const newAchievements =
      ACHIEVEMENTS.filter(
        (achievement) => {
          const progress =
            getAchievementProgress(
              achievement,
              {
                total,
                streak: currentStreak,
              },
            );

          return (
            progress >= achievement.target &&
            !shownAchievements.includes(
              achievement.id,
            )
          );
        },
      );

    if (newAchievements.length === 0) {
      return;
    }

    const updatedShownAchievements = [
      ...new Set([
        ...shownAchievements,
        ...newAchievements.map(
          (achievement) => achievement.id,
        ),
      ]),
    ];

    saveShownAchievements(
      updatedShownAchievements,
    );

    setAchievementQueue(
      (currentQueue) => [
        ...currentQueue,
        ...newAchievements,
      ],
    );
  }

  function resetLockedAchievements(
    total,
    currentStreak,
  ) {
    const shownAchievements =
      getShownAchievements();

    const stillUnlockedIds =
      ACHIEVEMENTS.filter(
        (achievement) => {
          const progress =
            getAchievementProgress(
              achievement,
              {
                total,
                streak: currentStreak,
              },
            );

          return (
            progress >= achievement.target
          );
        },
      ).map(
        (achievement) => achievement.id,
      );

    const updatedShownAchievements =
      shownAchievements.filter(
        (achievementId) =>
          stillUnlockedIds.includes(
            achievementId,
          ),
      );

    saveShownAchievements(
      updatedShownAchievements,
    );
  }

  function closeAchievement() {
    setAchievementQueue(
      (currentQueue) =>
        currentQueue.slice(1),
    );
  }

  return {
    unlockedAchievement,
    closeAchievement,
    checkAchievements,
    resetLockedAchievements,
  };
}