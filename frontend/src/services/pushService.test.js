// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendMyPushNotification,
  getMyPushSubscriptions,
  removePushSubscription,
  refreshPushSubscription,
  detachPushSubscription,
  claimPushSubscription,
  isPushSubscriptionOwnedByOther,
  isValidVapidPublicKey,
} from "./pushService";
import { supabase } from "../lib/supabase";
import { reportError } from "../utils/reportError";

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock("../utils/reportError", () => ({
  reportError: vi.fn(),
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

afterEach(() => {
  vi.unstubAllEnvs();
});

function base64UrlFromBytes(bytes) {
  const binary = Array.from(bytes, (byte) =>
    String.fromCharCode(byte),
  ).join("");

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function vapidPublicKey(length = 65, prefix = 0x04) {
  const bytes = new Uint8Array(length);
  bytes[0] = prefix;

  for (let index = 1; index < length; index += 1) {
    bytes[index] = index;
  }

  return base64UrlFromBytes(bytes);
}

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

  it("deriva device_name dallo user agent quando non fornito", async () => {
    mockPushEnvironment();

    Object.defineProperty(globalThis.navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });

    supabase.rpc.mockResolvedValue({ error: null });

    await subscribeToPush();

    expect(supabase.rpc).toHaveBeenCalledWith(
      "subscribe_push",
      expect.objectContaining({
        p_device_name: "Chrome su Windows",
      }),
    );
  });

  it("rispetta device_name esplicito", async () => {
    mockPushEnvironment();

    supabase.rpc.mockResolvedValue({ error: null });

    await subscribeToPush({ deviceName: "Telefono di Andrea" });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "subscribe_push",
      expect.objectContaining({
        p_device_name: "Telefono di Andrea",
      }),
    );
  });
});

describe("getMyPushSubscriptions", () => {
  it("ritorna la lista dei dispositivi", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ endpoint: "endpoint-1", device_name: "Chrome su Windows" }],
      error: null,
    });

    const result = await getMyPushSubscriptions();

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_push_subscriptions");
    expect(result).toHaveLength(1);
  });

  it("propaga l'errore del rpc", async () => {
    supabase.rpc.mockResolvedValue({ error: { message: "rpc ko" } });

    await expect(getMyPushSubscriptions()).rejects.toThrow("rpc ko");
  });
});

