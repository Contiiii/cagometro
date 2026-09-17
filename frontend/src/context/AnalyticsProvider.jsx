import { useEffect, useRef } from "react";

import {
  flushAnalyticsQueue,
  trackEvent,
} from "../services/analyticsService";

export default function AnalyticsProvider({ children }) {
  const offlineStartedAtRef = useRef(null);

  useEffect(() => {
    function handleOnline() {
      if (offlineStartedAtRef.current !== null) {
        trackEvent("offline_session_end", {
          durationMs: Date.now() - offlineStartedAtRef.current,
        });

        offlineStartedAtRef.current = null;
      }

      flushAnalyticsQueue();
    }

    function handleOffline() {
      if (offlineStartedAtRef.current === null) {
        offlineStartedAtRef.current = Date.now();

        trackEvent("offline_session_start", {
          at: offlineStartedAtRef.current,
        });
      }
    }

    function handleServiceWorkerMessage(event) {
      if (event?.data?.type === "ANALYTICS_EVENT") {
        trackEvent(event.data.event, event.data.payload ?? {});
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    if (!navigator.onLine && offlineStartedAtRef.current === null) {
      offlineStartedAtRef.current = Date.now();

      trackEvent("offline_session_start", {
        at: offlineStartedAtRef.current,
      });
    }

    flushAnalyticsQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, []);

  return children;
}