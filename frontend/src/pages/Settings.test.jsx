// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { isMobileDevice } from "../utils/userAgent";
import { OWNER_EMAILS } from "../config/admin";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../utils/userAgent", () => ({
  isMobileDevice: vi.fn(() => true),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

vi.mock("../hooks/useSettings", () => ({
  useSettings: vi.fn(),
}));

vi.mock("../hooks/useEntries", () => ({
  useEntries: vi.fn(),
}));

vi.mock("../../services/quotaService", () => ({
  fetchQuotaSnapshot: vi.fn(async () => null),
}));

vi.mock("../hooks/usePush", () => ({
  usePush: vi.fn(() => ({
    isSupported: true,
    permission: "granted",
    isSubscribed: true,
    isBusy: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    devices: [],
    devicesLoading: false,
    currentEndpoint: null,
    removeDevice: vi.fn(),
  })),
}));

import CagometroSettings from "./Settings";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { useEntries } from "../hooks/useEntries";

const USER = { id: "u-1", email: "mario@test.it" };

function setupMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  OWNER_EMAILS.splice(0, OWNER_EMAILS.length, "andreaconti05@gmail.com");
});

beforeEach(() => {
  setupMatchMedia();
});

const DEFAULT_SETTINGS = {
  accent: "pink",
  setAccent: vi.fn(),
  vibrationEnabled: true,
  initialTeamActivityLimit: 3,
  dailyReminder: false,
  streakAlerts: false,
  achievementAlerts: false,
  teamEntryAlerts: false,
  teamMemberAlerts: false,
  teamAchievementAlerts: false,
  updateSetting: vi.fn(),
};

const DEFAULT_ENTRIES = {
  entries: {},
  syncStatus: "synced",
  pendingOps: [],
  today: "2026-09-16",
  todayCount: 0,
  incrementToday: vi.fn(),
  decrementToday: vi.fn(),
  clearLocalData: vi.fn(),
  retrySync: vi.fn(async () => true),
};

function renderSettings(overrides = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: overrides.user ?? null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  });

  vi.mocked(useProfile).mockReturnValue({
    profile: overrides.profile ?? null,
    updateProfile: vi.fn(),
  });

  vi.mocked(useTheme).mockReturnValue({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: vi.fn(),
    isDark: true,
  });

  vi.mocked(useSettings).mockReturnValue({
    ...DEFAULT_SETTINGS,
    ...overrides.settings,
  });

  vi.mocked(useEntries).mockReturnValue({
    ...DEFAULT_ENTRIES,
    ...overrides.entries,
  });

  return render(<CagometroSettings />);
}

describe("CagometroSettings", () => {
  it("si apre senza crash per un utente non loggato", () => {
    renderSettings();

    expect(screen.getByText("Impostazioni")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Vai allo stato di sincronizzazione" }),
    ).toBeTruthy();
    expect(screen.getByText("Nessuna email collegata")).toBeTruthy();
  });

  it("si apre senza crash per un utente loggato con modifiche in attesa", () => {
    const pendingOps = [
      { id: "op-1", type: "saveEntry", payload: { date: "2026-09-16", count: 1 } },
    ];

    renderSettings({
      user: USER,
      entries: { syncStatus: "pending", pendingOps },
    });

    expect(screen.getByText("Impostazioni")).toBeTruthy();
    expect(screen.getByText("mario@test.it")).toBeTruthy();
  });

  it("mostra il conteggio delle modifiche in attesa nel pannello di sistema", async () => {
    const pendingOps = [
      { id: "op-1", type: "saveEntry", payload: { date: "2026-09-16", count: 1 } },
    ];

    renderSettings({
      user: USER,
      entries: { syncStatus: "pending", pendingOps },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Dati e sincronizzazione/ }),
    );

    expect(await screen.findByText("1 modifica in attesa")).toBeTruthy();
    expect(screen.getByText("Totale segnalazioni")).toBeTruthy();
    expect(screen.getByText("0 (+1)")).toBeTruthy();
  });

  it("mostra il pannello notifiche senza crash", async () => {
    renderSettings({ user: USER });

    fireEvent.click(screen.getByRole("button", { name: /Notifiche/ }));

    expect(await screen.findByText("Notifiche del dispositivo")).toBeTruthy();
  });

  it("apre la guida per aggiungere l'app alla Home dal pulsante nell'header", async () => {
    renderSettings({ user: USER });

    fireEvent.click(
      screen.getByRole("button", { name: "Aggiungi alla Home" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Aggiungi Cagometro alla Home",
      }),
    ).toBeTruthy();
  });

  it("nasconde il pulsante installazione su un dispositivo desktop", () => {
    vi.mocked(isMobileDevice).mockReturnValue(false);

    renderSettings({ user: USER });

    expect(
      screen.queryByRole("button", { name: "Aggiungi alla Home" }),
    ).toBeFalsy();
  });

  it("mostra i consumi del piano solo all'account proprietario", async () => {
    OWNER_EMAILS.splice(0, OWNER_EMAILS.length, "mario@test.it");

    renderSettings({ user: USER });

    fireEvent.click(screen.getByRole("button", { name: /Account/ }));

    expect(await screen.findByText("Risorse del servizio")).toBeTruthy();
  });

  it("nasconde i consumi del piano agli altri account", async () => {
    OWNER_EMAILS.splice(0, OWNER_EMAILS.length);

    renderSettings({ user: USER });

    fireEvent.click(screen.getByRole("button", { name: /Account/ }));

    expect(screen.queryByText("Risorse del servizio")).toBeFalsy();
    expect(await screen.findByText("Le cose importanti")).toBeTruthy();
  });

  it("mostra uno skeleton finché le impostazioni stanno caricando", () => {
    const { container } = renderSettings({ settings: { loading: true } });

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
    expect(screen.queryByText("Stile")).toBeFalsy();
  });
});