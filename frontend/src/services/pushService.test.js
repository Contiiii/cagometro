// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendMyPushNotification,
} from "./pushService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

function mockPushEnvironment({
  permission = "default",
  hasSubscription = false,
  serviceWorkerAvailable = true,
} = {}) {
  const subscription = hasSubscription
    ? {
        endpoint: "endpoint-1",
        toJSON: () => ({
          endpoint: "endpoint-1",
          keys: { p256dh: "p256dh-key", auth: "auth-key" },
        }),
        unsubscribe: vi.fn().mockResolvedValue(true),
      }
    : null;

  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(subscription),
    subscribe: vi.fn().mockResolvedValue(subscription ?? createSubscription()),
  };

  const swRegistration = {
    pushManager,
    showNotification: vi.fn(),
  };

  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: {
      permission,
      requestPermission: vi
        .fn()
        .mockResolvedValue(permission === "denied" ? "denied" : "granted"),
    },
  });

  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve(swRegistration),
    },
  });

  if (!serviceWorkerAvailable) {
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
  }

  return { swRegistration, pushManager, subscription };
}

function createSubscription() {
  return {
    endpoint: "endpoint-1",
    toJSON: () => ({
      endpoint: "endpoint-1",
      keys: { p256dh: "p256dh-key", auth: "auth-key" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    },
  });

  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: {},
  });

  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe: vi.fn().mockResolvedValue(createSubscription()),
        },
        showNotification: vi.fn(),
      }),
    },
  });
});

describe("isPushSupported", () => {
  it("restituisce false senza serviceWorker", () => {
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });

    expect(isPushSupported()).toBe(false);
  });

  it("restituisce true in un ambiente conforme", () => {
    expect(isPushSupported()).toBe(true);
  });
});

describe("getNotificationPermission", () => {
  it("restituisce la permission corrente", () => {
    mockPushEnvironment({ permission: "granted" });

    expect(getNotificationPermission()).toBe("granted");
  });
});

describe("requestNotificationPermission", () => {
  it("richiede il permesso e lo ritorna", async () => {
    mockPushEnvironment({ permission: "granted" });

    const permission = await requestNotificationPermission();

    expect(permission).toBe("granted");
  });
});

describe("getPushSubscription", () => {
  it("restituisce null senza subscription attiva", async () => {
    mockPushEnvironment();

    const result = await getPushSubscription();

    expect(result).toBeNull();
  });

  it("restituisce la subscription esistente", async () => {
    mockPushEnvironment({ hasSubscription: true });

    const result = await getPushSubscription();

    expect(result.endpoint).toBe("endpoint-1");
  });
});

describe("subscribeToPush", () => {
  it("salva la subscription e ritorna granted", async () => {
    mockPushEnvironment();

    supabase.rpc.mockResolvedValue({ error: null });

    const result = await subscribeToPush();

    expect(result.permission).toBe("granted");
    expect(result.subscription).not.toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith(
      "subscribe_push",
      expect.objectContaining({
        p_endpoint: "endpoint-1",
        p_keys_p256dh: "p256dh-key",
        p_keys_auth: "auth-key",
      }),
    );
  });

  it("non salva se il permesso è negato", async () => {
    mockPushEnvironment({ permission: "denied" });

    window.Notification.requestPermission.mockResolvedValue("denied");

    const result = await subscribeToPush();

    expect(result).toEqual({ permission: "denied", subscription: null });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("propaga l'errore del rpc", async () => {
    mockPushEnvironment();

    supabase.rpc.mockResolvedValue({ error: { message: "rpc ko" } });

    await expect(subscribeToPush()).rejects.toThrow("rpc ko");
  });
});

describe("unsubscribeFromPush", () => {
  it("rimuove la subscription lato server e locale", async () => {
    mockPushEnvironment({ hasSubscription: true });

    supabase.rpc.mockResolvedValue({ error: null });

    await unsubscribeFromPush();

    expect(supabase.rpc).toHaveBeenCalledWith(
      "unsubscribe_push",
      expect.objectContaining({ p_endpoint: "endpoint-1" }),
    );
  });
});

describe("sendMyPushNotification", () => {
  it("invoca notify_my_push con i parametri", async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    await sendMyPushNotification({
      type: "achievement",
      title: "Nuovo traguardo!",
      body: "Hai sbloccato un traguardo.",
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "notify_my_push",
      expect.objectContaining({
        p_type: "achievement",
        p_title: "Nuovo traguardo!",
        p_body: "Hai sbloccato un traguardo.",
        p_url: "/",
      }),
    );
  });

  it("propaga l'errore del rpc", async () => {
    supabase.rpc.mockResolvedValue({ error: { message: "rpc ko" } });

    await expect(
      sendMyPushNotification({
        type: "streak",
        title: "Record!",
        body: "Nuovo record.",
      }),
    ).rejects.toThrow("rpc ko");
  });
});