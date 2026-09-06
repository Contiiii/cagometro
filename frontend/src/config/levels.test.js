import {
  describe,
  expect,
  it,
} from "vitest";

import {
  LEVELS,
  getLevel,
} from "./levels";

describe("LEVELS", () => {
  it("contiene livelli ordinati per XP crescenti", () => {
    for (
      let index = 1;
      index < LEVELS.length;
      index++
    ) {
      expect(
        LEVELS[index].xp,
      ).toBeGreaterThan(
        LEVELS[index - 1].xp,
      );
    }
  });

  it("inizia dal livello 1 con zero XP", () => {
    expect(LEVELS[0]).toEqual({
      level: 1,
      xp: 0,
    });
  });

  it("ha numeri di livello consecutivi", () => {
    LEVELS.forEach((level, index) => {
      expect(level.level).toBe(index + 1);
    });
  });
});

describe("getLevel", () => {
  it("restituisce il livello 1 con zero XP", () => {
    expect(getLevel(0)).toEqual({
      level: 1,
      xp: 0,
    });
  });

  it("restituisce il livello 1 sotto la soglia del livello 2", () => {
    expect(getLevel(49).level).toBe(1);
  });

  it("restituisce il livello 2 esattamente a 50 XP", () => {
    expect(getLevel(50)).toEqual({
      level: 2,
      xp: 50,
    });
  });

  it("restituisce il livello 2 tra 50 e 149 XP", () => {
    expect(getLevel(149).level).toBe(2);
  });

  it("restituisce il livello 3 esattamente a 150 XP", () => {
    expect(getLevel(150)).toEqual({
      level: 3,
      xp: 150,
    });
  });

  it("restituisce il livello corretto a una soglia intermedia", () => {
    expect(getLevel(749)).toEqual({
      level: 5,
      xp: 500,
    });
  });

  it("restituisce il livello 10 a 3000 XP", () => {
    expect(getLevel(3000)).toEqual({
      level: 10,
      xp: 3000,
    });
  });

  it("mantiene il livello massimo oltre 3000 XP", () => {
    expect(getLevel(10000)).toEqual({
      level: 10,
      xp: 3000,
    });
  });

  it("restituisce il livello 1 con XP negativi", () => {
    expect(getLevel(-10)).toEqual({
      level: 1,
      xp: 0,
    });
  });
});