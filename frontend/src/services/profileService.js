import { supabase } from "../lib/supabase";

import {
  loadPendingOps,
  enqueueOp,
  dequeueOp,
} from "../utils/pendingQueue";

const PROFILE_OP_TYPE = "updateProfile";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,display_name,avatar_url")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile({ userId, displayName, avatarUrl }) {
  if (!userId) throw new Error("userId required");

  const payload = {
    display_name: displayName,
    avatar_url: avatarUrl,
  };

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    enqueueOp(userId, {
      type: PROFILE_OP_TYPE,
      payload,
    });
    return { queued: true };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
      enqueueOp(userId, {
        type: PROFILE_OP_TYPE,
        payload,
      });
      return { queued: true };
    }
    throw error;
  }
}

export async function flushProfileQueue(userId) {
  if (!userId) return Promise.resolve(true);

  const pendingOps = loadPendingOps(userId);
  const profileOps = pendingOps.filter((op) => op.type === PROFILE_OP_TYPE);

  if (profileOps.length === 0) return Promise.resolve(true);

  return profileOps.reduce(
    (promise, op) =>
      promise.then((results) =>
        (async () => {
          try {
            const { error } = await supabase
              .from("profiles")
              .update(op.payload)
              .eq("user_id", userId)
              .select()
              .single();

            if (error) throw error;

            dequeueOp(userId, op.id);
            return [...results, true];
          } catch (err) {
            console.error("Errore flush profile queue:", err);
            return [...results, false];
          }
        })(),
      ),
    Promise.resolve([]),
  ).then((results) => results.every((r) => r));
}