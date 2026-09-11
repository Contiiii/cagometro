import { TeamSelectionContext } from "./team-selection-context";

export function TeamSelectionProvider({ children, value }) {
  return (
    <TeamSelectionContext.Provider value={value}>
      {children}
    </TeamSelectionContext.Provider>
  );
}