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

export async function joinTeam(inviteCode) {
  const { data, error } = await supabase.rpc(
    "join_team",
    {
      team_invite_code: inviteCode,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function leaveTeam() {
  const { error } = await supabase.rpc(
    "leave_team",
  );

  if (error) {
    throw error;
  }
}

export async function getTeamMembers() {
  const { data, error } = await supabase.rpc(
    "get_team_members",
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}


export async function transferOwnership(
  newOwnerUserId,
) {
  const { error } = await supabase.rpc(
    "transfer_ownership",
    {
      new_owner_user_id: newOwnerUserId,
    },
  );

  if (error) {
    throw error;
  }
}