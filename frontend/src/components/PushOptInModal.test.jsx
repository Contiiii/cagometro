// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import PushOptInModal from "./PushOptInModal";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

vi.mock("../hooks/useInstallPrompt", () => ({
  useInstallPrompt: vi.fn(() => ({
    canInstall: false,
    installed: false,
    install: vi.fn(),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useInstallPrompt.mockReturnValue({
    canInstall: false,
    installed: false,
    install: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

function renderModal(overrides = {}) {
  const props = {
    open: true,
    mode: "optin",
    isBusy: false,
    error: null,
    isDark: true,
    prefersReducedMotion: true,
    onAccept: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };

  render(<PushOptInModal {...props} />);

  return props;
}

describe("PushOptInModal", () => {
  it("non renderizza nulla quando è chiuso", () => {
    renderModal({ open: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra il prompt di opt-in e invoca onAccept", () => {
    const { onAccept } = renderModal();

    expect(
      screen.getByRole("heading", { name: /vuoi ricevere le notifiche/i }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /attiva notifiche/i }),
    );

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("chiude senza attivare con 'Non ora'", () => {
    const { onClose, onAccept } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: /non ora/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("disabilita i pulsanti mentre è occupato", () => {
    renderModal({ isBusy: true });

    expect(
      screen.getByRole("button", { name: /attivazione/i }).disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: /non ora/i }).disabled).toBe(
      true,
    );
  });

  it("mostra l'errore ricevuto", () => {
    renderModal({ error: "Service worker non disponibile" });

    expect(
      screen.getByText(/service worker non disponibile/i),
    ).toBeTruthy();
  });

  it("in modalità install mostra le istruzioni per la Home", () => {
    renderModal({ mode: "install" });

    expect(
      screen.getByRole("heading", { name: /aggiungi cagometro alla home/i }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /attiva notifiche/i }),
    ).toBeNull();
  });

  it("in modalità install mostra 'Installa app' quando disponibile", () => {
    const install = vi.fn();

    useInstallPrompt.mockReturnValue({
      canInstall: true,
      installed: false,
      install,
    });

    renderModal({ mode: "install" });

    fireEvent.click(screen.getByRole("button", { name: /installa app/i }));

    expect(install).toHaveBeenCalledTimes(1);
  });
});
