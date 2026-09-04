import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { EntriesProvider } from "./context/EntriesProvider";
import { ProfileProvider } from "./context/ProfileProvider";
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
          <TeamProvider>
            <EntriesProvider>
              <App />
            </EntriesProvider>
          </TeamProvider>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
