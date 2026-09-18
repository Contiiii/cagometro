// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "../lib/supabase";
import {
  updateProfile,
  flushProfileQueue,
} from "./profileService";

import {
  loadPendingOps,
} from "../utils/pendingQueue";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const USER_ID = "user-1";

function setOnline(value) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("profileService", () => {
  it("updateProfile online chiama supabase e non accoda", async () => {
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { user_id: USER_ID, display_name: "Pippo", avatar_url: null },
              error: null,
            }),
          }),
        }),
      }),
    });

    const result = await updateProfile({
      userId: USER_ID,
      displayName: "Pippo",
      avatarUrl: null,
    });

    expect(result).toEqual({
      user_id: USER_ID,
      display_name: "Pippo",
      avatar_url: null,
    });
    expect(loadPendingOps(USER_ID)).toEqual([]);
  });

  it("updateProfile offline accoda la modifica", async () => {
    setOnline(false);

    const result = await updateProfile({
      userId: USER_ID,
      displayName: "Paperino",
      avatarUrl: "avatar.png",
    });

    expect(result).toEqual({ queued: true });

    const ops = loadPendingOps(USER_ID);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      type: "updateProfile",
      payload: { display_name: "Paperino", avatar_url: "avatar.png" },
    });
  });

  it("updateProfile con errore di rete accoda la modifica", async () => {
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockRejectedValue(new Error("Failed to fetch")),
          }),
        }),
      }),
    });

    const result = await updateProfile({
      userId: USER_ID,
      displayName: "Paperina",
      avatarUrl: null,
    });

    expect(result).toEqual({ queued: true });
    expect(loadPendingOps(USER_ID)).toHaveLength(1);
  });

  it("updateProfile con errore non di rete ripropaga l'errore", async () => {
    const serverError = new Error("Row level security violated");
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(serverError),
          }),
        }),
      }),
    });

    await expect(
      updateProfile({ userId: USER_ID, displayName: "X", avatarUrl: null }),
    ).rejects.toThrow("Row level security violated");
    expect(loadPendingOps(USER_ID)).toEqual([]);
  });

  it("flushProfileQueue invia le ops in coda e le rimuove", async () => {
    const queuedPayload = {
      display_name: "Queued",
      avatar_url: null,
    };

    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    });

    supabase.from.mockReturnValue({ update: updateFn });

    // preparo la coda direttamente
    const { enqueueOp } = await import("../utils/pendingQueue");
    enqueueOp(USER_ID, { type: "updateProfile", payload: queuedPayload });

    const ok = await flushProfileQueue(USER_ID);

    expect(ok).toBe(true);
    expect(updateFn).toHaveBeenCalledWith(queuedPayload);
    expect(loadPendingOps(USER_ID)).toEqual([]);
  });

  it("flushProfileQueue senza coda restituisce true senza chiamare supabase", async () => {
    const ok = await flushProfileQueue(USER_ID);

    expect(ok).toBe(true);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("flushProfileQueue con errore mantiene la coda e restituisce false", async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "offline" },
          }),
        }),
      }),
    });
    supabase.from.mockReturnValue({ update: updateFn });

    const { enqueueOp } = await import("../utils/pendingQueue");
    enqueueOp(USER_ID, {
      type: "updateProfile",
      payload: { display_name: "X", avatar_url: null },
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const ok = await flushProfileQueue(USER_ID);

    expect(ok).toBe(false);
    expect(loadPendingOps(USER_ID)).toHaveLength(1);
    consoleSpy.mockRestore();
  });
});