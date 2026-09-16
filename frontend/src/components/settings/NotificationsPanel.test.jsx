// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import NotificationsPanel from "./NotificationsPanel";

vi.mock("../../hooks/usePush", () => ({
  usePush: vi.fn(() => ({
    isSupported: true,
    permission: "granted",
    isSubscribed: true,
    isBusy: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
}));

import { usePush } from "../../hooks/usePush";

afterEach(() => {
  cleanup();
});

const THEME = {
  primaryText: "text-zinc-100",
  muted: "text-zinc-400",
  subtle: "text-zinc-500",
  softSurface: "bg-white/5",
};

function renderPanel(overrides) {
  const push = {
    isSupported: true,
    permission: "granted",
    isSubscribed: true,
    isBusy: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    ...overrides,
  };

  vi.mocked(usePush).mockReturnValue(push);

  return render(
    <NotificationsPanel
      theme={THEME}
      accentColor="#22c55e"
      dailyReminder={false}
      streakAlerts={false}
      achievementAlerts={false}
      teamEntryAlerts={false}
      teamMemberAlerts={false}
      teamAchievementAlerts={false}
      updateSetting={vi.fn()}
    />,
  );
}

function cardButton(title) {
  return screen.getByRole("button", { name: new RegExp(title) });
}

describe("NotificationsPanel", () => {
  it("mostra stato attivo quando push e permessi sono concessi", () => {
    renderPanel();

    expect(screen.getByText("Notifiche del dispositivo")).toBeTruthy();
    expect(
      screen.getByText("Le notifiche sono attive su questo dispositivo."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Disattiva" })).toBeTruthy();
  });

  it("invita ad attivare le notifiche quando non c'è ancora una subscription", () => {
    renderPanel({ permission: "default", isSubscribed: false });

    expect(
      screen.getByText("Attiva le notifiche per ricevere gli avvisi scelti qui sotto."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attiva" })).toBeTruthy();
  });

  it("avvisa quando il permesso è stato negato", () => {
    renderPanel({ permission: "denied", isSubscribed: false });

    expect(
      screen.getByText("Permesso negato. Aggiornalo dalle impostazioni del browser."),
    ).toBeTruthy();
  });

  it("nasconde toggle e bottone quando il browser non supporta il push", () => {
    renderPanel({ isSupported: false });

    expect(
      screen.getByText("Questo browser non supporta le notifiche."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Attiva" })).toBeNull();
  });

  it("chiama unsubscribe quando il push è attivo", () => {
    const unsubscribe = vi.fn();
    renderPanel({ unsubscribe });

    fireEvent.click(screen.getByRole("button", { name: "Disattiva" }));
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("chiama subscribe quando il push non è attivo", () => {
    const subscribe = vi.fn();
    renderPanel({ permission: "default", isSubscribed: false, subscribe });

    fireEvent.click(screen.getByRole("button", { name: "Attiva" }));
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("aggiorna le singole preferenze con updateSetting", () => {
    const updateSetting = vi.fn();
    vi.mocked(usePush).mockReturnValue({
      isSupported: true,
      permission: "granted",
      isSubscribed: true,
      isBusy: false,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    render(
      <NotificationsPanel
        theme={THEME}
        accentColor="#22c55e"
        dailyReminder={false}
        streakAlerts={false}
        achievementAlerts={false}
        teamEntryAlerts={false}
        teamMemberAlerts={false}
        teamAchievementAlerts={false}
        updateSetting={updateSetting}
      />,
    );

    fireEvent.click(cardButton("Promemoria giornaliero"));
    expect(updateSetting).toHaveBeenCalledWith("dailyReminder", true);

    fireEvent.click(cardButton("Avvisi streak"));
    expect(updateSetting).toHaveBeenCalledWith("streakAlerts", true);
  });

  it("disabilita i toggle delle preferenze quando il push non è attivo", () => {
    renderPanel({ permission: "default", isSubscribed: false });

    expect(cardButton("^TraguardiQuando")).toBeDefined();
    expect(cardButton("Promemoria giornaliero").disabled).toBe(true);
    expect(cardButton("Traguardi in squadra").disabled).toBe(true);
  });
});