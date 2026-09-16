import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SettingsContext } from "./settings-context";

import { useAuth } from "../hooks/useAuth";

import {
  getMySettings,
  ensureMySettings,
  upsertMySettings,
} from "../services/settingsService";

import {
  DEFAULT_ACCENT,
  VALID_ACCENTS,
  getAccentColor,
  getAccentContrast,
} from "../config/appearance";

import {
  loadPendingOps,
  enqueueOp,
  dequeueOp,
} from "../utils/pendingQueue";

const SETTINGS_STORAGE_KEY = "cagometro_settings";
const SETTINGS_OP_TYPE = "upsertSettings";

const ACCOUNT_SYNC_DEBOUNCE_MS = 800;

const DEFAULT_SETTINGS = {
  confirmationsEnabled: true,
  vibrationEnabled: true,
  initialTeamActivityLimit: 3,
  accent: DEFAULT_ACCENT,
  dailyReminder: true,
  streakAlerts: true,
  achievementAlerts: true,
  teamEntryAlerts: false,
  teamMemberAlerts: false,
  teamAchievementAlerts: false,
};

const VALID_ACTIVITY_LIMITS = [3, 5, 10];

function booleanSetting(storedSettings, key, fallback) {
  return typeof storedSettings?.[key] === "boolean"
    ? storedSettings[key]
    : fallback;
}

function loadStoredSettings() {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) {
      return DEFAULT_SETTINGS;
    }

    const parsedSettings = JSON.parse(storedSettings);

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,

      accent: VALID_ACCENTS.includes(parsedSettings.accent)
        ? parsedSettings.accent
        : DEFAULT_ACCENT,

      initialTeamActivityLimit: VALID_ACTIVITY_LIMITS.includes(
        parsedSettings.initialTeamActivityLimit,
      )
        ? parsedSettings.initialTeamActivityLimit
        : DEFAULT_SETTINGS.initialTeamActivityLimit,

      confirmationsEnabled: booleanSetting(
        parsedSettings,
        "confirmationsEnabled",
        DEFAULT_SETTINGS.confirmationsEnabled,
      ),

      vibrationEnabled: booleanSetting(
        parsedSettings,
        "vibrationEnabled",
        DEFAULT_SETTINGS.vibrationEnabled,
      ),

      dailyReminder: booleanSetting(
        parsedSettings,
        "dailyReminder",
        DEFAULT_SETTINGS.dailyReminder,
      ),

      streakAlerts: booleanSetting(
        parsedSettings,
        "streakAlerts",
        DEFAULT_SETTINGS.streakAlerts,
      ),

      achievementAlerts: booleanSetting(
        parsedSettings,
        "achievementAlerts",
        DEFAULT_SETTINGS.achievementAlerts,
      ),

      teamEntryAlerts: booleanSetting(
        parsedSettings,
        "teamEntryAlerts",
        DEFAULT_SETTINGS.teamEntryAlerts,
      ),

      teamMemberAlerts: booleanSetting(
        parsedSettings,
        "teamMemberAlerts",
        DEFAULT_SETTINGS.teamMemberAlerts,
      ),

      teamAchievementAlerts: booleanSetting(
        parsedSettings,
        "teamAchievementAlerts",
        DEFAULT_SETTINGS.teamAchievementAlerts,
      ),
    };
  } catch (error) {
    console.error("Errore caricamento impostazioni:", error);

    return DEFAULT_SETTINGS;
  }
}

function flushSettingsQueue(userId) {
  const pendingOps = loadPendingOps(userId);
  const settingsOps = pendingOps.filter((op) => op.type === SETTINGS_OP_TYPE);

  if (settingsOps.length === 0) return Promise.resolve(true);

  return settingsOps.reduce(
    (promise, op) =>
      promise.then((results) =>
        (async () => {
          try {
            await upsertMySettings(op.payload);
            dequeueOp(userId, op.id);
            return [...results, true];
          } catch (error) {
            console.error("Errore flush settings queue:", error);
            return [...results, false];
          }
        })(),
      ),
    Promise.resolve([]),
  ).then((results) => results.every((r) => r));
}

