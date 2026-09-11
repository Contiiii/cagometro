import { useMemo, useState, lazy, Suspense } from "react";
import { Link, Plus, Wifi } from "lucide-react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../hooks/useAuth";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import TeamLeaderboard from "../components/teams/TeamLeaderboard";
import TeamActivityFeed from "../components/teams/TeamActivityFeed";
import TeamHeroCard from "../components/teams/TeamHeroCard";
import TeamWeeklyGoal from "../components/teams/TeamWeeklyGoal";

import toast from "react-hot-toast";

import poopIcon from "../assets/poop.png";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  createTeamActivity,
  transferOwnership,
  removeTeamMember,
  regenerateInviteCode,
  toggleTeamInvites,
} from "../services/teamService";

const CreateTeamModal = lazy(
  () => import("../components/teams/CreateTeamModal"),
);
const ConfirmModal = lazy(() => import("../components/teams/ConfirmModal"));
const EditTeamModal = lazy(() => import("../components/teams/EditTeamModal"));
const TeamInviteModal = lazy(
  () => import("../components/teams/TeamInviteModal"),
);
const TeamSettingsModal = lazy(
  () => import("../components/teams/TeamSettingsModal"),
);
const TeamMembersModal = lazy(
  () => import("../components/teams/TeamMembersModal"),
);
const TeamMemberDetailsModal = lazy(
  () => import("../components/teams/TeamMemberDetailsModal"),
);
const JoinTeamModal = lazy(() => import("../components/teams/JoinTeamModal"));

