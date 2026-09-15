import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "./useAuth";

import {
  getNotificationPermission,
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/pushService";

export function usePush() {
  const { user } = useAuth();

  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSubscriptionState() {
      if (!user?.id || !isSupported) {
        return;
      }

      const subscription = await getPushSubscription();

      if (cancelled) {
        return;
      }

      setIsSubscribed(Boolean(subscription));
    }

    syncSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isSupported]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) {
      return null;
    }

    setIsBusy(true);

    try {
      const result = await subscribeToPush();

      setPermission(result.permission);
      setIsSubscribed(Boolean(result.subscription));

      return result;
    } finally {
      setIsBusy(false);
    }
  }, [user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    setIsBusy(true);

    try {
      await unsubscribeFromPush();

      setIsSubscribed(false);
    } finally {
      setIsBusy(false);
    }
  }, [isSupported]);

  const value = useMemo(
    () => ({
      isSupported,
      permission,
      isSubscribed,
      isBusy,
      subscribe,
      unsubscribe,
    }),
    [
      isSupported,
      permission,
      isSubscribed,
      isBusy,
      subscribe,
      unsubscribe,
    ],
  );

  return value;
}