import { supabase } from "../lib/supabase";

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

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY;
}

async function getServiceWorkerRegistration() {
  const registration = await navigator.serviceWorker.ready;

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

export async function subscribeToPush({ deviceName, userAgent } = {}) {
  if (!isPushSupported()) {
    throw new Error("Notifiche non supportate da questo browser.");
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
      applicationServerKey: urlBase64ToUint8Array(
        getVapidPublicKey(),
      ),
    }));

  const { endpoint, keys } = subscription.toJSON();

  const { error } = await supabase.rpc("subscribe_push", {
    p_endpoint: endpoint,
    p_keys_p256dh: keys.p256dh,
    p_keys_auth: keys.auth,
    p_user_agent: userAgent ?? navigator.userAgent,
    p_device_name: deviceName ?? null,
  });

  if (error) {
    throw error;
  }

  return { permission: "granted", subscription };
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