import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReducedMotion } from "framer-motion";

import { useTheme } from "../hooks/useTheme";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../hooks/useAuth";
import { useTeamDashboard } from "../hooks/useTeamDashboard";
import { useTeamActions } from "../hooks/useTeamActions";

import TeamsDashboard from "../components/teams/TeamsDashboard";
import { TeamUIProvider } from "../context/TeamUIContext";

import { getTheme } from "../config/theme";
import { notify } from "../utils/teamNotify";

export default function TeamDashboardPage() {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const { teamId } = useParams();

  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const {
    team,
    members = [],
    leaderboard = [],
    activity = [],
    loading,
    atTeamLimit,
    selectTeam,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const isDark = resolvedTheme === "dark";

  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const [rankingMode, setRankingMode] = useState("week");
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (teamId) {
      selectTeam(teamId).catch(() => {});
    }
  }, [teamId, selectTeam]);

  useEffect(() => {
    if (teamId && team === null && !loading) {
      navigate("/teams", { replace: true });
    }
  }, [teamId, team, loading, navigate]);

  const matchesRoute =
    Boolean(teamId) && (!team || team.team_id === teamId);

  const displayLoading = loading || !matchesRoute;

  const dashboard = useTeamDashboard({
    team: matchesRoute && team?.team_id === teamId ? team : null,
    members,
    leaderboard,
    user,
    rankingMode,
    selectedMember,
  });

  const actions = useTeamActions({
    team: matchesRoute && team?.team_id === teamId ? team : null,
    isLastMember: dashboard.isLastMember,
    atTeamLimit,
    selectedMember,
    setSelectedMember,
    notify,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  });

  const teamUI = useMemo(
    () => ({
      theme,
      isDark,
      prefersReducedMotion,
    }),
    [theme, isDark, prefersReducedMotion],
  );

  if (displayLoading) {
    return (
      <TeamUIProvider value={teamUI}>
        <div
          className={`min-h-screen overflow-x-hidden font-sans ${theme.app}`}
        >
          <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center justify-center px-5 py-24">
            <p className={`text-sm font-medium ${theme.muted}`}>
              Caricamento squadra…
            </p>
          </main>
        </div>
      </TeamUIProvider>
    );
  }

  return (
    <TeamUIProvider value={teamUI}>
      <TeamsDashboard
        team={team?.team_id === teamId ? team : null}
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