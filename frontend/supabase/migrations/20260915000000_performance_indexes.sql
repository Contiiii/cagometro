-- Performance: indici per i percorsi di lettura più frequenti (team e report)

create index if not exists team_members_active_team_idx
  on public.team_members (team_id, user_id)
  where left_at is null and removed_at is null;

create index if not exists team_activity_team_created_idx
  on public.team_activity (team_id, created_at desc);

create index if not exists entries_active_partial_idx
  on public.entries (user_id, date)
  where count > 0;

set check_function_bodies = off;

-- Le function read-only vengono marcate STABLE: segnalano al planner che
-- non modificano lo stato e consentono l'inlining/ottimizzazione delle query.

CREATE OR REPLACE FUNCTION public.get_my_team()
 RETURNS TABLE(team_id uuid, team_name text, description text, avatar_emoji text, invite_code text, invites_enabled boolean, max_members integer, role text, joined_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    t.id,
    t.name,
    t.description,
    t.avatar_emoji,
    t.invite_code,
    t.invite_enabled as invites_enabled,
    t.max_members,
    tm.role,
    tm.joined_at
  from public.teams t
  join public.team_members tm
    on tm.team_id = t.id
  where tm.user_id = auth.uid()
    and tm.left_at is null
    and tm.removed_at is null
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_activity()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, activity_type text, points integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    ta.id,
    ta.user_id,
    p.display_name,
    ta.activity_type,
    ta.points,
    ta.created_at
  from public.team_activity ta

  join public.profiles p
    on p.user_id = ta.user_id

  where ta.team_id = (
    select team_id
    from public.team_members
    where user_id = auth.uid()
      and left_at is null
      and removed_at is null
    limit 1
  )

  order by ta.created_at desc
  limit 50;
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_activity(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, activity_type text, points integer, metadata jsonb, target_user_id uuid, target_display_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    ta.id,
    ta.user_id,
    actor.display_name,
    ta.activity_type,
    ta.points,
    ta.metadata,

    case
      when ta.metadata->>'targetUserId' is not null
      then (ta.metadata->>'targetUserId')::uuid
      else null
    end as target_user_id,

    target.display_name as target_display_name,

    ta.created_at
  from public.team_activity as ta

  join public.profiles as actor
    on actor.user_id = ta.user_id

  left join public.profiles as target
    on target.user_id = case
      when ta.metadata->>'targetUserId' is not null
      then (ta.metadata->>'targetUserId')::uuid
      else null
    end

  where ta.team_id = (
    select tm.team_id
    from public.team_members as tm
    where tm.user_id = auth.uid()
      and tm.left_at is null
      and tm.removed_at is null
    limit 1
  )

  order by ta.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_invite_preview(p_invite_code text)
 RETURNS TABLE(id uuid, name text, description text, avatar_emoji text, member_count bigint)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_code text := upper(trim(p_invite_code));
begin
  if v_code is null or v_code = '' then
    raise exception 'Codice invito non valido';
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

CREATE OR REPLACE FUNCTION public.get_team_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, weekly_total bigint, lifetime_total bigint, current_streak bigint, xp bigint)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (
    select current_date as d
  ),
  team_users as (
    select tm.user_id
    from public.team_members tm
    where tm.team_id = (
      select team_id
      from public.team_members
      where user_id = auth.uid()
        and left_at is null
        and removed_at is null
      limit 1
    )
      and tm.left_at is null
      and tm.removed_at is null
  ),
  active_days as (
    select
      e.user_id,
      e.date
    from public.entries e
    join team_users tu
      on tu.user_id = e.user_id
    where e.count > 0
  ),
  streak_groups as (
    select
      user_id,
      date,
      date - row_number() over (
        partition by user_id
        order by date
      )::integer as grp
    from active_days
  ),
  streaks as (
    select
      sg.user_id,
      count(*)::bigint as current_streak
    from streak_groups sg
    cross join today t
    group by sg.user_id, sg.grp, t.d
    having max(sg.date) = t.d
  )
  select
    p.user_id,
    p.display_name,

    coalesce(
      sum(
        case
          when e.date >= date_trunc('week', current_date)::date
          then e.count
          else 0
        end
      ),
      0
    ) as weekly_total,

    coalesce(sum(e.count), 0) as lifetime_total,

    coalesce(s.current_streak, 0) as current_streak,

    coalesce(sum(e.count), 0) * 10 as xp

  from public.team_members tm

  join public.profiles p
    on p.user_id = tm.user_id

  left join public.entries e
    on e.user_id = tm.user_id

  left join streaks s
    on s.user_id = tm.user_id

  where tm.team_id = (
    select team_id
    from public.team_members
    where user_id = auth.uid()
      and left_at is null
      and removed_at is null
    limit 1
  )
    and tm.left_at is null
    and tm.removed_at is null

  group by
    p.user_id,
    p.display_name,
    s.current_streak

  order by weekly_total desc;
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_members()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, role text, joined_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    tm.user_id,
    p.display_name,
    p.avatar_url,
    tm.role,
    tm.joined_at
  from public.team_members tm
  join public.profiles p
    on p.user_id = tm.user_id
  where tm.team_id = (
    select team_id
    from public.team_members
    where user_id = auth.uid()
      and left_at is null
      and removed_at is null
    limit 1
  )
  and tm.left_at is null
  and tm.removed_at is null
  order by
    case when tm.role = 'owner' then 0 else 1 end,
    tm.joined_at;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_settings()
 RETURNS TABLE(daily_reminder boolean, streak_alerts boolean, achievement_alerts boolean, team_alerts boolean, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    us.daily_reminder,
    us.streak_alerts,
    us.achievement_alerts,
    us.team_alerts,
    us.updated_at
  from public.user_settings us
  where us.user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_sessions()
 RETURNS TABLE(session_id uuid, created_at timestamp with time zone, refreshed_at timestamp with time zone, user_agent text, ip text, aal text, is_current boolean)
 LANGUAGE sql
 STABLE
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