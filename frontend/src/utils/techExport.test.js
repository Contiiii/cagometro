import { describe, expect, it } from "vitest";

import { buildTechExport } from "./techExport";

describe("buildTechExport", () => {
  const payload = {
    app: "Cagometro",
    versione: "1.9.0",
    generatoIl: "2026-09-13T10:00:00.000Z",
    utenteLoggato: true,
    syncStatus: "synced",
    label: "Sincronizzazione automatica attiva",
    modificheInAttesa: [],
    giorniRegistrati: 12,
    totaleSegnalazioni: 40,
    entries: { "2026-09-13": 4 },
  };

  it("include metadati, stato e conteggi", () => {
    expect(buildTechExport(payload)).toEqual({
      app: "Cagometro",
      versione: "1.9.0",
      generatoIl: "2026-09-13T10:00:00.000Z",
      utenteLoggato: true,
      stato: {
        syncStatus: "synced",
        label: "Sincronizzazione automatica attiva",
        modificheInAttesa: [],
      },
      giorniRegistrati: 12,
      totaleSegnalazioni: 40,
      entries: { "2026-09-13": 4 },
    });
  });

  it("incluso le modifiche in attesa", () => {
    const exported = buildTechExport({
      ...payload,
      syncStatus: "pending",
      label: "2 modifiche in attesa",
      modificheInAttesa: [{ date: "2026-09-12", count: 1 }],
    });

    expect(exported.stato.modificheInAttesa).toEqual([
      { date: "2026-09-12", count: 1 },
    ]);
  });

  it("riflette l'override di versione e timestamp", () => {
    const exported = buildTechExport({
      ...payload,
      versione: "2.1.0",
      generatoIl: "2027-01-01T00:00:00.000Z",
    });

    expect(exported.versione).toBe("2.1.0");
    expect(exported.generatoIl).toBe("2027-01-01T00:00:00.000Z");
  });
});