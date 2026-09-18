// Helpers lato Service Worker per gestire "pushsubscriptionchange".
//
// Modulo puro: nessun import da supabase o dal client. La sincronizzazione del
// database avviene sempre tramite una pagina aperta (la queue qui definita è
// persistente in IndexedDB e viene "flushed" dal PushSyncProvider).

export const PUSH_SUBSCRIPTION_SYNC_MESSAGE = "PUSH_SUBSCRIPTION_SYNC";

const QUEUE_DB_NAME = "cagometro-push-sync";
const QUEUE_STORE_NAME = "changes";

// Fallback in-memory usato solo quando IndexedDB non è disponibile (es. test).
const memoryChanges = new Map();

function urlBase64ToUint8Array(base64String) {
  if (typeof base64String !== "string" || base64String === "") {
    return null;
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  let rawData;

  try {
    rawData = atob(base64);
  } catch {
    return null;
  }

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function getVapidApplicationServerKey() {
  return urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function encodeSubscription(subscription) {
  const payload = subscription?.toJSON ? subscription.toJSON() : subscription;

  if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
    return null;
  }

  return {
    endpoint: payload.endpoint,
    keys: {
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
  };
}

// "pushsubscriptionchange" spinge la rotazione dell'endpoint: crea la nuova
// subscription (retry limitato su errori temporanei) e restituisce null dopo
// un fallimento definitivo.
export async function createPushSubscriptionWithRetry({
  pushManager,
  applicationServerKey,
  attempts = 3,
  delays = [1000, 2000],
}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await sleep(delays[Math.min(attempt - 1, delays.length - 1)] ?? 0);
      }
    }
  }

  return { error: lastError };
}

function openQueueDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "endpoint" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(mode, callback) {
  return openQueueDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(QUEUE_STORE_NAME, mode);
          const store = transaction.objectStore(QUEUE_STORE_NAME);
          const request = callback(store);

          transaction.oncomplete = () => {
            resolve(request.result);
            db.close();
          };

          transaction.onerror = () => {
            reject(transaction.error);
            db.close();
          };
        } catch (error) {
          db.close();
          reject(error);
        }
      }),
  );
}

export async function enqueuePushSubscriptionChange({
  subscription,
  oldSubscription,
}) {
  const encoded = encodeSubscription(subscription);

  if (!encoded) {
    return;
  }

  const entry = {
    endpoint: encoded.endpoint,
    oldEndpoint: oldSubscription?.endpoint ?? null,
    keys_p256dh: encoded.keys.p256dh,
    keys_auth: encoded.keys.auth,
    createdAt: Date.now(),
  };

  if (typeof indexedDB !== "undefined") {
    await withStore("readwrite", (store) => store.put(entry));
    return;
  }

  memoryChanges.set(entry.endpoint, { ...entry });
}

export async function readPendingPushSubscriptionChanges() {
  if (typeof indexedDB !== "undefined") {
    const entries = await withStore("readonly", (store) => store.getAll());
    return (entries ?? []).sort((a, b) => a.createdAt - b.createdAt);
  }

  return [...memoryChanges.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export async function removePendingPushSubscriptionChange(endpoint) {
  if (!endpoint) {
    return;
  }

  if (typeof indexedDB !== "undefined") {
    await withStore("readwrite", (store) => store.delete(endpoint));
    return;
  }

  memoryChanges.delete(endpoint);
}

export async function clearPendingPushSubscriptionChanges() {
  if (typeof indexedDB !== "undefined") {
    const entries = await readPendingPushSubscriptionChanges();
    await Promise.all(entries.map((entry) => removePendingPushSubscriptionChange(entry.endpoint)));
    return;
  }

  memoryChanges.clear();
}

export async function notifyClientsPushSubscriptionSync(workerScope) {
  const clients = await workerScope.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  clients.forEach((client) => {
    client.postMessage({ type: PUSH_SUBSCRIPTION_SYNC_MESSAGE });
  });
}