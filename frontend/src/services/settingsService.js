import { supabase } from "../lib/supabase";

export async function getMySettings() {
  const { data, error } = await supabase.rpc("get_my_settings");

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function ensureMySettings() {
  const { error } = await supabase.rpc("ensure_my_settings");

  if (error) {
    throw error;
  }
}

export async function upsertMySettings({
  dailyReminder,
  streakAlerts,
  achievementAlerts,
  teamAlerts,
}) {
  const { error } = await supabase.rpc("upsert_my_settings", {
    p_daily_reminder: dailyReminder,
    p_streak_alerts: streakAlerts,
    p_achievement_alerts: achievementAlerts,
    p_team_alerts: teamAlerts,
  });

  if (error) {
    throw error;
  }
}