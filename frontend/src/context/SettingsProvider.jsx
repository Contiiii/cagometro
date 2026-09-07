import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { SettingsContext } from "./settings-context";

const STORAGE_KEY = "cagometro_settings";

const DEFAULT_SETTINGS = {
  animationsEnabled: true,
  confirmationsEnabled: true,
  hapticFeedbackEnabled: true,
  initialTeamActivityLimit: 5,
};

const VALID_ACTIVITY_LIMITS = [5, 10, 20];

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

      initialTeamActivityLimit:
        VALID_ACTIVITY_LIMITS.includes(
          parsedSettings.initialTeamActivityLimit,
        )
          ? parsedSettings.initialTeamActivityLimit
          : DEFAULT_SETTINGS.initialTeamActivityLimit,
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

  const updateSetting = useCallback(
    (settingName, value) => {
      setSettings((currentSettings) => {
        const updatedSettings = {
          ...currentSettings,
          value,
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

  const triggerHapticFeedback = useCallback(
    (duration = 20) => {
      if (!settings.hapticFeedbackEnabled) {
        return;
      }

      if (!("vibrate" in navigator)) {
        return;
      }

      navigator.vibrate(duration);
    },
    [settings.hapticFeedbackEnabled],
  );

  const value = useMemo(
    () => ({
      settings,

      animationsEnabled:
        settings.animationsEnabled,

      confirmationsEnabled:
        settings.confirmationsEnabled,

      hapticFeedbackEnabled:
        settings.hapticFeedbackEnabled,

      initialTeamActivityLimit:
        settings.initialTeamActivityLimit,

      updateSetting,
      resetSettings,
      triggerHapticFeedback,
    }),
    [
      settings,
      updateSetting,
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