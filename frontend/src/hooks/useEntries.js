import { useContext } from "react";

import { EntriesContext } from "../context/entries-context";

export function useEntries() {
  const context =
    useContext(EntriesContext);

  if (!context) {
    throw new Error(
      "useEntries deve essere utilizzato dentro EntriesProvider",
    );
  }

  return context;
}