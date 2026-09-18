import { useCallback, useEffect, useState } from "react";

import {
  trackEvent,
  trackEventOnce,
} from "../services/analyticsService";

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();

      setDeferredPrompt(event);
      setCanInstall(true);

      trackEventOnce(
        "pwa_install_available",
        "pwa_install_available",
        {},
      );
    }

    function handleAppInstalled() {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);

      trackEventOnce("pwa_installed", "pwa_installed", {});
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    const promptEvent = deferredPrompt;

    let outcome = "unknown";

    try {
      promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      outcome = choice?.outcome ?? "unknown";

      return outcome === "accepted";
    } catch {
      return false;
    } finally {
      trackEvent("pwa_install_prompt", { outcome });

      setDeferredPrompt(null);
      setCanInstall(false);
    }
  }, [deferredPrompt]);

  return { canInstall, installed, install };
}

export default useInstallPrompt;