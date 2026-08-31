import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { EntriesProvider } from "./context/EntriesProvider";

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <EntriesProvider>
        <App />
      </EntriesProvider>
    </AuthProvider>
  </StrictMode>,
);
