import { useCallback, useState } from "react";

import { TeamContext } from "./team-context";

import { getMyTeam } from "../services/teamService";

export function TeamProvider({ children }) {
  const [team, setTeam] = useState(null);

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

  return (
    <TeamContext.Provider
      value={{
        team,
        refreshTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
