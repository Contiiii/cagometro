import { describe, expect, it, vi } from "vitest";
import {
  formatRelativeTime,
  getLocalDateKey,
  getWeekRangeLabel,
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

  it("usa la data corrente se non viene passato alcun argomento", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 18, 23, 59, 59));

    expect(getLocalDateKey()).toBe("2026-05-18");

    vi.useRealTimers();
  });

  it("gestisce il cambio di mese", () => {
    expect(getLocalDateKey(new Date(2026, 0, 31))).toBe("2026-01-31");
    expect(getLocalDateKey(new Date(2026, 1, 1))).toBe("2026-02-01");
  });

  it("gestisce il cambio di anno", () => {
    expect(getLocalDateKey(new Date(2025, 11, 31))).toBe("2025-12-31");
    expect(getLocalDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("gestisce la mezzanotte", () => {
    expect(getLocalDateKey(new Date(2026, 8, 3, 0, 0, 0))).toBe("2026-09-03");
  });

  it("gestisce l'ultimo istante della giornata", () => {
    expect(getLocalDateKey(new Date(2026, 8, 3, 23, 59, 59))).toBe(
      "2026-09-03",
    );
  });

  it("gestisce il 29 febbraio di un anno bisestile", () => {
    expect(getLocalDateKey(new Date(2024, 1, 29))).toBe("2024-02-29");
  });

  it("usa la rappresentazione locale, non quella UTC", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));

    const localRepresentation = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const utcRepresentation = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    // La chiave deve riflettere i metodi locali...
    expect(getLocalDateKey(date)).toBe(localRepresentation);

    // ...e quando la data locale differisce da quella UTC (ad esempio su
    // un confine di mezzanotte con un fuso diverso), non deve essere la
    // rappresentazione UTC.
    if (localRepresentation !== utcRepresentation) {
      expect(getLocalDateKey(date)).not.toBe(utcRepresentation);
    }
  });
});

describe("getWeekRangeLabel", () => {
  it("mostra l'intervallo della settimana di riferimento", () => {
    expect(getWeekRangeLabel(new Date(2026, 8, 9))).toBe(
      "7 – 13 settembre 2026",
    );
  });

  it("normalizza a lunedì qualunque giorno della settimana", () => {
    expect(getWeekRangeLabel(new Date(2026, 8, 13))).toBe(
      "7 – 13 settembre 2026",
    );
  });

  it("gestisce una settimana a cavallo di due mesi", () => {
    expect(getWeekRangeLabel(new Date(2026, 8, 2))).toBe(
      "31 agosto – 6 settembre 2026",
    );
  });

  it("gestisce una settimana a cavallo di due anni", () => {
    expect(getWeekRangeLabel(new Date(2026, 0, 2))).toBe(
      "29 dicembre 2025 – 4 gennaio 2026",
    );
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

  it("parse correttamente la mezzanotte passata come chiave", () => {
    const date = parseLocalDateKey("2026-09-03");

    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it("parse il 29 febbraio di un anno bisestile", () => {
    const date = parseLocalDateKey("2024-02-29");

    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(29);
  });

  it("ripiega sul giorno successivo per date impossibili", () => {
    // JavaScript normalizza 2026-02-30 al 2 marzo 2026.
    const date = parseLocalDateKey("2026-02-30");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(2);
  });

  it("restituisce una data invalida per chiavi malformate", () => {
    const date = parseLocalDateKey("cagometro");

    expect(Number.isNaN(date.getTime())).toBe(true);
  });

  it("restituisce una data invalida per chiavi vuote", () => {
    const date = parseLocalDateKey("");

    expect(Number.isNaN(date.getTime())).toBe(true);
  });

  it("restituisce una data invalida per componenti non numerici", () => {
    const date = parseLocalDateKey("2026-xx-03");

    expect(Number.isNaN(date.getTime())).toBe(true);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date(2026, 8, 17, 12, 0, 0);

  it("formatta i minuti", () => {
    expect(formatRelativeTime(new Date(2026, 8, 17, 11, 45, 0), now)).toBe(
      "15 min fa",
    );
  });

  it("formatta le ore con singolare e plurale", () => {
    expect(formatRelativeTime(new Date(2026, 8, 17, 11, 0, 0), now)).toBe(
      "1 ora fa",
    );
    expect(formatRelativeTime(new Date(2026, 8, 17, 9, 0, 0), now)).toBe(
      "3 ore fa",
    );
  });

  it("formatta ieri e i giorni", () => {
    expect(formatRelativeTime(new Date(2026, 8, 16, 12, 0, 0), now)).toBe(
      "ieri",
    );
    expect(formatRelativeTime(new Date(2026, 8, 14, 12, 0, 0), now)).toBe(
      "3 giorni fa",
    );
  });

  it("usa 'adesso' sotto il minuto", () => {
    expect(formatRelativeTime(new Date(2026, 8, 17, 11, 59, 30), now)).toBe(
      "adesso",
    );
  });

  it("ricade sulla data per valori vecchi", () => {
    expect(formatRelativeTime(new Date(2026, 6, 1, 12, 0, 0), now)).toContain(
      "2026",
    );
  });

  it("gestisce valori mancanti o invalidi", () => {
    expect(formatRelativeTime(null, now)).toBe("");
    expect(formatRelativeTime("cagometro", now)).toBe("");
  });
});

describe("round trip", () => {
  it("mantiene la stessa data dopo conversione e parsing", () => {
    const original = new Date(2026, 4, 18);

    const key = getLocalDateKey(original);
    const parsed = parseLocalDateKey(key);

    expect(getLocalDateKey(parsed)).toBe(key);
  });

  it("mantiene la data attraverso un cambio di mese", () => {
    const original = new Date(2026, 0, 31);

    const key = getLocalDateKey(original);
    const parsed = parseLocalDateKey(key);

    expect(getLocalDateKey(parsed)).toBe(key);
  });

  it("mantiene la data attraverso un cambio di anno", () => {
    const original = new Date(2025, 11, 31);

    const key = getLocalDateKey(original);
    const parsed = parseLocalDateKey(key);

    expect(getLocalDateKey(parsed)).toBe(key);
  });

  it("mantiene la data per il 29 febbraio", () => {
    const original = new Date(2024, 1, 29);

    const key = getLocalDateKey(original);
    const parsed = parseLocalDateKey(key);

    expect(getLocalDateKey(parsed)).toBe(key);
  });

  it("mantiene la data intorno al cambio dell'ora legale", () => {
    const dates = [
      new Date(2026, 2, 29, 3, 0, 0),
      new Date(2026, 9, 25, 4, 0, 0),
    ];

    dates.forEach((original) => {
      const key = getLocalDateKey(original);
      const parsed = parseLocalDateKey(key);

      expect(getLocalDateKey(parsed)).toBe(key);
      expect(parsed.getHours()).toBe(12);
    });
  });
});