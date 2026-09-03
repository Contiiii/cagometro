import { supabase } from "../lib/supabase";

export async function getEntries(userId) {
  const { data, error } = await supabase
    .from("entries")
    .select("date,count")
    .eq("user_id", userId);

  if (error) throw error;

  return data;
}

export async function saveEntry({
  userId,
  date,
  count,
}) {
  const { data, error } = await supabase
    .from("entries")
    .upsert(
      {
        user_id: userId,
        date,
        count,
      },
      {
        onConflict: "user_id,date",
      },
    )
    .select();

  if (error) throw error;

  return data;
}


export async function importEntries(
  userId,
  entries,
) {
  const rows = Object.entries(entries).map(
    ([date, count]) => ({
      user_id: userId,
      date,
      count,
    }),
  );

  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("entries")
    .upsert(rows, {
      onConflict: "user_id,date",
    })
    .select();

  if (error) throw error;

  return data;
}