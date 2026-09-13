// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

import {
  clearAllLocalData,
  saveShownAchievements,
  saveUserEntries,
  savePendingSync,
} from "./storage";

describe("clearAllLocalData", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rimuove i dati locali dell'utente, lasciando i key estranei", () => {
    saveUserEntries("user-1", { "2026-09-13": 3 });
    savePendingSync("user-1", [{ date: "2026-09-13", count: 3 }]);

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