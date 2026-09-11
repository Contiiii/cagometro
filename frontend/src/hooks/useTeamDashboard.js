import { useMemo } from "react";

import { TEAM_WEEKLY_GOAL } from "../config/team";

export function useTeamDashboard({
  team,
  members = [],
  leaderboard = [],
  user,
  rankingMode,
  selectedMember = null,
}) {
  const scores = useMemo(() => leaderboard ?? [], [leaderboard]);
  const roster = useMemo(() => members ?? [], [members]);

  const totalWeekly = useMemo(
    () =>
      scores.reduce(
        (total, member) => total + Number(member.weekly_total || 0),
        0,
      ),
    [scores],
  );

  const totalLifetime = useMemo(
    () =>
      scores.reduce(
        (total, member) => total + Number(member.lifetime_total || 0),
        0,
      ),
    [scores],
  );

  const weeklyGoal = TEAM_WEEKLY_GOAL;

  const ranking = useMemo(() => {
    return [...scores].sort((a, b) => {
      const aScore =
        rankingMode === "week"
          ? Number(a.weekly_total || 0)
          : Number(a.lifetime_total || 0);

      const bScore =
        rankingMode === "week"
          ? Number(b.weekly_total || 0)
          : Number(b.lifetime_total || 0);

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      return String(a.display_name || "").localeCompare(
        String(b.display_name || ""),
        "it",
      );
    });
  }, [scores, rankingMode]);

  const currentUserPosition = useMemo(() => {
    const index = ranking.findIndex((member) => member.user_id === user?.id);

    return index >= 0 ? index + 1 : null;
  }, [ranking, user?.id]);

  const selectedData = useMemo(() => {
    return scores.find((member) => member.user_id === selectedMember) || null;
  }, [scores, selectedMember]);

  const selectedPosition = useMemo(() => {
    if (!selectedData) return null;

    const index = ranking.findIndex(
      (member) => member.user_id === selectedData.user_id,
    );

    return index >= 0 ? index + 1 : null;
  }, [ranking, selectedData]);

  const selectedMembership = useMemo(() => {
    if (!selectedData) return null;

    return roster.find((member) => member.user_id === selectedData.user_id) || null;
  }, [roster, selectedData]);

  const isOwner = useMemo(() => team?.role === "owner", [team?.role]);

  const activeMembers = useMemo(
    () => roster.filter((member) => !member.left_at && !member.removed_at),
    [roster],
  );

  const isLastMember = isOwner && activeMembers.length === 1;

  const inviteCode = team?.invite_code ?? "";

  return {
    totalWeekly,
    totalLifetime,
    weeklyGoal,
    ranking,
    currentUserPosition,
    selectedData,
    selectedPosition,
    selectedMembership,
    isOwner,
    activeMembers,
    isLastMember,
    inviteCode,
  };
}