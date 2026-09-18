import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Link, Plus, Trophy, UsersRound } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { useTheme } from "../hooks/useTheme";
import { useTeam } from "../hooks/useTeam";
import { useTeamActions } from "../hooks/useTeamActions";
import { useAuth } from "../hooks/useAuth";

import TeamsLanding from "../components/teams/TeamsLanding";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";
import { TeamUIProvider } from "../context/TeamUIContext";

import { MAX_TEAMS_PER_USER } from "../config/team";
import { getTheme } from "../config/theme";
import { notify } from "../utils/teamNotify";
import { rankLeaderboard } from "../utils/ranking";
import { getTeamLeaderboard } from "../services/teamService";

const CreateTeamModal = lazy(() => import("../components/teams/modals/CreateTeamModal"));
const JoinTeamModal = lazy(() => import("../components/teams/modals/JoinTeamModal"));

export default function Teams() {
  const navigate = useNavigate();

  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const {
    teams = [],
    loading,
    atTeamLimit,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const isDark = resolvedTheme === "dark";

  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [positions, setPositions] = useState({});
  const positionsRequestRef = useRef(0);

  useEffect(() => {
    if (!user?.id || teams.length === 0) {
      return undefined;
    }

    const requestId = ++positionsRequestRef.current;

    Promise.all(
      teams.map((teamItem) =>
        getTeamLeaderboard(teamItem.team_id)
          .then((rows) => {
            const ranking = rankLeaderboard(rows ?? [], "all");
            const index = ranking.findIndex(
              (member) => member.user_id === user.id,
            );

            return {
              teamId: teamItem.team_id,
              position: index >= 0 ? index + 1 : null,
            };
          })
          .catch(() => null),
      ),
    ).then((results) => {
      if (requestId !== positionsRequestRef.current) {
        return;
      }

      const next = {};

      for (const result of results) {
        if (result) {
          next[result.teamId] = result.position;
        }
      }

      setPositions(next);
    });

    return () => {
      positionsRequestRef.current += 1;
    };
  }, [teams, user?.id]);

  const actions = useTeamActions({
    team: null,
    atTeamLimit,
    notify,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  });

  const teamUI = useMemo(
    () => ({
      theme,
      isDark,
    }),
    [theme, isDark],
  );

  if (loading) {
    return (
      <TeamUIProvider value={teamUI}>
        <div
          className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
        >
          <Header eyebrow="Cagometro" title="Squadre" />
          <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-2xl items-center justify-center px-5">
            <p className={`text-sm font-medium ${theme.muted}`}>
              Caricamento squadre…
            </p>
          </main>
          <BottomNav />
        </div>
      </TeamUIProvider>
    );
  }

  if (teams.length === 0) {
    return (
      <TeamUIProvider value={teamUI}>
        <TeamsLanding
          onCreate={actions.handleCreateTeam}
          onJoin={actions.handleJoinTeam}
        />
      </TeamUIProvider>
    );
  }

  return (
    <TeamUIProvider value={teamUI}>
      <div
        className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
      >
        <Header eyebrow="Cagometro" title="Squadre" />

        <main className="mx-auto w-full max-w-2xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
          <section className="mx-auto max-w-2xl">
            <p className={`text-sm font-medium ${theme.muted}`}>
              Le tue squadre
            </p>

            <h1
              className={`mt-1 text-[clamp(2.15rem,7vw,3.6rem)] font-black leading-[0.95] tracking-[-0.075em] ${theme.primaryText}`}
            >
              Le tue <span className="text-accent-ink">squadre.</span>
            </h1>

            <p className={`mt-3 text-sm font-medium ${theme.muted}`}>
              Puoi far parte di massimo {MAX_TEAMS_PER_USER} squadre. Ogni
              registrazione viene conteggiata in tutte.
            </p>
          </section>

          <div className="mx-auto mt-7 grid max-w-2xl gap-3">
            {teams.map((teamItem) => (
              <button
                key={teamItem.team_id}
                type="button"
                onClick={() => navigate(`/teams/${teamItem.team_id}`)}
                className={`relative flex w-full items-center gap-4 overflow-hidden rounded-[1.75rem] border px-5 py-4 text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.softSurface}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-accent"
                />

                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-xl">
                  {teamItem.avatar_emoji || "💩"}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-base font-black ${theme.primaryText}`}
                  >
                    {teamItem.team_name}
                  </span>

                  <span className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${theme.muted}`}>
                    {teamItem.role === "owner" ? "Proprietario" : "Membro"}
                    {" · "}
                    <UsersRound
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                    {Number(teamItem.member_count ?? 0).toLocaleString(
                      "it-IT",
                    )}{" "}
                    {Number(teamItem.member_count ?? 0) === 1
                      ? "membro"
                      : "membri"}
                  </span>

                  {Boolean(teamItem.description) && (
                    <span
                      className={`mt-0.5 block truncate text-xs font-medium ${theme.subtle}`}
                      title={teamItem.description}
                    >
                      {teamItem.description}
                    </span>
                  )}
                </span>

                <span className="inline-flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex min-w-[2.4rem] items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                      positions[teamItem.team_id] != null
                        ? "bg-accent/10 text-accent-ink dark:text-accent-ink"
                        : theme.muted
                    }`}
                  >
                    <Trophy
                      className="h-3.5 w-3.5"
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                    {positions[teamItem.team_id] != null
                      ? `#${positions[teamItem.team_id]}`
                      : "…"}
                  </span>

                  <ChevronRight
                    className={`h-5 w-5 ${theme.muted}`}
                    strokeWidth={2.2}
                  />
                </span>
              </button>
            ))}
          </div>

          {!atTeamLimit && (
            <div className="mx-auto mt-7 grid max-w-2xl gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-extrabold text-accent-contrast shadow-[0_12px_28px_color-mix(in_oklab,var(--accent)_24%,transparent)] transition-transform hover:bg-accent hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                  Crea una squadra
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className={`min-h-14 w-full items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${theme.secondary} ${theme.focusOffset}`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Link className="h-5 w-5" strokeWidth={2.2} />
                  Entra con un codice
                </span>
              </button>
            </div>
          )}

          {atTeamLimit && (
            <Card
              as="section"
              theme={theme}
              className="mx-auto mt-7 max-w-2xl"
            >
              <p className={`text-sm leading-relaxed ${theme.muted}`}>
                Hai raggiunto il limite massimo di {MAX_TEAMS_PER_USER}{" "}
                squadre. Esci da una squadra per crearne o raggiungerne una
                nuova.
              </p>
            </Card>
          )}
        </main>

        <BottomNav />

        <AnimatePresence>
          {joinOpen && (
            <Suspense fallback={null}>
              <JoinTeamModal
                onClose={() => setJoinOpen(false)}
                onJoin={actions.handleJoinTeam}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <CreateTeamModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={actions.handleCreateTeam}
          />
        </Suspense>
      </div>
    </TeamUIProvider>
  );
}