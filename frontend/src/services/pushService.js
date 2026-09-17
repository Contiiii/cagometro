import { supabase } from "../lib/supabase";
import { formatDeviceName } from "../utils/userAgent";
import { reportError } from "../utils/reportError";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    Boolean(navigator?.serviceWorker) &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission() {
  if (!isPushSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    return "unsupported";
  }

  return Notification.requestPermission();
}

const VAPID_PUBLIC_KEY_LENGTH = 65;
const UNCOMPRESSED_POINT_PREFIX = 0x04;

function decodeBase64Url(base64String) {
  if (typeof base64String !== "string" || base64String.trim() === "") {
    return null;
  }

  const trimmed = base64String.trim();
  const padding = "=".repeat((4 - (trimmed.length % 4)) % 4);
  const base64 = (trimmed + padding).replace(/-/g, "+").replace(/_/g, "/");

  let rawData;

  try {
    rawData = window.atob(base64);
  } catch {
    return null;
  }

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Una chiave pubblica VAPID valida e' un punto P-256 non compresso: 65 byte
// con prefisso 0x04. Blocca all'attivazione gli errori di configurazione
// (chiave copiata male, valore di un altro ambiente, segnaposto).
export function isValidVapidPublicKey(value) {
  const bytes = decodeBase64Url(value);

  return Boolean(
    bytes &&
      bytes.length === VAPID_PUBLIC_KEY_LENGTH &&
      bytes[0] === UNCOMPRESSED_POINT_PREFIX,
  );
}

function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY;
}

async function getServiceWorkerRegistration() {
  const timeout = new Promise((_, reject) => {
    setTimeout(
      () =>
        reject(new Error("Service worker non disponibile: registrazione troppo lenta")),
      10000,
    );
  });

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    timeout,
  ]);

  return registration;
}

export async function getPushSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await getServiceWorkerRegistration();
  const subscription = await registration.pushManager.getSubscription();

  return subscription ?? null;
}

export function isPushSubscriptionOwnedByOther(error) {
  return Boolean(
    error &&
      (error?.code === "PUSH1" ||
        (typeof error?.message === "string" &&
          error.message.includes("PUSH_OWNED_BY_OTHER"))),
  );
}

export async function detachPushSubscription() {
  if (!isPushSupported()) {
    return;
  }

  let timeoutId;

  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              "Service worker non disponibile: registrazione troppo lenta",
            ),
          ),
        3000,
      );
    });

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      timeout,
    ]);

    clearTimeout(timeoutId);

    const subscription = await registration.pushManager.getSubscription();
    const endpoint = subscription?.endpoint ?? null;

    if (!endpoint) {
      return;
    }

    const { error } = await supabase.rpc("unsubscribe_push", {
      p_endpoint: endpoint,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    reportError(error, {
      feature: "push-detach",
      message: "Errore distacco dispositivo push:",
    });
  }
}

export async function subscribeToPush({ deviceName, userAgent } = {}) {
  if (!isPushSupported()) {
    throw new Error("Notifiche non supportate da questo browser.");
  }

  const vapidKey = getVapidPublicKey();

  if (!vapidKey) {
    throw new Error(
      "Chiave VAPID mancante: configura VITE_VAPID_PUBLIC_KEY.",
    );
  }

  const applicationServerKey = decodeBase64Url(vapidKey);

  if (!applicationServerKey || !isValidVapidPublicKey(vapidKey)) {
    throw new Error(
      "Chiave VAPID non valida: VITE_VAPID_PUBLIC_KEY non è una chiave P-256 valida.",
    );
  }

  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    return { permission, subscription: null };
  }

  const registration = await getServiceWorkerRegistration();
  const existingSubscription =
    await registration.pushManager.getSubscription();

  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  const { endpoint, keys } = subscription.toJSON();

  const resolvedUserAgent = userAgent ?? navigator.userAgent;

  const { error } = await supabase.rpc("subscribe_push", {
    p_endpoint: endpoint,
    p_keys_p256dh: keys.p256dh,
    p_keys_auth: keys.auth,
    p_user_agent: resolvedUserAgent,
    p_device_name: deviceName ?? formatDeviceName(resolvedUserAgent),
  });

  if (error) {
    throw error;
  }

  return { permission: "granted", subscription };
}

export async function getMyPushSubscriptions() {
  const { data, error } = await supabase.rpc("get_my_push_subscriptions");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function removePushSubscription(endpoint) {
  if (!endpoint) {
    return;
  }

  const { error } = await supabase.rpc("unsubscribe_push", {
    p_endpoint: endpoint,
  });

  if (error) {
    throw error;
  }
}

export async function refreshPushSubscription(subscription) {
  const payload = subscription?.toJSON ? subscription.toJSON() : subscription;

  if (!payload?.endpoint || !payload?.keys) {
    return;
  }

  const userAgent = navigator.userAgent;

  const { error } = await supabase.rpc("subscribe_push", {
    p_endpoint: payload.endpoint,
    p_keys_p256dh: payload.keys.p256dh,
    p_keys_auth: payload.keys.auth,
    p_user_agent: userAgent,
    p_device_name: formatDeviceName(userAgent),
  });

  if (error) {
    throw error;
  }
}

export async function claimPushSubscription(subscription) {
  const payload = subscription?.toJSON ? subscription.toJSON() : subscription;

  if (!payload?.endpoint || !payload?.keys) {
    throw new Error("Subscription non valida per il claim.");
  }

  const userAgent = navigator.userAgent;

  const { error } = await supabase.rpc("claim_push_subscription", {
    p_endpoint: payload.endpoint,
    p_keys_p256dh: payload.keys.p256dh,
    p_keys_auth: payload.keys.auth,
    p_user_agent: userAgent,
    p_device_name: formatDeviceName(userAgent),
  });

  if (error) {
    throw error;
  }
}

export async function unsubscribeFromPush({ endpoint } = {}) {
  if (!isPushSupported()) {
    return;
  }

  const targetEndpoint =
    endpoint ??
    (await getPushSubscription())?.endpoint ??
    null;

  if (targetEndpoint) {
    await supabase.rpc("unsubscribe_push", {
      p_endpoint: targetEndpoint,
    });
  }

  const registration = await getServiceWorkerRegistration();
  const existingSubscription =
    await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }
}

export async function sendMyPushNotification({ type, title, body, url }) {
  const { error } = await supabase.rpc("notify_my_push", {
    p_type: type,
    p_title: title,
    p_body: body,
    p_url: url ?? "/",
  });

  if (error) {
    throw error;
  }
}