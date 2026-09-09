import { useState } from "react";
import { useReducedMotion } from "framer-motion";

import AchievementUnlockModal from "../components/achievements/AchievementUnlockModal";
import CloudBackupWarning from "../components/CloudBackupWarning.jsx";

import Header from "../components/HeaderTest.jsx";
import BottomNav from "../components/BottomNavTest.jsx";
import StreakCard from "../components/home/StreakCard.jsx";
import DailyCounter from "../components/home/DailyCounter.jsx";
import PoopButton from "../components/home/PoopButton.jsx";
import UndoButton from "../components/home/UndoButton.jsx";

import { useTheme } from "../hooks/useTheme.js";
import { useEntries } from "../hooks/useEntries.js";
import { useStats } from "../hooks/useStats.js";
import { useAchievements } from "../hooks/useAchievements.js";
import { calculateStreak } from "../utils/stats.js";

export default function CagometroHome() {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const { entries, todayCount, incrementToday, decrementToday } = useEntries();

  const {
    unlockedAchievement,
    closeAchievement,
    checkAchievements,
    resetLockedAchievements,
  } = useAchievements();

  const { streak, bestStreak } = useStats(entries);

  const [burst, setBurst] = useState(0);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const registerActivity = async () => {
    if (isRegistering || isUndoing) return;

    try {
      setIsRegistering(true);

      const newEntries = await incrementToday();

      setBurst((current) => current + 1);
      setMessage("Registrazione aggiunta. Missione compiuta.");

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }

      if (newEntries) {
        const total = Object.values(newEntries).reduce(
          (sum, value) => sum + value,
          0,
        );

        const updatedStreak = calculateStreak(newEntries);

        checkAchievements(total, updatedStreak);
      }
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      setMessage("Non è stato possibile salvare la registrazione.");
    } finally {
      setIsRegistering(false);
    }
  };

  const undoActivity = async () => {
    if (todayCount === 0 || isUndoing || isRegistering) return;

    try {
      setIsUndoing(true);

      const newEntries = await decrementToday();

      setMessage("Ultima registrazione annullata.");

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(30);
      }

      const total = Object.values(newEntries).reduce(
        (sum, value) => sum + value,
        0,
      );

      const updatedStreak = calculateStreak(newEntries);

      resetLockedAchievements(total, updatedStreak);
    } catch (error) {
      console.error(
        "Errore durante l'annullamento della registrazione:",
        error,
      );

      setMessage("Non è stato possibile annullare la registrazione.");
    } finally {
      setIsUndoing(false);
    }
  };

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        softSurface: "bg-white/[0.035] border-white/[0.07]",
        muted: "text-zinc-400",
        primaryText: "text-zinc-50",
        secondary:
          "bg-white/[0.055] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]",
        counterRing: "border-white/[0.07]",
        buttonShadow: "shadow-[0_16px_45px_rgba(236,72,153,0.30)]",
        buttonOuter: "border-pink-300/30",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        softSurface: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        muted: "text-zinc-500",
        primaryText: "text-zinc-950",
        secondary:
          "bg-zinc-900/[0.045] border-zinc-900/[0.08] text-zinc-600 hover:bg-zinc-900/[0.08]",
        counterRing: "border-zinc-900/[0.07]",
        buttonShadow: "shadow-[0_16px_45px_rgba(236,72,153,0.28)]",
        buttonOuter: "border-pink-500/20",
      };

  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const displayMessage =
    message ||
    (todayCount === 0
      ? "La giornata è ancora tutta da registrare."
      : "Sei in ritmo. Continua così.");

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Bentornato" title="Cagometro" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-2xl">
          <p className={`mb-2 text-sm font-medium ${theme.muted}`}>
            {displayDate}
          </p>
          <h1
  className={`max-w-md text-[clamp(2rem,7vw,3.6rem)] font-black leading-[0.98] tracking-[-0.065em] ${theme.primaryText}`}
>
  Ogni <span className="text-pink-500">click</span>
  <br />
  racconta una storia.
</h1>


          <CloudBackupWarning />

          <StreakCard streak={streak} bestStreak={bestStreak} theme={theme} />
        </section>

        <section
          className={`relative mx-auto mt-5 max-w-2xl overflow-hidden rounded-[2rem] border p-5 sm:mt-7 sm:p-7 ${theme.surface}`}
        >
          <div className="pointer-events-none absolute -right-12 top-2 h-36 w-36 rounded-full bg-pink-500/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-amber-400/[0.05] blur-3xl" />

          <DailyCounter
            todayCount={todayCount}
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
          />

          <p className={`relative mt-2 text-sm font-medium ${theme.muted}`}>
            {displayMessage}
          </p>

          <div className="relative my-5 h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10" />

          <div className="relative flex flex-col items-center">
            <PoopButton
              onClick={registerActivity}
              burst={burst}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
            />

            <p
              className={`mt-1 text-center text-sm font-semibold ${theme.primaryText}`}
            >
              Tocca per registrare
            </p>
            <p
              className={`mt-1 text-center text-xs font-medium ${theme.muted}`}
            >
              Un tap e la giornata è aggiornata.
            </p>

            <UndoButton
              onClick={undoActivity}
              disabled={todayCount === 0 || isUndoing || isRegistering}
              isUndoing={isUndoing}
              isDark={isDark}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </section>
      </main>


      <AchievementUnlockModal
  achievement={unlockedAchievement}
  open={!!unlockedAchievement}
  onClose={closeAchievement}
  theme={theme}
  prefersReducedMotion={prefersReducedMotion}
/>

      <BottomNav />
    </div>
  );
}
