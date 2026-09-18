export const MAX_ATTEMPTS = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000];
export const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
export const MAX_RETRY_AFTER_MS = 30_000;

const NETWORK_ERROR_PATTERN =
  /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|timeout|timed out/i;

type HeaderValue = string | string[] | undefined;

type PushErrorLike = {
  statusCode?: number | null;
  headers?: Record<string, HeaderValue>;
  message?: string;
  code?: string;
};

export type PushSubscriptionLike = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SendNotification = (
  subscription: PushSubscriptionLike,
  payload: string,
  options: { timeout: number },
) => Promise<void>;

export type SendOutcome =
  | { delivered: true; attempts: number }
  | {
      delivered: false;
      statusCode: number | null;
      attempts: number;
      retries: number;
      removeEndpoint: boolean;
      forbidden: boolean;
      reason: string;
    };

export type SendWithRetryOptions = {
  attempts?: number;
  delays?: number[];
  timeoutMs?: number;
  now?: () => number;
};

function asPushError(value: unknown): PushErrorLike {
  if (value && typeof value === "object") {
    return value as PushErrorLike;
  }

  return {};
}

export function statusCodeOf(error: unknown): number | null {
  const statusCode = asPushError(error).statusCode;

  return typeof statusCode === "number" ? statusCode : null;
}

export function isNetworkOrTimeoutError(error: unknown): boolean {
  if (statusCodeOf(error) !== null) {
    return false;
  }

  const normalized = asPushError(error);
  const code = typeof normalized.code === "string" ? normalized.code : "";
  const message =
    typeof normalized.message === "string" ? normalized.message : "";

  return NETWORK_ERROR_PATTERN.test(`${code} ${message}`);
}

export function isRetryableError(error: unknown): boolean {
  const statusCode = statusCodeOf(error);

  if (statusCode !== null) {
    return RETRYABLE_STATUS_CODES.includes(statusCode);
  }

  return isNetworkOrTimeoutError(error);
}

function headerOf(error: unknown, name: string): HeaderValue | undefined {
  const headers = asPushError(error).headers;

  if (!headers) {
    return undefined;
  }

  return headers[name] ?? headers[name.toLowerCase()];
}

export function parseRetryAfterSeconds(
  value: HeaderValue | undefined,
  now?: number,
): number | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }

  const trimmed = raw.trim();
  const seconds = Number(trimmed);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.floor(seconds * 1000);
  }

  const when = Date.parse(trimmed);

  if (!Number.isNaN(when)) {
    const delay = when - (now ?? Date.now());

    if (delay >= 0) {
      return delay;
    }
  }

  return null;
}

export function retryDelayForAttempt(
  attempt: number,
  error: unknown,
  options: { delays?: number[]; now?: () => number } = {},
): number {
  const retryAfter = parseRetryAfterSeconds(
    headerOf(error, "retry-after"),
    options.now?.(),
  );

  if (retryAfter !== null) {
    return Math.min(retryAfter, MAX_RETRY_AFTER_MS);
  }

  const delays = options.delays ?? RETRY_DELAYS_MS;
  const index = Math.max(0, Math.min(attempt - 1, delays.length - 1));

  return delays[index];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendWithRetry(
  subscription: PushSubscriptionLike,
  payload: string,
  sendNotification: SendNotification,
  options: SendWithRetryOptions = {},
): Promise<SendOutcome> {
  const maxAttempts = Math.max(1, options.attempts ?? MAX_ATTEMPTS);
  const timeoutMs = options.timeoutMs ?? 10_000;

  for (let attempt = 1; ; attempt += 1) {
    try {
      await sendNotification(subscription, payload, { timeout: timeoutMs });

      return { delivered: true, attempts: attempt };
    } catch (error) {
      const statusCode = statusCodeOf(error);
      const reason =
        asPushError(error).message ?? `HTTP ${statusCode ?? "network"}`;

      if (statusCode === 404 || statusCode === 410) {
        return {
          delivered: false,
          statusCode,
          attempts: attempt,
          retries: attempt - 1,
          removeEndpoint: true,
          forbidden: false,
          reason,
        };
      }

      if (statusCode === 403) {
        return {
          delivered: false,
          statusCode,
          attempts: attempt,
          retries: attempt - 1,
          removeEndpoint: false,
          forbidden: true,
          reason,
        };
      }

      if (!isRetryableError(error) || attempt >= maxAttempts) {
        return {
          delivered: false,
          statusCode,
          attempts: attempt,
          retries: attempt - 1,
          removeEndpoint: false,
          forbidden: false,
          reason,
        };
      }

      await sleep(
        retryDelayForAttempt(attempt, error, {
          delays: options.delays,
          now: options.now,
        }),
      );
    }
  }
}