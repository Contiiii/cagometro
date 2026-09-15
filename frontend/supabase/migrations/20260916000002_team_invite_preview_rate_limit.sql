-- Rate limit su get_team_invite_preview: evita la brute force dei codici invito.
-- Tabella di log delle chiamate con identità del chiamante (null se anon).

create table if not exists public.team_invite_preview_calls (
  id bigint generated always as identity primary key,
  user_id uuid,
  created_at timestamp with time zone not null default now()
);

create index if not exists team_invite_preview_calls_identity_idx
  on public.team_invite_preview_calls (user_id, created_at);

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
  v_limit bigint := 30;
begin
  if v_code is null or v_code = '' then
    raise exception 'Codice invito non valido';
  end if;

  if v_user_id is null then
    v_limit := 5;
  end if;

  insert into public.team_invite_preview_calls (user_id)
  values (v_user_id);

  select count(*)
  into v_calls
  from public.team_invite_preview_calls
  where user_id is not distinct from v_user_id
    and created_at > now() - interval '1 minute';

  if v_calls > v_limit then
    raise exception 'Troppe richieste. Riprova tra qualche minuto.';
  end if;

  delete from public.team_invite_preview_calls
  where created_at < now() - interval '10 minutes';

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