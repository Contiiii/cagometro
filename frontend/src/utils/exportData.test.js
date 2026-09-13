import { describe, expect, it } from "vitest";

import { CSV_BOM, entriesToCSV, escapeCSVField } from "./exportData";

describe("escapeCSVField", () => {
  it("non avvolge i campi semplici", () => {
    expect(escapeCSVField("2026-09-13")).toBe("2026-09-13");
    expect(escapeCSVField(3)).toBe("3");
  });

  it("avvolge e raddoppia le virgolette", () => {
    expect(escapeCSVField('ciao "mondo"')).toBe('"ciao ""mondo"""');
  });

  it("avvolge i campi con separatore", () => {
    expect(escapeCSVField("a;b")).toBe('"a;b"');
  });
});

describe("entriesToCSV", () => {
  it("inizia con il BOM per la compatibilità Excel", () => {
    const csv = entriesToCSV({ "2026-09-13": 2 });

    expect(csv.startsWith(CSV_BOM)).toBe(true);
  });

  it("produce header e righe ordinate per data", () => {
    const csv = entriesToCSV({
      "2026-09-14": 1,
      "2026-09-13": 3,
    });

    expect(csv).toBe(
      [
        `${CSV_BOM}Data;Segnalazioni`,
        "2026-09-13;3",
        "2026-09-14;1",
      ].join("\r\n"),
    );
  });

  it("gestisce l'export vuoto con solo header", () => {
    expect(entriesToCSV({})).toBe(`${CSV_BOM}Data;Segnalazioni`);
  });

  it("usa il delimitatore personalizzato", () => {
    const csv = entriesToCSV({ "2026-09-13": 2 }, { delimiter: "," });

    expect(csv).toContain("Data,Segnalazioni");
    expect(csv).toContain("2026-09-13,2");
  });
});