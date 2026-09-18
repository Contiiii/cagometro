import { parseUserAgent } from "./userAgent";

export const PUSH_OPTIN_SEEN_KEY = "cagometro_push_optin_seen";
export const PUSH_INSTALL_PROMPT_SEEN_KEY =
  "cagometro_push_install_prompt_seen";

function readFlag(storage, key) {
  try {
    return storage?.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(storage, key) {
  try {
    storage?.setItem(key, "1");
  } catch {
    // storage non disponibile (private mode): non bloccante
  }
}

export function hasSeenPushOptIn(storage = globalThis.localStorage) {
  return readFlag(storage, PUSH_OPTIN_SEEN_KEY);
}

export function markPushOptInSeen(storage = globalThis.localStorage) {
  writeFlag(storage, PUSH_OPTIN_SEEN_KEY);
}

export function hasSeenPushInstallPrompt(storage = globalThis.localStorage) {
  return readFlag(storage, PUSH_INSTALL_PROMPT_SEEN_KEY);
}

export function markPushInstallPromptSeen(storage = globalThis.localStorage) {
  writeFlag(storage, PUSH_INSTALL_PROMPT_SEEN_KEY);
}

export function isIosDevice(userAgent = globalThis.navigator?.userAgent) {
  const { os } = parseUserAgent(userAgent ?? "");

  return os === "iOS" || os === "iPadOS";
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorStandalone = window.navigator?.standalone === true;

  const mediaStandalone =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false;

  return navigatorStandalone || mediaStandalone;
}

// Su iOS le push funzionano solo con l'app aggiunta alla schermata Home:
// in Safari non installata il permesso nativo non è nemmeno richiedibile.
export function isIosNonStandalone(userAgent) {
  return isIosDevice(userAgent) && !isStandaloneDisplay();
}

export function getPushOptInEligibility({
  user,
  isSupported,
  initialized,
  permission,
  isSubscribed,
  optInSeen,
  installPromptSeen,
  iosNonStandalone,
}) {
  if (!user) {
    return { shouldPrompt: false, mode: null };
  }

  if (iosNonStandalone) {
    return installPromptSeen
      ? { shouldPrompt: false, mode: null }
      : { shouldPrompt: true, mode: "install" };
  }

  const shouldPrompt =
    Boolean(isSupported) &&
    Boolean(initialized) &&
    permission === "default" &&
    !isSubscribed &&
    !optInSeen;

  return { shouldPrompt, mode: shouldPrompt ? "optin" : null };
}
