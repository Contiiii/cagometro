import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { EntriesContext } from "./entries-context";

import { useAuth } from "../hooks/useAuth";

import {
  createTeamActivity,
  removeTeamActivity,
} from "../services/teamService";

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
} from "../utils/storage";

import {
  loadPendingOps,
  savePendingOps,
  clearPendingOps,
  removePendingOps,
  createOpId,
} from "../utils/pendingQueue";

import { getLocalDateKey } from "../utils/date";

import { announce } from "../utils/announce";

import { reportError } from "../utils/reportError";

import { trackEvent } from "../services/analyticsService";

const OP_TYPES = {
  SAVE_ENTRY: "saveEntry",
  CREATE_TEAM_ACTIVITY: "createTeamActivity",
  REMOVE_TEAM_ACTIVITY: "removeTeamActivity",
};

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

  const [pendingOps, setPendingOps] = useState([]);

  const [today, setToday] = useState(() => getLocalDateKey());

  // Vero finché il primo hydrate (cache + server) non è concluso, così la UI
  // può evitare di mostrare un "vuoto" ingannevole al primo avvio. Si tiene
  // traccia dell'utente ormai idratato, così un cambio account torna a
  // "loading" senza setState sincroni dentro l'effetto.
  const [hydratedUserId, setHydratedUserId] = useState(() => userId);

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

  const flushPendingOps = useCallback(
    async () => {
      if (!userId || pendingOps.length === 0) {
        return true;
      }

      const batch = pendingOps;
      const batchIds = batch.map((op) => op.id);

      try {
        const saveEntryOps = batch.filter((op) => op.type === OP_TYPES.SAVE_ENTRY);
        const activityOps = batch.filter((op) => op.type === OP_TYPES.CREATE_TEAM_ACTIVITY);
        const removalOps = batch.filter(
          (op) => op.type === OP_TYPES.REMOVE_TEAM_ACTIVITY,
        );

        if (saveEntryOps.length > 0) {
          const entriesByDate = Object.fromEntries(
            saveEntryOps.map((op) => [op.payload.date, op.payload.count]),
          );

          await importEntries(userId, entriesByDate);
        }

        for (const op of activityOps) {
          await createTeamActivity(
            op.payload.activityType,
            op.payload.points,
            null,
            op.payload.dedupKey ?? op.id,
          );
        }

        for (const op of removalOps) {
          await removeTeamActivity(
            op.payload.activityType,
            op.payload.dedupKey ?? op.id,
          );
        }

        // Rimuove SOLO le operazioni del batch: quelle accodate durante
        // l'await (es. nuovo tap offline) restano nella coda.
        const remainingOps = removePendingOps(userId, batchIds);
        setPendingOps((prev) => prev.filter((op) => !batchIds.includes(op.id)));
        setSyncStatus(remainingOps.length > 0 ? "pending" : "synced");

        if (prevSyncStatusRef.current === "error") {
          announce("Sincronizzazione ripristinata");
        }

        prevSyncStatusRef.current = remainingOps.length > 0 ? "pending" : "synced";

        trackEvent("sync_batch", { ok: true, ops: batch.length });

        return true;
      } catch (error) {
        reportError(error, {
          feature: "entries-sync",
          userId,
          message: "Errore sincronizzazione pending:",
        });

        trackEvent("sync_batch", { ok: false, ops: batch.length });

        setSyncStatus("error");
        prevSyncStatusRef.current = "error";

        return false;
      }
    },
    [userId, pendingOps],
  );

  useEffect(() => {
    function handleOnline() {
      if (pendingOps.length > 0) {
        flushPendingOps();
      }
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushPendingOps, pendingOps]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function bootstrapEntries() {
      const previousOwner = entriesOwnerRef.current;

      if (!userId) {
        entriesOwnerRef.current = null;
        setPendingOps([]);
        setSyncStatus("synced");
        prevSyncStatusRef.current = "synced";
        setEntries(loadAnonymousEntries());
        setHydratedUserId(null);
        return;
      }

      // Cambio account: azzera subito lo stato del proprietario precedente
      // così i suoi dati non finiscono nella chiave del nuovo utente.
      entriesOwnerRef.current = userId;

      if (previousOwner !== userId) {
        setPendingOps([]);
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
      const savedPendingOps = loadPendingOps(userId);
      setPendingOps(savedPendingOps);

      // 3. Se online prova a sincronizzarli
      if (navigator.onLine && savedPendingOps.length > 0) {
        const bootstrapIds = savedPendingOps.map((op) => op.id);

        try {
          for (const op of savedPendingOps) {
            if (op.type === "saveEntry") {
              await saveEntry({
                userId,
                date: op.payload.date,
                count: op.payload.count,
              });
            } else if (op.type === "createTeamActivity") {
              await createTeamActivity(
                op.payload.activityType,
                op.payload.points,
                null,
                op.payload.dedupKey ?? op.id,
              );
            } else if (op.type === "removeTeamActivity") {
              await removeTeamActivity(
                op.payload.activityType,
                op.payload.dedupKey ?? op.id,
              );
            }
          }

          if (cancelled) return;

          removePendingOps(userId, bootstrapIds);
          setPendingOps((prev) =>
            prev.filter((op) => !bootstrapIds.includes(op.id)),
          );

          trackEvent("sync_batch", { ok: true, ops: savedPendingOps.length });
        } catch (error) {
          reportError(error, {
            feature: "entries-sync",
            userId,
            message: "Errore sync pending al bootstrap:",
          });

          trackEvent("sync_batch", { ok: false, ops: savedPendingOps.length });
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

          setHydratedUserId(userId);

          return;
        }

        setEntries(formatEntries(data));
      } catch (error) {
        console.error("Errore caricamento entries:", error);

        // Se siamo offline resta la cache locale
      }

      setHydratedUserId(userId);
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

  const hydrated = hydratedUserId === userId;

  const loading = authLoading || (userId ? !hydrated : false);

  const createPendingOps = useCallback(
    (ops) => {
      const datedOps = ops.map((op) => ({
        ...op,
        timestamp: Date.now(),
        id: createOpId(),
      }));

      setPendingOps((prev) => {
        const nextOps = [...prev, ...datedOps];

        if (userId) {
          savePendingOps(userId, nextOps);
        }

        return nextOps;
      });
    },
    [userId],
  );

  // Modello di sync: ogni salvataggio scrive un CONTEGGIO ASSOLUTO nella
  // entry del giorno (upsert idempotente). In caso di conflitto tra device
  // vince l'ultima scrittura (last-write-wins): l'approccio è deterministico
  // per un singolo device, dove i conteggi locali rimangono monotoni anche
  // offline. Non usiamo delta proprio per mantenere l'upsert idempotente.
  const syncEntry = useCallback(
    async (date, count, logActivity = false, removeActivity = false) => {
      // Chiave di deduplicazione condivisa tra il tentativo diretto e l'op
      // accodata: un retry dopo un timeout "commit riuscito ma risposta persa"
      // non crea una seconda riga di attività (on conflict in create_team_activity).
      const activityDedupKey = logActivity ? createOpId() : null;

      // Stessa logica per l'annullamento: la chiave evita di eliminare una
      // seconda riga se la RPC è andata a buon fine ma la risposta è andata persa.
      const removalDedupKey = removeActivity ? createOpId() : null;

      try {
        await saveEntry({
          userId,
          date,
          count,
        });
        if (logActivity) {
          await createTeamActivity("entry_created", 1, null, activityDedupKey);
        }
        if (removeActivity) {
          await removeTeamActivity("entry_created", removalDedupKey);
        }

        await flushPendingOps();

        setSyncStatus("synced");
        prevSyncStatusRef.current = "synced";
      } catch (error) {
        reportError(error, {
          feature: "entries-sync",
          userId,
          message: "Errore salvataggio entry:",
        });

        const ops = [
          { type: OP_TYPES.SAVE_ENTRY, payload: { date, count } },
        ];

        if (logActivity) {
          ops.push({
            type: OP_TYPES.CREATE_TEAM_ACTIVITY,
            payload: {
              activityType: "entry_created",
              points: 1,
              dedupKey: activityDedupKey,
            },
          });
        }

        if (removeActivity) {
          ops.push({
            type: OP_TYPES.REMOVE_TEAM_ACTIVITY,
            payload: {
              activityType: "entry_created",
              dedupKey: removalDedupKey,
            },
          });
        }

        createPendingOps(ops);

        trackEvent("offline_registration", { date, count });

        setSyncStatus("pending");
        prevSyncStatusRef.current = "pending";
      }
    },
    [userId, createPendingOps, flushPendingOps],
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
        await syncEntry(today, newCount, false, true);
      }

      return newEntries;
    });
  }, [today, userId, syncEntry]);

  const clearLocalData = useCallback(() => {
    entriesOwnerRef.current = null;
    setEntries({});
    entriesRef.current = {};
    if (userId) {
      clearPendingOps(userId);
    }
    setPendingOps([]);
    setSyncStatus("synced");
    prevSyncStatusRef.current = "synced";
  }, [userId]);

  const retrySync = useCallback(async () => {
    return flushPendingOps();
  }, [flushPendingOps]);

  const value = useMemo(
    () => ({
      entries,
      loading,
      syncStatus,
      pendingOps,
      today,
      todayCount,
      incrementToday,
      decrementToday,
      clearLocalData,
      retrySync,
    }),
    [
      entries,
      loading,
      syncStatus,
      pendingOps,
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
