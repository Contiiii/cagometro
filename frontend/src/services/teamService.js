import { supabase } from "../lib/supabase";

export async function createTeam({ name, description, avatarEmoji }) {
  const { data, error } = await supabase.rpc("create_team", {
    team_name: name,
    team_description: description,
    team_avatar_emoji: avatarEmoji,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyTeam() {
  const { data, error } = await supabase.rpc("get_my_team");

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function joinTeam(inviteCode) {
  const { data, error } = await supabase.rpc("join_team", {
    team_invite_code: inviteCode,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function leaveTeam() {
  const { error } = await supabase.rpc("leave_team");

  if (error) {
    throw error;
  }
}

export async function getTeamMembers() {
  const { data, error } = await supabase.rpc("get_team_members");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function transferOwnership(newOwnerUserId) {
  const { error } = await supabase.rpc("transfer_ownership", {
    new_owner_user_id: newOwnerUserId,
  });

  if (error) {
    throw error;
  }
}

export async function removeTeamMember(userId) {
  const { error } = await supabase.rpc("remove_team_member", {
    target_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function getTeamLeaderboard() {
  const { data, error } = await supabase.rpc("get_team_leaderboard");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateTeam({ name, description, avatarEmoji }) {
  const { data, error } = await supabase.rpc("update_team", {
    p_name: name,
    p_description: description,
    p_avatar_emoji: avatarEmoji,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleTeamInvites(enabled) {
  const { error } = await supabase.rpc("toggle_team_invites", {
    p_enabled: enabled,
  });

  if (error) {
    throw error;
  }
}

export async function regenerateInviteCode() {
  const { data, error } = await supabase.rpc("regenerate_invite_code");

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeamActivity(limit = 20, offset = 0) {
  const { data, error } = await supabase.rpc("get_team_activity", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  return data ?? [];
}

export async function createTeamActivity(
  activityType,
  points = null,
  metadata = null,
) {
  const { data, error } = await supabase.rpc(
    "create_team_activity",
    {
      p_activity_type: activityType,
      p_points: points,
      p_metadata: metadata,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


