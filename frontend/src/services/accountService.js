import { supabase } from "../lib/supabase";

export async function getMySessions() {
  const { data, error } = await supabase.rpc("get_my_sessions");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function revokeSession(sessionId) {
  const { error } = await supabase.rpc("revoke_session", {
    p_session_id: sessionId,
  });

  if (error) {
    throw error;
  }
}

export async function revokeOtherSessions() {
  const { error } = await supabase.rpc("revoke_other_sessions");

  if (error) {
    throw error;
  }
}

export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_account");

  if (error) {
    throw error;
  }
}