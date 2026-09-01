import { useEffect, useState } from "react";

import { EntriesContext } from "./entries-context";

import { useAuth } from "../hooks/useAuth";

import {
  getEntries,
  saveEntry,
  importEntries,
} from "../services/entriesService";

import {
  loadAnonymousEntries,
  saveAnonymousEntries,
  saveUserEntries,
  hasAnonymousEntries,
} from "../utils/storage";

import { getLocalDateKey } from "../utils/date";

export function EntriesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] = useState({});

  const [syncStatus, setSyncStatus] = useState("synced");

  const today = getLocalDateKey();

  useEffect(() => {
    if (authLoading) return;

    async function bootstrapEntries() {
      if (!user) {
        setEntries(loadAnonymousEntries());
        return;
      }

      try {
        const data = await getEntries(user.id);

        if (data.length === 0 && hasAnonymousEntries()) {
          const anonymousEntries = loadAnonymousEntries();

          await importEntries(user.id, anonymousEntries);

          const migratedData = await getEntries(user.id);

          const formattedEntries = {};

          migratedData.forEach((entry) => {
            formattedEntries[entry.date] = entry.count;
          });

          setEntries(formattedEntries);

          return;
        }

        const formattedEntries = {};

        data.forEach((entry) => {
          formattedEntries[entry.date] = entry.count;
        });

        setEntries(formattedEntries);
      } catch (error) {
        console.error("Errore caricamento entries:", error);
      }
    }

    bootstrapEntries();
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      saveUserEntries(user.id, entries);
    } else {
      saveAnonymousEntries(entries);
    }
  }, [entries, user, authLoading]);

  const todayCount = entries[today] || 0;

  async function incrementToday() {
    const newEntries = {
      ...entries,
      [today]: todayCount + 1,
    };

    setEntries(newEntries);

    if (user) {
      try {

        await saveEntry({
          userId: user.id,
          date: today,
          count: newEntries[today],
        });

        setSyncStatus("synced");
      } catch (error) {
        console.error(error);

        setSyncStatus("error");
      }
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
      try {

        await saveEntry({
          userId: user.id,
          date: today,
          count: newEntries[today],
        });

        setSyncStatus("synced");
      } catch (error) {
        console.error(error);

        setSyncStatus("error");
      }
    }

    return newEntries;
  }

  return (
    <EntriesContext.Provider
      value={{
        entries,
        setEntries,
        syncStatus,
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
