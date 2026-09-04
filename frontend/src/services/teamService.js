import { supabase } from "../lib/supabase";

export async function createTeam({
  name,
  description,
  avatarEmoji,
}) {
  const { data, error } = await supabase.rpc(
    "create_team",
    {
      team_name: name,
      team_description: description,
      team_avatar_emoji: avatarEmoji,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyTeam() {
  const { data, error } = await supabase.rpc(
    "get_my_team",
  );

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}