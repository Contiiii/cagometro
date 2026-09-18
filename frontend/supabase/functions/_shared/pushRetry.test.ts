import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MAX_RETRY_AFTER_MS,
  RETRY_DELAYS_MS,
  parseRetryAfterSeconds,
  retryDelayForAttempt,
  sendWithRetry,
} from "./pushRetry.ts";

const SUB = {
  endpoint: "https://push.example.com/abc",
  keys: { p256dh: "p256dh", auth: "auth" },
};

const PAYLOAD = JSON.stringify({ title: "T", body: "B", url: "/" });

function httpError(statusCode: number, extra: Record<string, unknown> = {}) {
  return {
    statusCode,
    message: `HTTP ${statusCode}`,
    headers: {},
    ...extra,
  };
}

function networkError(message = "socket hang up") {
  return { code: "ECONNRESET", message };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sendWithRetry", () => {
  it("ritenta dopo 429 e consegna al secondo tentativo", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(httpError(429))
      .mockResolvedValueOnce(undefined);

    const promise = sendWithRetry(SUB, PAYLOAD, send);

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);

    await expect(promise).resolves.toEqual({ delivered: true, attempts: 2 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("ritenta su errore di rete (timeout) senza status code", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(networkError("socket hang up"))
      .mockResolvedValueOnce(undefined);

    const promise = sendWithRetry(SUB, PAYLOAD, send);

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);

    await expect(promise).resolves.toEqual({ delivered: true, attempts: 2 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("ritenta dopo un errore 5xx (503) e consegna", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce(undefined);

    const promise = sendWithRetry(SUB, PAYLOAD, send);

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);

    await expect(promise).resolves.toEqual({ delivered: true, attempts: 2 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("attende Retry-After invece del delay di default", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(
        httpError(429, { headers: { "retry-after": "5" } }),
      )
      .mockResolvedValueOnce(undefined);

    const promise = sendWithRetry(SUB, PAYLOAD, send, {
      delays: RETRY_DELAYS_MS,
    });

    let settled = false;
    promise.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(4000);
    expect(settled).toBe(true);

    await expect(promise).resolves.toEqual({ delivered: true, attempts: 2 });
  });

  it("esaurisce i tentativi dopo max 3 con 429", async () => {
    const send = vi.fn().mockRejectedValue(httpError(429));

    const promise = sendWithRetry(SUB, PAYLOAD, send);

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1]);

    await expect(promise).resolves.toMatchObject({
      delivered: false,
      attempts: 3,
      retries: 2,
      removeEndpoint: false,
      forbidden: false,
    });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("404 → rimuove la subscription senza ritentare", async () => {
    const send = vi.fn().mockRejectedValueOnce(httpError(404));

    await expect(sendWithRetry(SUB, PAYLOAD, send)).resolves.toMatchObject({
      delivered: false,
      statusCode: 404,
      attempts: 1,
      retries: 0,
      removeEndpoint: true,
      forbidden: false,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("410 → rimuove la subscription senza ritentare", async () => {
    const send = vi.fn().mockRejectedValueOnce(httpError(410));

    await expect(sendWithRetry(SUB, PAYLOAD, send)).resolves.toMatchObject({
      delivered: false,
      statusCode: 410,
      attempts: 1,
      retries: 0,
      removeEndpoint: true,
      forbidden: false,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("403 → log dedicato, nessuna rimozione e nessun ritentativo", async () => {
    const send = vi.fn().mockRejectedValueOnce(httpError(403));

    await expect(sendWithRetry(SUB, PAYLOAD, send)).resolves.toMatchObject({
      delivered: false,
      statusCode: 403,
      attempts: 1,
      retries: 0,
      removeEndpoint: false,
      forbidden: true,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("errori non retryable (400) non vengono ritentati", async () => {
    const send = vi.fn().mockRejectedValueOnce(httpError(400));

    await expect(sendWithRetry(SUB, PAYLOAD, send)).resolves.toMatchObject({
      delivered: false,
      statusCode: 400,
      attempts: 1,
      retries: 0,
      removeEndpoint: false,
      forbidden: false,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("parseRetryAfterSeconds", () => {
  it("interpreta i secondi", () => {
    expect(parseRetryAfterSeconds("2")).toBe(2000);
  });

  it("gestisce un header array prendendo il primo valore", () => {
    expect(parseRetryAfterSeconds(["3", "1"])).toBe(3000);
  });

  it("restituisce null per valori vuoti o non validi", () => {
    expect(parseRetryAfterSeconds(undefined)).toBeNull();
    expect(parseRetryAfterSeconds("")).toBeNull();
    expect(parseRetryAfterSeconds("abc")).toBeNull();
  });
});

describe("retryDelayForAttempt", () => {
  it("usa Retry-After in secondi al posto del delay di default", () => {
    expect(
      retryDelayForAttempt(1, httpError(429, { headers: { "retry-after": "5" } })),
    ).toBe(5000);
  });

  it("usa Retry-After come http-date", () => {
    const future = new Date("2026-10-21T07:28:00Z");
    const now = future.getTime() - 3000;

    expect(
      retryDelayForAttempt(
        1,
        httpError(503, { headers: { "retry-after": future.toUTCString() } }),
        { now: () => now },
      ),
    ).toBe(3000);
  });

  it("impone il cap massimo a Retry-After", () => {
    expect(
      retryDelayForAttempt(1, httpError(429, { headers: { "retry-after": "3600" } })),
    ).toBe(MAX_RETRY_AFTER_MS);
  });

  it("usa il delay di default quando Retry-After non è valido", () => {
    expect(
      retryDelayForAttempt(3, httpError(503, { headers: { "retry-after": "abc" } })),
    ).toBe(RETRY_DELAYS_MS[2]);
  });
});