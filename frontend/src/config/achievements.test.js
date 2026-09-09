import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ACHIEVEMENTS,
  TEAM_ACHIEVEMENTS,
  getAchievementProgress,
} from "./achievements";

describe("ACHIEVEMENTS", () => {
  it("contiene ID univoci", () => {
    const ids = ACHIEVEMENTS.map(
      (achievement) => achievement.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contiene target positivi", () => {
    ACHIEVEMENTS.forEach((achievement) => {
      expect(
        achievement.target,
      ).toBeGreaterThan(0);
    });
  });

  it("contiene tutti i campi richiesti", () => {
    ACHIEVEMENTS.forEach((achievement) => {
      expect(achievement.id).toBeTruthy();
      expect(achievement.title).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.icon).toBeTruthy();
      expect(achievement.type).toBeTruthy();
      expect(achievement.target).toBeDefined();
    });
  });
});

describe("TEAM_ACHIEVEMENTS", () => {
  it("contiene ID univoci", () => {
    const ids = TEAM_ACHIEVEMENTS.map(
      (achievement) => achievement.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contiene target positivi", () => {
    TEAM_ACHIEVEMENTS.forEach(
      (achievement) => {
        expect(
          achievement.target,
        ).toBeGreaterThan(0);
      },
    );
  });

  it("contiene tutti i campi richiesti", () => {
    TEAM_ACHIEVEMENTS.forEach(
      (achievement) => {
        expect(achievement.id).toBeTruthy();
        expect(achievement.title).toBeTruthy();
        expect(
          achievement.description,
        ).toBeTruthy();
        expect(achievement.icon).toBeTruthy();
        expect(
          achievement.target,
        ).toBeDefined();
      },
    );
  });
});

describe("getAchievementProgress", () => {
  it("restituisce il totale per un achievement total", () => {
    const achievement = {
      type: "total",
      target: 10,
    };

    const result = getAchievementProgress(
      achievement,
      {
        total: 15,
        streak: 3,
      },
    );

    expect(result).toBe(15);
  });

  it("restituisce la streak per un achievement streak", () => {
    const achievement = {
      type: "streak",
      target: 7,
    };

    const result = getAchievementProgress(
      achievement,
      {
        total: 15,
        streak: 7,
      },
    );

    expect(result).toBe(7);
  });

  it("restituisce 0 per un tipo sconosciuto", () => {
    const result = getAchievementProgress(
      {
        type: "unknown",
      },
      {
        total: 10,
        streak: 5,
      },
    );

    expect(result).toBe(0);
  });

  it("individua correttamente un achievement total completato", () => {
    const achievement = ACHIEVEMENTS.find(
      (item) => item.id === "abitudinario",
    );

    const progress = getAchievementProgress(
      achievement,
      {
        total: 10,
        streak: 0,
      },
    );

    expect(
      progress >= achievement.target,
    ).toBe(true);
  });

  it("individua correttamente un achievement total non completato", () => {
    const achievement = ACHIEVEMENTS.find(
      (item) => item.id === "veterano",
    );

    const progress = getAchievementProgress(
      achievement,
      {
        total: 99,
        streak: 0,
      },
    );

    expect(
      progress >= achievement.target,
    ).toBe(false);
  });

  it("individua correttamente un achievement streak completato", () => {
    const achievement = ACHIEVEMENTS.find(
      (item) => item.id === "costante",
    );

    const progress = getAchievementProgress(
      achievement,
      {
        total: 0,
        streak: 7,
      },
    );

    expect(
      progress >= achievement.target,
    ).toBe(true);
  });
});