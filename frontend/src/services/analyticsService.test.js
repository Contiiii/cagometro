// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("../lib/supabase", () => ({
  supabase: { rpc: rpcMock },
}));

import {
  flushAnalyticsQueue,
  getClientDeviceId,
  hasRecorded,
  trackEvent,
  trackEventOnce,
} from "./analyticsService";

const DEVICE_ID_KEY = "analytics_device_id";
const QUEUE_KEY = "analytics_queue_v1";

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  rpcMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getClientDeviceId", () => {
  it("genera e riusa lo stesso device id persistente", () => {
    const first = getClientDeviceId();
    const second = getClientDeviceId();

    expect(second).toBe(first);
    expect(first).not.toBe("");
    expect(window.localStorage.getItem(DEVICE_ID_KEY)).toBe(first);
  });

  it("usa un fallback se crypto.randomUUID non è disponibile", () => {
    const cryptoObject = globalThis.crypto;
    const originalRandomUUID = cryptoObject?.randomUUID;

    try {
      if (cryptoObject) {
        Object.defineProperty(cryptoObject, "randomUUID", {
          configurable: true,
          value: undefined,
        });
      }

      const id = getClientDeviceId();

      expect(id.startsWith("device-")).toBe(true);
    } finally {
      if (cryptoObject && originalRandomUUID) {
        Object.defineProperty(cryptoObject, "randomUUID", {
          configurable: true,
          value: originalRandomUUID,
        });
      }
    }
  });
});

describe("trackEvent", () => {
  it("invia l'evento alla rpc con il device id persistente", async () => {
    rpcMock.mockResolvedValue({ error: null });

    const deviceId = getClientDeviceId();

    await trackEvent("pwa_installed", { source: "test" });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("record_app_event", {
      p_event: "pwa_installed",
      p_payload: { source: "test" },
      p_device_id: deviceId,
    });
  });

  it("se la rpc fallisce accoda l'evento e lo invia al flush successivo", async () => {
    rpcMock.mockRejectedValue(new Error("offline"));

    await trackEvent("offline_session_start", { at: 1 });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(QUEUE_KEY)).not.toBe("[]");

    rpcMock.mockResolvedValue({ error: null });

    await flushAnalyticsQueue();

    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(QUEUE_KEY)).toBe("[]");
  });

  it("il flush si interrompe al primo errore e conserva gli eventi in ordine", async () => {
    rpcMock.mockRejectedValue(new Error("offline"));

    await trackEvent("a", { n: 1 });
    await trackEvent("b", { n: 2 });

    rpcMock.mockReset();
    rpcMock
      .mockRejectedValueOnce(new Error("rete"))
      .mockResolvedValueOnce({ error: null });

    await flushAnalyticsQueue();

    expect(rpcMock).toHaveBeenCalledTimes(1);

    const queued = JSON.parse(window.localStorage.getItem(QUEUE_KEY));

    expect(queued).toHaveLength(2);
    expect(queued[0].event).toBe("a");
    expect(queued[1].event).toBe("b");
  });

  it("la coda non supera i 100 eventi", async () => {
    rpcMock.mockRejectedValue(new Error("offline"));

    for (let index = 0; index < 105; index += 1) {
      await trackEvent("e", { index });
    }

    const queued = JSON.parse(window.localStorage.getItem(QUEUE_KEY));

    expect(queued).toHaveLength(100);
    expect(queued[0].payload.index).toBe(5);
    expect(queued[99].payload.index).toBe(104);
  });

  it("flush con coda vuota non chiama la rpc", async () => {
    await flushAnalyticsQueue();

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("scarta un evento che fallisce troppe volte senza bloccare gli altri", async () => {
    rpcMock.mockRejectedValue(new Error("offline"));

    await trackEvent("broken", { n: 0 });
    await trackEvent("fine", { n: 1 });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      rpcMock.mockReset();
      rpcMock.mockRejectedValue(new Error("rete"));

      await flushAnalyticsQueue();
    }

    const remaining = JSON.parse(window.localStorage.getItem(QUEUE_KEY));

    expect(remaining).toHaveLength(1);
    expect(remaining[0].event).toBe("fine");

    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });

    await flushAnalyticsQueue();

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "record_app_event",
      expect.objectContaining({ p_event: "fine" }),
    );
    expect(window.localStorage.getItem(QUEUE_KEY)).toBe("[]");
  });

  it("scarta gli eventi più vecchi della soglia al flush", async () => {
    rpcMock.mockRejectedValue(new Error("offline"));

    await trackEvent("old", {});

    const queued = JSON.parse(window.localStorage.getItem(QUEUE_KEY));
    queued[0].ts -= 7 * 24 * 60 * 60 * 1000 + 1000;
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queued));

    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });

    await flushAnalyticsQueue();

    expect(rpcMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(QUEUE_KEY)).toBe("[]");
  });
});

describe("trackEventOnce", () => {
  it("registra l'evento una sola volta per chiave", async () => {
    rpcMock.mockResolvedValue({ error: null });

    await trackEventOnce("install-marker", "pwa_installed", {});
    await trackEventOnce("install-marker", "pwa_installed", {});

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(hasRecorded("install-marker")).toBe(true);
  });
});