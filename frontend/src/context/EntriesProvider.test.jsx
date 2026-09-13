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
});