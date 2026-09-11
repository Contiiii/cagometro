import { useContext } from "react";
import { TeamSelectionContext } from "../context/team-selection-context";

export function useTeamSelection() {
  const context = useContext(TeamSelectionContext);

  if (!context) {
    throw new Error(
      "useTeamSelection deve essere usato dentro TeamSelectionProvider",
    );
  }

  return context;
}