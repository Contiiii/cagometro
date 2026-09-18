-- Idempotenza del logging attività di squadra: una chiave di deduplicazione
-- permette di ritentare create_team_activity senza creare righe duplicate dopo
-- un timeout "commit riuscito ma risposta persa".

set check_function_bodies = off;

alter table public.team_activity
  add column if not exists dedup_key text;

create unique index if not exists team_activity_dedup_key_uidx
  on public.team_activity (dedup_key)
  where dedup_key is not null;

drop function if exists public.create_team_activity(text, integer, jsonb);

CREATE OR REPLACE FUNCTION public.create_team_activity(
  p_activity_type text,
  p_points integer DEFAULT NULL::integer,
  p_metadata jsonb DEFAULT NULL::jsonb,
  p_dedup_key text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team_id uuid;
  v_id uuid;
begin

  select tm.team_id
  into v_team_id
  from public.team_members tm
  where tm.user_id = auth.uid()
    and tm.left_at is null
    and tm.removed_at is null
  limit 1;

  if v_team_id is null then
    return null;
  end if;

  insert into public.team_activity (
    team_id,
    user_id,
    activity_type,
    points,
    metadata,
    dedup_key
  )
  values (
    v_team_id,
    auth.uid(),
    p_activity_type,
    p_points,
    p_metadata,
    p_dedup_key
  )
  on conflict (dedup_key) where dedup_key is not null
  do nothing
  returning id into v_id;

  return v_id;
end;
$function$
;