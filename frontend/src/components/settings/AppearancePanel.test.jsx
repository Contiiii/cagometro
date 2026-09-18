// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import AppearancePanel from "./AppearancePanel";
import { accentOptions } from "../../config/appearance";

const THEME = {
  softSurface: "bg-white/5",
  primaryText: "text-zinc-100",
  muted: "text-zinc-400",
  subtle: "text-zinc-500",
};

const setAccent = vi.fn();
const setTheme = vi.fn();
const setInitialTeamActivityLimit = vi.fn();

function renderPanel(props = {}) {
  return render(
    <AppearancePanel
      theme={THEME}
      accent="pink"
      setAccent={setAccent}
      accentColor="#ec4899"
      themeMode="dark"
      setTheme={setTheme}
      initialTeamActivityLimit={3}
      setInitialTeamActivityLimit={setInitialTeamActivityLimit}
      {...props}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AppearancePanel", () => {
  it("mostra uno swatch colorato per ogni stile della palette", () => {
    const { container } = renderPanel();

    const swatches = [
      ...container.querySelectorAll("span.rounded-full"),
    ].filter((el) => el.className.includes("h-7 w-7"));

    expect(swatches).toHaveLength(accentOptions.length);

    for (const swatch of swatches) {
      expect(swatch.style.backgroundColor).not.toBe("");
      expect(swatch.style.backgroundColor).toMatch(/^rgb\(/);
    }

    expect(screen.getByText("Rosa classico")).toBeTruthy();
    expect(screen.getByText("Viola illegale")).toBeTruthy();
  });

  it("chiama setAccent quando si seleziona uno stile", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Ambra sospetta/ }));

    expect(setAccent).toHaveBeenCalledWith("amber");
  });
});