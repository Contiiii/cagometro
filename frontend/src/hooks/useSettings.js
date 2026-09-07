import { useContext } from "react";

import { SettingsContext } from "../context/settings-context";

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings deve essere usato dentro SettingsProvider",
    );
  }

  return context;
}