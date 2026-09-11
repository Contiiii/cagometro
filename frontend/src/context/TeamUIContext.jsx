import { createContext, useContext } from "react";

const TeamUIContext = createContext(null);

export function TeamUIProvider({ children, value }) {
  return (
    <TeamUIContext.Provider value={value}>
      {children}
    </TeamUIContext.Provider>
  );
}

export function useTeamUI() {
  const context = useContext(TeamUIContext);

  if (!context) {
    throw new Error(
      "useTeamUI must be used inside TeamUIProvider",
    );
  }

  return context;
}