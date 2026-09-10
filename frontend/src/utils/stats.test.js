import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculateStreak,
  calculateBestStreak,
  getTotalHistorical,
  getRecordHistorical,
  getLastNDaysTotal,
  getMonthTotal,
  getMonthBestStreak,
  getWeeklyChartData,
  getMonthChartData,
} from "./stats";

describe("stats", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date(2026, 8, 6, 12, 0, 0),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateStreak", () => {
    it("restituisce 0 senza registrazioni", () => {
      expect(calculateStreak({})).toBe(0);
    });

    it("restituisce 1 con una registrazione oggi", () => {
      const entries = {
        "2026-09-06": 1,
      };

      expect(calculateStreak(entries)).toBe(1);
    });

    it("restituisce 2 con registrazioni oggi e ieri", () => {
      const entries = {
        "2026-09-06": 1,
        "2026-09-05": 2,
      };

      expect(calculateStreak(entries)).toBe(2);
    });

    it("conta una streak di più giorni", () => {
      const entries = {
        "2026-09-06": 1,
        "2026-09-05": 2,
        "2026-09-04": 1,
        "2026-09-03": 3,
      };

      expect(calculateStreak(entries)).toBe(4);
    });

    it("interrompe la streak al primo giorno mancante", () => {
      const entries = {
        "2026-09-06": 1,
        "2026-09-04": 5,
      };

      expect(calculateStreak(entries)).toBe(1);
    });

    it("ignora i giorni con count pari a zero", () => {
      const entries = {
        "2026-09-06": 0,
        "2026-09-05": 3,
      };

      expect(calculateStreak(entries)).toBe(0);
    });
  });

  describe("calculateBestStreak", () => {
    it("restituisce 0 senza registrazioni", () => {
      expect(calculateBestStreak({})).toBe(0);
    });

    it("restituisce 1 con una sola giornata attiva", () => {
      const entries = {
        "2026-09-01": 2,
      };

      expect(calculateBestStreak(entries)).toBe(1);
    });

    it("restituisce 3 con tre giorni consecutivi", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 1,
        "2026-09-03": 1,
      };

      expect(calculateBestStreak(entries)).toBe(3);
    });

    it("trova la streak migliore tra periodi separati", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 1,
        "2026-09-05": 1,
        "2026-09-06": 1,
        "2026-09-07": 1,
      };

      expect(calculateBestStreak(entries)).toBe(3);
    });

    it("ignora le date con count pari a zero", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 0,
        "2026-09-03": 1,
      };

      expect(calculateBestStreak(entries)).toBe(1);
    });
  });

  describe("getTotalHistorical", () => {
    it("restituisce 0 senza registrazioni", () => {
      expect(getTotalHistorical({})).toBe(0);
    });

    it("somma tutte le registrazioni", () => {
      const entries = {
        "2026-09-01": 5,
        "2026-09-02": 2,
        "2026-09-03": 3,
      };

      expect(getTotalHistorical(entries)).toBe(10);
    });
  });

  describe("getRecordHistorical", () => {
    it("restituisce 0 senza registrazioni", () => {
      expect(getRecordHistorical({})).toBe(0);
    });

    it("restituisce il valore giornaliero massimo", () => {
      const entries = {
        "2026-09-01": 5,
        "2026-09-02": 2,
        "2026-09-03": 8,
      };

      expect(getRecordHistorical(entries)).toBe(8);
    });
  });

  describe("getLastNDaysTotal", () => {
    it("somma solamente gli ultimi sette giorni", () => {
      const entries = {
        "2026-09-06": 3,
        "2026-09-05": 2,
        "2026-09-01": 4,
        "2026-08-30": 100,
      };

      expect(getLastNDaysTotal(entries, 7)).toBe(9);
    });

    it("restituisce 0 se non esistono dati recenti", () => {
      const entries = {
        "2026-01-01": 100,
      };

      expect(getLastNDaysTotal(entries, 7)).toBe(0);
    });

    it("include la giornata corrente", () => {
      const entries = {
        "2026-09-06": 7,
      };

      expect(getLastNDaysTotal(entries, 1)).toBe(7);
    });
  });

  describe("getMonthTotal", () => {
    it("somma solo le registrazioni del mese selezionato", () => {
      const entries = {
        "2026-09-01": 2,
        "2026-09-05": 3,
        "2026-08-20": 10,
      };

      const selectedMonth = new Date(
        2026,
        8,
        1,
        12,
        0,
        0,
      );

      expect(
        getMonthTotal(entries, selectedMonth),
      ).toBe(5);
    });

    it("distingue correttamente anni differenti", () => {
      const entries = {
        "2026-09-01": 2,
        "2025-09-01": 20,
      };

      const selectedMonth = new Date(
        2026,
        8,
        1,
        12,
        0,
        0,
      );

      expect(
        getMonthTotal(entries, selectedMonth),
      ).toBe(2);
    });

    it("restituisce 0 se il mese non contiene dati", () => {
      const entries = {
        "2026-08-01": 5,
      };

      const selectedMonth = new Date(
        2026,
        8,
        1,
        12,
        0,
        0,
      );

      expect(
        getMonthTotal(entries, selectedMonth),
      ).toBe(0);
    });
  });

  describe("getMonthBestStreak", () => {
    it("restituisce 0 senza registrazioni nel mese", () => {
      const entries = {
        "2026-08-20": 3,
      };

      const selectedMonth = new Date(2026, 8, 1, 12, 0, 0);

      expect(getMonthBestStreak(entries, selectedMonth)).toBe(0);
    });

    it("restituisce la streak più lunga dentro il mese", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 1,
        "2026-09-03": 1,
        "2026-09-10": 1,
        "2026-09-11": 1,
      };

      const selectedMonth = new Date(2026, 8, 1, 12, 0, 0);

      expect(getMonthBestStreak(entries, selectedMonth)).toBe(3);
    });

    it("non considera le streak che attraversano il confine del mese", () => {
      const entries = {
        "2026-08-30": 1,
        "2026-08-31": 1,
        "2026-09-01": 1,
        "2026-09-02": 1,
      };

      const selectedMonth = new Date(2026, 8, 1, 12, 0, 0);

      expect(getMonthBestStreak(entries, selectedMonth)).toBe(2);
    });

    it("ignora le date con conteggio nullo dentro il mese", () => {
      const entries = {
        "2026-09-01": 0,
        "2026-09-02": 1,
        "2026-09-03": 1,
      };

      const selectedMonth = new Date(2026, 8, 1, 12, 0, 0);

      expect(getMonthBestStreak(entries, selectedMonth)).toBe(2);
    });
  });

  describe("getWeeklyChartData", () => {
    it("restituisce sempre sette elementi", () => {
      const result = getWeeklyChartData({});

      expect(result).toHaveLength(7);
    });

    it("ordina i giorni dal meno recente a oggi", () => {
      const result = getWeeklyChartData({});

      expect(result[0].date).toBe("2026-08-31");
      expect(result[6].date).toBe("2026-09-06");
    });

    it("associa il count alla data corretta", () => {
      const entries = {
        "2026-09-06": 4,
        "2026-09-05": 2,
      };

      const result = getWeeklyChartData(entries);

      expect(result[5].count).toBe(2);
      expect(result[6].count).toBe(4);
    });

    it("usa zero per le date senza registrazioni", () => {
      const result = getWeeklyChartData({});

      expect(
        result.every((item) => item.count === 0),
      ).toBe(true);
    });
  });

  describe("getMonthChartData", () => {
    it("restituisce 28 giorni per febbraio 2026", () => {
      const selectedMonth = new Date(
        2026,
        1,
        1,
        12,
        0,
        0,
      );

      const result = getMonthChartData(
        {},
        selectedMonth,
      );

      expect(result).toHaveLength(28);
    });

    it("restituisce 29 giorni per febbraio bisestile", () => {
      const selectedMonth = new Date(
        2024,
        1,
        1,
        12,
        0,
        0,
      );

      const result = getMonthChartData(
        {},
        selectedMonth,
      );

      expect(result).toHaveLength(29);
    });

    it("restituisce 30 giorni per settembre", () => {
      const selectedMonth = new Date(
        2026,
        8,
        1,
        12,
        0,
        0,
      );

      const result = getMonthChartData(
        {},
        selectedMonth,
      );

      expect(result).toHaveLength(30);
    });

    it("associa i count ai giorni corretti", () => {
      const entries = {
        "2026-09-01": 3,
        "2026-09-15": 7,
      };

      const selectedMonth = new Date(
        2026,
        8,
        1,
        12,
        0,
        0,
      );

      const result = getMonthChartData(
        entries,
        selectedMonth,
      );

      expect(result[0]).toEqual({
        day: 1,
        date: "2026-09-01",
        count: 3,
      });

      expect(result[14]).toEqual({
        day: 15,
        date: "2026-09-15",
        count: 7,
      });
    });
  });
});
