// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { EntriesProvider } from "./EntriesProvider";
import { useEntries } from "../hooks/useEntries";

import { getEntries } from "../services/entriesService";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/entriesService", () => ({
  getEntries: vi.fn().mockResolvedValue([]),
  saveEntry: vi.fn().mockRejectedValue(new Error("offline")),
  importEntries: vi.fn().mockResolvedValue([]),
}));

let latest = null;

function Probe() {
  const value = useEntries();

  useEffect(() => {
    latest = value;
  });

  return null;
}

beforeEach(() => {
  vi.clearAllMocks();

  latest = null;

  window.localStorage.clear();

  useAuth.mockReturnValue({ user: null, loading: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EntriesProvider", () => {
  it("senza utente espone syncStatus 'synced' e pendingChanges vuoto", async () => {
    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(latest.syncStatus).toBe("synced");
    expect(latest.pendingChanges).toEqual([]);
  });

  it("clearLocalData resetta entries, pendingChanges e syncStatus", async () => {
    useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

    render(
      <EntriesProvider>
        <Probe />
      </EntriesProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    await act(async () => {
      await latest.incrementToday();
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(latest.syncStatus).toBe("pending");
    expect(latest.pendingChanges.length).toBeGreaterThan(0);

    await act(async () => {
      latest.clearLocalData();
    });

    expect(latest.entries).toEqual({});
    expect(latest.pendingChanges).toEqual([]);
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

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    // L'utente passa all'account B mentre il fetch di A è ancora in volo
    useAuth.mockReturnValue({ user: { id: "user-b" }, loading: false });

    await act(async () => {
      view.rerender(
        <EntriesProvider>
          <Probe />
        </EntriesProvider>,
      );

      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    // Arriva in ritardo la risposta dell'account precedente
    await act(async () => {
      resolveOldFetch([{ date: "2026-09-12", count: 7 }]);
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(latest.entries).toEqual({ "2026-09-13": 3 });
  });
});