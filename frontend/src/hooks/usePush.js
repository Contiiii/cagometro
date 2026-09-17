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
} from "../services/pushService";
import { reportError } from "../utils/reportError";
import { trackEvent } from "../services/analyticsService";

export function usePush() {
  const { user } = useAuth();

  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState(null);
  const [subscribeError, setSubscribeError] = useState(null);

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
            reportError(error, {
              feature: "push-touch",
              userId: user?.id ?? null,
              message: "Errore aggiornamento dispositivo push:",
            });
          }
        }

        await refreshDevices();
      } catch (error) {
        reportError(error, {
          feature: "push-state",
          userId: user?.id ?? null,
          message: "Errore stato sottoscrizione push:",
        });
      }
    }

    syncSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isSupported, refreshDevices]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) {
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

      return { permission: result.permission, subscription: result.subscription, error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      reportError(error, {
        feature: "push-subscribe",
        userId: user?.id ?? null,
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
  }, [user?.id, isSupported, refreshDevices]);

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

  const value = useMemo(
    () => ({
      isSupported,
      permission,
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
    }),
    [
      isSupported,
      permission,
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
    ],
    [
      isSupported,
      permission,
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
    ],
  );

  return value;
}
