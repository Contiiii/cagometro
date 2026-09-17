import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "./useAuth";

import {
  getNotificationPermission,
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getMyPushSubscriptions,
  removePushSubscription,
  refreshPushSubscription,
  claimPushSubscription,
  isPushSubscriptionOwnedByOther,
  sendMyPushNotification,
} from "../services/pushService";
import { reportError } from "../utils/reportError";
import { trackEvent } from "../services/analyticsService";

// Push di test dopo un'attivazione esplicita: conferma il path DB -> edge ->
// push service. La rilevazione di una VAPID errata resta comunque server-side
// (notify_my_push e' fire-and-forget, la risposta di send-push non torna qui).
async function sendTestPushNotification(userId) {
  try {
    await sendMyPushNotification({
      type: "test",
      title: "Notifiche attive",
      body: "Se vedi questa notifica, le push funzionano.",
      url: "/",
    });

    await trackEvent("push_test_sent");
  } catch (error) {
    reportError(error, {
      feature: "push-test",
      userId: userId ?? null,
      message: "Errore invio push di test:",
    });
  }
}

export function usePush() {
  const { user } = useAuth();
  const userId = user?.id;

  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [initialized, setInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState(null);
  const [subscribeError, setSubscribeError] = useState(null);
  const [subscribeConflict, setSubscribeConflict] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (!user?.id || !isSupported) {
      return;
    }

    setDevicesLoading(true);

    try {
      const list = await getMyPushSubscriptions();

      setDevices(list);
    } catch (error) {
      reportError(error, {
        feature: "push-devices",
        userId: user?.id ?? null,
        message: "Errore caricamento dispositivi push:",
      });
    } finally {
      setDevicesLoading(false);
    }
  }, [user?.id, isSupported]);

  useEffect(() => {
    let cancelled = false;

    async function syncSubscriptionState() {
      if (!user?.id || !isSupported) {
        setInitialized(true);

        return;
      }

      try {
        const subscription = await getPushSubscription();

        if (cancelled) {
          return;
        }

        setIsSubscribed(Boolean(subscription));
        setCurrentEndpoint(subscription?.endpoint ?? null);

        // Rinfresca last_seen_at senza richiedere il permesso: se il permesso
        // non è concesso non tocchiamo nulla per non rischiare un prompt.
        if (subscription && getNotificationPermission() === "granted") {
          try {
            await refreshPushSubscription(subscription);
          } catch (error) {
            if (isPushSubscriptionOwnedByOther(error)) {
              // L'endpoint è legato a un altro account: lo segnaliamo senza
              // adottarlo silenziosamente; il claim è sempre una scelta esplicita.
              setSubscribeConflict(true);
            } else {
              reportError(error, {
                feature: "push-touch",
                userId: user?.id ?? null,
                message: "Errore aggiornamento dispositivo push:",
              });
            }
          }
        }

        await refreshDevices();
      } catch (error) {
        reportError(error, {
          feature: "push-state",
          userId: user?.id ?? null,
          message: "Errore stato sottoscrizione push:",
        });
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    }

    syncSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isSupported, refreshDevices]);

  const subscribe = useCallback(async () => {
    if (!userId || !isSupported) {
      return null;
    }

    setIsBusy(true);
    setSubscribeError(null);

    try {
      const result = await subscribeToPush();

      setPermission(result.permission);
      setIsSubscribed(Boolean(result.subscription));
      setCurrentEndpoint(result.subscription?.endpoint ?? null);

      await refreshDevices();

      if (result.subscription) {
        await sendTestPushNotification(userId);
      }

      return { permission: result.permission, subscription: result.subscription, error: null };
    } catch (error) {
      if (isPushSubscriptionOwnedByOther(error)) {
        // Endpoint già associato a un altro account: nessun adottamento
        // silenzioso, si propone il claim esplicito.
        setSubscribeConflict(true);
        setSubscribeError(null);
        setPermission(getNotificationPermission());

        return {
          permission: getNotificationPermission(),
          subscription: null,
          error: null,
          conflict: true,
        };
      }

      const message =
        error instanceof Error ? error.message : String(error);

      reportError(error, {
        feature: "push-subscribe",
        userId: userId ?? null,
        message: "Errore attivazione notifiche:",
      });

      try {
        await trackEvent("push_subscribe_error", { message });
      } catch {
        // evento analitico non inviato, non bloccante
      }

      setSubscribeError(message);
      setPermission(getNotificationPermission());

      return { permission: getNotificationPermission(), subscription: null, error: message };
    } finally {
      setIsBusy(false);
    }
  }, [userId, isSupported, refreshDevices]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    setIsBusy(true);
    setSubscribeError(null);

    try {
      await unsubscribeFromPush();

      setIsSubscribed(false);
      setCurrentEndpoint(null);

      await refreshDevices();
    } finally {
      setIsBusy(false);
    }
  }, [isSupported, refreshDevices]);

  const removeDevice = useCallback(
    async (endpoint) => {
      if (!endpoint) {
        return;
      }

      setSubscribeError(null);

      await removePushSubscription(endpoint);

      await refreshDevices();
    },
    [refreshDevices],
  );

  const claim = useCallback(async () => {
    if (!user?.id || !isSupported) {
      return { error: "Notifiche non supportate." };
    }

    setIsBusy(true);
    setSubscribeError(null);

    try {
      const subscription = await getPushSubscription();

      if (!subscription) {
        setSubscribeConflict(false);

        return { error: "Nessuna notifica registrata su questo dispositivo." };
      }

      await claimPushSubscription(subscription);

      setIsSubscribed(true);
      setCurrentEndpoint(subscription.endpoint);
      setSubscribeConflict(false);

      await refreshDevices();

      return { error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      reportError(error, {
        feature: "push-claim",
        userId: user?.id ?? null,
        message: "Errore collegamento notifiche push:",
      });

      setSubscribeError(message);

      return { error: message };
    } finally {
      setIsBusy(false);
    }
  }, [user?.id, isSupported, refreshDevices]);

  const dismissConflict = useCallback(() => {
    setSubscribeConflict(false);
  }, []);

  const value = useMemo(
    () => ({
      isSupported,
      permission,
      initialized,
      isSubscribed,
      isBusy,
      subscribe,
      unsubscribe,
      devices,
      devicesLoading,
      currentEndpoint,
      refreshDevices,
      removeDevice,
      subscribeError,
      subscribeConflict,
      claim,
      dismissConflict,
    }),
    [
      isSupported,
      permission,
      initialized,
      isSubscribed,
      isBusy,
      subscribe,
      unsubscribe,
      devices,
      devicesLoading,
      currentEndpoint,
      refreshDevices,
      removeDevice,
      subscribeError,
      subscribeConflict,
      claim,
      dismissConflict,
    ],
  );

  return value;
}
