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

import ErrorBoundary from "./components/ErrorBoundary";

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
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
    </ErrorBoundary>
  </StrictMode>,
);
