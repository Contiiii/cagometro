import { useEffect, useState } from "react";

import { EntriesContext } from "./entries-context";

import { useAuth } from "../hooks/useAuth";

import { getEntries, saveEntry } from "../services/entriesService";

import {
  loadAnonymousEntries,
  saveAnonymousEntries,
  saveUserEntries,
} from "../utils/storage";

import { getLocalDateKey } from "../utils/date";

export function EntriesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] =
  useState(loadAnonymousEntries);


  const today = getLocalDateKey();


  useEffect(() => {
    async function loadCloudEntries() {
      if (authLoading || !user) return;

      try {
        const data = await getEntries(user.id);

        const formattedEntries = {};

        data.forEach((entry) => {
          formattedEntries[entry.date] = entry.count;
        });

        setEntries(formattedEntries);
      } catch (error) {
        console.error("Errore caricamento entries:", error);
      }
    }

    loadCloudEntries();
  }, [user, authLoading]);

  useEffect(() => {
  if (authLoading) return;

  if (user) {
    saveUserEntries(
      user.id,
      entries,
    );
  } else {
    saveAnonymousEntries(entries);
  }
}, [
  entries,
  user,
  authLoading,
]);

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
    if (todayCount <= 0) {
      return entries;
    }

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

  return (
    <EntriesContext.Provider
      value={{
        entries,
        setEntries,
        today,
        todayCount,
        incrementToday,
        decrementToday,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}
