import { useContext } from "react";
import { TeamUIContext } from "../context/team-ui-context";

export function useTeamUI() {
  const context = useContext(TeamUIContext);

  if (!context) {
    throw new Error(
      "useTeamUI must be used inside TeamUIProvider",
    );
  }

  return context;
}