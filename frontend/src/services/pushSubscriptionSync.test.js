import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPendingPushSubscriptionChanges,
  enqueuePushSubscriptionChange,
  readPendingPushSubscriptionChanges,
} from "./pushSubscriptionChange";
import {
  flushPendingPushSubscriptionSync,
  syncPushSubscriptionChange,
} from "./pushSubscriptionSync";
import * as pushService from "./pushService";
import { reportError } from "../utils/reportError";

vi.mock("./pushService", () => ({
  refreshPushSubscription: vi.fn(),
  removePushSubscription: vi.fn(),
  isPushSubscriptionOwnedByOther: vi.fn().mockReturnValue(false),
}));

vi.mock("../utils/reportError", () => ({
  reportError: vi.fn(),
}));

function makeSubscription(endpoint) {
  return {
    endpoint,
    toJSON: () => ({
      endpoint,
      keys: { p256dh: "p256dh", auth: "auth" },
    }),
  };
}

function pushError(statusCode) {
  return {
    statusCode,
    message: `HTTP ${statusCode}`,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  pushService.isPushSubscriptionOwnedByOther.mockReturnValue(false);
  return clearPendingPushSubscriptionChanges();
});

afterEach(() => {
  vi.useRealTimers();
});

async function enqueueFrom(endpoint, oldEndpoint = null) {
  await enqueuePushSubscriptionChange({
    subscription: makeSubscription(endpoint),
    oldSubscription: oldEndpoint ? makeSubscription(oldEndpoint) : null,
  });
}

describe("flushPendingPushSubscriptionSync", () => {
  it("endpoint nuovo senza vecchio: sincronizza e svuota la queue", async () => {
    await enqueueFrom("https://push.example.com/new");

    pushService.refreshPushSubscription.mockResolvedValueOnce(undefined);

    const processed = await flushPendingPushSubscriptionSync();

    expect(processed).toBe(1);
    expect(pushService.refreshPushSubscription).toHaveBeenCalledTimes(1);
    expect(pushService.refreshPushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example.com/new",
      keys: { p256dh: "p256dh", auth: "auth" },
    });
    expect(pushService.removePushSubscription).not.toHaveBeenCalled();
    await expect(readPendingPushSubscriptionChanges()).resolves.toEqual([]);
  });

  it("sostituzione endpoint: refresh nuovo poi remove vecchio", async () => {
    await enqueueFrom("https://push.example.com/new", "https://push.example.com/old");

    pushService.refreshPushSubscription.mockResolvedValueOnce(undefined);
    pushService.removePushSubscription.mockResolvedValueOnce(undefined);

    await flushPendingPushSubscriptionSync();

    expect(pushService.refreshPushSubscription).toHaveBeenCalledTimes(1);
    expect(pushService.removePushSubscription).toHaveBeenCalledTimes(1);
    expect(pushService.removePushSubscription).toHaveBeenCalledWith(
      "https://push.example.com/old",
    );

    const refreshCall = pushService.refreshPushSubscription.mock.invocationCallOrder[0];
    const removeCall = pushService.removePushSubscription.mock.invocationCallOrder[0];

    expect(refreshCall).toBeLessThan(removeCall);
    await expect(readPendingPushSubscriptionChanges()).resolves.toEqual([]);
  });

  it("ritenta il refresh del nuovo endpoint su errori temporanei", async () => {
    await enqueueFrom("https://push.example.com/new", null);

    pushService.refreshPushSubscription
      .mockRejectedValueOnce(pushError(502))
      .mockRejectedValueOnce(pushError(503))
      .mockResolvedValueOnce(undefined);

    const promise = flushPendingPushSubscriptionSync();

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).resolves.toBe(1);
    expect(pushService.refreshPushSubscription).toHaveBeenCalledTimes(3);
    await expect(readPendingPushSubscriptionChanges()).resolves.toEqual([]);
  });

  it("PUSH1 sul nuovo endpoint: niente remove, queue mantenuta", async () => {
    await enqueueFrom("https://push.example.com/new", "https://push.example.com/old");

    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);
    pushService.refreshPushSubscription.mockRejectedValueOnce({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned",
    });

    await flushPendingPushSubscriptionSync();

    expect(pushService.refreshPushSubscription).toHaveBeenCalledTimes(1);
    expect(pushService.removePushSubscription).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
    await expect(readPendingPushSubscriptionChanges()).resolves.toHaveLength(1);
  });

  it("errore di rete sul nuovo endpoint: nessuna perdita, entry mantenuta", async () => {
    await enqueueFrom("https://push.example.com/new", null);

    pushService.refreshPushSubscription.mockRejectedValue(
      new Error("offline"),
    );

    const promise = flushPendingPushSubscriptionSync();

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    const processed = await promise;

    expect(processed).toBe(0);
    expect(pushService.removePushSubscription).not.toHaveBeenCalled();
    await expect(readPendingPushSubscriptionChanges()).resolves.toHaveLength(1);
  });

  it("remove del vecchio endpoint fallito non blocca il clear del nuovo", async () => {
    await enqueueFrom("https://push.example.com/new", "https://push.example.com/old");

    pushService.refreshPushSubscription.mockResolvedValueOnce(undefined);
    pushService.removePushSubscription.mockRejectedValueOnce(
      new Error("remove fallito"),
    );

    const processed = await flushPendingPushSubscriptionSync();

    expect(processed).toBe(1);
    expect(reportError).toHaveBeenCalled();
    await expect(readPendingPushSubscriptionChanges()).resolves.toEqual([]);
  });
});

describe("syncPushSubscriptionChange", () => {
  it("non rimuove un vecchio endpoint identico al nuovo", async () => {
    pushService.refreshPushSubscription.mockResolvedValueOnce(undefined);

    await syncPushSubscriptionChange({
      endpoint: "https://push.example.com/new",
      oldEndpoint: "https://push.example.com/new",
      keys_p256dh: "p256dh",
      keys_auth: "auth",
    });

    expect(pushService.removePushSubscription).not.toHaveBeenCalled();
  });
});