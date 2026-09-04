import { useCallback, useState } from "react";

import { TeamContext } from "./team-context";

import { getMyTeam, getTeamMembers } from "../services/teamService";

export function TeamProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);

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

  return (
    <TeamContext.Provider
      value={{
        team,
        members,
        refreshTeam,
        refreshMembers,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
