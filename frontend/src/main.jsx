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

import { trackEvent } from "./services/analyticsService";

import ErrorBoundary from "./components/ErrorBoundary";

registerSW({
  immediate: true,
  onRegisterError: (error) => {
    trackEvent("sw_register_error", {
      message: error instanceof Error ? error.message : String(error),
    });
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AnalyticsProvider>
        <AuthProvider>
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
        </AuthProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
