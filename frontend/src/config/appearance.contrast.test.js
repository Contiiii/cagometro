import { describe, expect, it } from "vitest";

import {
  accentOptions,
  getAccentColor,
  getAccentContrast,
  getAccentInk,
} from "./appearance";
import { blendOver, contrastRatio } from "../utils/contrast";

const APP_LIGHT = "#f8f5f3";
const APP_DARK = "#0c0c0f";
const AA = 4.5;

describe("accentOptions", () => {
  for (const option of accentOptions) {
    describe(option.id, () => {
      it("il testo contrast ha almeno AA 4.5:1 sul fill", () => {
        expect(contrastRatio(option.contrast, option.fill)).toBeGreaterThanOrEqual(AA);
      });

      it("inkLight ha almeno AA 4.5:1 sullo sfondo app light", () => {
        expect(contrastRatio(option.inkLight, APP_LIGHT)).toBeGreaterThanOrEqual(AA);
      });

      it("inkLight ha almeno AA 4.5:1 sulla tint soft del fill", () => {
        const soft = blendOver(option.fill, APP_LIGHT, 0.15);
        expect(contrastRatio(option.inkLight, soft)).toBeGreaterThanOrEqual(AA);
      });

      it("inkDark ha almeno AA 4.5:1 sullo sfondo app dark", () => {
        expect(contrastRatio(option.inkDark, APP_DARK)).toBeGreaterThanOrEqual(AA);
      });

      it("esce coerente dagli helper getAccent*", () => {
        expect(getAccentColor(option.id)).toBe(option.fill);
        expect(getAccentContrast(option.id)).toBe(option.contrast);
        expect(getAccentInk(option.id, false)).toBe(option.inkLight);
        expect(getAccentInk(option.id, true)).toBe(option.inkDark);
      });
    });
  }
});