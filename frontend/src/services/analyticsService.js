import { supabase } from "../lib/supabase";

const DEVICE_ID_KEY = "analytics_device_id";
const ONCE_PREFIX = "analytics_once_";
const QUEUE_KEY = "analytics_queue_v1";
const MAX_QUEUE_LENGTH = 100;
const MAX_QUEUE_ATTEMPTS = 5;
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function generateDeviceId() {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // fallback sotto
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getClientDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);

    if (existing) {
      return existing;
    }

    const next = generateDeviceId();

    localStorage.setItem(DEVICE_ID_KEY, next);

    return next;
  } catch {
    return "unknown-device";
  }
}

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(queue.slice(-MAX_QUEUE_LENGTH)),
    );
  } catch {
    // analytics non bloccante
  }
}

function enqueueAnalyticsEvent(event, payload) {
  const queue = loadQueue();
  queue.push({ event, payload, ts: Date.now(), attempts: 0 });
  saveQueue(queue);
}

export function hasRecorded(key) {
  try {
    return Boolean(localStorage.getItem(`${ONCE_PREFIX}${key}`));
  } catch {
    return false;
  }
}

export function markRecorded(key) {
  try {
    localStorage.setItem(`${ONCE_PREFIX}${key}`, "1");
  } catch {
    // analytics non bloccante
  }
}

async function sendEvent(event, payload, deviceId) {
  const { error } = await supabase.rpc("record_app_event", {
    p_event: event,
    p_payload: payload ?? {},
    p_device_id: deviceId,
  });

  if (error) {
    throw error;
  }
}

export async function trackEvent(event, payload = {}) {
  try {
    await sendEvent(event, payload, getClientDeviceId());
    await flushAnalyticsQueue();
  } catch {
    enqueueAnalyticsEvent(event, payload);
  }
}

export async function trackEventOnce(key, event, payload = {}) {
  if (hasRecorded(key)) {
    return;
  }

  markRecorded(key);
  await trackEvent(event, payload);
}

export async function flushAnalyticsQueue() {
  const now = Date.now();
  const loaded = loadQueue();
  const queue = loaded.filter(
    (item) => now - (item?.ts ?? now) < MAX_QUEUE_AGE_MS,
  );

  if (queue.length === 0) {
    if (loaded.length > 0) {
      saveQueue([]);
    }

    return;
  }

  const deviceId = getClientDeviceId();
  const pending = [];
  let failed = false;

  for (const item of queue) {
    if (failed) {
      pending.push(item);
      continue;
    }

    // Un evento che ha già fallito troppe volte viene scartato così non
    // blocca (head-of-line) tutti quelli successivi.
    if ((item?.attempts ?? 0) >= MAX_QUEUE_ATTEMPTS) {
      continue;
    }

    try {
      await sendEvent(item.event, item.payload, deviceId);
    } catch {
      item.attempts = (item?.attempts ?? 0) + 1;

      if (item.attempts >= MAX_QUEUE_ATTEMPTS) {
        continue;
      }

      pending.push(item);
      failed = true;
    }
  }

  saveQueue(pending);
}