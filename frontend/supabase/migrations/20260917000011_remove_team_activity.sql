-- Annullamento di una registrazione: rimuove dal feed della squadra l'attività
-- entry_created corrispondente. L'operazione è idempotente tramite p_dedup_key,
-- così un retry dopo un timeout "commit riuscito ma risposta persa" non elimina
-- una seconda riga. La replica identity full è necessaria per ricevere gli
-- eventi DELETE filtrati per team_id via Realtime.

set check_function_bodies = off;

alter table public.team_activity replica identity full;

create table if not exists public.team_activity_removals (
  dedup_key text primary key,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.team_activity_removals enable row level security;

revoke all on table public.team_activity_removals from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.remove_team_activity(
  p_activity_type text DEFAULT 'entry_created'::text,
  p_dedup_key text DEFAULT NULL::text
)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team_id uuid;
  v_id uuid;
  v_claimed boolean := true;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_dedup_key is not null then
    insert into public.team_activity_removals (dedup_key, user_id)
    values (p_dedup_key, auth.uid())
    on conflict (dedup_key) do nothing;

    v_claimed := found;

    if not v_claimed then
      return 0;
    end if;
  end if;

  select tm.team_id
  into v_team_id
  from public.team_members tm
  where tm.user_id = auth.uid()
    and tm.left_at is null
    and tm.removed_at is null
  limit 1;

  if v_team_id is null then
    return 0;
  end if;

  select ta.id
  into v_id
  from public.team_activity ta
  where ta.team_id = v_team_id
    and ta.user_id = auth.uid()
    and ta.activity_type = p_activity_type
  order by ta.created_at desc, ta.id desc
  limit 1;

  if v_id is null then
    return 0;
  end if;

  delete from public.team_activity where id = v_id;

  return 1;
end;
$function$
;

revoke all on function public.remove_team_activity(text, text) from public, anon;
grant execute on function public.remove_team_activity(text, text) to authenticated;
