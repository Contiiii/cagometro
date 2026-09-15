const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /fetch failed/i,
  /network error/i,
  /networkerror/i,
  /load failed/i,
  /request failed with status code/i,
];

const RATE_LIMIT_PATTERNS = [
  /too many requests/i,
  /rate limit/i,
  /troppe richieste/i,
];

function isNetworkError(error) {
  if (error instanceof TypeError) {
    return true;
  }

  if (error?.code === "-1" || error?.code === "NETWORK_ERROR") {
    return true;
  }

  const message = typeof error?.message === "string" ? error.message : "";

  return NETWORK_PATTERNS.some((pattern) => pattern.test(message));
}

function isRateLimitError(error) {
  if (error?.status === 429 || error?.statusCode === 429) {
    return true;
  }

  const message = typeof error?.message === "string" ? error.message : "";

  return RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message));
}

export function getFriendlyErrorMessage(error, fallback) {
  if (isNetworkError(error)) {
    return "Connessione assente. Riprova tra poco.";
  }

  if (isRateLimitError(error)) {
    return "Troppe richieste. Riprova tra poco.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}