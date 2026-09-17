// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "./useInstallPrompt";

vi.mock("../services/analyticsService", () => ({
  trackEvent: vi.fn(() => Promise.resolve()),
  trackEventOnce: vi.fn(() => Promise.resolve()),
  flushAnalyticsQueue: vi.fn(() => Promise.resolve()),
}));

import { trackEvent, trackEventOnce } from "../services/analyticsService";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeBeforeInstallPromptEvent(outcome = "accepted") {
  const event = new Event("beforeinstallprompt", {
    cancelable: true,
  });

  Object.defineProperty(event, "prompt", {
    value: vi.fn(),
    configurable: true,
  });

  Object.defineProperty(event, "userChoice", {
    value: Promise.resolve({ outcome }),
    configurable: true,
  });

  return event;
}

describe("useInstallPrompt", () => {
  it("non propone l'installazione finché il browser non la permette", () => {
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
    expect(result.current.installed).toBe(false);
  });

  it("espone canInstall dopo beforeinstallprompt", () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(makeBeforeInstallPromptEvent());
    });

    expect(result.current.canInstall).toBe(true);
    expect(trackEventOnce).toHaveBeenCalledWith(
      "pwa_install_available",
      "pwa_install_available",
      {},
    );
  });

  it("chiama prompt e conferma l'installazione accettata", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(makeBeforeInstallPromptEvent());
    });

    let accepted;

    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(true);
    expect(result.current.canInstall).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith("pwa_install_prompt", {
      outcome: "accepted",
    });
  });

  it("traccia l'esito dismissed quando l'utente rifiuta", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(makeBeforeInstallPromptEvent("dismissed"));
    });

    let accepted;

    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith("pwa_install_prompt", {
      outcome: "dismissed",
    });
  });

  it("torna false se non c'è alcun prompt in attesa", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let accepted;

    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
  });

  it("segna come installata l'app dopo appinstalled", () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.installed).toBe(true);
    expect(result.current.canInstall).toBe(false);
    expect(trackEventOnce).toHaveBeenCalledWith(
      "pwa_installed",
      "pwa_installed",
      {},
    );
  });
});