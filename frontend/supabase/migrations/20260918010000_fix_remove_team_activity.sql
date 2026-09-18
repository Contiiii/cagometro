-- Fix cancellazione all'annullamento di una registrazione.
--
-- La versione multi-squadra di remove_team_activity (20260918000001) cercava
-- la riga da eliminare facendo match sul p_dedup_key. Ma l'undo passa un id di
-- rimozione GENERATO AL MOMENTO (marker di idempotenza in team_activity_removals),
-- diverso dalla dedup_key scritta in create_team_activity al momento della
-- registrazione. Risultato: la subquery non trovava nulla e la riga restava,
-- quindi il feed squadra non si aggiornava e l'animazione di rimozione non
-- partiva mai.
--
-- Ripristina la semantica della v1 (20260917000011): elimina l'ULTIMA riga che
-- matcha tipo + utente + squadra, coerente con decrementToday che toglie sempre
-- l'ultima registrazione. L'idempotenza sui retry resta garantita dalla tabella
-- team_activity_removals.

create or replace function public.remove_team_activity(
  p_activity_type text DEFAULT 'entry_created'::text,
  p_dedup_key text DEFAULT NULL::text,
  p_team_ids uuid[] DEFAULT NULL::uuid[]
)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_total integer := 0;
  v_deleted integer;
  v_claimed boolean := true;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_dedup_key is not null then
    insert into public.team_activity_removals (dedup_key, user_id)
    values (p_dedup_key, v_user_id)
    on conflict (dedup_key) do nothing;

    v_claimed := found;

    if not v_claimed then
      return 0;
    end if;
  end if;

  for v_team_id in
    select tm.team_id
    from public.team_members tm
    where tm.user_id = v_user_id
      and tm.left_at is null
      and tm.removed_at is null
      and (p_team_ids is null or tm.team_id = any (p_team_ids))
    order by tm.joined_at
  loop
    delete from public.team_activity ta
    using (
      select sub.id
      from public.team_activity sub
      where sub.team_id = v_team_id
        and sub.user_id = v_user_id
        and sub.activity_type = p_activity_type
      order by sub.created_at desc, sub.id desc
      limit 1
    ) tgt
    where ta.id = tgt.id;

    get diagnostics v_deleted = row_count;
    v_total := v_total + v_deleted;
  end loop;

  return v_total;
end;
$function$
;

revoke all on function public.remove_team_activity(text, text) from public, anon;
revoke all on function public.remove_team_activity(text, text, uuid[]) from public, anon;
grant execute on function public.remove_team_activity(text, text) to authenticated;
grant execute on function public.remove_team_activity(text, text, uuid[]) to authenticated;