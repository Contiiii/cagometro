import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { TeamProvider } from "./context/TeamProvider";

const Home = lazy(() => import("./pages/Home"));
const Report = lazy(() => import("./pages/Report"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Settings = lazy(() => import("./pages/Settings"));
const Teams = lazy(() => import("./pages/Teams"));
const JoinTeamPage = lazy(() => import("./pages/JoinTeamPage"));
const Login = lazy(() => import("./pages/Login"));
const Privacy = lazy(() => import("./pages/Privacy"));
import NotFound from "./pages/NotFound";

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

          <Route element={<TeamProvider><Outlet /></TeamProvider>}>
            <Route path="/teams" element={<Teams />} />

            <Route path="/achievements" element={<Achievements />} />

            <Route path="/join/:code" element={<JoinTeamPage />} />
          </Route>

          <Route path="/report" element={<Report />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </MotionConfig>
    </BrowserRouter>
  );
}
