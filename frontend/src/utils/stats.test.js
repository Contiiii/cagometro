import { describe, it, expect } from "vitest";
import {
  calculateStreak,
  calculateBestStreak,
  getTotalHistorical,
  getRecordHistorical,
  getLastNDaysTotal,
  getMonthTotal,
  getWeeklyChartData,
  getMonthChartData,
} from "./stats";
import { getLocalDateKey } from "./date";

describe("calculateStreak", () => {
  it("restituisce 0 senza registrazioni", () => {
    expect(calculateStreak({})).toBe(0);
  });

  it("restituisce 1 se oggi ha almeno una registrazione", () => {
    const today = getLocalDateKey();

    const entries = {
      [today]: 1,
    };

    expect(calculateStreak(entries)).toBe(1);
  });

  it("restituisce 2 con registrazioni oggi e ieri", () => {
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const entries = {
      [getLocalDateKey(today)]: 1,
      [getLocalDateKey(yesterday)]: 1,
    };

    expect(calculateStreak(entries)).toBe(2);
  });

  it("interrompe la streak se manca il giorno precedente", () => {
    const today = new Date();

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const entries = {
      [getLocalDateKey(today)]: 1,
      [getLocalDateKey(twoDaysAgo)]: 1,
    };

    expect(calculateStreak(entries)).toBe(1);
  });

  describe("calculateBestStreak", () => {
    it("restituisce 0 senza registrazioni", () => {
      expect(calculateBestStreak({})).toBe(0);
    });

    it("restituisce 3 per una streak di tre giorni consecutivi", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 1,
        "2026-09-03": 1,
      };

      expect(calculateBestStreak(entries)).toBe(3);
    });

    it("restituisce la streak migliore anche se ci sono interruzioni", () => {
      const entries = {
        "2026-09-01": 1,
        "2026-09-02": 1,
        "2026-09-05": 1,
        "2026-09-06": 1,
        "2026-09-07": 1,
      };

      expect(calculateBestStreak(entries)).toBe(3);
    });
  });
  describe("getTotalHistorical", () => {
    it("somma correttamente tutte le registrazioni", () => {
      const entries = {
        "2026-09-01": 5,
        "2026-09-02": 2,
        "2026-09-03": 3,
      };

      expect(getTotalHistorical(entries)).toBe(10);
    });
  });
  describe("getRecordHistorical", () => {
    it("restituisce il record massimo", () => {
      const entries = {
        "2026-09-01": 5,
        "2026-09-02": 2,
        "2026-09-03": 8,
      };

      expect(getRecordHistorical(entries)).toBe(8);
    });
  });
  describe("getLastNDaysTotal", () => {
    it("somma correttamente gli ultimi 7 giorni", () => {
      const today = new Date();

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const entries = {
        [getLocalDateKey(today)]: 3,
        [getLocalDateKey(yesterday)]: 2,
      };

      expect(getLastNDaysTotal(entries, 7)).toBe(5);
    });
  });
  describe("getMonthTotal", () => {
    it("somma solo le registrazioni del mese selezionato", () => {
      const entries = {
        "2026-09-01": 2,
        "2026-09-05": 3,
        "2026-08-20": 10,
      };

      const selectedMonth = new Date("2026-09-01");

      expect(getMonthTotal(entries, selectedMonth)).toBe(5);
    });
  });
  describe("getWeeklyChartData", () => {
    it("restituisce sempre 7 elementi", () => {
      const result = getWeeklyChartData({});

      expect(result).toHaveLength(7);
    });
  });
  describe("getMonthChartData", () => {
    it("restituisce tutti i giorni del mese", () => {
      const result = getMonthChartData({}, new Date("2026-02-01"));

      expect(result).toHaveLength(28);
    });
  });
});
