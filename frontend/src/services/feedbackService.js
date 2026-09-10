import { supabase } from "../lib/supabase";

export async function submitFeedback({
  category,
  message,
  name,
  userId,
}) {
  const { error } = await supabase.from("feedback").insert({
    category,
    message,
    author_name: name,
    user_id: userId ?? null,
  });

  if (error) throw error;
}