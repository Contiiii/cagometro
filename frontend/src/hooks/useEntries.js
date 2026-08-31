import { useEffect, useState } from "react";

import { loadEntries, saveEntries } from "../utils/storage";

export function useEntries() {
  const today = new Date().toISOString().split("T")[0];

  const [entries, setEntries] = useState(loadEntries);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const todayCount = entries[today] || 0;

  function incrementToday() {
    const newEntries = {
      ...entries,
      [today]: todayCount + 1,
    };

    setEntries(newEntries);

    return newEntries;
  }

  function decrementToday() {
    if (todayCount <= 0) return entries;

    const newEntries = {
      ...entries,
      [today]: todayCount - 1,
    };

    setEntries(newEntries);

    return newEntries;
  }

  return {
    entries,
    setEntries,
    today,
    todayCount,
    incrementToday,
    decrementToday,
  };
}
