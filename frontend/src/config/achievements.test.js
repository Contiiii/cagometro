import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  getAchievementProgress,
} from "./achievements";

describe("getAchievementProgress", () => {
  it("restituisce il totale per gli achievement di tipo total", () => {
    const achievement = ACHIEVEMENTS.find(
      (a) => a.type === "total",
    );

    expect(
      getAchievementProgress(achievement, {
        total: 15,
        streak: 3,
      }),
    ).toBe(15);
  });

  it("restituisce la streak per gli achievement di tipo streak", () => {
    const achievement = ACHIEVEMENTS.find(
      (a) => a.type === "streak",
    );

    expect(
      getAchievementProgress(achievement, {
        total: 15,
        streak: 7,
      }),
    ).toBe(7);
  });

  it("restituisce 0 per tipi sconosciuti", () => {
    expect(
      getAchievementProgress(
        {
          type: "unknown",
        },
        {
          total: 10,
          streak: 5,
        },
      ),
    ).toBe(0);
  });
});
