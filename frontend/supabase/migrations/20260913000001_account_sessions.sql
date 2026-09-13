set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_sessions()
 RETURNS TABLE(session_id uuid, created_at timestamp with time zone, refreshed_at timestamp with time zone, user_agent text, ip text, aal text, is_current boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'auth'
AS $function$
  select
    s.id,
    s.created_at,
    s.refreshed_at,
    s.user_agent,
    s.ip::text,
    s.aal::text,
    (s.id = (auth.jwt() ->> 'session_id')::uuid)
  from sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_other_sessions()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'auth'
AS $function$
  delete from sessions
  where user_id = auth.uid()
    and id <> (auth.jwt() ->> 'session_id')::uuid;
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'auth'
AS $function$
  delete from sessions
  where user_id = auth.uid()
    and id = p_session_id
    and id <> (auth.jwt() ->> 'session_id')::uuid;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth','public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
  v_successor uuid;
begin
  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  delete from public.feedback where user_id = v_user_id;
  delete from public.entries where user_id = v_user_id;

  for v_team_id in
    select tm.team_id
    from public.team_members tm
    where tm.user_id = v_user_id
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  loop
    select successor.user_id into v_successor
    from (
      select
        tm.user_id,
        coalesce(
          sum(case when e.date >= date_trunc('week', current_date)::date then e.count else 0 end),
          0
        ) as weekly_total,
        coalesce(sum(e.count), 0) as lifetime_total,
        tm.joined_at
      from public.team_members tm
      left join public.entries e on e.user_id = tm.user_id
      where tm.team_id = v_team_id
        and tm.user_id <> v_user_id
        and tm.left_at is null
        and tm.removed_at is null
      group by tm.user_id, tm.joined_at
      order by weekly_total desc, lifetime_total desc, tm.joined_at asc
      limit 1
    ) successor;

    if v_successor is null then
      delete from public.teams where id = v_team_id;
    else
      delete from public.team_members
      where team_id = v_team_id and user_id = v_user_id;

      update public.team_members
      set role = 'owner'
      where team_id = v_team_id and user_id = v_successor;
    end if;
  end loop;

  delete from public.profiles where user_id = v_user_id;

  delete from auth.users where id = v_user_id;
end;
$function$
;

grant execute on function "public"."get_my_sessions"() to "authenticated";

grant execute on function "public"."revoke_other_sessions"() to "authenticated";

grant execute on function "public"."revoke_session"(uuid) to "authenticated";

grant execute on function "public"."delete_account"() to "authenticated";