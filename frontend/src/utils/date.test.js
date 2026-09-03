import { describe, it, expect } from "vitest";
import {
  getLocalDateKey,
  parseLocalDateKey,
} from "./date";

describe("getLocalDateKey", () => {
  it("formatta correttamente una data", () => {
    const date = new Date(2026, 8, 3);

    expect(getLocalDateKey(date)).toBe("2026-09-03");
  });

  it("aggiunge gli zeri a mese e giorno", () => {
    const date = new Date(2026, 0, 5);

    expect(getLocalDateKey(date)).toBe("2026-01-05");
  });
});

describe("parseLocalDateKey", () => {
  it("converte una chiave data in oggetto Date", () => {
    const date = parseLocalDateKey("2026-09-03");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(3);
  });

  it("imposta sempre l'ora a mezzogiorno", () => {
    const date = parseLocalDateKey("2026-09-03");

    expect(date.getHours()).toBe(12);
  });
});

describe("round trip", () => {
  it("mantiene la stessa data dopo conversione e parsing", () => {
    const original = new Date(2026, 4, 18);

    const key = getLocalDateKey(original);
    const parsed = parseLocalDateKey(key);

    expect(getLocalDateKey(parsed)).toBe(key);
  });
});