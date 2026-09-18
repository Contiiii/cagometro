import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import "@fontsource-variable/inter";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { EntriesProvider } from "./context/EntriesProvider";
import { ProfileProvider } from "./context/ProfileProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { SettingsProvider } from "./context/SettingsProvider";
import { TeamProvider } from "./context/TeamProvider";
import AnalyticsProvider from "./context/AnalyticsProvider";
import PushSyncProvider from "./context/PushSyncProvider";

import { trackEvent } from "./services/analyticsService";

import ErrorBoundary from "./components/ErrorBoundary";

let swRegistration = null;

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW: (_swUrl, registration) => {
    swRegistration = registration;
  },
  onRegisterError: (error) => {
    trackEvent("sw_register_error", {
      message: error instanceof Error ? error.message : String(error),
    });
  },
});

function checkForAppUpdate() {
  swRegistration?.update?.().catch(() => {});
}

if (typeof window !== "undefined") {
  window.addEventListener("focus", checkForAppUpdate);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForAppUpdate();
    }
  });

  window.setInterval(checkForAppUpdate, UPDATE_CHECK_INTERVAL_MS);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AnalyticsProvider>
        <AuthProvider>
          <PushSyncProvider>
            <ProfileProvider>
              <EntriesProvider>
                <ThemeProvider>
                  <SettingsProvider>
                    <TeamProvider>
                      <App />
                    </TeamProvider>
                  </SettingsProvider>
                </ThemeProvider>
              </EntriesProvider>
            </ProfileProvider>
          </PushSyncProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
