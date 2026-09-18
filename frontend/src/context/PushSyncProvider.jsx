import { useEffect, useRef } from "react";

import { useAuth } from "../hooks/useAuth";
import { PUSH_SUBSCRIPTION_SYNC_MESSAGE } from "../services/pushSubscriptionChange";
import { flushPendingPushSubscriptionSync } from "../services/pushSubscriptionSync";

export default function PushSyncProvider({ children }) {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    function runFlush() {
      if (!userRef.current?.id) {
        return;
      }

      flushPendingPushSubscriptionSync();
    }

    function handleServiceWorkerMessage(event) {
      if (event?.data?.type === PUSH_SUBSCRIPTION_SYNC_MESSAGE) {
        runFlush();
      }
    }

    window.addEventListener("online", runFlush);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      window.removeEventListener("online", runFlush);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      flushPendingPushSubscriptionSync();
    }
  }, [user?.id]);

  return children;
}