-- Protezione get_team_invite_preview: richiede un utente autenticato.
-- Senza auth la preview non viene esposta (evita enumerazione codici invito).
-- Il rate limit resta attivo per gli utenti autenticati (30/min).

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_team_invite_preview(p_invite_code text)
 RETURNS TABLE(id uuid, name text, description text, avatar_emoji text, member_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_code text := upper(trim(p_invite_code));
  v_user_id uuid := auth.uid();
  v_calls bigint;
begin
  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if v_code is null or v_code = '' then
    raise exception 'Codice invito non valido';
  end if;

  insert into public.team_invite_preview_calls (user_id)
  values (v_user_id);

  delete from public.team_invite_preview_calls
  where created_at < now() - interval '10 minutes';

  select count(*)
  into v_calls
  from public.team_invite_preview_calls
  where user_id = v_user_id
    and created_at > now() - interval '1 minute';

  if v_calls > 30 then
    raise exception 'Troppe richieste. Riprova tra qualche minuto.';
  end if;

  return query
  select
    t.id,
    t.name,
    t.description,
    t.avatar_emoji,
    count(tm.user_id) filter (
      where tm.left_at is null and tm.removed_at is null
    )::bigint as member_count
  from public.teams t
  left join public.team_members tm
    on tm.team_id = t.id
  where t.invite_code = v_code
    and t.invite_enabled = true
  group by
    t.id,
    t.name,
    t.description,
    t.avatar_emoji;
end;
$function$
;