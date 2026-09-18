import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PUSH_SUBSCRIPTION_SYNC_MESSAGE,
  clearPendingPushSubscriptionChanges,
  createPushSubscriptionWithRetry,
  encodeSubscription,
  enqueuePushSubscriptionChange,
  notifyClientsPushSubscriptionSync,
  readPendingPushSubscriptionChanges,
  removePendingPushSubscriptionChange,
} from "./pushSubscriptionChange";

function makeSubscription(endpoint, p256dh = "p256dh", auth = "auth") {
  return {
    endpoint,
    toJSON: () => ({
      endpoint,
      keys: { p256dh, auth },
    }),
  };
}

const pushManager = {
  subscribe: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  return clearPendingPushSubscriptionChanges();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createPushSubscriptionWithRetry", () => {
  it("crea la subscription al primo tentativo", async () => {
    const subscription = makeSubscription("https://push.example.com/new");
    pushManager.subscribe.mockResolvedValueOnce(subscription);

    const result = await createPushSubscriptionWithRetry({
      pushManager,
      applicationServerKey: new Uint8Array(8),
    });

    expect(result).toBe(subscription);
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
  });

  it("ritenta su errori temporanei e poi consegna", async () => {
    const subscription = makeSubscription("https://push.example.com/new");
    pushManager.subscribe
      .mockRejectedValueOnce(new Error("rete assente"))
      .mockResolvedValueOnce(subscription);

    const promise = createPushSubscriptionWithRetry({
      pushManager,
      applicationServerKey: new Uint8Array(8),
      delays: [1000, 2000],
    });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe(subscription);
    expect(pushManager.subscribe).toHaveBeenCalledTimes(2);
  });

  it("dopo il numero massimo di tentativi restituisce l'errore", async () => {
    pushManager.subscribe.mockRejectedValue(new Error("errore persistente"));

    const promise = createPushSubscriptionWithRetry({
      pushManager,
      applicationServerKey: new Uint8Array(8),
      attempts: 3,
      delays: [1000, 2000],
    });

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;

    expect(result.error).toBeInstanceOf(Error);
    expect(pushManager.subscribe).toHaveBeenCalledTimes(3);
  });
});

describe("encodeSubscription", () => {
  it("normalizza una subscription con toJSON", () => {
    expect(encodeSubscription(makeSubscription("https://x")).endpoint).toBe(
      "https://x",
    );
  });

  it("accetta un payload già serializzato", () => {
    expect(
      encodeSubscription({
        endpoint: "https://x",
        keys: { p256dh: "k", auth: "a" },
      }),
    ).toEqual({
      endpoint: "https://x",
      keys: { p256dh: "k", auth: "a" },
    });
  });

  it("restituisce null per subscription incomplete", () => {
    expect(encodeSubscription({ endpoint: "https://x" })).toBeNull();
    expect(encodeSubscription(null)).toBeNull();
  });
});

describe("queue push subscription change", () => {
  it("accoda un nuovo endpoint e lo rilegge", async () => {
    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/new"),
      oldSubscription: makeSubscription("https://push.example.com/old"),
    });

    const pending = await readPendingPushSubscriptionChanges();

    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      endpoint: "https://push.example.com/new",
      oldEndpoint: "https://push.example.com/old",
      keys_p256dh: "p256dh",
      keys_auth: "auth",
    });
  });

  it("accoda senza vecchio endpoint (reinstallazione/reset)", async () => {
    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/new"),
      oldSubscription: null,
    });

    const pending = await readPendingPushSubscriptionChanges();

    expect(pending[0].oldEndpoint).toBeNull();
  });

  it("è idempotente: stesso endpoint nuovo non duplica la riga", async () => {
    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/new"),
      oldSubscription: makeSubscription("https://push.example.com/old"),
    });

    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/new"),
      oldSubscription: null,
    });

    const pending = await readPendingPushSubscriptionChanges();

    expect(pending).toHaveLength(1);
    expect(pending[0].oldEndpoint).toBeNull();
  });

  it("rimuove una singola entry dalla queue", async () => {
    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/a"),
    });
    await enqueuePushSubscriptionChange({
      subscription: makeSubscription("https://push.example.com/b"),
    });

    await removePendingPushSubscriptionChange("https://push.example.com/a");

    const pending = await readPendingPushSubscriptionChanges();

    expect(pending.map((entry) => entry.endpoint)).toEqual([
      "https://push.example.com/b",
    ]);
  });
});

describe("notifyClientsPushSubscriptionSync", () => {
  it("posta il messaggio a tutti i client window", async () => {
    const clientA = { postMessage: vi.fn() };
    const clientB = { postMessage: vi.fn() };
    const workerScope = {
      clients: {
        matchAll: vi.fn().mockResolvedValueOnce([clientA, clientB]),
      },
    };

    await notifyClientsPushSubscriptionSync(workerScope);

    expect(workerScope.clients.matchAll).toHaveBeenCalledWith({
      type: "window",
      includeUncontrolled: true,
    });
    expect(clientA.postMessage).toHaveBeenCalledWith({
      type: PUSH_SUBSCRIPTION_SYNC_MESSAGE,
    });
    expect(clientB.postMessage).toHaveBeenCalledWith({
      type: PUSH_SUBSCRIPTION_SYNC_MESSAGE,
    });
  });
});