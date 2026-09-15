-- Unificazione create_team_activity: rimossa la variante obsoleta a 2 parametri
-- (senza metadata), mantiene solo quella a 3 parametri usata dal frontend.

set check_function_bodies = off;

drop function if exists public.create_team_activity(text, integer);

CREATE OR REPLACE FUNCTION public.create_team_activity(p_activity_type text, p_points integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT NULL::jsonb)
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
    metadata
  )
  values (
    v_team_id,
    auth.uid(),
    p_activity_type,
    p_points,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$function$
;