import { useState } from "react";
import { useReducedMotion } from "framer-motion";

import { useTheme } from "../hooks/useTheme";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../hooks/useAuth";
import { useTeamDashboard } from "../hooks/useTeamDashboard";
import { useTeamActions } from "../hooks/useTeamActions";

import TeamsLanding from "../components/teams/TeamsLanding";
import TeamsDashboard from "../components/teams/TeamsDashboard";
import { TeamUIProvider } from "../context/TeamUIContext";

import { getTeamTheme } from "../config/teamTheme";
import { notify } from "../utils/teamNotify";

export default function CagometroTeams() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const {
    team,
    members = [],
    leaderboard = [],
    activity = [],
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const isDark = resolvedTheme === "dark";

  const theme = getTeamTheme(isDark);

  const [rankingMode, setRankingMode] = useState("week");
  const [selectedMember, setSelectedMember] = useState(null);

  const dashboard = useTeamDashboard({
    team,
    members,
    leaderboard,
    user,
    rankingMode,
    selectedMember,
  });

  const actions = useTeamActions({
    team,
    isLastMember: dashboard.isLastMember,
    selectedMember,
    setSelectedMember,
    notify,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  });

  const teamUI = {
    theme,
    isDark,
    prefersReducedMotion,
  };

  if (!team) {
    return (
      <TeamUIProvider value={teamUI}>
        <TeamsLanding
          onCreate={actions.handleCreateTeam}
          onJoin={actions.handleJoinTeam}
        />
      </TeamUIProvider>
    );
  }

  return (
    <TeamUIProvider value={teamUI}>
      <TeamsDashboard
        team={team}
        members={members}
        leaderboard={leaderboard}
        activity={activity}
        user={user}
        rankingMode={rankingMode}
        onRankingChange={setRankingMode}
        data={dashboard}
        actions={actions}
        setSelectedMember={setSelectedMember}
      />
    </TeamUIProvider>
  );
}