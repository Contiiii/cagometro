// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsProvider } from "./SettingsProvider";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import {
  getMySettings,
  ensureMySettings,
  upsertMySettings,
} from "../services/settingsService";

import { loadPendingOps } from "../utils/pendingQueue";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

vi.mock("../services/settingsService", () => ({
  getMySettings: vi.fn(),
  ensureMySettings: vi.fn(),
  upsertMySettings: vi.fn(),
}));

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

  useAuth.mockReturnValue({ user: null, loading: false });
  useTheme.mockReturnValue({ resolvedTheme: "light" });
  getMySettings.mockResolvedValue(null);
  ensureMySettings.mockResolvedValue(undefined);
  upsertMySettings.mockResolvedValue(undefined);
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
    expect(latest.teamEntryAlerts).toBe(false);
    expect(latest.teamMemberAlerts).toBe(false);
    expect(latest.teamAchievementAlerts).toBe(false);
  });

  it("updateSetting aggiorna lo stato e persiste su localStorage", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().updateSetting("accent", "violet");
    });

    expect(getLatest().accent).toBe("violet");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.accent).toBe("violet");
    expect(stored.teamEntryAlerts).toBe(false);
  });

  it("carica dal storage fondendo i default con gli override parziali", () => {
    seedStorage({
      accent: "emerald",
      teamMemberAlerts: true,
    });

    const { getLatest } = renderProvider();
    const latest = getLatest();

    expect(latest.accent).toBe("emerald");
    expect(latest.teamMemberAlerts).toBe(true);
    expect(latest.teamEntryAlerts).toBe(false);
    expect(latest.dailyReminder).toBe(true);
  });

  it("dopo un refresh (remount) ripristina le preferenze persistenti", () => {
    const first = renderProvider();

    act(() => {
      first.getLatest().updateSetting("accent", "violet");
      first.getLatest().updateSetting("teamEntryAlerts", true);
    });

    cleanup();

    const { getLatest } = renderProvider();
    const latest = getLatest();

    expect(latest.accent).toBe("violet");
    expect(latest.teamEntryAlerts).toBe(true);
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
      teamEntryAlerts: 1,
    });

    const { getLatest } = renderProvider();

    expect(getLatest().dailyReminder).toBe(true);
    expect(getLatest().teamEntryAlerts).toBe(false);
  });

  it("resetSettings ripristina tutti i default", () => {
    const { getLatest } = renderProvider();

    act(() => {
      getLatest().updateSetting("accent", "amber");
      getLatest().updateSetting("teamEntryAlerts", true);
    });

    act(() => {
      getLatest().resetSettings();
    });

    const latest = getLatest();

    expect(latest.accent).toBe("pink");
    expect(latest.teamEntryAlerts).toBe(false);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.accent).toBe("pink");
    expect(stored.teamEntryAlerts).toBe(false);
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
    ).toBe("#18181b");
    expect(
      document.documentElement.style.getPropertyValue("--accent-ink"),
    ).toBe("#be185d");

    act(() => {
      getLatest().setAccent("amber");
    });

    expect(
      document.documentElement.style.getPropertyValue("--accent"),
    ).toBe("#f59e0b");
    expect(
      document.documentElement.style.getPropertyValue("--accent-contrast"),
    ).toBe("#18181b");
    expect(
      document.documentElement.style.getPropertyValue("--accent-ink"),
    ).toBe("#92400e");
  });

  it("in tema scuro usa l'ink luminoso dell'accento", () => {
    useTheme.mockReturnValue({ resolvedTheme: "dark" });

    const { getLatest } = renderProvider();

    expect(
      document.documentElement.style.getPropertyValue("--accent-ink"),
    ).toBe("#ec4899");

    act(() => {
      getLatest().setAccent("violet");
    });

    expect(
      document.documentElement.style.getPropertyValue("--accent-ink"),
    ).toBe("#a78bfa");
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

  it("con utente autenticato carica le preferenze dal server", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    getMySettings.mockResolvedValue({
      daily_reminder: false,
      streak_alerts: true,
      achievement_alerts: false,
      team_entry_alerts: true,
      team_member_alerts: false,
      team_achievement_alerts: true,
    });

    const { getLatest } = renderProvider();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    const latest = getLatest();

    expect(latest.dailyReminder).toBe(false);
    expect(latest.streakAlerts).toBe(true);
    expect(latest.achievementAlerts).toBe(false);
    expect(latest.teamEntryAlerts).toBe(true);
    expect(latest.teamMemberAlerts).toBe(false);
    expect(latest.teamAchievementAlerts).toBe(true);

    expect(upsertMySettings).not.toHaveBeenCalled();
  });

  it("senza riga sul server crea l'impostazione e invia le preferenze locali", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    getMySettings.mockResolvedValue(null);

    renderProvider();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(ensureMySettings).toHaveBeenCalledTimes(1);
    expect(upsertMySettings).toHaveBeenCalledWith({
      dailyReminder: true,
      streakAlerts: true,
      achievementAlerts: true,
      teamEntryAlerts: false,
      teamMemberAlerts: false,
      teamAchievementAlerts: false,
    });
  });

  it("salva le preferenze sul server dopo il debounce", async () => {
    vi.useFakeTimers();

    try {
      useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

      getMySettings.mockResolvedValue({
        daily_reminder: true,
        streak_alerts: true,
        achievement_alerts: true,
        team_entry_alerts: false,
        team_member_alerts: false,
        team_achievement_alerts: false,
      });

      const { getLatest } = renderProvider();

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        getLatest().updateSetting("teamEntryAlerts", true);
      });

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(upsertMySettings).toHaveBeenCalledWith({
        dailyReminder: true,
        streakAlerts: true,
        achievementAlerts: true,
        teamEntryAlerts: true,
        teamMemberAlerts: false,
        teamAchievementAlerts: false,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("senza utente non sincronizza con il server", async () => {
    renderProvider();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(getMySettings).not.toHaveBeenCalled();
    expect(ensureMySettings).not.toHaveBeenCalled();
    expect(upsertMySettings).not.toHaveBeenCalled();
  });

  describe("coda offline", () => {
    function setOnline(value) {
      Object.defineProperty(navigator, "onLine", {
        value,
        configurable: true,
      });
    }

    beforeEach(() => {
      getMySettings.mockReset().mockRejectedValue(new Error("offline"));
      ensureMySettings.mockReset().mockResolvedValue(undefined);
      upsertMySettings.mockReset().mockResolvedValue(undefined);
    });

    function renderAuthed() {
      useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
      return renderProvider();
    }

    it("con utente offline il toggle accoda senza chiamare la rete", async () => {
      setOnline(false);

      getMySettings.mockRejectedValue(new Error("offline"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { getLatest } = renderAuthed();

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      act(() => {
        getLatest().updateSetting("teamEntryAlerts", true);
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      });

      expect(upsertMySettings).not.toHaveBeenCalled();

      const ops = loadPendingOps("user-1");
      expect(ops).toHaveLength(1);
      expect(ops[0]).toMatchObject({
        type: "upsertSettings",
        payload: {
          dailyReminder: true,
          streakAlerts: true,
          achievementAlerts: true,
          teamEntryAlerts: true,
          teamMemberAlerts: false,
          teamAchievementAlerts: false,
        },
      });

      consoleSpy.mockRestore();
    });

    it("se upsert fallisce la modifica viene accodata", async () => {
      getMySettings.mockResolvedValue({
        daily_reminder: true,
        streak_alerts: true,
        achievement_alerts: true,
        team_entry_alerts: false,
        team_member_alerts: false,
        team_achievement_alerts: false,
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { getLatest } = renderAuthed();

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      upsertMySettings.mockRejectedValueOnce(new Error("Failed to fetch"));

      act(() => {
        getLatest().updateSetting("teamEntryAlerts", true);
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      const ops = loadPendingOps("user-1");
      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("upsertSettings");

      consoleSpy.mockRestore();
    });

    it("il ritorno online flusha la coda settings", async () => {
      setOnline(false);

      getMySettings.mockRejectedValue(new Error("offline"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { getLatest } = renderAuthed();

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      act(() => {
        getLatest().updateSetting("teamEntryAlerts", true);
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      });

      expect(loadPendingOps("user-1")).toHaveLength(1);

      consoleSpy.mockRestore();

      setOnline(true);

      await act(async () => {
        window.dispatchEvent(new Event("online"));
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      expect(upsertMySettings).toHaveBeenCalled();
      expect(loadPendingOps("user-1")).toEqual([]);
    });

    it("senza utente nessuna coda viene scritta", async () => {
      setOnline(false);

      useAuth.mockReturnValue({ user: null, loading: false });

      const { getLatest } = renderProvider();

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });

      act(() => {
        getLatest().updateSetting("teamEntryAlerts", true);
      });

      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      });

      expect(loadPendingOps("user-undefined")).toEqual([]);
    });
  });
});