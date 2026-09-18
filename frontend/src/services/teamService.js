import { supabase } from "../lib/supabase";

export async function createTeam({ name, description, avatarEmoji, maxMembers }) {
  const { data, error } = await supabase.rpc("create_team", {
    team_name: name,
    team_description: description,
    team_avatar_emoji: avatarEmoji,
    team_max_members: maxMembers,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyTeams() {
  const { data, error } = await supabase.rpc("get_my_teams");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTeam(teamId) {
  const { data, error } = await supabase.rpc("get_team", {
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function getTeamInvitePreview(inviteCode) {
  const { data, error } = await supabase.rpc("get_team_invite_preview", {
    p_invite_code: inviteCode,
  });

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

export async function leaveTeam(teamId) {
  const { error } = await supabase.rpc("leave_team", {
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }
}

export async function getTeamMembers(teamId) {
  const { data, error } = await supabase.rpc("get_team_members", {
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function transferOwnership(newOwnerUserId, teamId) {
  if (!newOwnerUserId) {
    throw new Error("Seleziona un membro a cui trasferire la proprietà.");
  }

  const { error } = await supabase.rpc("transfer_ownership", {
    new_owner_user_id: newOwnerUserId,
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }
}

export async function removeTeamMember(userId, teamId) {
  const { error } = await supabase.rpc("remove_team_member", {
    target_user_id: userId,
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }
}

export async function getTeamLeaderboard(teamId) {
  const { data, error } = await supabase.rpc("get_team_leaderboard", {
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateTeam({ name, description, avatarEmoji, maxMembers }, teamId) {
  const { data, error } = await supabase.rpc("update_team", {
    p_name: name,
    p_description: description,
    p_avatar_emoji: avatarEmoji,
    p_max_members: maxMembers,
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleTeamInvites(enabled, teamId) {
  const { error } = await supabase.rpc("toggle_team_invites", {
    p_enabled: enabled,
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }
}

export async function regenerateInviteCode(teamId) {
  const { data, error } = await supabase.rpc("regenerate_invite_code", {
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getTeamActivity(limit = 20, offset = 0, teamId) {
  const { data, error } = await supabase.rpc("get_team_activity", {
    p_limit: limit,
    p_offset: offset,
    p_team_id: teamId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createTeamActivity(
  activityType,
  points = null,
  metadata = null,
  dedupKey = null,
  teamIds = null,
) {
  const { data, error } = await supabase.rpc("create_team_activity", {
    p_activity_type: activityType,
    p_points: points,
    p_metadata: metadata,
    p_dedup_key: dedupKey,
    p_team_ids: teamIds,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function removeTeamActivity(
  activityType = "entry_created",
  dedupKey = null,
  teamIds = null,
) {
  const { data, error } = await supabase.rpc("remove_team_activity", {
    p_activity_type: activityType,
    p_dedup_key: dedupKey,
    p_team_ids: teamIds,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function createAchievementTeamActivities(
  newAchievements,
  teamIds,
  userId,
) {
  if (
    !Array.isArray(teamIds) ||
    teamIds.length === 0 ||
    userId == null ||
    !Array.isArray(newAchievements) ||
    newAchievements.length === 0
  ) {
    return [];
  }

  return Promise.allSettled(
    newAchievements.map((achievement) =>
      createTeamActivity(
        "achievement_unlocked",
        null,
        {
          achievementId: achievement.id,
          achievementName: achievement.title,
        },
        `${teamIds.join(":")}:${userId}:achievement:${achievement.id}`,
        teamIds,
      ),
    ),
  );
}