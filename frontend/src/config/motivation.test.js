import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MOTIVATIONAL_PHRASES,
  pickRandomPhrase,
} from "./motivation";

describe("MOTIVATIONAL_PHRASES", () => {
  it("contiene almeno dieci frasi", () => {
    expect(MOTIVATIONAL_PHRASES.length).toBeGreaterThanOrEqual(
      10,
    );
  });

  it("contiene solo frasi non vuote", () => {
    MOTIVATIONAL_PHRASES.forEach((phrase) => {
      expect(typeof phrase).toBe("string");
      expect(phrase.trim().length).toBeGreaterThan(0);
    });
  });

  it("non contiene frasi duplicate", () => {
    expect(new Set(MOTIVATIONAL_PHRASES).size).toBe(
      MOTIVATIONAL_PHRASES.length,
    );
  });
});

describe("pickRandomPhrase", () => {
  it("restituisce sempre una frase valida", () => {
    for (let index = 0; index < 50; index++) {
      const phrase = pickRandomPhrase();

      expect(MOTIVATIONAL_PHRASES).toContain(phrase);
    }
  });

  it("non restituisce mai la stessa frase della precedente", () => {
    for (let index = 0; index < 50; index++) {
      const previousPhrase = "Frase precedente di prova.";

      const phrase = pickRandomPhrase(previousPhrase);

      expect(phrase).not.toBe(previousPhrase);
    }
  });
});