import { supabase } from "../lib/supabase";

export async function submitFeedback({
  category,
  message,
  name,
}) {
  const { error } = await supabase.rpc("submit_feedback", {
    p_category: category,
    p_message: message,
    p_author_name: name,
  });

  if (error) throw error;
}
