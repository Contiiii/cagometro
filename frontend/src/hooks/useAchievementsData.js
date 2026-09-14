import { useMemo } from "react";

import {
  ACHIEVEMENTS,
  TEAM_ACHIEVEMENTS,
  getAchievementProgress,
} from "../config/achievements";

import {
  calculateStreak,
  getTotalHistorical,
} from "../utils/stats";

function normalizeAchievement(achievement) {
  return {
    ...achievement,

    rarity:
      achievement.target >= 1000
        ? "Leggendario"
        : achievement.target >= 100
          ? "Epico"
          : achievement.target >= 10
            ? "Raro"
            : "Comune",

    accent:
      achievement.target >= 100
        ? "amber"
        : achievement.target >= 10
          ? "emerald"
          : "pink",

    note: achievement.description,

    xp: achievement.target * 10,

    unlockedAt: "oggi",

    secret: achievement.secret || false,
  };
}

export function useAchievementsData({
  entries,
  leaderboard,
  members,
  section,
  activeFilter,
}) {
  const totalHistorical = useMemo(
    () => getTotalHistorical(entries),
    [entries],
  );

  const streak = useMemo(
    () => calculateStreak(entries),
    [entries],
  );

  const personalAchievements = useMemo(() => {
    return ACHIEVEMENTS.map((achievement) => {
      const progress = getAchievementProgress(
        achievement,
        {
          total: totalHistorical,
          streak,
        },
      );

      return normalizeAchievement({
        ...achievement,
        progress,
        unlocked:
          progress >= achievement.target,
      });
    });
  }, [totalHistorical, streak]);

  const weeklyTotal = useMemo(
    () =>
      (leaderboard || []).reduce(
        (sum, player) =>
          sum +
          Number(player.weekly_total || 0),
        0,
      ),
    [leaderboard],
  );

  const lifetimeTotal = useMemo(
    () =>
      (leaderboard || []).reduce(
        (sum, player) =>
          sum +
          Number(player.lifetime_total || 0),
        0,
      ),
    [leaderboard],
  );

  const goalCompleted =
    weeklyTotal >= 100;

  const teamAchievements = useMemo(() => {
    return TEAM_ACHIEVEMENTS.map(
      (achievement) => {
        let progress = 0;

        switch (achievement.id) {
          case "first-team":
            progress =
              (members || []).length > 0
                ? 1
                : 0;
            break;

          case "weekly-100":
            progress = weeklyTotal;
            break;

          case "lifetime-500":
            progress = lifetimeTotal;
            break;

          case "lifetime-1000":
            progress = lifetimeTotal;
            break;

          case "ten-members":
            progress =
              (members || []).length;
            break;

          case "goal-completed":
            progress = goalCompleted
              ? 1
              : 0;
            break;

          default:
            break;
        }

        return normalizeAchievement({
          ...achievement,
          progress,
          unlocked:
            progress >=
            achievement.target,
        });
      },
    );
  }, [
    members,
    weeklyTotal,
    lifetimeTotal,
    goalCompleted,
  ]);

  const allAchievements = useMemo(
    () =>
      section === "personali"
        ? personalAchievements
        : teamAchievements,
    [section, personalAchievements, teamAchievements],
  );

  const unlocked = useMemo(
    () =>
      allAchievements.filter(
        (achievement) => achievement.unlocked,
      ),
    [allAchievements],
  );

  const inProgress = useMemo(
    () =>
      allAchievements.filter(
        (achievement) =>
          !achievement.unlocked &&
          !achievement.secret,
      ),
    [allAchievements],
  );

  const filteredAchievements = useMemo(() => {
    return allAchievements
      .filter((achievement) => {
        if (
          activeFilter === "Ottenuti"
        ) {
          return achievement.unlocked;
        }

        if (
          activeFilter === "In corso"
        ) {
          return (
            !achievement.unlocked &&
            !achievement.secret
          );
        }

        if (
          activeFilter === "Segreti"
        ) {
          return achievement.secret;
        }

        return true;
      })
      .sort((a, b) => {
        if (
          a.unlocked !== b.unlocked
        ) {
          return a.unlocked ? -1 : 1;
        }

        const aRatio = a.target
          ? a.progress / a.target
          : 0;

        const bRatio = b.target
          ? b.progress / b.target
          : 0;

        return bRatio - aRatio;
      });
  }, [allAchievements, activeFilter]);

  const nextAchievement = useMemo(
    () =>
      [...inProgress].sort((a, b) => {
        const aRatio = a.target
          ? a.progress / a.target
          : 0;

        const bRatio = b.target
          ? b.progress / b.target
          : 0;

        return bRatio - aRatio;
      })[0] || null,
    [inProgress],
  );

  const overallProgress = useMemo(
    () =>
      allAchievements.length > 0
        ? Math.round(
            (unlocked.length /
              allAchievements.length) *
              100,
          )
        : 0,
    [unlocked, allAchievements],
  );

  const nextAchievementProgress = useMemo(
    () =>
      nextAchievement?.target
        ? Math.min(
            100,
            Math.round(
              (nextAchievement.progress /
                nextAchievement.target) *
                100,
            ),
          )
        : 0,
    [nextAchievement],
  );

  return {
    allAchievements,
    unlocked,
    inProgress,
    filteredAchievements,
    nextAchievement,
    overallProgress,
    nextAchievementProgress,
  };
}