export function SettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const authUserId = user?.id ?? null;

  const [settings, setSettings] = useState(loadStoredSettings);

  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const skipNextSyncRef = useRef(false);
  const serverSyncSettledRef = useRef(false);
  const localEditDuringSyncRef = useRef(false);

  const [syncEpoch, setSyncEpoch] = useState(0);

  const isOnlineRef = useRef(typeof navigator !== "undefined" ? navigator.onLine : true);

  const setOnlineStatus = useCallback((online) => {
    isOnlineRef.current = online;
    if (online && authUserId) {
      flushSettingsQueue(authUserId);
    }
  }, [authUserId]);

  useEffect(() => {
    function handleOnline() {
      setOnlineStatus(true);
    }

    function handleOffline() {
      setOnlineStatus(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);

  useEffect(() => {
    if (authLoading || !user?.id) {
      return;
    }

    let cancelled = false;
    serverSyncSettledRef.current = false;
    localEditDuringSyncRef.current = false;

    async function syncSettingsFromAccount() {
      try {
        const serverSettings = await getMySettings();

        if (cancelled || localEditDuringSyncRef.current) {
          return;
        }

        if (!serverSettings) {
          await ensureMySettings();

          if (cancelled || localEditDuringSyncRef.current) {
            return;
          }

          await upsertMySettings({
            dailyReminder: settingsRef.current.dailyReminder,
            streakAlerts: settingsRef.current.streakAlerts,
            achievementAlerts: settingsRef.current.achievementAlerts,
            teamEntryAlerts: settingsRef.current.teamEntryAlerts,
            teamMemberAlerts: settingsRef.current.teamMemberAlerts,
            teamAchievementAlerts:
              settingsRef.current.teamAchievementAlerts,
          });

          return;
        }

        const currentSettings = settingsRef.current;

        const nextSettings = {
          ...currentSettings,
          dailyReminder: serverSettings.daily_reminder,
          streakAlerts: serverSettings.streak_alerts,
          achievementAlerts: serverSettings.achievement_alerts,
          teamEntryAlerts: serverSettings.team_entry_alerts,
          teamMemberAlerts: serverSettings.team_member_alerts,
          teamAchievementAlerts: serverSettings.team_achievement_alerts,
        };

        const settingsChanged =
          currentSettings.dailyReminder !== nextSettings.dailyReminder ||
          currentSettings.streakAlerts !== nextSettings.streakAlerts ||
          currentSettings.achievementAlerts !==
            nextSettings.achievementAlerts ||
          currentSettings.teamEntryAlerts !== nextSettings.teamEntryAlerts ||
          currentSettings.teamMemberAlerts !== nextSettings.teamMemberAlerts ||
          currentSettings.teamAchievementAlerts !==
            nextSettings.teamAchievementAlerts;

        if (!settingsChanged) {
          return;
        }

        skipNextSyncRef.current = true;

        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));

        setSettings(nextSettings);
      } catch (error) {
        console.error("Errore sincronizzazione impostazioni account:", error);
      }
    }

    syncSettingsFromAccount().finally(() => {
      serverSyncSettledRef.current = true;

      if (!cancelled) {
        setSyncEpoch((n) => n + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (authLoading || !user?.id) {
      return;
    }

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    if (!serverSyncSettledRef.current) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const payload = {
        dailyReminder: settings.dailyReminder,
        streakAlerts: settings.streakAlerts,
        achievementAlerts: settings.achievementAlerts,
        teamEntryAlerts: settings.teamEntryAlerts,
        teamMemberAlerts: settings.teamMemberAlerts,
        teamAchievementAlerts: settings.teamAchievementAlerts,
      };

      if (isOnlineRef.current) {
        upsertMySettings(payload).catch((error) => {
          console.error("Errore salvataggio impostazioni account:", error);
          enqueueOp(user.id, {
            type: SETTINGS_OP_TYPE,
            payload,
          });
        });
      } else {
        enqueueOp(user.id, {
          type: SETTINGS_OP_TYPE,
          payload,
        });
      }
    }, ACCOUNT_SYNC_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    user?.id,
    authLoading,
    syncEpoch,
    settings.dailyReminder,
    settings.streakAlerts,
    settings.achievementAlerts,
    settings.teamEntryAlerts,
    settings.teamMemberAlerts,
    settings.teamAchievementAlerts,
  ]);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--accent", getAccentColor(settings.accent));

    root.style.setProperty(
      "--accent-contrast",
      getAccentContrast(settings.accent),
    );
  }, [settings.accent]);

  const updateSetting = useCallback(
    (settingName, value) => {
      if (!serverSyncSettledRef.current) {
        localEditDuringSyncRef.current = true;
      }

      setSettings((currentSettings) => {
        const updatedSettings = {
          ...currentSettings,
          [settingName]: value,
        };

        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

        return updatedSettings;
      });
    },
    [],
  );

  const resetSettings = useCallback(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));

    setSettings(DEFAULT_SETTINGS);
  }, []);

  const setAccent = useCallback(
    (nextAccent) => {
      if (!VALID_ACCENTS.includes(nextAccent)) {
        console.error(`Accent non valido: ${nextAccent}`);

        return;
      }

      updateSetting("accent", nextAccent);
    },
    [updateSetting],
  );

  const triggerHapticFeedback = useCallback(
    (duration = 20) => {
      if (!settings.vibrationEnabled) {
        return;
      }

      if (!("vibrate" in navigator)) {
        return;
      }

      navigator.vibrate(duration);
    },
    [settings.vibrationEnabled],
  );

  const value = useMemo(
    () => ({
      settings,

      confirmationsEnabled: settings.confirmationsEnabled,

      vibrationEnabled: settings.vibrationEnabled,

      initialTeamActivityLimit: settings.initialTeamActivityLimit,

      accent: settings.accent,

      dailyReminder: settings.dailyReminder,

      streakAlerts: settings.streakAlerts,

      achievementAlerts: settings.achievementAlerts,

      teamEntryAlerts: settings.teamEntryAlerts,

      teamMemberAlerts: settings.teamMemberAlerts,

      teamAchievementAlerts: settings.teamAchievementAlerts,

      updateSetting,
      setAccent,
      resetSettings,
      triggerHapticFeedback,
    }),
    [
      settings,
      updateSetting,
      setAccent,
      resetSettings,
      triggerHapticFeedback,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}