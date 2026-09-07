import { useState } from "react";
import {
  Activity,
  Award,
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
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useTheme } from "../hooks/useTheme";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";

const members = [
  {
    id: "ludovica",
    name: "Ludovica",
    initials: "LU",
    rank: 1,
    today: 6,
    weekly: 31,
    xp: 2840,
    streak: 19,
    role: "Capitana",
    online: true,
    avatar: "from-violet-400 to-fuchsia-500",
  },
  {
    id: "matteo",
    name: "Matteo",
    initials: "ME",
    rank: 2,
    today: 4,
    weekly: 27,
    xp: 2410,
    streak: 12,
    role: "Tu",
    online: true,
    avatar: "from-amber-200 to-pink-400",
  },
  {
    id: "simone",
    name: "Simone",
    initials: "SI",
    rank: 3,
    today: 3,
    weekly: 24,
    xp: 2190,
    streak: 8,
    role: "Membro",
    online: false,
    avatar: "from-sky-400 to-blue-600",
  },
  {
    id: "valentina",
    name: "Valentina",
    initials: "VA",
    rank: 4,
    today: 2,
    weekly: 18,
    xp: 1760,
    streak: 5,
    role: "Membro",
    online: true,
    avatar: "from-emerald-300 to-teal-500",
  },
  {
    id: "nicolo",
    name: "Nicolò",
    initials: "NI",
    rank: 5,
    today: 1,
    weekly: 15,
    xp: 1430,
    streak: 3,
    role: "Nuovo",
    online: false,
    avatar: "from-orange-300 to-rose-500",
  },
];

const activities = [
  {
    id: 1,
    memberId: "ludovica",
    action: "ha raggiunto una streak di 19 giorni",
    time: "2 min fa",
    type: "streak",
    fresh: true,
  },
  {
    id: 2,
    memberId: "matteo",
    action: "ha aggiunto una registrazione",
    time: "18 min fa",
    type: "log",
    fresh: false,
  },
  {
    id: 3,
    memberId: "simone",
    action: "ha superato Valentina in classifica",
    time: "42 min fa",
    type: "rank",
    fresh: false,
  },
  {
    id: 4,
    memberId: "valentina",
    action: "ha sbloccato il badge Costante",
    time: "1 h fa",
    type: "badge",
    fresh: false,
  },
  {
    id: 5,
    memberId: "nicolo",
    action: "si è unito alla squadra",
    time: "ieri, 19:32",
    type: "joined",
    fresh: false,
  },
  {
    id: 6,
    memberId: "ludovica",
    action: "ha portato la squadra al livello 14",
    time: "ieri, 18:09",
    type: "level",
    fresh: false,
  },
];

const getMember = (memberId) =>
  members.find((member) => member.id === memberId);

const getActivityIcon = (type) => {
  const icons = {
    streak: Flame,
    log: Plus,
    rank: Trophy,
    badge: Award,
    joined: UserPlus,
    level: Sparkles,
  };

  return icons[type] || Activity;
};

