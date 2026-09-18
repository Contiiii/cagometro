import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import OfflineBanner from "./components/OfflineBanner";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const Report = lazy(() => import("./pages/Report"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Settings = lazy(() => import("./pages/Settings"));
const Teams = lazy(() => import("./pages/Teams"));
const TeamDashboardPage = lazy(() => import("./pages/TeamDashboardPage"));
const JoinTeamPage = lazy(() => import("./pages/JoinTeamPage"));
const Login = lazy(() => import("./pages/Login"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Changelog = lazy(() => import("./pages/Changelog"));

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid rgba(244,114,182,.2)",
          },
        }}
      />

      <div
        id="global-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <OfflineBanner />

      <MotionConfig reducedMotion="user">
        <Suspense
        fallback={
          <div
            className="
        flex
        min-h-dvh
        items-center
        justify-center
        bg-black
        text-white
      "
          >
            Caricamento...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/settings" element={<Settings />} />

          <Route path="/teams" element={<Teams />} />

          <Route path="/teams/:teamId" element={<TeamDashboardPage />} />

          <Route path="/achievements" element={<Achievements />} />

          <Route path="/report" element={<Report />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/join/:code" element={<JoinTeamPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </MotionConfig>
    </BrowserRouter>
  );
}
