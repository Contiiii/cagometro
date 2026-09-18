// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

import {
  clearAllLocalData,
  saveShownAchievements,
  saveUserEntries,
  savePendingSync,
  saveViewedTeamId,
  loadViewedTeamId,
} from "./storage";

describe("clearAllLocalData", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rimuove i dati locali dell'utente, lasciando i key estranei", () => {
    saveUserEntries("user-1", { "2026-09-13": 3 });
    savePendingSync("user-1", [{ date: "2026-09-13", count: 3 }]);
    saveViewedTeamId("user-1", "team-a");

    window.localStorage.setItem("entries_anonymous", JSON.stringify({}));
    window.localStorage.setItem(
      "cagometro_settings",
      JSON.stringify({ accent: "sky" }),
    );
    window.localStorage.setItem("cagometro_theme", JSON.stringify("dark"));
    saveShownAchievements(["prima-cacca"]);

    window.localStorage.setItem("achievements-section", "personali");
    window.localStorage.setItem("cagometro.teamOnboardingSeen", "1");

    clearAllLocalData("user-1");

    expect(window.localStorage.getItem("entries_anonymous")).toBeNull();
    expect(window.localStorage.getItem("entries_user_user-1")).toBeNull();
    expect(window.localStorage.getItem("pending_sync_user-1")).toBeNull();
    expect(window.localStorage.getItem("team_viewed_user-1")).toBeNull();
    expect(window.localStorage.getItem("cagometro_settings")).toBeNull();
    expect(window.localStorage.getItem("cagometro_theme")).toBeNull();
    expect(window.localStorage.getItem("shownAchievements")).toBeNull();

    expect(window.localStorage.getItem("achievements-section")).toBe(
      "personali",
    );
    expect(window.localStorage.getItem("cagometro.teamOnboardingSeen")).toBe(
      "1",
    );
  });

  it("senza userId rimuove solo i dati globali", () => {
    saveUserEntries("user-1", { "2026-09-13": 3 });
    savePendingSync("user-1", [{ date: "2026-09-13", count: 3 }]);

    window.localStorage.setItem("entries_anonymous", JSON.stringify({}));
    window.localStorage.setItem("cagometro_settings", "{}");
    window.localStorage.setItem("cagometro_theme", "light");
    saveShownAchievements([]);

    clearAllLocalData();

    expect(window.localStorage.getItem("entries_anonymous")).toBeNull();
    expect(window.localStorage.getItem("cagometro_settings")).toBeNull();
    expect(window.localStorage.getItem("cagometro_theme")).toBeNull();
    expect(window.localStorage.getItem("shownAchievements")).toBeNull();

    expect(window.localStorage.getItem("entries_user_user-1")).not.toBeNull();
    expect(window.localStorage.getItem("pending_sync_user-1")).not.toBeNull();
  });
});

describe("viewedTeamId", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("salva e carica il team visualizzato per utente", () => {
    expect(loadViewedTeamId("user-1")).toBeNull();

    saveViewedTeamId("user-1", "team-a");

    expect(loadViewedTeamId("user-1")).toBe("team-a");
    expect(loadViewedTeamId("user-2")).toBeNull();
  });

  it("rimuove il valore se passato null", () => {
    saveViewedTeamId("user-1", "team-a");
    saveViewedTeamId("user-1", null);

    expect(loadViewedTeamId("user-1")).toBeNull();
  });

  it("ignora chiamate senza userId", () => {
    saveViewedTeamId(null, "team-a");

    expect(window.localStorage.getItem("team_viewed_null")).toBeNull();
  });
});