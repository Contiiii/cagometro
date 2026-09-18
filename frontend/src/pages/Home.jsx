import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import CloudBackupWarning from "../components/CloudBackupWarning";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Card from "../components/ui/Card";
import StreakCard from "../components/home/StreakCard";
import DailyCounter from "../components/home/DailyCounter";
import PoopButton from "../components/home/PoopButton";
import UndoButton from "../components/home/UndoButton";
import MotivationToast from "../components/home/MotivationToast";
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
import { useTeam } from "../hooks/useTeam.js";
import { sendMyPushNotification } from "../services/pushService.js";
import { createAchievementTeamActivities } from "../services/teamService.js";
import { trackEvent } from "../services/analyticsService.js";
import { calculateStreak } from "../utils/stats.js";
import { reportError } from "../utils/reportError.js";
import {
  getPushOptInEligibility,
  hasSeenPushInstallPrompt,
  hasSeenPushOptIn,
  isIosNonStandalone,
  markPushInstallPromptSeen,
  markPushOptInSeen,
} from "../utils/pushOptIn.js";

const AchievementUnlockModal = lazy(
  () => import("../components/achievements/AchievementUnlockModal"),
);
const PushOptInModal = lazy(() => import("../components/PushOptInModal"));
const ReleaseNotesModal = lazy(() => import("../components/ReleaseNotesModal"));

const CURRENT_APP_VERSION = APP_VERSION;

const NOTIFICATION_ALERT_KEYS = [
  "dailyReminder",
  "streakAlerts",
  "achievementAlerts",
  "teamEntryAlerts",
  "teamMemberAlerts",
  "teamAchievementAlerts",
];

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

  const {
    triggerHapticFeedback,
    achievementAlerts,
    streakAlerts,
    updateSetting,
  } = useSettings();

  const {
    isSubscribed: pushSubscribed,
    isSupported: pushSupported,
    permission: pushPermission,
    initialized: pushInitialized,
    subscribe: subscribePush,
    subscribeError: pushSubscribeError,
  } = usePush();

  const { team } = useTeam();

  const { streak, bestStreak } = useStats(entries);

  const [burst, setBurst] = useState(0);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [motivationToast, setMotivationToast] = useState(null);
  const [pushOptInBusy, setPushOptInBusy] = useState(false);
  const [optInSeen, setOptInSeen] = useState(() => hasSeenPushOptIn());
  const [installPromptSeen, setInstallPromptSeen] = useState(() =>
    hasSeenPushInstallPrompt(),
  );
  const [iosNonStandalone] = useState(() => isIosNonStandalone());

  const pushOptInEligibility = useMemo(
    () =>
      getPushOptInEligibility({
        user,
        isSupported: pushSupported,
        initialized: pushInitialized,
        permission: pushPermission,
        isSubscribed: pushSubscribed,
        optInSeen,
        installPromptSeen,
        iosNonStandalone,
      }),
    [
      user,
      pushSupported,
      pushInitialized,
      pushPermission,
      pushSubscribed,
      optInSeen,
      installPromptSeen,
      iosNonStandalone,
    ],
  );

  const pushOptInOpen = pushOptInEligibility.shouldPrompt && !releaseNotesOpen;

  useEffect(() => {
    if (pushOptInOpen) {
      trackEvent("push_optin_shown", { mode: pushOptInEligibility.mode });
    }
  }, [pushOptInOpen, pushOptInEligibility.mode]);

  function closePushOptIn() {
    if (pushOptInEligibility.mode === "install") {
      markPushInstallPromptSeen();
      setInstallPromptSeen(true);
    } else {
      markPushOptInSeen();
      setOptInSeen(true);
    }

    trackEvent("push_optin_dismissed", { mode: pushOptInEligibility.mode });
  }

  async function acceptPushOptIn() {
    if (pushOptInBusy) {
      return;
    }

    setPushOptInBusy(true);

    try {
      const result = await subscribePush();

      // Errore riproponibile: lasciamo il modale aperto per ritentare.
      if (result?.error) {
        return;
      }

      if (result?.subscription) {
        NOTIFICATION_ALERT_KEYS.forEach((key) => updateSetting(key, true));
      }

      markPushOptInSeen();
      setOptInSeen(true);

      trackEvent("push_optin_accepted", {
        permission: result?.permission ?? null,
        subscribed: Boolean(result?.subscription),
      });
    } finally {
      setPushOptInBusy(false);
    }
  }

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

        createAchievementTeamActivities(newAchievements, team?.id, user?.id).then(
          (results) => {
            results.forEach((result) => {
              if (result.status === "rejected") {
                reportError(result.reason, {
                  feature: "home-achievement-team",
                  userId: user?.id ?? null,
                  message: "Errore invio attività squadra (traguardo):",
                });
              }
            });
          },
        );

        if (pushSubscribed && achievementAlerts && newAchievements.length > 0) {
          const achievementNames = newAchievements
            .map((achievement) => achievement.title)
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
            Ogni <span className="text-accent-ink">click</span>
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

      <Suspense fallback={null}>
        <AchievementUnlockModal
          achievement={unlockedAchievement}
          open={!!unlockedAchievement}
          onClose={closeAchievement}
          theme={theme}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Suspense>

      <MotivationToast
        toast={motivationToast}
        onClose={() => setMotivationToast(null)}
        prefersReducedMotion={prefersReducedMotion}
        isDark={isDark}
      />

      <BottomNav />

      <Suspense fallback={null}>
        <ReleaseNotesModal
          open={releaseNotesOpen}
          onClose={closeReleaseNotes}
          notes={RELEASE_NOTES}
          isDark={isDark}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PushOptInModal
          open={pushOptInOpen}
          mode={pushOptInEligibility.mode}
          isBusy={pushOptInBusy}
          error={pushSubscribeError}
          isDark={isDark}
          prefersReducedMotion={prefersReducedMotion}
          onAccept={acceptPushOptIn}
          onClose={closePushOptIn}
        />
      </Suspense>
    </div>
  );
}
