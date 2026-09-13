// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsProvider } from "./SettingsProvider";
import { useSettings } from "../hooks/useSettings";

const STORAGE_KEY = "cagometro_settings";

function SettingsHarness({ onSettings }) {
  onSettings(useSettings());
  return null;
}

function renderProvider() {
  let latest = null;

  render(
    <SettingsProvider>
      <SettingsHarness
        onSettings={(value) => {
          latest = value;
        }}
      />
    </SettingsProvider>,
  );

  return {
    getLatest: () => latest,
  };
}

function seedStorage(partialSettings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(partialSettings),
  );
}

beforeEach(() => {
  localStorage.clear();

  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("SettingsProvider", () => {
  it("espone i valori di default", () => {
    const { getLatest } = renderProvider();

    const latest = getLatest();

    expect(latest.confirmationsEnabled).toBe(true);
    expect(latest.vibrationEnabled).toBe(true);
    expect(latest.initialTeamActivityLimit).toBe(3);
    expect(latest.accent).toBe("pink");
    expect(latest.dailyReminder).toBe(true);
    expect(latest.streakAlerts).toBe(true);
    expect(latest.achievementAlerts).toBe(true);
    expect(latest.teamAlerts).toBe(false);
  });

  it("updateSetting aggiorna lo stato e persiste su localStorage", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().updateSetting("accent", "violet");
    });

    expect(getLatest().accent).toBe("violet");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.accent).toBe("violet");
    expect(stored.teamAlerts).toBe(false);
  });

  it("carica dal storage fondendo i default con gli override parziali", () => {
    seedStorage({
      accent: "emerald",
      teamAlerts: true,
    });

    const { getLatest } = renderProvider();
    const latest = getLatest();

    expect(latest.accent).toBe("emerald");
    expect(latest.teamAlerts).toBe(true);
    expect(latest.dailyReminder).toBe(true);
  });

  it("recupera i default quando accent non e valido", () => {
    seedStorage({ accent: "neon" });

    const { getLatest } = renderProvider();

    expect(getLatest().accent).toBe("pink");
  });

  it("recupera i default quando un booleano non e un booleano", () => {
    seedStorage({
      dailyReminder: "si",
      teamAlerts: 1,
    });

    const { getLatest } = renderProvider();

    expect(getLatest().dailyReminder).toBe(true);
    expect(getLatest().teamAlerts).toBe(false);
  });

  it("resetSettings ripristina tutti i default", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().updateSetting("accent", "amber");
      getLatest().updateSetting("teamAlerts", true);
    });

    act(() => {
      getLatest().resetSettings();
    });

    const latest = getLatest();

    expect(latest.accent).toBe("pink");
    expect(latest.teamAlerts).toBe(false);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.accent).toBe("pink");
    expect(stored.teamAlerts).toBe(false);
  });

  it("setAccent aggiorna lo stato e persiste su localStorage", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().setAccent("violet");
    });

    expect(getLatest().accent).toBe("violet");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.accent).toBe("violet");
  });

  it("setAccent ignora un accent non valido", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().setAccent("neon");
    });

    expect(getLatest().accent).toBe("pink");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("applica il colore accento come variabili CSS globali", () => {
    const { getLatest } = renderProvider();

    expect(
      document.documentElement.style.getPropertyValue("--accent"),
    ).toBe("#ec4899");
    expect(
      document.documentElement.style.getPropertyValue("--accent-contrast"),
    ).toBe("#ffffff");

    act(() => {
      getLatest().setAccent("amber");
    });

    expect(
      document.documentElement.style.getPropertyValue("--accent"),
    ).toBe("#f59e0b");
    expect(
      document.documentElement.style.getPropertyValue("--accent-contrast"),
    ).toBe("#18181b");
  });

  it("triggerHapticFeedback vibra quando la vibrazione e attiva", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().triggerHapticFeedback(30);
    });

    expect(navigator.vibrate).toHaveBeenCalledWith(30);
  });

  it("triggerHapticFeedback non vibra quando la vibrazione e disattivata", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().updateSetting("vibrationEnabled", false);
    });

    act(() => {
      getLatest().triggerHapticFeedback(30);
    });

    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("triggerHapticFeedback non fallisce quando navigator.vibrate non esiste", () => {
    delete navigator.vibrate;

    const { getLatest } = renderProvider();

    expect(() => {
      act(() => {
        getLatest().triggerHapticFeedback(30);
      });
    }).not.toThrow();
  });
});