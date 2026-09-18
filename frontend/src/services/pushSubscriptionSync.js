// Lato pagina: applica i cambi di subscription salvati dal Service Worker.
//
// Flusso: refresh del nuovo endpoint (subscribe_push) SINCRONIZZATO, poi (solo
// dopo conferma) remove del vecchio endpoint (unsubscribe_push). La queue viene
// svuotata soltanto quando il nuovo endpoint è confermato: nessuna perdita di
// subscription in caso di offline o errori temporanei.

import {
  isPushSubscriptionOwnedByOther,
  refreshPushSubscription,
  removePushSubscription,
} from "./pushService";
import {
  readPendingPushSubscriptionChanges,
  removePendingPushSubscriptionChange,
} from "./pushSubscriptionChange";
import { reportError } from "../utils/reportError";

const RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWithRetry(
  fn,
  { attempts = RETRY_ATTEMPTS, delays = RETRY_DELAYS_MS, shouldRetry = null } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const allowRetry = shouldRetry ? shouldRetry(error) : true;

      if (!allowRetry || attempt >= attempts) {
        break;
      }

      await sleep(delays[Math.min(attempt - 1, delays.length - 1)] ?? 0);
    }
  }

  throw lastError;
}

export async function syncPushSubscriptionChange({
  endpoint,
  oldEndpoint,
  keys_p256dh,
  keys_auth,
}) {
  const subscription = {
    endpoint,
    keys: {
      p256dh: keys_p256dh,
      auth: keys_auth,
    },
  };

  // Il nuovo endpoint è la priorità: retry su errori temporanei, MA mai su un
  // conflitto di ownership (PUSH1) — in quel caso la queue resta per un retry
  // successivo e il vecchio endpoint non viene toccato.
  await runWithRetry(() => refreshPushSubscription(subscription), {
    shouldRetry: (error) => !isPushSubscriptionOwnedByOther(error),
  });

  if (oldEndpoint && oldEndpoint !== endpoint) {
    try {
      await removePushSubscription(oldEndpoint);
    } catch (error) {
      reportError(error, {
        feature: "push-sync-remove-old",
        message: "Errore rimozione vecchio endpoint push:",
      });
    }
  }
}

export async function flushPendingPushSubscriptionSync() {
  const pending = await readPendingPushSubscriptionChanges();

  let processed = 0;

  for (const entry of pending) {
    try {
      await syncPushSubscriptionChange(entry);
      await removePendingPushSubscriptionChange(entry.endpoint);
      processed += 1;
    } catch (error) {
      reportError(error, {
        feature: "push-sync",
        message: "Errore sincronizzazione cambiamento subscription push:",
      });
    }
  }

  return processed;
}