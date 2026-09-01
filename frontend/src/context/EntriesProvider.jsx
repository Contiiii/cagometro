import { useEffect, useState, useCallback } from "react";

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
  loadUserEntries,
  saveUserEntries,
  hasAnonymousEntries,
  savePendingSync,
  clearPendingSync,
  loadPendingSync,
} from "../utils/storage";

import { getLocalDateKey } from "../utils/date";

export function EntriesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] = useState({});

  const [syncStatus, setSyncStatus] = useState("synced");

  const [pendingChanges, setPendingChanges] = useState([]);

  const today = getLocalDateKey();

  const flushPendingChanges = useCallback(
    async (changes = pendingChanges) => {
      if (!user || changes.length === 0) {
        return true;
      }

      try {
        await Promise.all(
          changes.map((change) =>
            saveEntry({
              userId: user.id,
              date: change.date,
              count: change.count,
            }),
          ),
        );

        clearPendingSync(user.id);
        setPendingChanges([]);
        setSyncStatus("synced");

        return true;
      } catch (error) {
        console.error("Errore sincronizzazione pending:", error);

        savePendingSync(user.id, changes);
        setSyncStatus("error");

        return false;
      }
    },
    [user, pendingChanges],
  );

  useEffect(() => {
    function handleOnline() {
      if (pendingChanges.length > 0) {
        flushPendingChanges();
      }
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushPendingChanges, pendingChanges]);

  useEffect(() => {
    if (authLoading) return;

    async function bootstrapEntries() {
  if (!user) {
    setEntries(loadAnonymousEntries());
    return;
  }

  // 1. Mostra subito la cache locale
  const cachedEntries = loadUserEntries(user.id);

  if (Object.keys(cachedEntries).length > 0) {
    setEntries(cachedEntries);
  }

  // 2. Recupera eventuali pending
  const savedPending = loadPendingSync(user.id);
  setPendingChanges(savedPending);

  // 3. Se online prova a sincronizzarli
  if (navigator.onLine && savedPending.length > 0) {
    try {
      await Promise.all(
        savedPending.map((change) =>
          saveEntry({
            userId: user.id,
            date: change.date,
            count: change.count,
          }),
        ),
      );

      clearPendingSync(user.id);
setPendingChanges([]);
    } catch (error) {
      console.error(
        "Errore sync pending:",
        error,
      );
    }
  }

  try {
    const data = await getEntries(user.id);

    if (
      data.length === 0 &&
      hasAnonymousEntries()
    ) {
      const anonymousEntries =
        loadAnonymousEntries();

      await importEntries(
        user.id,
        anonymousEntries,
      );

      localStorage.removeItem(
        "entries_anonymous",
      );

      const migratedData =
        await getEntries(user.id);

      const formattedEntries = {};

      migratedData.forEach((entry) => {
        formattedEntries[entry.date] =
          entry.count;
      });

      setEntries(formattedEntries);

      return;
    }

    const formattedEntries = {};

    data.forEach((entry) => {
      formattedEntries[entry.date] =
        entry.count;
    });

    setEntries(formattedEntries);
  } catch (error) {
    console.error(
      "Errore caricamento entries:",
      error,
    );

    // Se siamo offline resta la cache locale
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

  function createPendingChanges(date, count) {
    const nextPendingChanges = [
      ...pendingChanges.filter((change) => change.date !== date),
      {
        date,
        count,
      },
    ];

    setPendingChanges(nextPendingChanges);

    if (user) {
      savePendingSync(user.id, nextPendingChanges);
    }

    return nextPendingChanges;
  }

  async function incrementToday() {
    const newEntries = {
      ...entries,
      [today]: todayCount + 1,
    };

    setEntries(newEntries);

    if (user) {
  saveUserEntries(
    user.id,
    newEntries,
  );
}

    if (user) {
      try {
        await saveEntry({
          userId: user.id,
          date: today,
          count: newEntries[today],
        });

        if (pendingChanges.length > 0) {
          await flushPendingChanges();
        }

        setSyncStatus("synced");
      } catch (error) {
        console.error(error);

        createPendingChanges(today, newEntries[today]);

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
  saveUserEntries(
    user.id,
    newEntries,
  );
}

    if (user) {
      try {
        await saveEntry({
          userId: user.id,
          date: today,
          count: newEntries[today],
        });

        if (pendingChanges.length > 0) {
          await flushPendingChanges();
        }

        setSyncStatus("synced");
      } catch (error) {
        console.error(error);

        createPendingChanges(today, newEntries[today]);

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
