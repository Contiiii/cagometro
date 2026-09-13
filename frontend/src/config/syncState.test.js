import { describe, expect, it } from "vitest";

import { resolveSyncState } from "./syncState";

const USER = { id: "u-1" };

function pending(count, date) {
  return Array.from({ length: count }, (_, index) => ({
    date: date ?? `2026-01-${index + 1}`,
    count: 1,
  }));
}

describe("resolveSyncState", () => {
  it("senza utente restituisce il tono 'off'", () => {
    const result = resolveSyncState(null, "synced", []);

    expect(result.tone).toBe("off");
    expect(result.label).toBe("Sincronizzazione non disponibile");
    expect(result.dotClass).toBe("bg-amber-500");
    expect(result.iconColor).toBe("#f59e0b");
    expect(result.ping).toBe(false);
  });

  it("con utente sincronizzato restituisce il tono 'synced'", () => {
    const result = resolveSyncState(USER, "synced", []);

    expect(result.tone).toBe("synced");
    expect(result.label).toBe("Sincronizzazione automatica attiva");
    expect(result.dotClass).toBe("bg-emerald-500");
    expect(result.iconColor).toBeNull();
    expect(result.ping).toBe(true);
  });

  it("con una modifica in attesa usa il singolare", () => {
    const result = resolveSyncState(USER, "synced", pending(1));

    expect(result.tone).toBe("pending");
    expect(result.label).toBe("1 modifica in attesa");
    expect(result.dotClass).toBe("bg-amber-500");
    expect(result.ping).toBe(false);
  });

  it("con più modifiche in attesa usa il plurale", () => {
    const result = resolveSyncState(USER, "synced", pending(3));

    expect(result.tone).toBe("pending");
    expect(result.label).toBe("3 modifiche in attesa");
  });

  it("con syncStatus 'pending' senza modifiche usa il fallback", () => {
    const result = resolveSyncState(USER, "pending", []);

    expect(result.tone).toBe("pending");
    expect(result.label).toBe("In attesa di sincronizzazione");
  });

  it("con errore di sincronizzazione restituisce il tono 'error'", () => {
    const result = resolveSyncState(USER, "error", []);

    expect(result.tone).toBe("error");
    expect(result.label).toBe("Errore di sincronizzazione");
    expect(result.dotClass).toBe("bg-rose-500");
    expect(result.iconColor).toBe("#f43f5e");
    expect(result.ping).toBe(false);
  });

  it("l'errore prevale sulle modifiche in attesa", () => {
    const result = resolveSyncState(USER, "error", pending(2));

    expect(result.tone).toBe("error");
    expect(result.label).toBe("Errore di sincronizzazione");
  });
});