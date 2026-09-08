import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  Crown,
  Flame,
  Link,
  Medal,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Trophy,
  UserPlus,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../hooks/useAuth";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";
import CreateTeamModal from "../components/teams/CreateTeamModal";

import toast from "react-hot-toast";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  createTeamActivity,
  transferOwnership,
  removeTeamMember,
  updateTeam,
  regenerateInviteCode,
} from "../services/teamService";

const getActivityIcon = (type) => {
  const icons = {
    entry_created: Plus,
    member_joined: UserPlus,
    member_left: UsersRound,
    ownership_transferred: Crown,
    member_removed: X,
    streak_bonus: Flame,
  };

  return icons[type] || Activity;
};

const getActivityStyle = (type, isDark) => {
  const styles = {
    entry_created: isDark
      ? "bg-pink-500/15 text-pink-400"
      : "bg-pink-500/12 text-pink-600",

    member_joined: isDark
      ? "bg-emerald-400/15 text-emerald-400"
      : "bg-emerald-500/12 text-emerald-700",

    member_left: isDark
      ? "bg-zinc-400/15 text-zinc-300"
      : "bg-zinc-500/12 text-zinc-600",

    ownership_transferred: isDark
      ? "bg-amber-400/15 text-amber-300"
      : "bg-amber-400/15 text-amber-700",

    member_removed: isDark
      ? "bg-rose-400/15 text-rose-400"
      : "bg-rose-500/12 text-rose-700",

    streak_bonus: isDark
      ? "bg-orange-400/15 text-orange-400"
      : "bg-orange-500/12 text-orange-700",
  };

  return styles[type] || styles.entry_created;
};

const getRankStyle = (rank, isDark) => {
  if (rank === 1) {
    return isDark
      ? "border-amber-300/25 bg-amber-300/15 text-amber-300"
      : "border-amber-500/25 bg-amber-400/15 text-amber-700";
  }

  if (rank === 2) {
    return isDark
      ? "border-zinc-300/20 bg-zinc-200/10 text-zinc-200"
      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-700";
  }

  if (rank === 3) {
    return isDark
      ? "border-orange-300/20 bg-orange-300/10 text-orange-300"
      : "border-orange-500/20 bg-orange-400/15 text-orange-700";
  }

  return isDark
    ? "border-white/[0.08] bg-white/[0.05] text-zinc-400"
    : "border-zinc-900/[0.08] bg-zinc-900/[0.04] text-zinc-500";
};

const avatarGradients = [
  "from-pink-400 to-fuchsia-600",
  "from-violet-400 to-indigo-600",
  "from-sky-400 to-blue-600",
  "from-emerald-300 to-teal-600",
  "from-amber-300 to-orange-500",
];

const TEAM_EMOJIS = [
  "🏆",
  "💩",
  "🔥",
  "🚀",
  "⚡",
  "👑",
  "🎯",
  "🌋",
  "🍕",
  "🦍",
];

