import { useCallback, useState, useEffect } from "react";

import { supabase } from "../lib/supabase";

import { useAuth } from "../hooks/useAuth";

import { TeamContext } from "./team-context";

import {
  getMyTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";

export function TeamProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const { user, loading: authLoading } = useAuth();

  const refreshTeam = useCallback(async () => {
    try {
      const data = await getMyTeam();

      setTeam(data);

      return data;
    } catch (error) {
      console.error("Errore caricamento team:", error);

      throw error;
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();

      setMembers(data);

      return data;
    } catch (error) {
      console.error("Errore caricamento membri:", error);

      throw error;
    }
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    const data = await getTeamLeaderboard();

    setLeaderboard(data);
  }, []);

  const refreshActivity = useCallback(async () => {
    const data = await getTeamActivity();

    setActivity(data);
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      return undefined;
    }

    const channel = supabase
      .channel(`team-activity-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity",
        },
        () => {

          refreshActivity().catch((error) => {
            console.error("Errore aggiornamento attività realtime:", error);
          });
        },
      )
      .subscribe((status, error) => {
        if (error) {
          console.error("Errore Team Realtime:", error);
        }

        if (status === "CHANNEL_ERROR") {
          console.error("Canale Team Realtime non disponibile");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, user, refreshActivity]);

  return (
    <TeamContext.Provider
      value={{
        team,
        members,
        leaderboard,
        refreshTeam,
        activity,
        refreshActivity,
        refreshMembers,
        refreshLeaderboard,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