describe("removePushSubscription", () => {
  it("rimuove solo lato server l'endpoint indicato", async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    await removePushSubscription("endpoint-2");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "unsubscribe_push",
      expect.objectContaining({ p_endpoint: "endpoint-2" }),
    );
  });

  it("non chiama il rpc senza endpoint", async () => {
    await removePushSubscription();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe("refreshPushSubscription", () => {
  it("rinfresca last_seen_at con i dati della subscription", async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    await refreshPushSubscription({
      toJSON: () => ({
        endpoint: "endpoint-1",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "subscribe_push",
      expect.objectContaining({
        p_endpoint: "endpoint-1",
        p_keys_p256dh: "p256dh-key",
        p_keys_auth: "auth-key",
      }),
    );
  });

  it("ignora payload incompleti", async () => {
    await refreshPushSubscription({ endpoint: "endpoint-1" });

    expect(supabase.rpc).not.toHaveBeenCalled();
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

describe("subscribeToPush - errori", () => {
  it("lancia quando il service worker rifiuta la ready", async () => {
    mockPushEnvironment();

    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.reject(new Error("unavailable")) },
    });

    await expect(subscribeToPush()).rejects.toThrow("unavailable");
  });

  it("rifiuta una chiave VAPID malformata all'attivazione", async () => {
    mockPushEnvironment();

    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "non-una-chiave-vapid");

    await expect(subscribeToPush()).rejects.toThrow(
      "non è una chiave P-256 valida",
    );
  });

  it("passa la chiave decodificata come applicationServerKey", async () => {
    const { pushManager } = mockPushEnvironment();

    supabase.rpc.mockResolvedValue({ error: null });

    await subscribeToPush();

    const [options] = pushManager.subscribe.mock.calls[0];

    expect(options.applicationServerKey).toBeInstanceOf(Uint8Array);
    expect(options.applicationServerKey.length).toBe(65);
    expect(options.applicationServerKey[0]).toBe(0x04);
  });
});

describe("isValidVapidPublicKey", () => {
  it("accetta una chiave P-256 non compressa di 65 byte", () => {
    expect(isValidVapidPublicKey(vapidPublicKey())).toBe(true);
  });

  it("rifiuta lunghezze errate e prefissi non compressi", () => {
    expect(isValidVapidPublicKey(vapidPublicKey(64))).toBe(false);
    expect(isValidVapidPublicKey(vapidPublicKey(66))).toBe(false);
    expect(isValidVapidPublicKey(vapidPublicKey(65, 0x02))).toBe(false);
  });

  it("rifiuta valori assenti o non decodificabili", () => {
    expect(isValidVapidPublicKey(undefined)).toBe(false);
    expect(isValidVapidPublicKey("")).toBe(false);
    expect(isValidVapidPublicKey("!!!")).toBe(false);
  });
});

describe("isPushSubscriptionOwnedByOther", () => {
  it("riconosce l'errcode PUSH1", () => {
    expect(
      isPushSubscriptionOwnedByOther({
        code: "PUSH1",
        message: "Subscription already owned by another user",
      }),
    ).toBe(true);
  });

  it("riconosce il marcatore PUSH_OWNED_BY_OTHER nel messaggio", () => {
    expect(
      isPushSubscriptionOwnedByOther({
        message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
      }),
    ).toBe(true);
  });

  it("restituisce false per errori generici e valori nulli", () => {
    expect(isPushSubscriptionOwnedByOther(new Error("altro errore"))).toBe(false);
    expect(isPushSubscriptionOwnedByOther(null)).toBe(false);
  });
});

describe("detachPushSubscription", () => {
  it("rimuove lato server l'endpoint corrente senza chiamare subscription.unsubscribe", async () => {
    const { subscription } = mockPushEnvironment({ hasSubscription: true });

    supabase.rpc.mockResolvedValue({ error: null });

    await detachPushSubscription();

    expect(supabase.rpc).toHaveBeenCalledWith(
      "unsubscribe_push",
      expect.objectContaining({ p_endpoint: "endpoint-1" }),
    );
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });

  it("non chiama il rpc senza subscription attiva", async () => {
    mockPushEnvironment();

    await detachPushSubscription();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("non fa nulla senza supporto push", async () => {
    mockPushEnvironment({ serviceWorkerAvailable: false });

    await detachPushSubscription();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("assorbe l'errore del rpc e lo registra via reportError", async () => {
    mockPushEnvironment({ hasSubscription: true });

    supabase.rpc.mockResolvedValue({ error: { message: "rpc ko" } });

    await expect(detachPushSubscription()).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalled();
  });
});

describe("claimPushSubscription", () => {
  it("chiama claim_push_subscription con i dati della subscription", async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    await claimPushSubscription({
      toJSON: () => ({
        endpoint: "endpoint-1",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "claim_push_subscription",
      expect.objectContaining({
        p_endpoint: "endpoint-1",
        p_keys_p256dh: "p256dh-key",
        p_keys_auth: "auth-key",
      }),
    );
  });

  it("rifiuta payload incompleti senza chiamare il rpc", async () => {
    await expect(
      claimPushSubscription({ endpoint: "endpoint-1" }),
    ).rejects.toThrow("Subscription non valida");

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("propaga l'errore del rpc", async () => {
    supabase.rpc.mockResolvedValue({ error: { message: "rpc ko" } });

    await expect(
      claimPushSubscription({
        toJSON: () => ({
          endpoint: "endpoint-1",
          keys: { p256dh: "p256dh-key", auth: "auth-key" },
        }),
      }),
    ).rejects.toThrow("rpc ko");
  });
});