const getAvatarGradient = (userId = "") => {
  const normalizedId = String(userId || "");

  const value = [...normalizedId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return avatarGradients[value % avatarGradients.length];
};

const getActivityText = (item) => {
  const displayName = item.display_name || "Un utente";
  const targetName = item.target_display_name || "un membro";
  const points = Number(item.points || 0);

  switch (item.activity_type) {
    case "entry_created":
      return `${displayName} ha registrato ${points} ${
        points === 1 ? "punto" : "punti"
      }`;

    case "member_joined":
      return `${displayName} è entrato nella squadra`;

    case "member_left":
      return `${displayName} ha lasciato la squadra`;

    case "ownership_transferred":
      return `${displayName} ha trasferito la proprietà${
        item.target_display_name ? ` a ${targetName}` : ""
      }`;

    case "member_removed":
      return `${displayName} ha rimosso ${targetName} dalla squadra`;

    case "streak_bonus":
      return `${displayName} ha ottenuto +${points} ${
        points === 1 ? "punto bonus streak" : "punti bonus streak"
      }`;

    default:
      return `${displayName} ha aggiornato la squadra`;
  }
};

const formatActivityTime = (createdAt) => {
  if (!createdAt) return "";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CagometroTeams() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const {
    team,
    members,
    leaderboard,
    activity,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const isDark = resolvedTheme === "dark";

  const [rankingMode, setRankingMode] = useState("week");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const visibleActivities = showAllActivities ? activity : activity.slice(0, 3);
  const [membersOpen, setMembersOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  function openConfirm(config) {
    setConfirmConfig(config);
    setConfirmOpen(true);
  }

  const totalWeekly = leaderboard.reduce(
    (total, member) => total + Number(member.weekly_total || 0),
    0,
  );

  const weeklyGoal = 140;
  const weeklyProgress = Math.min(
    100,
    Math.round((totalWeekly / weeklyGoal) * 100),
  );

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

      return bScore - aScore;
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

  const inviteLink = inviteCode
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

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

  const copyInvite = async () => {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Errore durante la copia dell'invito:", error);
      toast.error("Non è stato possibile copiare il link");
    }
  };

  const shareInvite = async () => {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unisciti a ${team?.team_name || "questa squadra"}`,
          text: `Entra nella squadra ${team?.team_name || ""} su Cagometro.`,
          url: inviteLink,
        });

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Errore durante la condivisione:", error);
      }
    }

    await copyInvite();
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

      await Promise.all([
        refreshTeam(),
        refreshMembers(),
        refreshLeaderboard(),
        refreshActivity(),
      ]);

      toast.success("Squadra creata");
    } catch (error) {
      console.error("Errore durante la creazione della squadra:", error);

      toast.error(error.message || "Non è stato possibile creare la squadra");

      throw error;
    }
  }

  async function handleJoinTeam() {
    const code = joinCode.trim().toUpperCase();

    if (!code) {
      toast.error("Inserisci un codice invito");
      return;
    }

    try {
      setJoining(true);

      await joinTeam(code);

      await createTeamActivity("member_joined");

      await refreshTeam();
      await refreshMembers();
      await refreshLeaderboard();
      await refreshActivity();

      toast.success("Sei entrato nella squadra");

      setJoinOpen(false);
      setJoinCode("");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  }

  async function handleLeaveTeam() {
    openConfirm({
      title: "Lascia squadra",
      description:
        team?.role === "owner"
          ? "Sei il proprietario della squadra. Assicurati di aver trasferito la proprietà."
          : "Vuoi davvero lasciare la squadra?",
      confirmText: "Lascia",
      variant: "danger",
      onConfirm: async () => {
        try {
          setLeaving(true);

          await createTeamActivity("member_left");
          await leaveTeam();

          setSelectedMember(null);
          setInviteOpen(false);
          setSettingsOpen(false);
          setShowAllActivities(false);

          await Promise.all([
            refreshTeam(),
            refreshMembers(),
            refreshLeaderboard(),
            refreshActivity(),
          ]);

          toast.success("Hai lasciato la squadra");
        } catch (error) {
          console.error(error);
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

          await Promise.all([
            refreshTeam(),
            refreshMembers(),
            refreshLeaderboard(),
            refreshActivity(),
          ]);

          toast.success(`${member.display_name} è ora il proprietario`);

          setMembersOpen(false);
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

          await Promise.all([
            refreshMembers(),
            refreshLeaderboard(),
            refreshActivity(),
          ]);

          toast.success(`${member.display_name} è stato rimosso`);
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
        await refreshTeam();

        setCopied(false);
        toast.success("Nuovo codice invito generato");
      },
    });
  }

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const totalLifetime = leaderboard.reduce(
    (total, member) => total + Number(member.lifetime_total || 0),
    0,
  );

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
              <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-pink-500 text-3xl shadow-[0_12px_30px_rgba(236,72,153,0.25)]">
                💩
              </div>

              <p className={`mt-8 text-sm font-semibold ${theme.muted}`}>
                La squadra è il posto dove le tue statistiche diventano una
                storia condivisa.
              </p>

              <h1
                className={`mt-3 max-w-md text-[clamp(2.2rem,8vw,4rem)] font-black leading-[0.95] tracking-[-0.065em] ${theme.primaryText}`}
              >
                Da soli è un dato.
                <br />
                Insieme è una <span className="text-pink-500">leggenda.</span>
              </h1>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.24)] transition-transform hover:bg-pink-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                  Crea una squadra
                </button>

                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${theme.secondary} ${theme.focusOffset}`}
                >
                  <Link className="h-5 w-5" strokeWidth={2.2} />
                  Entra con un codice
                </button>
              </div>

              <div
                className={`mt-7 flex items-center gap-2 text-xs font-semibold ${theme.muted}`}
              >
                <Wifi className="h-4 w-4 text-emerald-500" strokeWidth={2.2} />
                Le squadre si aggiornano in tempo reale.
              </div>
            </div>
          </section>
        </main>

        <BottomNav />

        <AnimatePresence>
          {joinOpen && (
            <ModalShell
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setJoinOpen(false)}
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className={`text-sm font-semibold ${theme.muted}`}>
                      Entra in squadra
                    </p>
                    <h2
                      className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
                    >
                      Hai un codice?
                    </h2>
                  </div>

                  <CloseButton
                    onClick={() => setJoinOpen(false)}
                    theme={theme}
                    isDark={isDark}
                  />
                </div>

                <label
                  htmlFor="team-code"
                  className={`mt-7 block text-sm font-bold ${theme.primaryText}`}
                >
                  Codice squadra
                </label>

                <input
                  id="team-code"
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(event.target.value.toUpperCase())
                  }
                  placeholder="ES. CAGO-7F9K"
                  className={`mt-2 min-h-14 w-full rounded-2xl border px-4 font-mono text-base font-bold tracking-[0.12em] outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 ${theme.input}`}
                />

                <button
                  type="button"
                  onClick={handleJoinTeam}
                  disabled={joining}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <UsersRound className="h-5 w-5" strokeWidth={2.3} />
                  {joining ? "Ingresso..." : "Entra nella squadra"}
                </button>
              </div>
            </ModalShell>
          )}
        </AnimatePresence>
        <CreateTeamModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateTeam}
          isDark={isDark}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Squadra attiva" title={team?.team_name || "Squadra"} />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-3xl">
          <div className="relative">
            <div
              className={`relative overflow-hidden rounded-[2rem] border ${theme.surface}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-500/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-amber-400/[0.06] blur-3xl" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-pink-500 text-2xl shadow-[0_12px_30px_rgba(236,72,153,0.28)] sm:h-16 sm:w-16 sm:text-3xl">
                    {team?.avatar_emoji || "🏆"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1
                        className={`min-w-0 break-words text-[clamp(1.35rem,5vw,2.2rem)] font-black leading-[0.95] tracking-[-0.055em] ${theme.primaryText}`}
                      >
                        {team?.team_name || "Squadra senza nome"}
                      </h1>

                      {team?.role === "owner" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2.5 py-1 text-[10px] font-extrabold text-pink-500 sm:text-[11px]">
                          <ShieldCheck
                            className="h-3.5 w-3.5"
                            strokeWidth={2.4}
                          />
                          ADMIN
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-2 max-w-[52ch] text-sm font-medium leading-relaxed ${theme.muted}`}
                    >
                      {team?.description ||
                        "Nessuna descrizione della squadra."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                        isDark
                          ? "border-white/[0.08] bg-white/[0.04]"
                          : "border-zinc-900/[0.08] bg-zinc-900/[0.03]"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                      Squadra attiva
                    </span>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                        isDark
                          ? "border-white/[0.08] bg-white/[0.04]"
                          : "border-zinc-900/[0.08] bg-zinc-900/[0.03]"
                      }`}
                    >
                      <UsersRound className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {members.length}{" "}
                      {members.length === 1 ? "membro" : "membri"}
                    </span>
                  </div>

                  <div
                    className={`grid gap-2 ${
                      team?.role === "owner" ? "grid-cols-2" : "grid-cols-1"
                    } sm:flex`}
                  >
                    {team?.role === "owner" && (
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        aria-label="Gestisci squadra"
                        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.secondary}`}
                      >
                        <Settings className="h-4 w-4" strokeWidth={2.2} />
                        <span>Gestisci</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInviteOpen(true)}
                      aria-label="Invita un membro"
                      disabled={!inviteCode}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                    >
                      <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                      <span>Invita</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-3 border-t ${isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"}`}
              >
                <div className="px-4 py-4 sm:px-5">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Membri
                  </p>
                  <p
                    className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {members.length}
                  </p>
                </div>

                <div
                  className={`px-4 py-4 sm:px-5 ${isDark ? "border-x border-white/[0.08]" : "border-x border-zinc-900/[0.08]"}`}
                >
                  <p
                    className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Totale
                  </p>
                  <p
                    className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {totalLifetime.toLocaleString("it-IT")}
                  </p>
                </div>

                <div className="px-4 py-4 sm:px-5">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Posizione
                  </p>
                  <p
                    className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {currentUserPosition ? `#${currentUserPosition}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-5 max-w-3xl">
          <article className={`rounded-[1.7rem] border p-5 ${theme.surface}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-bold ${theme.primaryText}`}>
                  Obiettivo settimanale
                </p>
                <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                  Mancano {Math.max(0, weeklyGoal - totalWeekly)} registrazioni
                  al traguardo.
                </p>
              </div>

              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/15 text-amber-500">
                <Flame className="h-5 w-5" strokeWidth={2.3} />
              </span>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <span
                  className={`text-3xl font-black tracking-[-0.06em] ${theme.primaryText}`}
                >
                  {totalWeekly}
                </span>
                <span className={`ml-2 text-sm font-bold ${theme.muted}`}>
                  / {weeklyGoal}
                </span>
              </div>

              <span className="text-sm font-extrabold text-pink-500">
                {weeklyProgress}%
              </span>
            </div>

            <div
              className={`mt-3 h-2.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"}`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${weeklyProgress}%` }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.55,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-pink-500"
              />
            </div>
          </article>
        </section>

        <section className="mx-auto mt-7 max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
              >
                La classifica
              </h2>
            </div>

            <div className={`flex rounded-xl border p-1 ${theme.softSurface}`}>
              <button
                type="button"
                onClick={() => setRankingMode("week")}
                aria-pressed={rankingMode === "week"}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  rankingMode === "week"
                    ? isDark
                      ? "bg-zinc-100 text-zinc-950 shadow-sm"
                      : "bg-zinc-900 text-white shadow-sm"
                    : theme.muted
                }`}
              >
                Settimana
              </button>

              <button
                type="button"
                onClick={() => setRankingMode("all")}
                aria-pressed={rankingMode === "all"}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  rankingMode === "all"
                    ? isDark
                      ? "bg-zinc-100 text-zinc-950 shadow-sm"
                      : "bg-zinc-900 text-white shadow-sm"
                    : theme.muted
                }`}
              >
                Storico
              </button>
            </div>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-[1.75rem] border ${theme.surface}`}
          >
            {ranking.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Trophy
                  className={`mx-auto h-7 w-7 ${theme.subtle}`}
                  strokeWidth={1.8}
                />

                <p className={`mt-3 text-sm font-bold ${theme.primaryText}`}>
                  Nessun punteggio disponibile
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Le registrazioni della squadra appariranno qui.
                </p>
              </div>
            ) : (
              ranking.map((member, index) => {
                const position = index + 1;
                const isCurrentUser = member.user_id === user?.id;

                const membership = members.find(
                  (item) => item.user_id === member.user_id,
                );

                const isOwner = membership?.role === "owner";

                const avatarGradient =
                  member.avatar || getAvatarGradient(member.user_id);

                const metric =
                  rankingMode === "week"
                    ? Number(member.weekly_total || 0)
                    : Number(member.lifetime_total || 0);

                return (
                  <motion.button
                    layout
                    key={member.user_id}
                    type="button"
                    onClick={() => setSelectedMember(member.user_id)}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            layout: {
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            },
                            delay: index * 0.04,
                            duration: 0.24,
                          }
                    }
                    className={`flex min-h-[76px] w-full items-center gap-3 px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                      isCurrentUser
                        ? isDark
                          ? "bg-pink-500/[0.10]"
                          : "bg-pink-500/[0.07]"
                        : isDark
                          ? "hover:bg-white/[0.045]"
                          : "hover:bg-zinc-900/[0.035]"
                    } ${index !== ranking.length - 1 ? (isDark ? "border-b border-white/[0.07]" : "border-b border-zinc-900/[0.07]") : ""}`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-xs font-black ${getRankStyle(position, isDark)}`}
                    >
                      {position === 1 ? (
                        <Crown className="h-4 w-4" strokeWidth={2.2} />
                      ) : position === 2 || position === 3 ? (
                        <Medal className="h-4 w-4" strokeWidth={2.2} />
                      ) : (
                        position
                      )}
                    </span>

                    <div className="relative shrink-0">
                      <div
                        className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${avatarGradient} text-xs font-black text-white`}
                      >
                        {getInitials(member.display_name)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate text-sm font-extrabold ${theme.primaryText}`}
                        >
                          {member.display_name}
                        </span>
                        {isCurrentUser && (
                          <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
                            TU
                          </span>
                        )}

                        {isOwner && (
                          <Crown
                            className="h-3.5 w-3.5 text-amber-500"
                            strokeWidth={2.4}
                            aria-label="Proprietario della squadra"
                          />
                        )}
                      </div>

                      <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                        {rankingMode === "week" ? (
                          <>
                            Storico:{" "}
                            {Number(member.lifetime_total || 0).toLocaleString(
                              "it-IT",
                            )}
                          </>
                        ) : (
                          <>
                            Settimana:{" "}
                            {Number(member.weekly_total || 0).toLocaleString(
                              "it-IT",
                            )}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p
                          className={`text-lg font-black leading-none tracking-tight ${theme.primaryText}`}
                        >
                          {metric.toLocaleString("it-IT")}
                        </p>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 ${theme.subtle}`}
                        strokeWidth={2.2}
                      />
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
              >
                Attività recente
              </h2>
            </div>

            <span className="flex items-center gap-1.5 pb-1 text-xs font-bold text-emerald-500">
              <Wifi className="h-4 w-4" strokeWidth={2.2} />
              Live
            </span>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-[1.75rem] border ${theme.surface}`}
          >
            {visibleActivities.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Activity
                  className={`mx-auto h-7 w-7 ${theme.subtle}`}
                  strokeWidth={1.8}
                />

                <p className={`mt-3 text-sm font-bold ${theme.primaryText}`}>
                  Nessuna attività recente
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Le azioni della squadra appariranno qui.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {visibleActivities.map((item, index) => {
                  const ActivityIcon = getActivityIcon(item.activity_type);

                  const avatarGradient = getAvatarGradient(
                    String(item.user_id || item.id || ""),
                  );

                  const activityText = getActivityText(item);

                  return (
                    <motion.article
                      layout
                      key={
                        item.id || `${item.activity_type}-${item.created_at}`
                      }
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, y: -8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, height: 0 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.25,
                      }}
                      className={`relative flex gap-3 px-4 py-4 ${
                        index !== visibleActivities.length - 1
                          ? isDark
                            ? "border-b border-white/[0.07]"
                            : "border-b border-zinc-900/[0.07]"
                          : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${avatarGradient} text-[11px] font-black text-white`}
                        >
                          {getInitials(item.display_name || "Utente")}
                        </div>

                        <span
                          className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg ${getActivityStyle(
                            item.activity_type,
                            isDark,
                          )}`}
                        >
                          <ActivityIcon className="h-3 w-3" strokeWidth={2.6} />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${theme.primaryText}`}
                        >
                          {activityText}
                        </p>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${theme.subtle}`}
                          >
                            {formatActivityTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            )}

            {activity.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllActivities((current) => !current)}
                className={`flex min-h-14 w-full items-center justify-center gap-2 border-t text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                  isDark
                    ? "border-white/[0.07] hover:bg-white/[0.045]"
                    : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.035]"
                } ${theme.primaryText}`}
              >
                {showAllActivities
                  ? "Mostra meno"
                  : `Carica altre ${activity.length - 3} attività`}

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAllActivities ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.4}
                />
              </button>
            )}
          </div>
        </section>
      </main>

      <BottomNav />

      <AnimatePresence>
        {selectedData && (
          <ModalShell
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
            onClose={() => setSelectedMember(null)}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-[1.3rem] bg-gradient-to-br ${
                      selectedData.avatar ||
                      getAvatarGradient(selectedData.user_id)
                    } text-sm font-black text-white`}
                  >
                    {getInitials(selectedData.display_name || "Utente")}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`truncate text-xl font-black tracking-tight ${theme.primaryText}`}
                      >
                        {selectedData.display_name || "Utente"}
                      </h2>

                      {selectedData.user_id === user?.id && (
                        <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
                          TU
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
                      {selectedMembership?.role === "owner"
                        ? "Proprietario"
                        : "Membro"}{" "}
                      · posizione #{selectedPosition || "-"}
                    </p>
                  </div>
                </div>

                <CloseButton
                  onClick={() => setSelectedMember(null)}
                  theme={theme}
                  isDark={isDark}
                />
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                <div className={`rounded-2xl border p-3 ${theme.softSurface}`}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                  >
                    Posizione
                  </p>

                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    #{selectedPosition || "-"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${theme.softSurface}`}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                  >
                    Settimana
                  </p>

                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {Number(selectedData.weekly_total || 0).toLocaleString(
                      "it-IT",
                    )}
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${theme.softSurface}`}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                  >
                    Storico
                  </p>

                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {Number(selectedData.lifetime_total || 0).toLocaleString(
                      "it-IT",
                    )}
                  </p>
                </div>
              </div>

              <div
                className={`mt-5 rounded-2xl border p-4 ${theme.softSurface}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-bold ${theme.primaryText}`}>
                    Contributo settimanale
                  </p>

                  <span className="text-sm font-black text-pink-500">
                    {Number(selectedData.weekly_total || 0).toLocaleString(
                      "it-IT",
                    )}
                  </span>
                </div>

                <div
                  className={`mt-3 h-2 overflow-hidden rounded-full ${
                    isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"
                  }`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        totalWeekly > 0
                          ? Math.min(
                              100,
                              (Number(selectedData.weekly_total || 0) /
                                totalWeekly) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.5,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-pink-500"
                  />
                </div>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inviteOpen && (
          <ModalShell
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
            onClose={() => setInviteOpen(false)}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    {team?.team_name || "Squadra"}
                  </p>
                  <h2
                    className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    Porta qualcuno nel team.
                  </h2>
                </div>

                <CloseButton
                  onClick={() => setInviteOpen(false)}
                  theme={theme}
                  isDark={isDark}
                />
              </div>

              <div
                className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className={`text-[11px] font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
                    >
                      Codice squadra
                    </p>
                    <p
                      className={`mt-2 font-mono text-2xl font-black tracking-[0.12em] ${theme.primaryText}`}
                    >
                      {inviteCode}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyInvite}
                    aria-label="Copia link invito"
                    className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${theme.secondary} ${theme.focusOffset}`}
                  >
                    {copied ? (
                      <Check
                        className="h-5 w-5 text-emerald-500"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Copy className="h-5 w-5" strokeWidth={2.2} />
                    )}
                  </button>
                </div>

                <p
                  className={`mt-4 text-xs font-medium leading-relaxed ${theme.muted}`}
                >
                  Condividi il codice oppure copia il link completo per invitare
                  nuovi membri.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyInvite}
                  className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${theme.secondary} ${theme.focusOffset}`}
                >
                  {copied ? (
                    <>
                      <Check
                        className="h-4 w-4 text-emerald-500"
                        strokeWidth={2.5}
                      />
                      Link copiato
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" strokeWidth={2.2} />
                      Copia invito
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={shareInvite}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(236,72,153,0.20)] transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <Share2 className="h-4 w-4" strokeWidth={2.3} />
                  Condividi
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <ModalShell
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
            onClose={() => setSettingsOpen(false)}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Gestione squadra
                  </p>
                  <h2
                    className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {team?.team_name || "Squadra"}
                  </h2>
                </div>

                <CloseButton
                  onClick={() => setSettingsOpen(false)}
                  theme={theme}
                  isDark={isDark}
                />
              </div>

              <div
                className={`mt-7 overflow-hidden rounded-[1.4rem] border ${theme.softSurface}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setEditOpen(true);
                  }}
                  className={`flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                    isDark
                      ? "hover:bg-white/[0.05]"
                      : "hover:bg-zinc-900/[0.04]"
                  } ${theme.primaryText}`}
                >
                  Modifica identità della squadra
                  <ChevronRight
                    className={`h-4 w-4 ${theme.subtle}`}
                    strokeWidth={2.2}
                  />
                </button>
                <button
                  type="button"
                  className={`flex min-h-14 w-full items-center justify-between border-t px-4 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                    isDark
                      ? "border-white/[0.07] hover:bg-white/[0.05]"
                      : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.04]"
                  } ${theme.primaryText}`}
                  onClick={() => {
                    setSettingsOpen(false);
                    setMembersOpen(true);
                  }}
                >
                  Gestisci membri
                  <ChevronRight
                    className={`h-4 w-4 ${theme.subtle}`}
                    strokeWidth={2.2}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateInvite}
                  className={`flex min-h-14 w-full items-center justify-between border-t px-4 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                    isDark
                      ? "border-white/[0.07] hover:bg-white/[0.05]"
                      : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.04]"
                  } ${theme.primaryText}`}
                >
                  Rigenera codice invito
                  <ChevronRight
                    className={`h-4 w-4 ${theme.subtle}`}
                    strokeWidth={2.2}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleLeaveTeam}
                disabled={leaving}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {leaving ? "Uscita in corso..." : "Abbandona squadra"}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {membersOpen && (
          <ModalShell
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
            onClose={() => setMembersOpen(false)}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Gestione squadra
                  </p>

                  <h2
                    className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    Membri e ruoli ({members.length})
                  </h2>
                </div>

                <CloseButton
                  onClick={() => setMembersOpen(false)}
                  theme={theme}
                  isDark={isDark}
                />
              </div>

              <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {members.map((member) => {
                  const isOwner = member.role === "owner";
                  const isCurrentUser = member.user_id === user?.id;

                  const leaderboardData = leaderboard.find(
                    (item) => item.user_id === member.user_id,
                  );

                  return (
                    <div
                      key={member.user_id}
                      className={`rounded-2xl border p-4 ${theme.softSurface}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                            member.user_id,
                          )} text-xs font-black text-white`}
                        >
                          {getInitials(member.display_name || "Utente")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`truncate font-extrabold ${theme.primaryText}`}
                            >
                              {member.display_name || "Utente"}
                            </p>

                            {isCurrentUser && (
                              <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
                                TU
                              </span>
                            )}

                            {isOwner && (
                              <Crown
                                className="h-4 w-4 text-amber-500"
                                strokeWidth={2.4}
                              />
                            )}
                          </div>

                          <p className={`text-xs ${theme.muted}`}>
                            {isOwner ? "Proprietario" : "Membro"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`font-black ${theme.primaryText}`}>
                            {Number(
                              leaderboardData?.lifetime_total || 0,
                            ).toLocaleString("it-IT")}
                          </p>

                          <p className={`text-xs ${theme.muted}`}>storico</p>
                        </div>
                      </div>

                      {team?.role === "owner" && !isCurrentUser && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleTransferOwnership(member)}
                            className={`min-h-11 rounded-xl border text-xs font-bold ${theme.secondary}`}
                          >
                            Rendi proprietario
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="min-h-11 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500"
                          >
                            Rimuovi
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editOpen && (
          <EditTeamModal
            open={editOpen}
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
        )}
      </AnimatePresence>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
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
    </div>
  );
}

function CloseButton({ onClick, theme, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chiudi pannello"
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${theme.secondary} ${
        isDark
          ? "focus-visible:ring-offset-[#17171b]"
          : "focus-visible:ring-offset-[#fdfbf9]"
      }`}
    >
      <X className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}

