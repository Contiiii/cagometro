import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

import { reportError } from "../utils/reportError";

import { useAuth } from "../hooks/useAuth";

import { useSettings } from "../hooks/useSettings";

import { TeamContext } from "./team-context";

import {
  getMyTeams,
  getTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";

import { MAX_TEAMS_PER_USER } from "../config/team";

import {
  loadTeamSnapshot,
  saveTeamSnapshot,
  clearTeamSnapshot,
  loadViewedTeamId,
  saveViewedTeamId,
} from "../utils/storage";

export const TEAM_REALTIME_DEBOUNCE_MS = 500;

export const MAX_TEAMS = MAX_TEAMS_PER_USER;

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

  const [teams, setTeams] = useState([]);
  const [viewedTeamId, setViewedTeamId] = useState(null);
  const [bundle, setBundle] = useState({
    team: null,
    members: [],
    leaderboard: [],
    activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const dashboardRequestRef = useRef(0);
  const hydratedUserIdRef = useRef(null);
  const viewedTeamIdRef = useRef(null);
  const cacheRef = useRef(new Map());
  const realtimeDebounceTimerRef = useRef(null);
  const realtimeLeaderboardDirtyRef = useRef(false);
  const realtimeMembersDirtyRef = useRef(false);
  const teamIdsRef = useRef([]);

  const userId = user?.id ?? null;

  const applyTeams = useCallback((nextTeams) => {
    const list = Array.isArray(nextTeams) ? nextTeams : [];
    teamIdsRef.current = list.map((item) => item.team_id);
    setTeams(list);
    return list;
  }, []);

  const clearBundle = useCallback(() => {
    setBundle({ team: null, members: [], leaderboard: [], activity: [] });
  }, []);

  const resolveViewedTeamId = useCallback(
    (nextTeams, fallbackId) => {
      if (!Array.isArray(nextTeams) || nextTeams.length === 0) {
        return null;
      }

      const storedId = loadViewedTeamId(userId);
      const candidate = [storedId, fallbackId]
        .filter(Boolean)
        .find((id) => nextTeams.some((item) => item.team_id === id));

      return candidate ?? nextTeams[0].team_id;
    },
    [userId],
  );

  const loadTeamBundle = useCallback(
    async (teamId, requestId) => {
      const prev = cacheRef.current.get(teamId);

      const [teamResult, membersResult, leaderboardResult, activityResult] =
        await Promise.allSettled([
          getTeam(teamId),
          getTeamMembers(teamId),
          getTeamLeaderboard(teamId),
          getTeamActivity(initialTeamActivityLimit, 0, teamId),
        ]);

      if (requestId !== dashboardRequestRef.current) {
        return {
          hasErrors: false,
          failedSections: [],
          cancelled: true,
        };
      }

      if (teamResult.status === "rejected") {
        reportError(teamResult.reason, {
          feature: "team-load",
          userId,
          message: "Errore caricamento squadra:",
        });
      }

      if (membersResult.status === "rejected") {
        reportError(membersResult.reason, {
          feature: "team-members-load",
          userId,
          message: "Errore caricamento membri Team:",
        });
      }

      if (leaderboardResult.status === "rejected") {
        reportError(leaderboardResult.reason, {
          feature: "team-leaderboard-load",
          userId,
          message: "Errore caricamento classifica Team:",
        });
      }

      if (activityResult.status === "rejected") {
        reportError(activityResult.reason, {
          feature: "team-activity-load",
          userId,
          message: "Errore caricamento attività Team:",
        });
      }

      const nextBundle = {
        team: teamResult.status === "fulfilled" ? (teamResult.value ?? null) : (prev?.team ?? null),
        members:
          membersResult.status === "fulfilled"
            ? (membersResult.value ?? [])
            : (prev?.members ?? []),
        leaderboard:
          leaderboardResult.status === "fulfilled"
            ? (leaderboardResult.value ?? [])
            : (prev?.leaderboard ?? []),
        activity:
          activityResult.status === "fulfilled"
            ? (activityResult.value ?? [])
            : (prev?.activity ?? []),
      };

      cacheRef.current.set(teamId, nextBundle);
      viewedTeamIdRef.current = teamId;
      setViewedTeamId(teamId);
      setBundle(nextBundle);
      saveViewedTeamId(userId, teamId);

      const failedSections = [
        membersResult.status === "rejected" ? "members" : null,
        leaderboardResult.status === "rejected" ? "leaderboard" : null,
        activityResult.status === "rejected" ? "activity" : null,
      ].filter(Boolean);

      return {
        hasErrors: failedSections.length > 0,
        failedSections,
      };
    },
    [initialTeamActivityLimit, userId],
  );

  const refreshTeams = useCallback(async () => {
    const generation = dashboardRequestRef.current;
    const data = await getMyTeams();

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    applyTeams(data ?? []);

    return data ?? [];
  }, [applyTeams]);

  const refreshDashboard = useCallback(
    async (requestedUserId = userId) => {
      if (!requestedUserId) {
        return {
          hasErrors: false,
          failedSections: [],
        };
      }

      const requestId = ++dashboardRequestRef.current;

      setLoading(true);

      try {
        const nextTeams = await getMyTeams();

        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        applyTeams(nextTeams ?? []);

        const nextViewedTeamId = resolveViewedTeamId(
          nextTeams ?? [],
          viewedTeamIdRef.current,
        );

        viewedTeamIdRef.current = nextViewedTeamId;
        setViewedTeamId(nextViewedTeamId);

        if (!nextViewedTeamId) {
          clearTeamSnapshot(requestedUserId);
          cacheRef.current.clear();
          clearBundle();
          setLoadedUserId(requestedUserId);

          return {
            hasErrors: false,
            failedSections: [],
          };
        }

        const loadResult = await loadTeamBundle(nextViewedTeamId, requestId);

        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        if (cacheRef.current.get(nextViewedTeamId)?.team) {
          saveTeamSnapshot(requestedUserId, {
            teams: nextTeams ?? [],
            viewedTeamId: nextViewedTeamId,
            ...(cacheRef.current.get(nextViewedTeamId) ?? {}),
          });
        }

        setLoadedUserId(requestedUserId);

        return loadResult;
      } catch (error) {
        if (requestId !== dashboardRequestRef.current) {
          return {
            hasErrors: false,
            failedSections: [],
            cancelled: true,
          };
        }

        const cached = cacheRef.current.get(viewedTeamIdRef.current);

        if (!cached) {
          clearBundle();
        }

        setLoadedUserId(requestedUserId);

        throw error;
      } finally {
        if (requestId === dashboardRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [applyTeams, clearBundle, loadTeamBundle, resolveViewedTeamId, userId],
  );

  // Riflette lo stato della squadra visualizzata in un ref: le funzioni di
  // refresh leggono il ref (stabile) invece dello stato per non ricreare i
  // callback a ogni cambio di bundle.
  useEffect(() => {
    viewedTeamIdRef.current = viewedTeamId;
  }, [viewedTeamId]);

  useEffect(() => {
    if (authLoading || !userId) {
      return undefined;
    }

    const requestedUserId = userId;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      if (hydratedUserIdRef.current !== requestedUserId) {
        hydratedUserIdRef.current = requestedUserId;

        const snapshot = loadTeamSnapshot(requestedUserId);

        if (snapshot) {
          const nextTeams = snapshot.teams ?? [];
          applyTeams(nextTeams);
          setViewedTeamId(snapshot.viewedTeamId ?? null);
          viewedTeamIdRef.current = snapshot.viewedTeamId ?? null;

          if (snapshot.team) {
            const nextBundle = {
              team: snapshot.team,
              members: snapshot.members ?? [],
              leaderboard: snapshot.leaderboard ?? [],
              activity: snapshot.activity ?? [],
            };

            const cachedTeamId =
              snapshot.viewedTeamId ?? snapshot.team?.team_id ?? null;

            cacheRef.current.set(cachedTeamId, nextBundle);
            setBundle(nextBundle);
          }
        }
      }

      refreshDashboard(requestedUserId).catch((error) => {
        if (!cancelled) {
          reportError(error, {
            feature: "team-dashboard-load",
            userId,
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
  }, [authLoading, userId, applyTeams, refreshDashboard]);

  const selectTeam = useCallback(
    async (teamId) => {
      if (!teamId) {
        return;
      }

      await refreshTeams();

      if (viewedTeamIdRef.current === teamId && cacheRef.current.has(teamId)) {
        const cached = cacheRef.current.get(teamId);
        setViewedTeamId(teamId);
        setBundle(cached);
        return;
      }

      const requestId = ++dashboardRequestRef.current;

      setLoading(true);

      try {
        return await loadTeamBundle(teamId, requestId);
      } finally {
        if (requestId === dashboardRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [loadTeamBundle, refreshTeams],
  );

  const refreshTeam = useCallback(async () => {
    const teamId = viewedTeamIdRef.current;

    if (!teamId) {
      return null;
    }

    const generation = dashboardRequestRef.current;
    const data = await getTeam(teamId);

    if (generation !== dashboardRequestRef.current) {
      return data;
    }

    const prev = cacheRef.current.get(teamId) ?? {
      team: null,
      members: [],
      leaderboard: [],
      activity: [],
    };
    const next = { ...prev, team: data };

    cacheRef.current.set(teamId, next);

    if (viewedTeamIdRef.current === teamId) {
      setBundle(next);
    }

    return data;
  }, []);

  const refreshMembers = useCallback(async () => {
    const teamId = viewedTeamIdRef.current;

    if (!teamId) {
      return [];
    }

    const generation = dashboardRequestRef.current;
    const data = await getTeamMembers(teamId);

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    const prev = cacheRef.current.get(teamId) ?? {
      team: null,
      members: [],
      leaderboard: [],
      activity: [],
    };
    const next = { ...prev, members: data ?? [] };

    cacheRef.current.set(teamId, next);

    if (viewedTeamIdRef.current === teamId) {
      setBundle(next);
    }

    return data ?? [];
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    const teamId = viewedTeamIdRef.current;

    if (!teamId) {
      return [];
    }

    const generation = dashboardRequestRef.current;
    const data = await getTeamLeaderboard(teamId);

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    const prev = cacheRef.current.get(teamId) ?? {
      team: null,
      members: [],
      leaderboard: [],
      activity: [],
    };
    const next = { ...prev, leaderboard: data ?? [] };

    cacheRef.current.set(teamId, next);

    if (viewedTeamIdRef.current === teamId) {
      setBundle(next);
    }

    return data ?? [];
  }, []);

  const refreshActivity = useCallback(async () => {
    const teamId = viewedTeamIdRef.current;

    if (!teamId) {
      return [];
    }

    const generation = dashboardRequestRef.current;
    const data = await getTeamActivity(initialTeamActivityLimit, 0, teamId);

    if (generation !== dashboardRequestRef.current) {
      return data ?? [];
    }

    const prev = cacheRef.current.get(teamId) ?? {
      team: null,
      members: [],
      leaderboard: [],
      activity: [],
    };
    const next = { ...prev, activity: data ?? [] };

    cacheRef.current.set(teamId, next);

    if (viewedTeamIdRef.current === teamId) {
      setBundle(next);
    }

    return data ?? [];
  }, [initialTeamActivityLimit]);

  const isAuthenticated = Boolean(userId);

  const hasCurrentUserData = isAuthenticated && loadedUserId === userId;

  const currentViewedTeamId = hasCurrentUserData ? viewedTeamId : null;

  useEffect(() => {
    if (authLoading || !userId || !currentViewedTeamId) {
      return undefined;
    }

    function handleActivityChange(activityType) {
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
                  userId,
                  message: "Errore aggiornamento realtime Team:",
                });
              }
            });
          })
          .catch((error) => {
            reportError(error, {
              feature: "team-realtime-refresh",
              userId,
              message: "Errore aggiornamento realtime Team:",
            });
          });
      }, TEAM_REALTIME_DEBOUNCE_MS);
    }

    const channel = supabase
      .channel(`team-activity-${currentViewedTeamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity",
          filter: `team_id=eq.${currentViewedTeamId}`,
        },
        (payload) => {
          const activityType = payload.new?.activity_type;
          handleActivityChange(activityType);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "team_activity",
          filter: `team_id=eq.${currentViewedTeamId}`,
        },
        (payload) => {
          const activityType = payload.old?.activity_type;
          handleActivityChange(activityType);
        },
      )
      .subscribe((status, error) => {
        if (error) {
          reportError(error, {
            feature: "team-realtime",
            userId,
            message: "Errore Team Realtime:",
          });
        }

        if (status === "CHANNEL_ERROR") {
          reportError(null, {
            feature: "team-realtime-channel",
            userId,
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
    userId,
    currentViewedTeamId,
    refreshActivity,
    refreshLeaderboard,
    refreshMembers,
  ]);

  const contextValue = useMemo(
    () => ({
      team: hasCurrentUserData ? bundle.team : null,
      members: hasCurrentUserData ? bundle.members : [],
      leaderboard: hasCurrentUserData ? bundle.leaderboard : [],
      activity: hasCurrentUserData ? bundle.activity : [],
      teams: hasCurrentUserData ? teams : [],
      viewedTeamId: hasCurrentUserData ? viewedTeamId : null,
      loading:
        authLoading || (isAuthenticated && (!hasCurrentUserData || loading)),
      atTeamLimit: (hasCurrentUserData ? teams : []).length >= MAX_TEAMS,
      teamIdsRef,
      selectTeam,
      refreshDashboard,
      refreshTeams,
      refreshTeam,
      refreshMembers,
      refreshLeaderboard,
      refreshActivity,
    }),
    [
      authLoading,
      isAuthenticated,
      hasCurrentUserData,
      bundle,
      teams,
      viewedTeamId,
      loading,
      selectTeam,
      refreshDashboard,
      refreshTeams,
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