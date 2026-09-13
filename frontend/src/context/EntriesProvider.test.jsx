// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { EntriesProvider } from "./EntriesProvider";
import { useEntries } from "../hooks/useEntries";

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
});