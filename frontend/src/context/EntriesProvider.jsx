import { useEffect, useRef, useState, useCallback } from "react";

import { EntriesContext } from "./entries-context";

import { useAuth } from "../hooks/useAuth";

import { createTeamActivity } from "../services/teamService";

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

function formatEntries(entriesList) {
  return entriesList.reduce((acc, entry) => {
    acc[entry.date] = entry.count;
    return acc;
  }, {});
}

export function EntriesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] = useState({});

  const [syncStatus, setSyncStatus] = useState("synced");

  const [pendingChanges, setPendingChanges] = useState([]);

  const [today, setToday] = useState(() => getLocalDateKey());

  const entriesRef = useRef(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const mutationQueueRef = useRef(Promise.resolve());

  function enqueueMutation(mutator) {
    const next = mutationQueueRef.current.then(mutator);
    mutationQueueRef.current = next.then(() => undefined, () => undefined);
    return next;
  }

  useEffect(() => {
    let timerId = null;

    function refreshToday() {
      setToday(getLocalDateKey());
    }

    function scheduleNextMidnight() {
      const now = new Date();

      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);

      timerId = window.setTimeout(() => {
        refreshToday();
        scheduleNextMidnight();
      }, nextMidnight.getTime() - now.getTime());
    }

    scheduleNextMidnight();

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refreshToday();
      }
    }

    function handleFocus() {
      refreshToday();
    }

    function handleOnline() {
      refreshToday();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

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
          console.error("Errore sync pending:", error);
        }
      }

      try {
        const data = await getEntries(user.id);

        if (data.length === 0 && hasAnonymousEntries()) {
          const anonymousEntries = loadAnonymousEntries();

          const migratedData = await importEntries(user.id, anonymousEntries);

          localStorage.removeItem("entries_anonymous");

          setEntries(formatEntries(migratedData));

          return;
        }

        setEntries(formatEntries(data));
      } catch (error) {
        console.error("Errore caricamento entries:", error);

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
    setPendingChanges((prev) => {
      const nextPendingChanges = [
        ...prev.filter((change) => change.date !== date),
        {
          date,
          count,
        },
      ];

      if (user) {
        savePendingSync(user.id, nextPendingChanges);
      }

      return nextPendingChanges;
    });
  }

  async function syncEntry(date, count, logActivity = false) {
    try {
      await saveEntry({
        userId: user.id,
        date,
        count,
      });
      if (logActivity) {
        await createTeamActivity("entry_created", 1);
      }

      await flushPendingChanges();

      setSyncStatus("synced");
    } catch (error) {
      console.error(error);

      createPendingChanges(date, count);

      setSyncStatus("pending");
    }
  }

  function incrementToday() {
    return enqueueMutation(async () => {
      const currentCount = entriesRef.current[today] || 0;
      const newCount = currentCount + 1;
      const newEntries = {
        ...entriesRef.current,
        [today]: newCount,
      };

      entriesRef.current = newEntries;
      setEntries(newEntries);

      if (user) {
        saveUserEntries(user.id, newEntries);
        await syncEntry(today, newCount, true);
      }

      return newEntries;
    });
  }

  function decrementToday() {
    return enqueueMutation(async () => {
      const currentCount = entriesRef.current[today] || 0;

      if (currentCount <= 0) {
        return entriesRef.current;
      }

      const newCount = currentCount - 1;
      const newEntries = {
        ...entriesRef.current,
        [today]: newCount,
      };

      entriesRef.current = newEntries;
      setEntries(newEntries);

      if (user) {
        saveUserEntries(user.id, newEntries);
        await syncEntry(today, newCount);
      }

      return newEntries;
    });
  }

  return (
    <EntriesContext.Provider
      value={{
        entries,
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
