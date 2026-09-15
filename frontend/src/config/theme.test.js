import { describe, expect, it } from "vitest";

import { getAccentStyles, getTheme } from "./theme";

const REQUIRED_TOKENS = [
  "app",
  "surface",
  "softSurface",
  "primaryText",
  "muted",
  "subtle",
  "secondary",
  "header",
  "input",
  "modal",
  "elevated",
  "overlay",
  "dangerSoft",
  "focusOffset",
  "counterRing",
  "buttonShadow",
  "buttonOuter",
];

describe("getTheme", () => {
  it("espone tutti i token canonici in entrambe le modalità", () => {
    const dark = getTheme(true);
    const light = getTheme(false);

    for (const token of REQUIRED_TOKENS) {
      expect(dark[token], `dark.${token}`).toBeTruthy();
      expect(light[token], `light.${token}`).toBeTruthy();
    }
  });

  it("produce classi diverse tra dark e light", () => {
    const dark = getTheme(true);
    const light = getTheme(false);

    for (const token of REQUIRED_TOKENS) {
      if (token === "subtle") continue;
      expect(dark[token]).not.toBe(light[token]);
    }
  });

  it("usa la palette #0c0c0f per lo sfondo dark", () => {
    const dark = getTheme(true);
    const light = getTheme(false);

    expect(dark.app).toContain("bg-[#0c0c0f]");
    expect(light.app).toContain("bg-[#f8f5f3]");
  });

  it("usa surface zinc in dark e surface bianca in light", () => {
    const dark = getTheme(true);
    const light = getTheme(false);

    expect(dark.surface).toBe("bg-zinc-900/80 border-white/[0.08]");
    expect(light.surface).toBe("bg-white/85 border-zinc-200/80");
  });

  it("non espone token legacy", () => {
    const dark = getTheme(true);

    expect(dark).not.toHaveProperty("text");
    expect(dark).not.toHaveProperty("soft");
    expect(dark).not.toHaveProperty("surfaceAlt");
    expect(dark).not.toHaveProperty("sheet");
    expect(dark).not.toHaveProperty("panel");
    expect(dark).not.toHaveProperty("divider");
    expect(dark).not.toHaveProperty("nav");
  });
});

describe("getAccentStyles", () => {
  it("espone i quattro accent con i token attesi", () => {
    const dark = getAccentStyles(true);

    for (const color of ["pink", "amber", "emerald", "zinc"]) {
      expect(dark[color]).toMatchObject({
        solid: expect.any(String),
        soft: expect.any(String),
        text: expect.any(String),
        line: expect.any(String),
        ring: expect.any(String),
        border: expect.any(String),
      });
    }
  });

  it("varia lo zinc in base alla modalità", () => {
    const dark = getAccentStyles(true).zinc;
    const light = getAccentStyles(false).zinc;

    expect(dark.solid).not.toBe(light.solid);
  });
});