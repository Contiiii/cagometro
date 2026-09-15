import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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

import { announce } from "../utils/announce";

function formatEntries(entriesList) {
  return entriesList.reduce((acc, entry) => {
    acc[entry.date] = entry.count;
    return acc;
  }, {});
}

export function EntriesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const userId = user?.id ?? null;

  const [entries, setEntries] = useState({});

  const [syncStatus, setSyncStatus] = useState("synced");

  const [pendingChanges, setPendingChanges] = useState([]);

  const [today, setToday] = useState(() => getLocalDateKey());

  const entriesRef = useRef(entries);

  const entriesOwnerRef = useRef(null);

  const prevSyncStatusRef = useRef("synced");

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
      if (!userId || changes.length === 0) {
        return true;
      }

      try {
        const entriesByDate = Object.fromEntries(
          changes.map((change) => [change.date, change.count]),
        );

        await importEntries(userId, entriesByDate);

        clearPendingSync(userId);
        setPendingChanges([]);
        setSyncStatus("synced");

        if (prevSyncStatusRef.current === "error") {
          announce("Sincronizzazione ripristinata");
        }

        prevSyncStatusRef.current = "synced";

        return true;
      } catch (error) {
        console.error("Errore sincronizzazione pending:", error);

        savePendingSync(userId, changes);
        setSyncStatus("error");
        prevSyncStatusRef.current = "error";

        return false;
      }
    },
    [userId, pendingChanges],
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

    let cancelled = false;

    async function bootstrapEntries() {
      const previousOwner = entriesOwnerRef.current;

      if (!userId) {
        entriesOwnerRef.current = null;
        setPendingChanges([]);
        setSyncStatus("synced");
        prevSyncStatusRef.current = "synced";
        setEntries(loadAnonymousEntries());
        return;
      }

      // Cambio account: azzera subito lo stato del proprietario precedente
      // così i suoi dati non finiscono nella chiave del nuovo utente.
      entriesOwnerRef.current = userId;

      if (previousOwner !== userId) {
        setPendingChanges([]);
        setSyncStatus("synced");
        prevSyncStatusRef.current = "synced";
        setEntries({});
      }

      // 1. Mostra subito la cache locale
      const cachedEntries = loadUserEntries(userId);

      if (Object.keys(cachedEntries).length > 0) {
        setEntries(cachedEntries);
      }

      // 2. Recupera eventuali pending
      const savedPending = loadPendingSync(userId);
      setPendingChanges(savedPending);

      // 3. Se online prova a sincronizzarli
      if (navigator.onLine && savedPending.length > 0) {
        try {
          const pendingByDate = Object.fromEntries(
            savedPending.map((change) => [change.date, change.count]),
          );

          await importEntries(userId, pendingByDate);

          if (cancelled) return;

          clearPendingSync(userId);
          setPendingChanges([]);
        } catch (error) {
          console.error("Errore sync pending:", error);
        }
      }

      try {
        const data = await getEntries(userId);

        // Un fetch partito per un account precedente non deve
        // sovrascrivere i dati dell'account corrente.
        if (cancelled) return;

        if (data.length === 0 && hasAnonymousEntries()) {
          const anonymousEntries = loadAnonymousEntries();

          const migratedData = await importEntries(userId, anonymousEntries);

          if (cancelled) return;

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

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    // Persiste solo se i dati in stato appartengono davvero all'utente
    // corrente: durante un cambio account non deve finire roba del
    // vecchio account nella chiave del nuovo.
    if (entriesOwnerRef.current !== userId) {
      return;
    }

    if (userId) {
      saveUserEntries(userId, entries);
    } else {
      saveAnonymousEntries(entries);
    }
  }, [entries, userId, authLoading]);

  const todayCount = entries[today] || 0;

  const createPendingChanges = useCallback(
    (date, count) => {
      setPendingChanges((prev) => {
        const nextPendingChanges = [
          ...prev.filter((change) => change.date !== date),
          {
            date,
            count,
          },
        ];

        if (userId) {
          savePendingSync(userId, nextPendingChanges);
        }

        return nextPendingChanges;
      });
    },
    [userId],
  );

  const syncEntry = useCallback(
    async (date, count, logActivity = false) => {
      try {
        await saveEntry({
          userId,
          date,
          count,
        });
        if (logActivity) {
          await createTeamActivity("entry_created", 1);
        }

        await flushPendingChanges();

        setSyncStatus("synced");
        prevSyncStatusRef.current = "synced";
      } catch (error) {
        console.error(error);

        createPendingChanges(date, count);

        setSyncStatus("pending");
        prevSyncStatusRef.current = "pending";
      }
    },
    [userId, flushPendingChanges, createPendingChanges],
  );

  const incrementToday = useCallback(() => {
    return enqueueMutation(async () => {
      const currentCount = entriesRef.current[today] || 0;
      const newCount = currentCount + 1;
      const newEntries = {
        ...entriesRef.current,
        [today]: newCount,
      };

      entriesRef.current = newEntries;
      setEntries(newEntries);

      if (userId) {
        await syncEntry(today, newCount, true);
      }

      return newEntries;
    });
  }, [today, userId, syncEntry]);

  const decrementToday = useCallback(() => {
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

      if (userId) {
        await syncEntry(today, newCount);
      }

      return newEntries;
    });
  }, [today, userId, syncEntry]);

  const clearLocalData = useCallback(() => {
    entriesOwnerRef.current = null;
    setEntries({});
    entriesRef.current = {};
    setPendingChanges([]);
    setSyncStatus("synced");
    prevSyncStatusRef.current = "synced";
  }, []);

  const retrySync = useCallback(async () => {
    return flushPendingChanges();
  }, [flushPendingChanges]);

  const value = useMemo(
    () => ({
      entries,
      syncStatus,
      pendingChanges,
      today,
      todayCount,
      incrementToday,
      decrementToday,
      clearLocalData,
      retrySync,
    }),
    [
      entries,
      syncStatus,
      pendingChanges,
      today,
      todayCount,
      incrementToday,
      decrementToday,
      clearLocalData,
      retrySync,
    ],
  );

  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
}
