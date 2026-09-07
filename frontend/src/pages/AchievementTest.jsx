import { useMemo, useState } from "react";
import {
  Award,
  Check,
  ChevronRight,
  Flame,
  LockKeyhole,
  Sparkles,
  Sun,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";
import { useTheme } from "../hooks/useTheme";

const personalAchievements = [
  {
    id: "steady",
    title: "Costante, non perfetto",
    description: "Registra attività per 14 giorni consecutivi.",
    rarity: "Raro",
    xp: 250,
    progress: 12,
    target: 14,
    unlocked: false,
    accent: "amber",
    icon: Flame,
    note: "Sei a due giorni dal record. Il filo tiene.",
  },
  {
    id: "first-step",
    title: "Primo timbro",
    description: "Registra la tua prima attività.",
    rarity: "Comune",
    xp: 50,
    progress: 1,
    target: 1,
    unlocked: true,
    accent: "pink",
    icon: Check,
    unlockedAt: "12 gennaio 2026",
    note: "Ogni archivio inizia da un gesto minuscolo.",
  },
  {
    id: "hundred",
    title: "Tripla cifra",
    description: "Raggiungi 100 registrazioni totali.",
    rarity: "Raro",
    xp: 200,
    progress: 100,
    target: 100,
    unlocked: true,
    accent: "pink",
    icon: Award,
    unlockedAt: "18 maggio 2026",
    note: "Cento. Ormai non è più un caso.",
  },
  {
    id: "morning",
    title: "Mattiniero sospetto",
    description: "Registra 20 attività prima delle 10:00.",
    rarity: "Non comune",
    xp: 150,
    progress: 16,
    target: 20,
    unlocked: false,
    accent: "amber",
    icon: Sun,
    note: "La mattina ti riesce bene. Quasi inquietante.",
  },
  {
    id: "secret-personal",
    title: "???",
    description: "Questo traguardo preferisce non anticiparsi.",
    rarity: "Segreto",
    xp: 300,
    progress: 0,
    target: 1,
    unlocked: false,
    secret: true,
    accent: "zinc",
    icon: LockKeyhole,
    note: "Continua così. Qualcosa prima o poi si farà vivo.",
  },
];

const teamAchievements = [
  {
    id: "team-player",
    title: "Presenza in squadra",
    description: "Contribuisci a 30 attività nella tua squadra.",
    rarity: "Raro",
    xp: 220,
    progress: 30,
    target: 30,
    unlocked: true,
    accent: "emerald",
    icon: UsersRound,
    unlockedAt: "2 agosto 2026",
    note: "Cago Legends ha preso nota del tuo contributo.",
  },
  {
    id: "carry-week",
    title: "Spingi il gruppo",
    description:
      "Contribuisci con 10 attività in una sola settimana di squadra.",
    rarity: "Epico",
    xp: 320,
    progress: 8,
    target: 10,
    unlocked: false,
    accent: "pink",
    icon: Trophy,
    note: "Manca poco: questa settimana puoi trascinare tutti.",
  },
  {
    id: "weekend-gang",
    title: "Weekend operativo",
    description: "La squadra registra attività in quattro weekend consecutivi.",
    rarity: "Epico",
    xp: 350,
    progress: 2,
    target: 4,
    unlocked: false,
    accent: "emerald",
    icon: Sparkles,
    note: "Due weekend su quattro. Il divano sta perdendo voti.",
  },
  {
    id: "team-streak",
    title: "Nessuno molla",
    description:
      "Mantieni almeno una registrazione al giorno in squadra per 21 giorni.",
    rarity: "Raro",
    xp: 260,
    progress: 14,
    target: 21,
    unlocked: false,
    accent: "amber",
    icon: Flame,
    note: "La costanza collettiva ha sempre un certo fascino.",
  },
  {
    id: "secret-team",
    title: "???",
    description: "La squadra non sa ancora di cosa è capace.",
    rarity: "Segreto",
    xp: 400,
    progress: 0,
    target: 1,
    unlocked: false,
    secret: true,
    accent: "zinc",
    icon: LockKeyhole,
    note: "Serve qualcosa di memorabile. O leggermente assurdo.",
  },
];

const filters = ["Tutti", "Ottenuti", "In corso", "Segreti"];

export default function CagometroAchievements() {
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const [section, setSection] = useState("personali");
  const [activeFilter, setActiveFilter] = useState("Tutti");
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [celebration, setCelebration] = useState(false);

  const [unlockedIds, setUnlockedIds] = useState([
    ...personalAchievements
      .filter((item) => item.unlocked)
      .map((item) => item.id),
    ...teamAchievements.filter((item) => item.unlocked).map((item) => item.id),
  ]);

  const baseAchievements =
    section === "personali" ? personalAchievements : teamAchievements;

  const allAchievements = useMemo(
    () =>
      baseAchievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
      })),
    [baseAchievements, unlockedIds],
  );

  const unlocked = allAchievements.filter(
    (achievement) => achievement.unlocked,
  );
  const inProgress = allAchievements.filter(
    (achievement) => !achievement.unlocked && !achievement.secret,
  );

  const filteredAchievements = allAchievements.filter((achievement) => {
    if (activeFilter === "Ottenuti") return achievement.unlocked;
    if (activeFilter === "In corso")
      return !achievement.unlocked && !achievement.secret;
    if (activeFilter === "Segreti") return achievement.secret;
    return true;
  });

  const nextAchievement = inProgress.length
    ? inProgress.reduce((closest, achievement) => {
        const closestRatio = closest.progress / closest.target;
        const currentRatio = achievement.progress / achievement.target;
        return currentRatio > closestRatio ? achievement : closest;
      }, inProgress[0])
    : null;

  const NextAchievementIcon = nextAchievement?.icon;

  const overallProgress = Math.round(
    (unlocked.length / allAchievements.length) * 100,
  );

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "border-white/[0.08] bg-zinc-900/80",
        softSurface: "border-white/[0.07] bg-white/[0.035]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        sheet: "border-white/[0.09] bg-[#17171b]",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "border-zinc-200/80 bg-white/85",
        softSurface: "border-zinc-900/[0.07] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        sheet: "border-zinc-900/[0.09] bg-[#fdfbf9]",
      };

  const accentStyles = {
    pink: {
      solid: "bg-pink-500 text-white",
      soft: "bg-pink-500/10 text-pink-500",
      progress: "bg-pink-500",
      border: "border-pink-500/20",
    },
    amber: {
      solid: "bg-amber-500 text-zinc-950",
      soft: "bg-amber-400/15 text-amber-500",
      progress: "bg-amber-500",
      border: "border-amber-500/20",
    },
    emerald: {
      solid: "bg-emerald-500 text-white",
      soft: "bg-emerald-500/10 text-emerald-500",
      progress: "bg-emerald-500",
      border: "border-emerald-500/20",
    },
    zinc: {
      solid: isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-white",
      soft: isDark
        ? "bg-zinc-800 text-zinc-400"
        : "bg-zinc-900/10 text-zinc-500",
      progress: "bg-zinc-500",
      border: isDark ? "border-white/[0.10]" : "border-zinc-900/[0.10]",
    },
  };

  const switchSection = (nextSection) => {
    setSection(nextSection);
    setActiveFilter("Tutti");
  };

  const unlockAchievement = (achievementId) => {
    setUnlockedIds((current) =>
      current.includes(achievementId) ? current : [...current, achievementId],
    );
    setCelebration(true);

    window.setTimeout(() => {
      setCelebration(false);
    }, 1700);
  };

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="La tua collezione" title="Traguardi" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-3xl">
          <p className={`text-sm font-medium ${theme.muted}`}>
            Dati dimostrativi · archivio diviso per area
          </p>

          <h1
            className={`mt-1 max-w-xl text-[clamp(2.2rem,8vw,4.2rem)] font-black leading-[0.94] tracking-[-0.078em] ${theme.text}`}
          >
            Due bacheche.
            <br />
            <span className="text-pink-500">Un ego ben nutrito.</span>
          </h1>

          <div
            role="group"
            aria-label="Seleziona tipo di traguardi"
            className={`mt-6 grid grid-cols-2 rounded-2xl border p-1.5 ${theme.softSurface}`}
          >
            <button
              type="button"
              onClick={() => switchSection("personali")}
              aria-pressed={section === "personali"}
              className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                section === "personali"
                  ? isDark
                    ? "bg-zinc-100 text-zinc-950 shadow-sm"
                    : "bg-zinc-900 text-white shadow-sm"
                  : theme.muted
              }`}
            >
              Personali
            </button>

            <button
              type="button"
              onClick={() => switchSection("squadra")}
              aria-pressed={section === "squadra"}
              className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                section === "squadra"
                  ? isDark
                    ? "bg-zinc-100 text-zinc-950 shadow-sm"
                    : "bg-zinc-900 text-white shadow-sm"
                  : theme.muted
              }`}
            >
              Squadra
            </button>
          </div>
        </section>

        <AnimatePresence mode="wait">
          <motion.section
            key={section}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
            className={`relative mx-auto mt-6 max-w-3xl overflow-hidden rounded-[2rem] border p-5 sm:p-7 ${theme.surface}`}
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-pink-500/[0.08] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-amber-400/[0.07] blur-3xl" />

            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className={`text-sm font-semibold ${theme.muted}`}>
                  {section === "personali"
                    ? "Traguardi personali ottenuti"
                    : "Traguardi di squadra ottenuti"}
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <motion.output
                    key={`${section}-${unlocked.length}`}
                    aria-live="polite"
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 8, scale: 0.94 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`text-[clamp(4.5rem,17vw,7rem)] font-black leading-none tracking-[-0.10em] ${theme.text}`}
                  >
                    {unlocked.length}
                  </motion.output>

                  <span className={`mb-2 text-lg font-bold ${theme.muted}`}>
                    / {allAchievements.length}
                  </span>
                </div>
              </div>

              <div className="mt-1 text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-2 text-xs font-extrabold text-pink-500">
                  {section === "personali" ? (
                    <Trophy className="h-4 w-4" strokeWidth={2.4} />
                  ) : (
                    <UsersRound className="h-4 w-4" strokeWidth={2.4} />
                  )}
                  {overallProgress}%
                </span>

                <p
                  className={`mt-3 max-w-[130px] text-[11px] font-semibold leading-snug ${theme.subtle}`}
                >
                  {section === "personali"
                    ? "Qui c’è la tua parte più testarda."
                    : "Qui si vede se la squadra regge davvero."}
                </p>
              </div>
            </div>

            <div
              className={`relative mt-8 h-3 overflow-hidden rounded-full ${isDark ? "bg-white/[0.07]" : "bg-zinc-900/[0.07]"}`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${overallProgress}%` }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.65,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-pink-500"
              />
            </div>

            <div className="relative mt-3 flex justify-between">
              <span className={`text-xs font-semibold ${theme.muted}`}>
                {unlocked.length} ottenuti
              </span>
              <span className={`text-xs font-semibold ${theme.muted}`}>
                {allAchievements.length - unlocked.length} da inseguire
              </span>
            </div>
          </motion.section>
        </AnimatePresence>

        {nextAchievement && (
          <section
            className={`mx-auto mt-5 max-w-3xl overflow-hidden rounded-[1.85rem] border ${theme.surface}`}
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] ${accentStyles[nextAchievement.accent].soft}`}
                >
                  {NextAchievementIcon && (
                    <NextAchievementIcon
                      className="h-7 w-7"
                      strokeWidth={2.2}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    {section === "personali"
                      ? "Vicino per te"
                      : "Vicino per la squadra"}
                  </p>
                  <h2
                    className={`mt-1 text-xl font-black tracking-tight ${theme.text}`}
                  >
                    {nextAchievement.title}
                  </h2>
                  <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
                    {nextAchievement.note}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAchievement(nextAchievement)}
                className={`flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.softSurface}`}
              >
                Apri
                <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            <div
              className={`border-t px-5 py-4 sm:px-7 ${isDark ? "border-white/[0.07]" : "border-zinc-900/[0.07]"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs font-bold ${theme.muted}`}>
                  {nextAchievement.progress} di {nextAchievement.target}
                </span>
                <span
                  className={`text-xs font-extrabold ${accentStyles[nextAchievement.accent].soft.split(" ")[1]}`}
                >
                  {Math.round(
                    (nextAchievement.progress / nextAchievement.target) * 100,
                  )}
                  %
                </span>
              </div>

              <div
                className={`mt-2 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/[0.07]" : "bg-zinc-900/[0.07]"}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: `${(nextAchievement.progress / nextAchievement.target) * 100}%`,
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.55 }}
                  className={`h-full rounded-full ${accentStyles[nextAchievement.accent].progress}`}
                />
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold ${theme.muted}`}>
                {section === "personali"
                  ? "Archivio personale"
                  : "Archivio della squadra"}
              </p>
              <h2
                className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.text}`}
              >
                Collezione attiva
              </h2>
            </div>

            <span className={`pb-1 text-xs font-bold ${theme.subtle}`}>
              Tocca per aprire
            </span>
          </div>

          <div
            role="group"
            aria-label="Filtra traguardi"
            className="mt-5 flex gap-2 overflow-x-auto pb-1"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  activeFilter === filter
                    ? "bg-pink-500 text-white shadow-[0_7px_18px_rgba(236,72,153,0.24)]"
                    : `${theme.softSurface} border ${theme.muted}`
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <motion.div layout className="mt-5 grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                const style = accentStyles[achievement.accent];
                const progress = Math.round(
                  (achievement.progress / achievement.target) * 100,
                );

                return (
                  <motion.button
                    layout
                    key={`${section}-${achievement.id}`}
                    type="button"
                    onClick={() => setSelectedAchievement(achievement)}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 12 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.97 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.24,
                      delay: prefersReducedMotion ? 0 : index * 0.04,
                    }}
                    className={`group relative min-h-[172px] overflow-hidden rounded-[1.7rem] border p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.surface} ${
                      achievement.secret ? "opacity-80" : ""
                    }`}
                  >
                    {!achievement.secret && achievement.unlocked && (
                      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-[4rem] bg-pink-500/[0.07]" />
                    )}

                    <div className="relative flex items-start justify-between gap-4">
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-2xl ${achievement.unlocked ? style.solid : style.soft}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.3} />
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${style.border} ${style.soft.split(" ")[1]}`}
                      >
                        {achievement.rarity}
                      </span>
                    </div>

                    <div className="relative mt-5">
                      <h3
                        className={`text-lg font-black tracking-tight ${theme.text}`}
                      >
                        {achievement.title}
                      </h3>

                      <p
                        className={`mt-1 line-clamp-2 text-xs font-medium leading-relaxed ${theme.muted}`}
                      >
                        {achievement.secret
                          ? "Qualcosa è nascosto qui. Nessuno vuole rovinare la sorpresa."
                          : achievement.description}
                      </p>
                    </div>

                    {achievement.unlocked ? (
                      <div className="relative mt-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-500">
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                          Ottenuto
                        </span>
                        <span className={`text-xs font-black ${theme.text}`}>
                          +{achievement.xp} XP
                        </span>
                      </div>
                    ) : (
                      <div className="relative mt-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${theme.muted}`}>
                            {achievement.secret
                              ? "Segreto"
                              : `${achievement.progress} / ${achievement.target}`}
                          </span>
                          {!achievement.secret && (
                            <span
                              className={`text-xs font-extrabold ${style.soft.split(" ")[1]}`}
                            >
                              {progress}%
                            </span>
                          )}
                        </div>

                        {!achievement.secret && (
                          <div
                            className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.07]" : "bg-zinc-900/[0.07]"}`}
                          >
                            <motion.div
                              initial={false}
                              animate={{ width: `${progress}%` }}
                              transition={{
                                duration: prefersReducedMotion ? 0 : 0.45,
                              }}
                              className={`h-full rounded-full ${style.progress}`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>

      <BottomNav />

      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedAchievement(null);
              }
            }}
          >
            <AchievementDetail
              achievement={selectedAchievement}
              isUnlocked={unlockedIds.includes(selectedAchievement.id)}
              isDark={isDark}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setSelectedAchievement(null)}
              onUnlock={() => {
                unlockAchievement(selectedAchievement.id);
                setSelectedAchievement(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebration && !prefersReducedMotion && (
          <motion.div
            aria-live="polite"
            className="pointer-events-none fixed inset-0 z-[60] grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <motion.span
                key={item}
                initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.2,
                  x: Math.cos((item * Math.PI) / 4) * 150,
                  y: Math.sin((item * Math.PI) / 4) * 150,
                }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className={`absolute h-3 w-3 rounded-full ${
                  item % 2 === 0 ? "bg-pink-400" : "bg-amber-400"
                }`}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="rounded-2xl bg-pink-500 px-5 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(236,72,153,0.32)]"
            >
              Traguardo sbloccato
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementDetail({
  achievement,
  isUnlocked,
  isDark,
  theme,
  prefersReducedMotion,
  onClose,
  onUnlock,
}) {
  const Icon = achievement.icon;
  const progress = Math.round(
    (achievement.progress / achievement.target) * 100,
  );

  const styles = {
    pink: {
      solid: "bg-pink-500 text-white",
      soft: "bg-pink-500/10 text-pink-500",
      progress: "bg-pink-500",
    },
    amber: {
      solid: "bg-amber-500 text-zinc-950",
      soft: "bg-amber-400/15 text-amber-500",
      progress: "bg-amber-500",
    },
    emerald: {
      solid: "bg-emerald-500 text-white",
      soft: "bg-emerald-500/10 text-emerald-500",
      progress: "bg-emerald-500",
    },
    zinc: {
      solid: isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-white",
      soft: isDark
        ? "bg-zinc-800 text-zinc-400"
        : "bg-zinc-900/10 text-zinc-500",
      progress: "bg-zinc-500",
    },
  };

  const accent = styles[achievement.accent];
  const canDemoUnlock =
    !isUnlocked &&
    !achievement.secret &&
    ["steady", "carry-week"].includes(achievement.id);

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
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
      className={`w-full max-w-md overflow-hidden rounded-[2rem] border shadow-2xl ${theme.sheet}`}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div
            className={`grid h-16 w-16 place-items-center rounded-[1.4rem] ${isUnlocked ? accent.solid : accent.soft}`}
          >
            <Icon className="h-8 w-8" strokeWidth={2.2} />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi dettaglio traguardo"
            className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.softSurface}`}
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <p
          className={`mt-7 text-xs font-bold uppercase tracking-[0.13em] ${theme.subtle}`}
        >
          {achievement.rarity}
        </p>

        <h2
          id="achievement-title"
          className={`mt-2 text-3xl font-black tracking-[-0.06em] ${theme.text}`}
        >
          {achievement.title}
        </h2>

        <p
          className={`mt-3 text-sm font-medium leading-relaxed ${theme.muted}`}
        >
          {achievement.secret
            ? "Il requisito verrà rivelato solo quando i dati decideranno che te lo sei meritato."
            : achievement.description}
        </p>

        {isUnlocked ? (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm font-extrabold text-emerald-500">
                <Check className="h-5 w-5" strokeWidth={2.5} />
                Traguardo ottenuto
              </span>

              <span className={`text-sm font-black ${theme.text}`}>
                +{achievement.xp} XP
              </span>
            </div>

            <p className={`mt-4 text-xs font-semibold ${theme.muted}`}>
              Sbloccato il {achievement.unlockedAt}.
            </p>
          </div>
        ) : !achievement.secret ? (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${theme.text}`}>
                Progresso attuale
              </span>
              <span
                className={`text-sm font-black ${accent.soft.split(" ")[1]}`}
              >
                {achievement.progress} / {achievement.target}
              </span>
            </div>

            <div
              className={`mt-4 h-2.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"}`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.55 }}
                className={`h-full rounded-full ${accent.progress}`}
              />
            </div>

            <p
              className={`mt-4 text-xs font-semibold leading-relaxed ${theme.muted}`}
            >
              {achievement.note}
            </p>
          </div>
        ) : (
          <div
            className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
          >
            <LockKeyhole
              className={`h-6 w-6 ${theme.muted}`}
              strokeWidth={2.2}
            />
            <p
              className={`mt-4 text-sm font-semibold leading-relaxed ${theme.muted}`}
            >
              {achievement.note}
            </p>
          </div>
        )}

        {canDemoUnlock && (
          <button
            type="button"
            onClick={onUnlock}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
          >
            <Sparkles className="h-5 w-5" strokeWidth={2.4} />
            Simula sblocco
          </button>
        )}
      </div>
    </motion.section>
  );
}
