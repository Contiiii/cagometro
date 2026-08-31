import { useEffect, useState } from "react";

import { loadEntries, saveEntries } from "../utils/storage";

import { useAuth } from "./useAuth";
import {
  getEntries,
  saveEntry,
} from "../services/entriesService";


export function useEntries() {
  const { user } = useAuth();

  const [entries, setEntries] = useState(loadEntries);

  const today = new Date()

    .toISOString()

    .split("T")[0];

  useEffect(() => {
  async function loadCloudEntries() {
    if (!user) return;


    const data = await getEntries(user.id);

    const formattedEntries = {};

    data.forEach((entry) => {
      formattedEntries[entry.date] = entry.count;
    });

    setEntries(formattedEntries);
  }

  loadCloudEntries();
}, [user]);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const todayCount = entries[today] || 0;

async function incrementToday() {
  const newEntries = {
    ...entries,
    [today]: todayCount + 1,
  };

  setEntries(newEntries);

  if (user) {
    await saveEntry({
      userId: user.id,
      date: today,
      count: newEntries[today],
    });
  }

  return newEntries;
}

  async function decrementToday() {
  if (todayCount <= 0) return entries;

  const newEntries = {
    ...entries,
    [today]: todayCount - 1,
  };

  setEntries(newEntries);

  if (user) {
    await saveEntry({
      userId: user.id,
      date: today,
      count: newEntries[today],
    });
  }

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
