import { useState } from "react";

import toast from "react-hot-toast";

import { getShownAchievements, saveShownAchievements } from "../utils/storage";

export function useAchievements() {
  const [unlockedAchievement, setUnlockedAchievement] = useState(null);

  const [showConfetti, setShowConfetti] = useState(false);

  function checkAchievements(total, currentStreak) {
    const shownAchievements = getShownAchievements();

    const achievements = [
      {
        title: "Prima Cacca",
        unlocked: total >= 1,
      },
      {
        title: "Abitudinario",
        unlocked: total >= 10,
      },
      {
        title: "Veterano",
        unlocked: total >= 100,
      },
      {
        title: "Costante",
        unlocked: currentStreak >= 7,
      },
      {
        title: "Leggenda",
        unlocked: currentStreak >= 30,
      },
    ];

    let updated = [...shownAchievements];

    achievements.forEach((achievement) => {
      if (
        achievement.unlocked &&
        !shownAchievements.includes(achievement.title)
      ) {
        setUnlockedAchievement(achievement);

        setShowConfetti(true);

        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);

        setTimeout(() => {
          setUnlockedAchievement(null);
        }, 3000);

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

        updated.push(achievement.title);

        saveShownAchievements(updated);
      }
    });

  }

  return {
    unlockedAchievement,
    showConfetti,
    setUnlockedAchievement,
    checkAchievements,
  };
}