export default function CagometroTeams() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const {
    team,
    members = [],
    leaderboard = [],
    activity = [],
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const isDark = resolvedTheme === "dark";

  const [rankingMode, setRankingMode] = useState("week");
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invitesToggling, setInvitesToggling] = useState(false);
  const [invitesEnabled, setInvitesEnabled] = useState(
    () => team?.invites_enabled !== false,
  );
  const [previousServerInvitesEnabled, setPreviousServerInvitesEnabled] =
    useState(team?.invites_enabled);

  if (team?.invites_enabled !== previousServerInvitesEnabled) {
    setPreviousServerInvitesEnabled(team?.invites_enabled);

    if (typeof team?.invites_enabled === "boolean") {
      setInvitesEnabled(team.invites_enabled);
    }
  }
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  function openConfirm(config) {
    setConfirmConfig(config);
  }

  const totalWeekly = useMemo(
    () =>
      leaderboard.reduce(
        (total, member) => total + Number(member.weekly_total || 0),
        0,
      ),
    [leaderboard],
  );

  const totalLifetime = useMemo(
    () =>
      leaderboard.reduce(
        (total, member) => total + Number(member.lifetime_total || 0),
        0,
      ),
    [leaderboard],
  );

  const weeklyGoal = 140;

  const ranking = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      const aScore =
        rankingMode === "week"
          ? Number(a.weekly_total || 0)
          : Number(a.lifetime_total || 0);

      const bScore =
        rankingMode === "week"
          ? Number(b.weekly_total || 0)
          : Number(b.lifetime_total || 0);

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      return String(a.display_name || "").localeCompare(
        String(b.display_name || ""),
        "it",
      );
    });
  }, [leaderboard, rankingMode]);

  const currentUserPosition = useMemo(() => {
    const index = ranking.findIndex((member) => member.user_id === user?.id);

    return index >= 0 ? index + 1 : null;
  }, [ranking, user?.id]);

  const selectedData = useMemo(() => {
    return (
      leaderboard.find((member) => member.user_id === selectedMember) || null
    );
  }, [leaderboard, selectedMember]);

  const selectedPosition = useMemo(() => {
    if (!selectedData) return null;

    const index = ranking.findIndex(
      (member) => member.user_id === selectedData.user_id,
    );

    return index >= 0 ? index + 1 : null;
  }, [ranking, selectedData]);

  const selectedMembership = useMemo(() => {
    if (!selectedData) return null;

    return (
      members.find((member) => member.user_id === selectedData.user_id) || null
    );
  }, [members, selectedData]);

  const inviteCode = team?.invite_code ?? "";

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        softSurface: "bg-white/[0.035] border-white/[0.07]",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-50",
        header: "bg-[#0c0c0f]/80 border-white/[0.07]",
        nav: "bg-zinc-950/80 border-white/[0.09]",
        navInactive: "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]",
        secondary:
          "bg-white/[0.055] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]",
        sheet: "bg-[#17171b] border-white/[0.09]",
        input:
          "border-white/[0.10] bg-white/[0.05] text-zinc-100 placeholder:text-zinc-500",
        focusOffset: "focus-visible:ring-offset-[#0c0c0f]",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        softSurface: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-950",
        header: "bg-[#f8f5f3]/80 border-zinc-900/[0.07]",
        nav: "bg-white/85 border-zinc-900/[0.09]",
        navInactive:
          "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-900/[0.05]",
        secondary:
          "bg-zinc-900/[0.045] border-zinc-900/[0.08] text-zinc-700 hover:bg-zinc-900/[0.08]",
        sheet: "bg-[#fdfbf9] border-zinc-900/[0.09]",
        input:
          "border-zinc-900/[0.12] bg-zinc-900/[0.04] text-zinc-900 placeholder:text-zinc-400",
        focusOffset: "focus-visible:ring-offset-[#f8f5f3]",
      };

  async function handleCreateTeam(payload) {
    const name = payload.name?.trim();

    if (!name) {
      toast.error("Inserisci un nome squadra");
      throw new Error("Nome squadra mancante");
    }

    try {
      await createTeam({
        name,
        description: payload.description?.trim() || null,
        avatarEmoji: "🏆",
        privacy: payload.privacy,
        accent: payload.accent,
      });

      // Solo team e members (leaderboard e activity non esistono ancora)
      await Promise.all([refreshTeam(), refreshMembers()]);

      toast.success("Squadra creata");
    } catch (error) {
      console.error("Errore durante la creazione della squadra:", error);
      toast.error(error?.message || "Non è stato possibile creare la squadra");
      throw error;
    }
  }

  async function handleJoinTeam(code) {
    await joinTeam(code);
    await createTeamActivity("member_joined");

    // Team, members e leaderboard (activity opzionale)
    await Promise.all([refreshTeam(), refreshMembers(), refreshLeaderboard()]);

    toast.success("Sei entrato nella squadra");
  }

  const isOwner = useMemo(() => team?.role === "owner", [team?.role]);

  const activeMembers = useMemo(
    () => members.filter((member) => !member.left_at && !member.removed_at),
    [members],
  );

  const isLastMember = isOwner && activeMembers.length === 1;

  function handleLeaveTeam() {
    openConfirm({
      title: isLastMember ? "Sciogli squadra" : "Lascia squadra",
      description: isLastMember
        ? "Sei l'unico membro della squadra. Abbandonandola la squadra verrà eliminata definitivamente."
        : "Vuoi davvero lasciare la squadra?",
      confirmText: isLastMember ? "Sciogli squadra" : "Lascia",
      variant: "danger",
      onConfirm: async () => {
        try {
          setLeaving(true);

          await createTeamActivity("member_left");
          await leaveTeam();

          setSelectedMember(null);
          setInviteOpen(false);
          setSettingsOpen(false);
          setMembersOpen(false);

          // Solo team (stai uscendo, non serve refresh completo)
          await refreshTeam();

          toast.success(
            isLastMember
              ? "Squadra sciolta con successo"
              : "Hai lasciato la squadra",
          );
        } catch (error) {
          console.error("Errore durante l'uscita dalla squadra:", error);
          throw error;
        } finally {
          setLeaving(false);
        }
      },
    });
  }

  async function handleTransferOwnership(member) {
    openConfirm({
      title: "Trasferisci proprietà",
      description: `${member.display_name} diventerà il nuovo proprietario della squadra.`,
      confirmText: "Trasferisci",
      variant: "warning",
      onConfirm: async () => {
        try {
          await transferOwnership(member.user_id);

          await createTeamActivity("ownership_transferred", null, {
            target_user_id: member.user_id,
            target_display_name: member.display_name,
          });

          // Team (ruolo cambiato), members, activity
          await Promise.all([
            refreshTeam(),
            refreshMembers(),
            refreshActivity(),
          ]);

          toast.success(`${member.display_name} è ora il proprietario`);

          setMembersOpen(false);
          setSettingsOpen(false);
          setSelectedMember(null);
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
    });
  }

  async function handleRemoveMember(member) {
    openConfirm({
      title: "Rimuovi membro",
      description: `Vuoi rimuovere ${member.display_name} dalla squadra?`,
      confirmText: "Rimuovi",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removeTeamMember(member.user_id);

          await createTeamActivity("member_removed", null, {
            target_user_id: member.user_id,
            target_display_name: member.display_name,
          });

          // Members, leaderboard, activity (team non cambia)
          await Promise.all([
            refreshMembers(),
            refreshLeaderboard(),
            refreshActivity(),
          ]);

          toast.success(`${member.display_name} è stato rimosso`);
          if (selectedMember === member.user_id) {
            setSelectedMember(null);
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
    });
  }

  function handleRegenerateInvite() {
    setSettingsOpen(false);

    openConfirm({
      title: "Rigenera codice invito",
      description:
        "Il codice attuale e tutti i link già condivisi smetteranno di funzionare.",
      confirmText: "Rigenera",
      variant: "warning",
      onConfirm: async () => {
        await regenerateInviteCode();
        await refreshTeam(); // Solo team (cambia solo invite_code)

        toast.success("Nuovo codice invito generato");
      },
    });
  }

  async function handleToggleInvites(nextEnabled) {
    if (invitesToggling) return;

    const previousEnabled = invitesEnabled;

    setInvitesEnabled(nextEnabled);
    setInvitesToggling(true);

    try {
      await toggleTeamInvites(nextEnabled);
      await refreshTeam(); // Solo team (cambia solo invites_enabled)

      toast.success(
        nextEnabled
          ? "Inviti riabilitati: il codice è di nuovo attivo"
          : "Inviti disabilitati",
      );
    } catch (error) {
      console.error("Errore aggiornamento stato inviti:", error);

      setInvitesEnabled(previousEnabled);

      toast.error("Non è stato possibile aggiornare lo stato degli inviti");
    } finally {
      setInvitesToggling(false);
    }
  }

  if (!team) {
    return (
      <div
        className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
      >
        <Header eyebrow="Cagometro" title="Squadre" />

        <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-2xl items-center px-5 pb-36 pt-8 sm:px-8">
          <section
            className={`relative w-full overflow-hidden rounded-[2rem] border p-6 sm:p-10 ${theme.surface}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-pink-500/[0.10] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-400/[0.07] blur-3xl" />

            <div className="relative">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[1.4rem] bg-pink-500 shadow-[0_12px_30px_rgba(236,72,153,0.25)]">
                <img
                  src={poopIcon}
                  alt="Icona squadra"
                  className="h-10 w-10 object-contain"
                />
              </div>

              <p className={`mt-8 text-sm font-semibold ${theme.muted}`}>
                La squadra è il posto dove le tue statistiche diventano una
                storia condivisa.
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
          </section>
        </main>

        <BottomNav />

        <AnimatePresence>
          {joinOpen && (
            <Suspense fallback={null}>
              <JoinTeamModal
                onClose={() => setJoinOpen(false)}
                onJoin={handleJoinTeam}
                theme={theme}
                isDark={isDark}
                prefersReducedMotion={prefersReducedMotion}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <CreateTeamModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={handleCreateTeam}
            isDark={isDark}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Squadra attiva" title={team?.team_name || "Squadra"} />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <TeamHeroCard
          team={team}
          membersCount={members.length}
          totalLifetime={totalLifetime}
          currentUserPosition={currentUserPosition}
          invitesEnabled={Boolean(inviteCode) && invitesEnabled}
          theme={theme}
          isDark={isDark}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenInvite={() => setInviteOpen(true)}
        />

        <TeamWeeklyGoal
          totalWeekly={totalWeekly}
          weeklyGoal={weeklyGoal}
          theme={theme}
          isDark={isDark}
          prefersReducedMotion={prefersReducedMotion}
        />

        <TeamLeaderboard
          leaderboard={leaderboard}
          members={members}
          currentUserId={user?.id}
          rankingMode={rankingMode}
          onRankingChange={setRankingMode}
          onSelectMember={setSelectedMember}
          theme={theme}
          isDark={isDark}
          prefersReducedMotion={prefersReducedMotion}
        />

        <TeamActivityFeed
          activity={activity}
          theme={theme}
          isDark={isDark}
          prefersReducedMotion={prefersReducedMotion}
        />
      </main>

      <BottomNav />

      <AnimatePresence>
        {selectedData && (
          <Suspense fallback={null}>
            <TeamMemberDetailsModal
              member={selectedData}
              membership={selectedMembership}
              position={selectedPosition}
              currentUserId={user?.id}
              totalWeekly={totalWeekly}
              theme={theme}
              isDark={isDark}
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setSelectedMember(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inviteOpen && (
          <Suspense fallback={null}>
            <TeamInviteModal
              onClose={() => setInviteOpen(false)}
              team={team}
              theme={theme}
              isDark={isDark}
              prefersReducedMotion={prefersReducedMotion}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <Suspense fallback={null}>
            <TeamSettingsModal
              team={team}
              theme={theme}
              isDark={isDark}
              prefersReducedMotion={prefersReducedMotion}
              leaving={leaving}
              invitesEnabled={invitesEnabled}
              togglingInvites={invitesToggling}
              onToggleInvites={handleToggleInvites}
              onClose={() => setSettingsOpen(false)}
              onEdit={() => {
                setSettingsOpen(false);
                setEditOpen(true);
              }}
              onManageMembers={() => {
                setSettingsOpen(false);
                setMembersOpen(true);
              }}
              onRegenerateInvite={handleRegenerateInvite}
              onLeave={handleLeaveTeam}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {membersOpen && (
          <Suspense fallback={null}>
            <TeamMembersModal
              team={team}
              members={members}
              leaderboard={leaderboard}
              currentUserId={user?.id}
              theme={theme}
              isDark={isDark}
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setMembersOpen(false)}
              onTransferOwnership={handleTransferOwnership}
              onRemoveMember={handleRemoveMember}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editOpen && (
          <Suspense fallback={null}>
            <EditTeamModal
              onClose={() => setEditOpen(false)}
              team={team}
              isDark={isDark}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
              onSaved={async () => {
                await Promise.all([
                  refreshTeam(),
                  refreshMembers(),
                  refreshLeaderboard(),
                  refreshActivity(),
                ]);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <ConfirmModal
          open={!!confirmConfig}
          onClose={() => {
            setConfirmConfig(null);
          }}
          title={confirmConfig?.title}
          description={confirmConfig?.description}
          confirmText={confirmConfig?.confirmText}
          onConfirm={confirmConfig?.onConfirm}
          prefersReducedMotion={prefersReducedMotion}
          theme={theme}
          isDanger={confirmConfig?.variant === "danger"}
        />
      </Suspense>
    </div>
  );
}
