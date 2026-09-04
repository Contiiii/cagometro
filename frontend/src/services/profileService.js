import { supabase } from "../lib/supabase";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile({
  userId,
  displayName,
  avatarUrl,
}) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}