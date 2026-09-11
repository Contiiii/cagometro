import { lazy, Suspense, useState } from "react";
import { Link, Plus, Wifi } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import Header from "../Header";
import BottomNav from "../BottomNav";
import Card from "../ui/Card";
import IconTile from "../ui/IconTile";

import { useTeamUI } from "../../hooks/useTeamUI";

import poopIcon from "../../assets/poop.png";

const CreateTeamModal = lazy(() => import("./modals/CreateTeamModal"));
const JoinTeamModal = lazy(() => import("./modals/JoinTeamModal"));

export default function TeamsLanding({ onCreate, onJoin }) {
  const { theme } = useTeamUI();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <div
        id="team-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <Header eyebrow="Cagometro" title="Squadre" />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-2xl items-center px-5 pb-36 pt-8 sm:px-8">
        <Card as="section" theme={theme} padding="lg" className="w-full">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-pink-500/[0.10] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-400/[0.07] blur-3xl" />

          <div className="relative">
            <IconTile
              size="3xl"
              className="overflow-hidden bg-pink-500 shadow-[0_12px_30px_rgba(236,72,153,0.25)]"
            >
              <img
                src={poopIcon}
                alt="Icona squadra"
                className="h-10 w-10 object-contain"
              />
            </IconTile>

            <p className={`mt-8 text-sm font-semibold ${theme.muted}`}>
              La squadra è il posto dove le tue statistiche diventano una storia
              condivisa.
            </p>

            <div className={`mt-6 grid gap-3 text-sm ${theme.muted}`}>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <span>Confronta i progressi con gli amici</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <span>Sblocca traguardi e sali in classifica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <span>Crea o unisciti in pochi secondi</span>
              </div>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.24)] transition-transform hover:bg-pink-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                  Crea una squadra
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  className={`w-full flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${theme.secondary} ${theme.focusOffset}`}
                >
                  <Link className="h-5 w-5" strokeWidth={2.2} />
                  Entra con un codice
                </button>
              </div>
            </div>

            <div
              className={`mt-7 flex items-center gap-2 text-xs font-semibold ${theme.muted}`}
            >
              <Wifi className="h-4 w-4 text-emerald-500" strokeWidth={2.2} />
              Aggiornamento in tempo reale
            </div>
          </div>
        </Card>
      </main>

      <BottomNav />

      <AnimatePresence>
        {joinOpen && (
          <Suspense fallback={null}>
            <JoinTeamModal
              onClose={() => setJoinOpen(false)}
              onJoin={onJoin}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <CreateTeamModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={onCreate}
        />
      </Suspense>
    </div>
  );
}