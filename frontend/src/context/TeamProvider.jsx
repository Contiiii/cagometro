import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

import { reportError } from "../utils/reportError";

import { useAuth } from "../hooks/useAuth";

import { useSettings } from "../hooks/useSettings";

import { TeamContext } from "./team-context";

import {
  getMyTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";

import {
  loadTeamSnapshot,
  saveTeamSnapshot,
  clearTeamSnapshot,
} from "../utils/storage";

export const TEAM_REALTIME_DEBOUNCE_MS = 500;

const REALTIME_LEADERBOARD_EVENT_TYPES = new Set([
  "entry_created",
  "member_joined",
  "member_left",
  "member_removed",
]);

const REALTIME_MEMBERS_EVENT_TYPES = new Set([
  "member_joined",
  "member_left",
  "member_removed",
  "ownership_transferred",
]);

export function TeamProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const { initialTeamActivityLimit } = useSettings();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const dashboardRequestRef = useRef(0);
  const hydratedUserIdRef = useRef(null);
  const teamIdRef = useRef(null);
  const realtimeDebounceTimerRef = useRef(null);
  const realtimeLeaderboardDirtyRef = useRef(false);
  const realtimeMembersDirtyRef = useRef(false);

  const clearTeamData = useCallback(() => {
    setTeam(null);
    setMembers([]);
    setLeaderboard([]);
    setActivity([]);
  }, []);

  // Riflette lo stato di `team` (incluso idratazione da snapshot) per
  // rilevare i cambi di squadra dentro refreshDashboard.
  useEffect(() => {
    teamIdRef.current = team?.id ?? team?.team_id ?? null;
  }, [team]);

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
    const data = await getTeamActivity(initialTeamActivityLimit, 0);

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    setActivity(data ?? []);

    return data ?? [];
  }, [initialTeamActivityLimit]);

  const refreshDashboard = useCallback(
    async (requestedUserId = user?.id) => {
      if (!requestedUserId) {
        return {
          hasErrors: false,
          failedSections: [],
        };
      }

      const requestId = ++dashboardRequestRef.current;
      const previousTeamId = teamIdRef.current;

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

        const nextTeamId = nextTeam?.id ?? nextTeam?.team_id ?? null;
        const teamChanged = previousTeamId !== nextTeamId;

        teamIdRef.current = nextTeamId;

        setTeam(nextTeam);

        if (!nextTeam) {
          clearTeamSnapshot(requestedUserId);
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
            getTeamActivity(initialTeamActivityLimit, 0),
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
          if (teamChanged) {
            setMembers([]);
          }

          reportError(membersResult.reason, {
            feature: "team-members-load",
            userId: user?.id ?? null,
            message: "Errore caricamento membri Team:",
          });
        }

        if (leaderboardResult.status === "fulfilled") {
          setLeaderboard(leaderboardResult.value ?? []);
        } else {
          if (teamChanged) {
            setLeaderboard([]);
          }

          reportError(leaderboardResult.reason, {
            feature: "team-leaderboard-load",
            userId: user?.id ?? null,
            message: "Errore caricamento classifica Team:",
          });
        }

        if (activityResult.status === "fulfilled") {
          setActivity(activityResult.value ?? []);
        } else {
          if (teamChanged) {
            setActivity([]);
          }

          reportError(activityResult.reason, {
            feature: "team-activity-load",
            userId: user?.id ?? null,
            message: "Errore caricamento attività Team:",
          });
        }

        // Save snapshot after successful data load
        if (
          membersResult.status === "fulfilled" &&
          leaderboardResult.status === "fulfilled" &&
          activityResult.status === "fulfilled"
        ) {
          saveTeamSnapshot(requestedUserId, {
            team: nextTeam,
            members: membersResult.value ?? [],
            leaderboard: leaderboardResult.value ?? [],
            activity: activityResult.value ?? [],
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

        if (!loadTeamSnapshot(requestedUserId)) {
          clearTeamData();
        }

        setLoadedUserId(requestedUserId);

        throw error;
      } finally {
        if (requestId === dashboardRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [clearTeamData, user, initialTeamActivityLimit],
  );

  useEffect(() => {
    if (authLoading || !user?.id) {
      return undefined;
    }

    const requestedUserId = user.id;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      // Hydrate dallo snapshot locale una sola volta per utente, poi rigenera.
      if (!cancelled && hydratedUserIdRef.current !== requestedUserId) {
        hydratedUserIdRef.current = requestedUserId;

        const snapshot = loadTeamSnapshot(requestedUserId);

        if (snapshot) {
          setTeam(snapshot.team ?? null);
          setMembers(snapshot.members ?? []);
          setLeaderboard(snapshot.leaderboard ?? []);
          setActivity(snapshot.activity ?? []);
        }
      }

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
        (payload) => {
          const activityType = payload.new?.activity_type;

          if (REALTIME_LEADERBOARD_EVENT_TYPES.has(activityType)) {
            realtimeLeaderboardDirtyRef.current = true;
          }

          if (REALTIME_MEMBERS_EVENT_TYPES.has(activityType)) {
            realtimeMembersDirtyRef.current = true;
          }

          if (realtimeDebounceTimerRef.current) {
            window.clearTimeout(realtimeDebounceTimerRef.current);
          }

          realtimeDebounceTimerRef.current = window.setTimeout(() => {
            realtimeDebounceTimerRef.current = null;

            const operations = [refreshActivity()];

            if (realtimeLeaderboardDirtyRef.current) {
              realtimeLeaderboardDirtyRef.current = false;
              operations.push(refreshLeaderboard());
            }

            if (realtimeMembersDirtyRef.current) {
              realtimeMembersDirtyRef.current = false;
              operations.push(refreshMembers());
            }

            Promise.allSettled(operations)
              .then((results) => {
                results.forEach((result) => {
                  if (result.status === "rejected") {
                    reportError(result.reason, {
                      feature: "team-realtime-refresh",
                      userId: user?.id ?? null,
                      message: "Errore aggiornamento realtime Team:",
                    });
                  }
                });
              })
              .catch((error) => {
                reportError(error, {
                  feature: "team-realtime-refresh",
                  userId: user?.id ?? null,
                  message: "Errore aggiornamento realtime Team:",
                });
              });
          }, TEAM_REALTIME_DEBOUNCE_MS);
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
      if (realtimeDebounceTimerRef.current) {
        window.clearTimeout(realtimeDebounceTimerRef.current);
        realtimeDebounceTimerRef.current = null;
      }

      realtimeLeaderboardDirtyRef.current = false;
      realtimeMembersDirtyRef.current = false;

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
