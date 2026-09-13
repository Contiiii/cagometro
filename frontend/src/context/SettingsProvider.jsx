import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SettingsContext } from "./settings-context";

import {
  DEFAULT_ACCENT,
  VALID_ACCENTS,
  getAccentColor,
  getAccentContrast,
} from "../config/appearance";

const STORAGE_KEY = "cagometro_settings";

const DEFAULT_SETTINGS = {
  confirmationsEnabled: true,
  vibrationEnabled: true,
  initialTeamActivityLimit: 3,
  accent: DEFAULT_ACCENT,
  dailyReminder: true,
  streakAlerts: true,
  achievementAlerts: true,
  teamAlerts: false,
};

const VALID_ACTIVITY_LIMITS = [3, 5, 10];

function booleanSetting(storedSettings, key, fallback) {
  return typeof storedSettings?.[key] === "boolean"
    ? storedSettings[key]
    : fallback;
}

function loadStoredSettings() {
  try {
    const storedSettings = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!storedSettings) {
      return DEFAULT_SETTINGS;
    }

    const parsedSettings = JSON.parse(storedSettings);

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,

      accent: VALID_ACCENTS.includes(
        parsedSettings.accent,
      )
        ? parsedSettings.accent
        : DEFAULT_ACCENT,

      initialTeamActivityLimit:
        VALID_ACTIVITY_LIMITS.includes(
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

      teamAlerts: booleanSetting(
        parsedSettings,
        "teamAlerts",
        DEFAULT_SETTINGS.teamAlerts,
      ),
    };
  } catch (error) {
    console.error(
      "Errore caricamento impostazioni:",
      error,
    );

    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(
    loadStoredSettings,
  );

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--accent",
      getAccentColor(settings.accent),
    );

    root.style.setProperty(
      "--accent-contrast",
      getAccentContrast(settings.accent),
    );
  }, [settings.accent]);

  const updateSetting = useCallback(
    (settingName, value) => {
      setSettings((currentSettings) => {
        const updatedSettings = {
          ...currentSettings,
          [settingName]: value,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updatedSettings),
        );

        return updatedSettings;
      });
    },
    [],
  );

  const resetSettings = useCallback(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_SETTINGS),
    );

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

      confirmationsEnabled:
        settings.confirmationsEnabled,

      vibrationEnabled:
        settings.vibrationEnabled,

      initialTeamActivityLimit:
        settings.initialTeamActivityLimit,

      accent: settings.accent,

      dailyReminder: settings.dailyReminder,

      streakAlerts: settings.streakAlerts,

      achievementAlerts:
        settings.achievementAlerts,

      teamAlerts: settings.teamAlerts,

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