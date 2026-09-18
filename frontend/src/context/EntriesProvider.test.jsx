// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { EntriesProvider } from "./EntriesProvider";
import { useEntries } from "../hooks/useEntries";

import { getEntries, saveEntry, importEntries } from "../services/entriesService";
import { createTeamActivity, removeTeamActivity } from "../services/teamService";

import { getLocalDateKey } from "../utils/date";
import {
  saveAnonymousEntries,
  saveUserEntries,
} from "../utils/storage";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/entriesService", () => ({
  getEntries: vi.fn().mockResolvedValue([]),
  saveEntry: vi.fn().mockRejectedValue(new Error("offline")),
  importEntries: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/teamService", () => ({
  createTeamActivity: vi.fn().mockResolvedValue(undefined),
  removeTeamActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/analyticsService", () => ({
  trackEvent: vi.fn(() => Promise.resolve()),
  trackEventOnce: vi.fn(() => Promise.resolve()),
  flushAnalyticsQueue: vi.fn(() => Promise.resolve()),
  hasRecorded: vi.fn(() => false),
  markRecorded: vi.fn(),
}));

import { trackEvent } from "../services/analyticsService";

let latest = null;

function Probe() {
  const value = useEntries();

  useEffect(() => {
    latest = value;
  });

  return null;
}

function setOnline(value) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
}

