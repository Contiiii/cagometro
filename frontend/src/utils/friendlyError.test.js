import { describe, expect, it } from "vitest";

import { getFriendlyErrorMessage } from "../utils/friendlyError";

describe("getFriendlyErrorMessage", () => {
  it("errore di rete generico => messaggio offline", () => {
    expect(
      getFriendlyErrorMessage(new TypeError("Failed to fetch"), "fallback"),
    ).toBe("Connessione assente. Riprova tra poco.");
  });

  it("errore supabase di rete (code -1) => messaggio offline", () => {
    const error = { code: "-1", message: "fetch failed" };

    expect(getFriendlyErrorMessage(error, "fallback")).toBe(
      "Connessione assente. Riprova tra poco.",
    );
  });

  it("errore rate limit HTTP 429 => messaggio dedicato", () => {
    const error = { status: 429, message: "Too Many Requests" };

    expect(getFriendlyErrorMessage(error, "fallback")).toBe(
      "Troppe richieste. Riprova tra poco.",
    );
  });

  it("messaggio tecnico 'load failed' => messaggio offline", () => {
    expect(
      getFriendlyErrorMessage(new Error("load failed"), "fallback"),
    ).toBe("Connessione assente. Riprova tra poco.");
  });

  it("messaggio RPC leggibile viene conservato", () => {
    const error = new Error("Codice invito non valido");

    expect(getFriendlyErrorMessage(error, "fallback")).toBe(
      "Codice invito non valido",
    );
  });

  it("errore senza message => fallback", () => {
    expect(getFriendlyErrorMessage(null, "fallback")).toBe("fallback");
    expect(getFriendlyErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("message vuoto o whitespace => fallback", () => {
    expect(getFriendlyErrorMessage(new Error("   "), "fallback")).toBe(
      "fallback",
    );
  });
});