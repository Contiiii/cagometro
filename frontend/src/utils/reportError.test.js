import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportError } from "./reportError";

describe("reportError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logga tag feature, messaggio, errore e contesto", () => {
    reportError(new Error("boom"), {
      feature: "entries-sync",
      userId: "user-1",
      message: "Errore sincronizzazione pending:",
      extra: { date: "2026-09-16" },
    });

    expect(console.error).toHaveBeenCalledWith(
      "[entries-sync] user=user-1 Errore sincronizzazione pending:",
      new Error("boom"),
      { extra: { date: "2026-09-16" } },
    );
  });

  it("usa 'Errore' come messaggio di default", () => {
    reportError(new Error("boom"), { feature: "profile-sync" });

    expect(console.error).toHaveBeenCalledWith(
      "[profile-sync] Errore",
      new Error("boom"),
      {},
    );
  });

  it("omette il suffisso user se non specificato", () => {
    reportError(new Error("boom"), { feature: "team" });

    expect(console.error).toHaveBeenCalledWith(
      "[team] Errore",
      new Error("boom"),
      {},
    );
  });

  it("con error null logga solo prefisso e contesto", () => {
    reportError(null, {
      feature: "team-realtime-channel",
      message: "Canale non disponibile",
    });

    expect(console.error).toHaveBeenCalledWith(
      "[team-realtime-channel] Canale non disponibile",
      {},
    );
  });
});