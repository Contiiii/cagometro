import { useContext } from "react";
import { TeamContext } from "../context/team-context";

export function useTeam() {
  const context = useContext(TeamContext);

  if (!context) {
    throw new Error(
      "useTeam deve essere usato dentro TeamProvider",
    );
  }

  return context;
}