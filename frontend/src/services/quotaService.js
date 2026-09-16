import { supabase } from "../lib/supabase";

export const QUOTA_STORAGE_KEY = "cagometro_quota_last_check";

export async function getLatestQuotaSnapshot() {
  const { data, error } = await supabase
    .from("quota_snapshots")
    .select("recorded_at,period_end,requests,usage,limits")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = error.message ?? "";

    if (message.includes("quota_snapshots") || message.includes("does not exist")) {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

export async function fetchQuotaSnapshot() {
  const snapshot = await getLatestQuotaSnapshot();

  if (snapshot) {
    const stored = {
      recordedAt: snapshot.recorded_at,
      periodEnd: snapshot.period_end,
      requests: snapshot.requests ?? {},
      usage: snapshot.usage ?? {},
      limits: snapshot.limits ?? {},
    };

    try {
      window.localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Errore salvataggio quota locale:", error);
    }

    return stored;
  }

  const cached = window.localStorage.getItem(QUOTA_STORAGE_KEY);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.error("Errore lettura quota locale:", error);
    }
  }

  return null;
}