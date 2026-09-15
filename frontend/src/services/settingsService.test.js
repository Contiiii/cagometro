import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getMySettings,
  ensureMySettings,
  upsertMySettings,
} from "./settingsService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockRpc(overrides = {}) {
  const result = {
    data: null,
    error: null,
    ...overrides,
  };

  supabase.rpc.mockResolvedValue(result);

  return result;
}

describe("getMySettings", () => {
  it("chiama la rpc get_my_settings e restituisce il primo elemento", async () => {
    mockRpc({
      data: [{ daily_reminder: true, streak_alerts: false }],
    });

    const settings = await getMySettings();

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_settings");
    expect(settings).toEqual({ daily_reminder: true, streak_alerts: false });
  });

  it("restituisce null quando il data è vuoto", async () => {
    mockRpc({ data: [] });

    await expect(getMySettings()).resolves.toBeNull();
  });

  it("restituisce null quando il data è null", async () => {
    mockRpc({ data: null });

    await expect(getMySettings()).resolves.toBeNull();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "settings non disponibili" } });

    await expect(getMySettings()).rejects.toThrow("settings non disponibili");
  });
});

describe("ensureMySettings", () => {
  it("chiama la rpc ensure_my_settings senza parametri", async () => {
    mockRpc();

    await ensureMySettings();

    expect(supabase.rpc).toHaveBeenCalledWith("ensure_my_settings");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "creazione fallita" } });

    await expect(ensureMySettings()).rejects.toThrow("creazione fallita");
  });
});

describe("upsertMySettings", () => {
  it("chiama la rpc upsert_my_settings mappando i parametri", async () => {
    mockRpc();

    await upsertMySettings({
      dailyReminder: true,
      streakAlerts: false,
      achievementAlerts: true,
      teamAlerts: false,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("upsert_my_settings", {
      p_daily_reminder: true,
      p_streak_alerts: false,
      p_achievement_alerts: true,
      p_team_alerts: false,
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "aggiornamento fallito" } });

    await expect(
      upsertMySettings({
        dailyReminder: true,
        streakAlerts: true,
        achievementAlerts: true,
        teamAlerts: true,
      }),
    ).rejects.toThrow("aggiornamento fallito");
  });
});