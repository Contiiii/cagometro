import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import AchievementUnlockModal from "../components/achievements/AchievementUnlockModal";
import CloudBackupWarning from "../components/CloudBackupWarning";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";
import StreakCard from "../components/home/StreakCard";
import DailyCounter from "../components/home/DailyCounter";
import PoopButton from "../components/home/PoopButton";
import UndoButton from "../components/home/UndoButton";
import MotivationToast from "../components/home/MotivationToast";
import ReleaseNotesModal from "../components/ReleaseNotesModal";
import SkeletonBlock from "../components/ui/SkeletonBlock";

import {
  APP_VERSION,
  RELEASE_NOTES,
} from "../config/releaseNotes";

import { pickRandomPhrase } from "../config/motivation";


import { useTheme } from "../hooks/useTheme.js";
import { getTheme } from "../config/theme.js";
import { useAuth } from "../hooks/useAuth.js";
import { useEntries } from "../hooks/useEntries.js";
import { useStats } from "../hooks/useStats.js";
import { useAchievements } from "../hooks/useAchievements.js";
import { useSettings } from "../hooks/useSettings.js";
import { usePush } from "../hooks/usePush.js";
import { sendMyPushNotification } from "../services/pushService.js";
import { calculateStreak } from "../utils/stats.js";
import { reportError } from "../utils/reportError.js";

const CURRENT_APP_VERSION = APP_VERSION;

const HOME_DATE_FORMATTER = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});


export default function Home() {
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const lastSeenVersion = window.localStorage.getItem(
      "cagometro_last_seen_version",
    );

    return lastSeenVersion !== CURRENT_APP_VERSION;
  });

  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const { user } = useAuth();

  const { entries, loading: entriesLoading, todayCount, incrementToday, decrementToday } = useEntries();

  const {
    unlockedAchievement,
    closeAchievement,
    checkAchievements,
    resetLockedAchievements,
  } = useAchievements();

  const { triggerHapticFeedback, achievementAlerts, streakAlerts } = useSettings();

  const { isSubscribed: pushSubscribed } = usePush();

  const { streak, bestStreak } = useStats(entries);

  const [burst, setBurst] = useState(0);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [motivationToast, setMotivationToast] = useState(null);

  const registerActivity = async () => {
    if (isRegistering || isUndoing || entriesLoading) return;

    try {
      setIsRegistering(true);

      const newEntries = await incrementToday();

      setBurst((current) => current + 1);
      setMessage("Registrazione aggiunta. Missione compiuta.");

      setMotivationToast((prev) => ({
        id: (prev?.id ?? 0) + 1,
        phrase: pickRandomPhrase(prev?.phrase),
      }));

      triggerHapticFeedback(50);

      if (newEntries) {
        const total = Object.values(newEntries).reduce(
          (sum, value) => sum + value,
          0,
        );

        const updatedStreak = calculateStreak(newEntries);

        const newAchievements = checkAchievements(total, updatedStreak);

        if (pushSubscribed && achievementAlerts && newAchievements.length > 0) {
          const achievementNames = newAchievements
            .map((achievement) => achievement.name)
            .join(", ");

          sendMyPushNotification({
            type: "achievement",
            title: "Traguardo sbloccato!",
            body: `Hai sbloccato ${achievementNames}.`,
            url: "/achievements",
          }).catch((error) => {
            reportError(error, {
              feature: "home-achievement-push",
              userId: user?.id ?? null,
              message: "Errore invio notifica traguardo:",
            });
          });
        }

        if (pushSubscribed && streakAlerts && updatedStreak > bestStreak) {
          sendMyPushNotification({
            type: "streak",
            title: "Nuovo record di serie!",
            body: `Hai raggiunto una serie di ${updatedStreak} giorni consecutivi.`,
            url: "/",
          }).catch((error) => {
            reportError(error, {
              feature: "home-streak-push",
              userId: user?.id ?? null,
              message: "Errore invio notifica streak:",
            });
          });
        }
      }
    } catch (error) {
      reportError(error, {
        feature: "home-register",
        userId: user?.id ?? null,
        message: "Errore durante la registrazione:",
      });
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

      triggerHapticFeedback(30);

      const total = Object.values(newEntries).reduce(
        (sum, value) => sum + value,
        0,
      );

      const updatedStreak = calculateStreak(newEntries);

      resetLockedAchievements(total, updatedStreak);
    } catch (error) {
      reportError(error, {
        feature: "home-undo",
        userId: user?.id ?? null,
        message: "Errore durante l'annullamento della registrazione:",
      });

      setMessage("Non è stato possibile annullare la registrazione.");
    } finally {
      setIsUndoing(false);
    }
  };

  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const formattedDate = HOME_DATE_FORMATTER.format(new Date());

  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const displayMessage =
    message ||
    (todayCount === 0
      ? "La giornata è ancora tutta da registrare."
      : "Sei in ritmo. Continua così.");

  function closeReleaseNotes() {
    window.localStorage.setItem(
      "cagometro_last_seen_version",
      CURRENT_APP_VERSION,
    );

    setReleaseNotesOpen(false);
  }

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
            Ogni <span className="text-accent">click</span>
            <br />
            racconta una storia.
          </h1>

          <CloudBackupWarning />

          {entriesLoading ? (
            <SkeletonBlock className="mt-6 h-[72px] w-full" />
          ) : (
            <StreakCard streak={streak} bestStreak={bestStreak} theme={theme} />
          )}
        </section>

        <Card
          as="section"
          theme={theme}
          className="mx-auto mt-5 max-w-2xl sm:mt-7"
        >
          <div className="pointer-events-none absolute -right-12 top-2 h-36 w-36 rounded-full bg-accent/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-amber-400/[0.05] blur-3xl" />

          {entriesLoading ? (
            <SkeletonBlock className="h-24 w-full" />
          ) : (
            <DailyCounter
              todayCount={todayCount}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
            />
          )}

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
              disabled={todayCount === 0 || isUndoing || isRegistering || entriesLoading}
              isUndoing={isUndoing}
              isDark={isDark}
              theme={theme}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </Card>
      </main>

      <AchievementUnlockModal
        achievement={unlockedAchievement}
        open={!!unlockedAchievement}
        onClose={closeAchievement}
        theme={theme}
        prefersReducedMotion={prefersReducedMotion}
      />

      <MotivationToast
        toast={motivationToast}
        onClose={() => setMotivationToast(null)}
        prefersReducedMotion={prefersReducedMotion}
        isDark={isDark}
      />

      <BottomNav />

      <ReleaseNotesModal
        open={releaseNotesOpen}
        onClose={closeReleaseNotes}
        notes={RELEASE_NOTES}
        isDark={isDark}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  );
}
