import { TeamUIContext } from "./team-ui-context";

export function TeamUIProvider({ children, value }) {
  return (
    <TeamUIContext.Provider value={value}>
      {children}
    </TeamUIContext.Provider>
  );
}