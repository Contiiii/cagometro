import { useState } from "react";
import toast from "react-hot-toast";

import { getShownAchievements, saveShownAchievements } from "../utils/storage";

import {
  ACHIEVEMENTS,
  getAchievementProgress,
} from "../config/achievements.js";

export function useAchievements() {
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const unlockedAchievement = achievementQueue[0] ?? null;

  function checkAchievements(total, currentStreak) {
    const shownAchievements = getShownAchievements();
    const newAchievements = ACHIEVEMENTS.filter((achievement) => {
      const progress = getAchievementProgress(achievement, {
        total,
        streak: currentStreak,
      });

      return (
        progress >= achievement.target &&
        !shownAchievements.includes(achievement.id)
      );
    });

    if (newAchievements.length === 0) {
      return;
    }

    const updatedShownAchievements = [
      ...new Set([
        ...shownAchievements,
        ...newAchievements.map((achievement) => achievement.id),
      ]),
    ];

    saveShownAchievements(updatedShownAchievements);

    setAchievementQueue((currentQueue) => [
      ...currentQueue,
      ...newAchievements,
    ]);

    setShowConfetti(true);

    window.setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    newAchievements.forEach((achievement) => {
      toast.success(`🏆 ${achievement.title}`, {
        duration: 4000,
        style: {
          background: "#18181b",
          color: "#fff",
          border: "1px solid rgba(244,114,182,.3)",
          borderRadius: "16px",
          padding: "12px 16px",
        },
      });
    });
  }

  function resetLockedAchievements(total, currentStreak) {
    const shownAchievements = getShownAchievements();

    const stillUnlockedIds = ACHIEVEMENTS.filter((achievement) => {
      const progress = getAchievementProgress(achievement, {
        total,
        streak: currentStreak,
      });

      return progress >= achievement.target;
    }).map((achievement) => achievement.id);

    const updatedShownAchievements = shownAchievements.filter((achievementId) =>
      stillUnlockedIds.includes(achievementId),
    );

    saveShownAchievements(updatedShownAchievements);
  }
  function closeAchievement() {
    setAchievementQueue((currentQueue) => currentQueue.slice(1));
  }

  return {
    unlockedAchievement,
    showConfetti,
    closeAchievement,
    checkAchievements,
    resetLockedAchievements,
  };
}