function flushAsync() {
  return act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  latest = null;

  window.localStorage.clear();

  setOnline(true);

  getEntries.mockResolvedValue([]);
  saveEntry.mockRejectedValue(new Error("offline"));
  importEntries.mockResolvedValue([]);
  createTeamActivity.mockResolvedValue(undefined);

  useAuth.mockReturnValue({ user: null, loading: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EntriesProvider", () => {
  it("senza utente espone syncStatus 'synced' e pendingOps vuoto", async () => {
    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    expect(latest.syncStatus).toBe("synced");
    expect(latest.pendingOps).toEqual([]);
  });

  it("clearLocalData resetta entries, pendingOps e syncStatus", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    expect(latest.syncStatus).toBe("pending");
    expect(latest.pendingOps.length).toBeGreaterThan(0);

    await act(async () => {
      latest.clearLocalData();
    });

    expect(latest.entries).toEqual({});
    expect(latest.pendingOps).toEqual([]);
    expect(latest.syncStatus).toBe("synced");
  });

  it("al cambio account i dati del vecchio utente non sovrascrivono quelli del nuovo", async () => {
    let resolveOldFetch;

    getEntries
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldFetch = resolve;
          }),
      )
      .mockImplementationOnce(async () => [{ date: "2026-09-13", count: 3 }]);

    useAuth.mockReturnValue({ user: { id: "user-a" }, loading: false });

    const view = render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    useAuth.mockReturnValue({ user: { id: "user-b" }, loading: false });

    await act(async () => {
      view.rerender(
        <EntriesProvider>
          <Probe />
        </EntriesProvider>,
      );

      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await act(async () => {
      resolveOldFetch([{ date: "2026-09-12", count: 7 }]);
    });

    await flushAsync();

    expect(latest.entries).toEqual({ "2026-09-13": 3 });
  });

  it("incrementToday offline accumula pendingOps e passa a 'pending'", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    expect(latest.entries).toEqual({ [today]: 1 });
    const saveEntryOps = latest.pendingOps.filter((op) => op.type === "saveEntry");
    expect(saveEntryOps).toHaveLength(1);
    expect(saveEntryOps[0].payload).toEqual({ date: today, count: 1 });
    expect(latest.syncStatus).toBe("pending");
    expect(saveEntry).toHaveBeenCalledWith({
      userId: "user-1",
      date: today,
      count: 1,
    });
  });

  it("al ritorno online flusha i pendingOps e torna 'synced'", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    setOnline(true);

    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await flushAsync();

    expect(importEntries).toHaveBeenCalledWith("user-1", { [today]: 1 });
    expect(latest.pendingOps).toEqual([]);
    expect(latest.syncStatus).toBe("synced");
  });

  it("se il flush fallisce passa a 'error' e un nuovo flush recupera a 'synced'", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    importEntries.mockRejectedValueOnce(new Error("rete"));

    setOnline(true);

    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    // Wait for flush to complete and error state to propagate
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    });

    expect(latest.syncStatus).toBe("error");
    const saveEntryOps = latest.pendingOps.filter((op) => op.type === "saveEntry");
    expect(saveEntryOps).toHaveLength(1);
    expect(saveEntryOps[0].payload).toEqual({ date: today, count: 1 });

    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await flushAsync();

    expect(latest.pendingOps).toEqual([]);
    expect(latest.syncStatus).toBe("synced");
  });

  it("retrySync espone un flush manuale che recupera i pending a 'synced'", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    expect(latest.syncStatus).toBe("pending");

    setOnline(true);

    let ok;

    await act(async () => {
      ok = await latest.retrySync();
    });

    await flushAsync();

    expect(ok).toBe(true);
    expect(importEntries).toHaveBeenCalledWith("user-1", { [today]: 1 });
    expect(latest.pendingOps).toEqual([]);
    expect(latest.syncStatus).toBe("synced");
  });

  it("non perde le operazioni accodate durante un flush in corso", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    expect(latest.syncStatus).toBe("pending");

    let resolveImport;
    importEntries.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );

    let flushPromise;
    let flushDone = false;
    await act(async () => {
      flushPromise = latest.retrySync();
      flushPromise.then(() => {
        flushDone = true;
      });
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(flushDone).toBe(false);

    // Durante l'await del flush accodo un'altra operazione, senza rete
    await act(async () => {
      await latest.incrementToday();
    });

    await act(async () => {
      resolveImport([]);
      const ok = await flushPromise;
      expect(ok).toBe(true);
    });

    await flushAsync();

    // La prima operazione è andata a buon fine, la seconda resta in coda
    expect(importEntries).toHaveBeenCalledWith("user-1", { [today]: 1 });

    const remaining = latest.pendingOps.filter(
      (op) => op.type === "saveEntry",
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].payload).toEqual({ date: today, count: 2 });
    expect(latest.syncStatus).toBe("pending");
  });

  it("retrySync fallito mantiene 'error' e restituisce false", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    importEntries.mockRejectedValueOnce(new Error("rete"));

    let ok;

    await act(async () => {
      ok = await latest.retrySync();
    });

    await flushAsync();

    expect(ok).toBe(false);
    expect(latest.syncStatus).toBe("error");
    expect(latest.pendingOps.length).toBeGreaterThan(0);
  });

  it("retrySync senza pending non chiama importEntries", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    let ok;

    await act(async () => {
      ok = await latest.retrySync();
    });

    expect(ok).toBe(true);
    expect(importEntries).not.toHaveBeenCalled();
    expect(latest.syncStatus).toBe("synced");
  });

  it("due increment offline sulla stessa data producono pending separati che si uniscono al flush", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const today = getLocalDateKey();

    expect(latest.entries).toEqual({ [today]: 2 });
    const saveEntryOps = latest.pendingOps.filter((op) => op.type === "saveEntry");
    expect(saveEntryOps).toHaveLength(2);
    expect(saveEntryOps[0].payload).toEqual({ date: today, count: 1 });
    expect(saveEntryOps[1].payload).toEqual({ date: today, count: 2 });
  });

  it("incrementToday online chiama saveEntry e createTeamActivity", async () => {
    saveEntry.mockResolvedValue([]);

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    const today = getLocalDateKey();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    expect(saveEntry).toHaveBeenCalledWith({
      userId: "user-1",
      date: today,
      count: 1,
    });
    expect(createTeamActivity).toHaveBeenCalledWith(
      "entry_created",
      1,
      null,
      expect.any(String),
      [],
    );
    expect(latest.syncStatus).toBe("synced");
    expect(latest.pendingOps).toEqual([]);
  });

  it("offline: l'op attività accodata riusa la stessa dedupKey al flush", async () => {
    setOnline(false);

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const activityOps = latest.pendingOps.filter(
      (op) => op.type === "createTeamActivity",
    );
    expect(activityOps).toHaveLength(1);

    const dedupKey = activityOps[0].payload.dedupKey;
    expect(dedupKey).toBeTruthy();
    expect(activityOps[0].payload).toEqual({
      activityType: "entry_created",
      points: 1,
      dedupKey,
      teamIds: [],
    });

    setOnline(true);

    await act(async () => {
      await latest.retrySync();
    });

    await flushAsync();

    expect(createTeamActivity).toHaveBeenCalledWith(
      "entry_created",
      1,
      null,
      dedupKey,
      [],
    );
  });

  it("retry dopo attempt diretto fallito riusa la stessa dedupKey", async () => {
    saveEntry.mockResolvedValue([]);
    createTeamActivity.mockRejectedValueOnce(new Error("timeout"));

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    const firstCall = createTeamActivity.mock.calls[0];
    const queuedActivity = latest.pendingOps.find(
      (op) => op.type === "createTeamActivity",
    );

    expect(firstCall).toEqual([
      "entry_created",
      1,
      null,
      queuedActivity.payload.dedupKey,
      [],
    ]);
    expect(latest.syncStatus).toBe("pending");

  createTeamActivity.mockResolvedValue(undefined);
  removeTeamActivity.mockResolvedValue(undefined);

    await act(async () => {
      await latest.retrySync();
    });

    await flushAsync();

    expect(createTeamActivity).toHaveBeenLastCalledWith(
      "entry_created",
      1,
      null,
      firstCall[3],
      [],
    );
    expect(latest.syncStatus).toBe("synced");
  });

  it("flush usa op.id come dedupKey per le attività legacy senza dedupKey", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    const legacyOp = {
      id: "legacy-op-1",
      timestamp: Date.now(),
      type: "createTeamActivity",
      payload: { activityType: "entry_created", points: 1 },
    };

    window.localStorage.setItem(
      "pending_ops_user-1",
      JSON.stringify([legacyOp]),
    );

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    expect(createTeamActivity).toHaveBeenCalledWith(
      "entry_created",
      1,
      null,
      "legacy-op-1",
      null,
    );
  });

  it("decrementToday a zero non modifica nulla", async () => {
    saveEntry.mockResolvedValue([]);

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.decrementToday();
    });

    await flushAsync();

    expect(latest.entries).toEqual({});
    expect(latest.pendingOps).toEqual([]);
    expect(latest.syncStatus).toBe("synced");
    expect(saveEntry).not.toHaveBeenCalled();
  });

  it("decrementToday offline accumula pending", async () => {
    setOnline(false);

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    const today = getLocalDateKey();

    saveUserEntries("user-1", { [today]: 2 });
    getEntries.mockResolvedValue([{ date: today, count: 2 }]);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.decrementToday();
    });

    await flushAsync();

    expect(latest.entries).toEqual({ [today]: 1 });
    expect(latest.pendingOps).toEqual([
      expect.objectContaining({
        type: "saveEntry",
        payload: { date: today, count: 1 },
      }),
      expect.objectContaining({
        type: "removeTeamActivity",
        payload: expect.objectContaining({ activityType: "entry_created" }),
      }),
    ]);
    expect(latest.syncStatus).toBe("pending");
  });

  it("decrementToday online rimuove l'attività di squadra", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    const today = getLocalDateKey();

    saveUserEntries("user-1", { [today]: 2 });
    getEntries.mockResolvedValue([{ date: today, count: 2 }]);
    saveEntry.mockResolvedValue([{ date: today, count: 1 }]);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.decrementToday();
    });

    await flushAsync();

    expect(latest.entries).toEqual({ [today]: 1 });
    expect(saveEntry).toHaveBeenCalledWith({
      userId: "user-1",
      date: today,
      count: 1,
    });
    expect(removeTeamActivity).toHaveBeenCalledWith(
      "entry_created",
      expect.any(String),
      [],
    );
    expect(latest.syncStatus).toBe("synced");
  });

  it("al primo login migra le entries anonime e rimuove la chiave locale", async () => {
    const anonymousEntries = { "2026-09-13": 5, "2026-09-14": 2 };

    saveAnonymousEntries(anonymousEntries);

    importEntries.mockResolvedValue([
      { date: "2026-09-13", count: 5 },
      { date: "2026-09-14", count: 2 },
    ]);

    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    expect(importEntries).toHaveBeenCalledWith("user-1", anonymousEntries);
    expect(latest.entries).toEqual(anonymousEntries);
    expect(window.localStorage.getItem("entries_anonymous")).toBeNull();
  });

  it("cambio account rapido non contamina i dati tra utenti", async () => {
    getEntries
      .mockResolvedValueOnce([{ date: "2026-09-10", count: 1 }])
      .mockResolvedValueOnce([{ date: "2026-09-11", count: 2 }])
      .mockResolvedValueOnce([{ date: "2026-09-12", count: 3 }]);

    useAuth.mockReturnValue({ user: { id: "user-a" }, loading: false });

    const view = render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    expect(latest.entries).toEqual({ "2026-09-10": 1 });

    useAuth.mockReturnValue({ user: { id: "user-b" }, loading: false });

    await act(async () => {
      view.rerender(
        <EntriesProvider>
          <Probe />
        </EntriesProvider>,
      );

      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await flushAsync();

    expect(latest.entries).toEqual({ "2026-09-11": 2 });

    useAuth.mockReturnValue({ user: { id: "user-c" }, loading: false });

    await act(async () => {
      view.rerender(
        <EntriesProvider>
          <Probe />
        </EntriesProvider>,
      );

      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await flushAsync();

    expect(latest.entries).toEqual({ "2026-09-12": 3 });

    const entriesOfA = JSON.parse(
      window.localStorage.getItem("entries_user_user-a"),
    );
    const entriesOfB = JSON.parse(
      window.localStorage.getItem("entries_user_user-b"),
    );
    const entriesOfC = JSON.parse(
      window.localStorage.getItem("entries_user_user-c"),
    );

    expect(entriesOfA).toEqual({ "2026-09-10": 1 });
    expect(entriesOfB).toEqual({ "2026-09-11": 2 });
    expect(entriesOfC).toEqual({ "2026-09-12": 3 });
  });

  it("traccia sync_batch ok quando un flush recupera i pending", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    setOnline(true);

    await act(async () => {
      await latest.retrySync();
    });

    await flushAsync();

    expect(trackEvent).toHaveBeenCalledWith(
      "sync_batch",
      expect.objectContaining({ ok: true }),
    );
  });

  it("traccia sync_batch ko quando il flush fallisce", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    importEntries.mockRejectedValueOnce(new Error("rete"));

    let ok;

    await act(async () => {
      ok = await latest.retrySync();
    });

    await flushAsync();

    expect(ok).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith(
      "sync_batch",
      expect.objectContaining({ ok: false }),
    );
  });

  it("traccia offline_registration quando una registrazione finisce in coda", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    setOnline(false);

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await flushAsync();

    const today = getLocalDateKey();

    await act(async () => {
      await latest.incrementToday();
    });

    await flushAsync();

    expect(trackEvent).toHaveBeenCalledWith("offline_registration", {
      date: today,
      count: 1,
    });
  });
});