function ModalShell({ children, onClose, theme, prefersReducedMotion }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-3 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-lg overflow-hidden rounded-[2rem] border shadow-2xl ${theme.sheet}`}
        initial={
          prefersReducedMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 20, scale: 0.98 }
        }
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          duration: prefersReducedMotion ? 0 : undefined,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmText,
  onConfirm,
  theme,
  isDanger = false,
  prefersReducedMotion,
}) {
  const [loading, setLoading] = useState(false);

  function handleClose() {
    if (!loading) {
      onClose();
    }
  }
  if (!open) return null;

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={handleClose}
    >
      <div className="p-6">
        <div
          className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${
            isDanger
              ? "bg-rose-500/10 text-rose-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          <AlertTriangle className="h-6 w-6" strokeWidth={2.4} />
        </div>
        <h2 className={`text-xl font-black ${theme.primaryText}`}>{title}</h2>

        <p className={`mt-3 text-sm leading-relaxed ${theme.muted}`}>
          {description}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className={`flex-1 rounded-2xl border py-3 text-sm font-bold ${
              theme.secondary
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Annulla
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              if (!onConfirm || loading) return;

              try {
                setLoading(true);
                await onConfirm();
                onClose();
              } catch (error) {
                console.error(error);

                toast.error(
                  error?.message || "Impossibile completare l’operazione",
                );
              } finally {
                setLoading(false);
              }
            }}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white ${
              isDanger ? "bg-rose-500" : "bg-pink-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Attendere..." : confirmText}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function EditTeamModal({
  onClose,
  team,
  theme,
  isDark,
  prefersReducedMotion,
  onSaved,
}) {
  const [name, setName] = useState(team?.team_name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [emoji, setEmoji] = useState(team?.avatar_emoji || "🏆");
  const [saving, setSaving] = useState(false);

  const originalName = (team?.team_name || "").trim();
  const originalDescription = (team?.description || "").trim();
  const originalEmoji = team?.avatar_emoji || "🏆";

  const hasChanges =
    name.trim() !== originalName ||
    description.trim() !== originalDescription ||
    emoji !== originalEmoji;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Inserisci un nome squadra");
      return;
    }
    try {
      setSaving(true);

      await updateTeam({
        name: name.trim(),
        description: description.trim(),
        avatarEmoji: emoji,
      });

      if (onSaved) {
        await onSaved();
      }

      toast.success("Squadra aggiornata");

      onClose();
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Impossibile aggiornare la squadra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Personalizzazione
            </p>

            <h2 className={`mt-1 text-2xl font-black ${theme.primaryText}`}>
              Identità squadra
            </h2>
          </div>

          <CloseButton
            onClick={() => {
              if (!saving) {
                onClose();
              }
            }}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <div
          className={`mt-6 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-500 text-3xl">
              {emoji}
            </div>

            <div>
              <h3 className={`font-black ${theme.primaryText}`}>
                {name || "Nome squadra"}
              </h3>

              <p className={`mt-1 text-sm leading-relaxed ${theme.muted}`}>
                {description || "Anteprima descrizione"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className={`block text-sm font-bold ${theme.primaryText}`}>
            Nome squadra
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 ${theme.input}`}
          />
        </div>

        <div className="mt-5">
          <label className={`block text-sm font-bold ${theme.primaryText}`}>
            Descrizione
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={160}
            className={`mt-2 w-full resize-none rounded-2xl border px-4 py-3 ${theme.input}`}
          />
          <div className="mt-2 flex justify-end">
            <span className={`text-xs ${theme.subtle}`}>
              {description.length}/160
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className={`text-sm font-bold ${theme.primaryText}`}>
            Avatar squadra
          </p>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {TEAM_EMOJIS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmoji(item)}
                className={`h-12 rounded-2xl border text-2xl ${
                  emoji === item
                    ? "border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/20"
                    : ""
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            type="button"
            disabled={saving}
            className={`flex-1 rounded-2xl border py-3 text-sm font-bold ${theme.secondary}`}
          >
            Annulla
          </button> 

          <button
            onClick={handleSave}
            type="button"
            disabled={saving || !hasChanges}
            className="flex-1 rounded-2xl bg-pink-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
