import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

import { reportError } from "../utils/reportError";

import { useAuth } from "../hooks/useAuth";

import { TeamContext } from "./team-context";

import {
  getMyTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";

export function TeamProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const dashboardRequestRef = useRef(0);

  const clearTeamData = useCallback(() => {
    setTeam(null);
    setMembers([]);
    setLeaderboard([]);
    setActivity([]);
  }, []);

  const refreshTeam = useCallback(async () => {
    const generation = dashboardRequestRef.current;
    const data = await getMyTeam();

    if (generation !== dashboardRequestRef.current) {
      return data;
    }

    setTeam(data);

    return data;
  }, []);

  const refreshMembers = useCallback(async () => {
    const generation = dashboardRequestRef.current;
    const data = await getTeamMembers();

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    setMembers(data ?? []);

    return data ?? [];
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    const generation = dashboardRequestRef.current;
    const data = await getTeamLeaderboard();

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    setLeaderboard(data ?? []);

    return data ?? [];
  }, []);

  const refreshActivity = useCallback(async () => {
    const generation = dashboardRequestRef.current;
    const data = await getTeamActivity(20, 0);

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    setActivity(data ?? []);

    return data ?? [];
  }, []);

  const refreshDashboard = useCallback(
    async (requestedUserId = user?.id) => {
      if (!requestedUserId) {
        return {
          hasErrors: false,
          failedSections: [],
        };
      }

      const requestId = ++dashboardRequestRef.current;

      setLoading(true);

      try {
        const nextTeam = await getMyTeam();

        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        setTeam(nextTeam);

        if (!nextTeam) {
          setMembers([]);
          setLeaderboard([]);
          setActivity([]);
          setLoadedUserId(requestedUserId);

          return {
            hasErrors: false,
            failedSections: [],
          };
        }

        const [membersResult, leaderboardResult, activityResult] =
          await Promise.allSettled([
            getTeamMembers(),
            getTeamLeaderboard(),
            getTeamActivity(20, 0),
          ]);

        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value ?? []);
        } else {
          setMembers([]);

          reportError(membersResult.reason, {
            feature: "team-members-load",
            userId: user?.id ?? null,
            message: "Errore caricamento membri Team:",
          });
        }

        if (leaderboardResult.status === "fulfilled") {
          setLeaderboard(leaderboardResult.value ?? []);
        } else {
          setLeaderboard([]);

          reportError(leaderboardResult.reason, {
            feature: "team-leaderboard-load",
            userId: user?.id ?? null,
            message: "Errore caricamento classifica Team:",
          });
        }

        if (activityResult.status === "fulfilled") {
          setActivity(activityResult.value ?? []);
        } else {
          setActivity([]);

          reportError(activityResult.reason, {
            feature: "team-activity-load",
            userId: user?.id ?? null,
            message: "Errore caricamento attività Team:",
          });
        }

        const failedSections = [
          membersResult.status === "rejected" ? "members" : null,
          leaderboardResult.status === "rejected" ? "leaderboard" : null,
          activityResult.status === "rejected" ? "activity" : null,
        ].filter(Boolean);

        setLoadedUserId(requestedUserId);

        return {
          hasErrors: failedSections.length > 0,
          failedSections,
        };
      } catch (error) {
        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        clearTeamData();
        setLoadedUserId(requestedUserId);

        throw error;
      } finally {
        if (requestId === dashboardRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [clearTeamData, user],
  );

  useEffect(() => {
    if (authLoading || !user?.id) {
      return undefined;
    }

    const requestedUserId = user.id;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      refreshDashboard(requestedUserId).catch((error) => {
        if (!cancelled) {
          reportError(error, {
            feature: "team-dashboard-load",
            userId: user?.id ?? null,
            message: "Impossibile caricare la dashboard Team:",
          });
        }
      });
    }, 0);

    return () => {
      cancelled = true;
      dashboardRequestRef.current += 1;
      window.clearTimeout(timeoutId);
    };
  }, [authLoading, user?.id, refreshDashboard]);

  const isAuthenticated = Boolean(user?.id);

  const hasCurrentUserData = isAuthenticated && loadedUserId === user?.id;

  const currentTeamId = hasCurrentUserData
    ? (team?.id ?? team?.team_id ?? null)
    : null;

  useEffect(() => {
    if (authLoading || !user?.id || !currentTeamId) {
      return undefined;
    }

    const channel = supabase
      .channel(`team-activity-${currentTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity",
          filter: `team_id=eq.${currentTeamId}`,
        },
        async (payload) => {
          const activityType = payload.new?.activity_type;

          const shouldRefreshMembers = [
            "member_joined",
            "member_left",
            "member_removed",
            "ownership_transferred",
          ].includes(activityType);

          const operations = [refreshActivity(), refreshLeaderboard()];

          if (shouldRefreshMembers) {
            operations.push(refreshMembers());
          }

          const results = await Promise.allSettled(operations);

          results.forEach((result) => {
            if (result.status === "rejected") {
            reportError(result.reason, {
              feature: "team-realtime-refresh",
              userId: user?.id ?? null,
              message: "Errore aggiornamento realtime Team:",
            });
            }
          });
        },
      )
      .subscribe((status, error) => {
        if (error) {
          reportError(error, {
            feature: "team-realtime",
            userId: user?.id ?? null,
            message: "Errore Team Realtime:",
          });
        }

        if (status === "CHANNEL_ERROR") {
          reportError(null, {
            feature: "team-realtime-channel",
            userId: user?.id ?? null,
            message: "Canale Team Realtime non disponibile",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    authLoading,
    user?.id,
    currentTeamId,
    refreshActivity,
    refreshLeaderboard,
    refreshMembers,
  ]);

  const contextValue = useMemo(
    () => ({
      team: hasCurrentUserData ? team : null,
      members: hasCurrentUserData ? members : [],
      leaderboard: hasCurrentUserData ? leaderboard : [],
      activity: hasCurrentUserData ? activity : [],
      loading:
        authLoading || (isAuthenticated && (!hasCurrentUserData || loading)),
      refreshDashboard,
      refreshTeam,
      refreshMembers,
      refreshLeaderboard,
      refreshActivity,
    }),
    [
      authLoading,
      isAuthenticated,
      hasCurrentUserData,
      team,
      members,
      leaderboard,
      activity,
      loading,
      refreshDashboard,
      refreshTeam,
      refreshMembers,
      refreshLeaderboard,
      refreshActivity,
    ],
  );

  return (
    <TeamContext.Provider value={contextValue}>{children}</TeamContext.Provider>
  );
}