const getActivityStyle = (type, isDark) => {
  const styles = {
    streak: isDark
      ? "bg-amber-400/15 text-amber-400"
      : "bg-amber-400/15 text-amber-700",
    log: isDark
      ? "bg-pink-500/15 text-pink-400"
      : "bg-pink-500/12 text-pink-600",
    rank: isDark
      ? "bg-yellow-300/15 text-yellow-300"
      : "bg-yellow-400/15 text-yellow-700",
    badge: isDark
      ? "bg-pink-500/15 text-pink-400"
      : "bg-pink-500/12 text-pink-600",
    joined: isDark
      ? "bg-emerald-400/15 text-emerald-400"
      : "bg-emerald-500/12 text-emerald-700",
    level: isDark
      ? "bg-violet-400/15 text-violet-300"
      : "bg-violet-500/12 text-violet-700",
  };

  return styles[type] || styles.log;
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

export default function CagometroTeams() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [rankingMode, setRankingMode] = useState("today");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasTeam, setHasTeam] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const visibleActivities = showAllActivities
    ? activities
    : activities.slice(0, 3);

  const selectedData = members.find((member) => member.id === selectedMember);

  const totalWeekly = members.reduce(
    (total, member) => total + member.weekly,
    0,
  );

  const weeklyGoal = 140;
  const weeklyProgress = Math.min(
    100,
    Math.round((totalWeekly / weeklyGoal) * 100),
  );

  const ranking = [...members].sort((a, b) => {
    if (rankingMode === "today") return b.today - a.today;
    return b.weekly - a.weekly;
  });

  const inviteCode = "CAGO-7F9K";
  const inviteLink = "https://cagometro.app/invita/CAGO-7F9K";

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
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      // Nel prototipo è sufficiente simulare il successo anche senza Clipboard API.
    }

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2200);
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Unisciti ai Cago Legends",
          text: "Entra nella mia squadra su Cagometro.",
          url: inviteLink,
        });
        return;
      } catch {
        // Se l'utente annulla la condivisione, non serve mostrare un errore.
      }
    }

    copyInvite();
  };

  const createTeam = () => {
    setHasTeam(true);
    setJoinOpen(false);
  };

  const joinTeam = () => {
    if (!joinCode.trim()) return;

    setHasTeam(true);
    setJoinOpen(false);
    setJoinCode("");
  };

  if (!hasTeam) {
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
                  onClick={createTeam}
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
                  onClick={joinTeam}
                  disabled={!joinCode.trim()}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <UsersRound className="h-5 w-5" strokeWidth={2.3} />
                  Entra nella squadra
                </button>
              </div>
            </ModalShell>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Squadra attiva" title="Cago Legends" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section
          className={`relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border p-5 sm:p-7 ${theme.surface}`}
        >
          <div className="pointer-events-none absolute -right-12 -top-10 h-48 w-48 rounded-full bg-pink-500/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-12 h-36 w-36 rounded-full bg-amber-400/[0.07] blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-pink-500 text-3xl shadow-[0_10px_28px_rgba(236,72,153,0.28)]">
                💩
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className={`text-[clamp(1.5rem,5vw,2.25rem)] font-black tracking-[-0.055em] ${theme.primaryText}`}
                  >
                    Cago Legends
                  </h1>
                  <span className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-1 text-[11px] font-extrabold text-pink-500">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                    ADMIN
                  </span>
                </div>

                <p
                  className={`mt-1 max-w-md text-sm font-medium ${theme.muted}`}
                >
                  Pochi membri, zero vergogna, numeri memorabili.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              aria-label="Invita un membro"
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Invita</span>
            </button>
          </div>

          <div
            className={`relative mt-6 grid grid-cols-3 border-t pt-5 ${isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"}`}
          >
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
              >
                Membri
              </p>
              <p
                className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
              >
                5
              </p>
            </div>

            <div
              className={`border-x px-4 ${isDark ? "border-white/[0.08]" : "border-zinc-900/[0.08]"}`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
              >
                Livello
              </p>
              <p
                className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
              >
                {members.length}
              </p>
            </div>

            <div className="pl-4">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
              >
                La tua posizione
              </p>
              <p
                className={`mt-1 text-xl font-black tracking-tight ${theme.primaryText}`}
              >
                #2
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-5 grid max-w-3xl gap-4 md:grid-cols-[1.15fr_0.85fr]">
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

          <article
            className={`relative overflow-hidden rounded-[1.7rem] border p-5 ${theme.softSurface}`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/[0.08] blur-2xl" />

            <div className="relative flex items-center justify-between">
              <p className={`text-sm font-bold ${theme.primaryText}`}>
                Squadra live
              </p>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/[0.10] px-2.5 py-1 text-[11px] font-bold text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(74,222,128,0.7)]" />
                3 online
              </span>
            </div>

            <div className="relative mt-6 flex items-center">
              {members.slice(0, 4).map((member, index) => (
                <div
                  key={member.id}
                  className={`relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${member.avatar} text-[11px] font-black text-zinc-900 ring-2 ${
                    isDark ? "ring-zinc-900" : "ring-[#f8f5f3]"
                  }`}
                  style={{ marginLeft: index === 0 ? 0 : -9 }}
                >
                  {member.initials}
                  {member.online && (
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-emerald-400 ${isDark ? "border-zinc-900" : "border-[#f8f5f3]"}`}
                    />
                  )}
                </div>
              ))}

              <span className={`ml-3 text-xs font-semibold ${theme.muted}`}>
                Attivi adesso
              </span>
            </div>

            <p
              className={`relative mt-5 text-xs font-medium leading-relaxed ${theme.muted}`}
            >
              Ultimo aggiornamento ricevuto pochi istanti fa.
            </p>
          </article>
        </section>

        <section className="mx-auto mt-7 max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                Gara interna
              </p>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
              >
                La classifica
              </h2>
            </div>

            <div className={`flex rounded-xl border p-1 ${theme.softSurface}`}>
              <button
                type="button"
                onClick={() => setRankingMode("today")}
                aria-pressed={rankingMode === "today"}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  rankingMode === "today"
                    ? isDark
                      ? "bg-zinc-100 text-zinc-950 shadow-sm"
                      : "bg-zinc-900 text-white shadow-sm"
                    : theme.muted
                }`}
              >
                Oggi
              </button>

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
            </div>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-[1.75rem] border ${theme.surface}`}
          >
            {ranking.map((member, index) => {
              const isCurrentUser = member.id === "matteo";
              const position = index + 1;
              const metric =
                rankingMode === "today" ? member.today : member.weekly;

              return (
                <motion.button
                  key={`${rankingMode}-${member.id}`}
                  type="button"
                  onClick={() => setSelectedMember(member.id)}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : index * 0.04,
                    duration: 0.24,
                  }}
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
                      className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${member.avatar} text-xs font-black text-zinc-900`}
                    >
                      {member.initials}
                    </div>

                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                        member.online ? "bg-emerald-400" : "bg-zinc-400"
                      } ${isDark ? "border-zinc-900" : "border-white"}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-extrabold ${theme.primaryText}`}
                      >
                        {member.name}
                      </span>

                      {isCurrentUser && (
                        <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
                          TU
                        </span>
                      )}

                      {member.role === "Capitana" && (
                        <Crown
                          className="h-3.5 w-3.5 text-amber-500"
                          strokeWidth={2.4}
                        />
                      )}
                    </div>

                    <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                      🔥 {member.streak} giorni ·{" "}
                      {member.xp.toLocaleString("it-IT")} XP
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p
                        className={`text-lg font-black leading-none tracking-tight ${theme.primaryText}`}
                      >
                        {metric}
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                      >
                        {rankingMode === "today" ? "oggi" : "sett."}
                      </p>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 ${theme.subtle}`}
                      strokeWidth={2.2}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                Cosa succede
              </p>
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
            <AnimatePresence initial={false}>
              {visibleActivities.map((activity, index) => {
                const member = getMember(activity.memberId);
                const ActivityIcon = getActivityIcon(activity.type);

                return (
                  <motion.article
                    key={activity.id}
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
                      delay:
                        prefersReducedMotion || !activity.fresh
                          ? 0
                          : index * 0.08,
                    }}
                    className={`relative flex gap-3 px-4 py-4 ${
                      activity.fresh
                        ? isDark
                          ? "bg-pink-500/[0.055]"
                          : "bg-pink-500/[0.045]"
                        : ""
                    } ${index !== visibleActivities.length - 1 ? (isDark ? "border-b border-white/[0.07]" : "border-b border-zinc-900/[0.07]") : ""}`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${member.avatar} text-[11px] font-black text-zinc-900`}
                      >
                        {member.initials}
                      </div>

                      <span
                        className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-lg ${getActivityStyle(activity.type, isDark)}`}
                      >
                        <ActivityIcon className="h-3 w-3" strokeWidth={2.6} />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${theme.primaryText}`}
                      >
                        <span className="font-extrabold">{member.name}</span>{" "}
                        <span className={theme.muted}>{activity.action}</span>
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`text-xs font-medium ${theme.subtle}`}>
                          {activity.time}
                        </span>

                        {activity.fresh && (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-pink-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                            Nuovo
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setShowAllActivities((current) => !current)}
              className={`flex min-h-14 w-full items-center justify-center gap-2 border-t text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                isDark
                  ? "border-white/[0.07] hover:bg-white/[0.045]"
                  : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.035]"
              } ${theme.primaryText}`}
            >
              {showAllActivities ? "Mostra meno" : "Carica altre attività"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAllActivities ? "rotate-180" : ""}`}
                strokeWidth={2.4}
              />
            </button>
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
                <div className="flex items-center gap-4">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-[1.3rem] bg-gradient-to-br ${selectedData.avatar} text-sm font-black text-zinc-900`}
                  >
                    {selectedData.initials}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-xl font-black tracking-tight ${theme.primaryText}`}
                      >
                        {selectedData.name}
                      </h2>

                      {selectedData.id === "matteo" && (
                        <span className="rounded-full bg-pink-500/12 px-2 py-0.5 text-[10px] font-extrabold text-pink-500">
                          TU
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
                      {selectedData.role} · posizione #{selectedData.rank}
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
                    Oggi
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {selectedData.today}
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${theme.softSurface}`}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                  >
                    Streak
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {selectedData.streak}
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${theme.softSurface}`}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${theme.subtle}`}
                  >
                    XP
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black tracking-tight ${theme.primaryText}`}
                  >
                    {selectedData.xp.toLocaleString("it-IT")}
                  </p>
                </div>
              </div>

              <div
                className={`mt-5 rounded-2xl border p-4 ${theme.softSurface}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-bold ${theme.primaryText}`}>
                    Settimana corrente
                  </p>
                  <span className="text-sm font-black text-pink-500">
                    {selectedData.weekly} registrazioni
                  </span>
                </div>

                <div
                  className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"}`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (selectedData.weekly / 35) * 100)}%`,
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
                    Cago Legends
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
                  Il link resta valido per 7 giorni. Chi entra parte dal livello
                  1, ma con molto onore.
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
                    Cago Legends
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
                  onClick={() => setInviteOpen(true)}
                  className={`flex min-h-14 w-full items-center justify-between border-t px-4 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                    isDark
                      ? "border-white/[0.07] hover:bg-white/[0.05]"
                      : "border-zinc-900/[0.07] hover:bg-zinc-900/[0.04]"
                  } ${theme.primaryText}`}
                >
                  Mostra codice squadra
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
                >
                  Gestisci membri
                  <ChevronRight
                    className={`h-4 w-4 ${theme.subtle}`}
                    strokeWidth={2.2}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setHasTeam(false);
                }}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-rose-500 transition hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Abbandona squadra
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
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