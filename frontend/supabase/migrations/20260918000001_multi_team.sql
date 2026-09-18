-- Multi-squadra: un utente può appartenere a più squadre (massimo 3).
-- Non esiste più il concetto di "squadra attiva" nel DB: ogni attività
-- (entry_created, achievement...) viene attribuita a tutte le squadre
-- dell'utente. Le RPC di lettura/scrittura diventano esplicite e ricevono
-- p_team_id / p_team_ids: niente più risoluzione implicita con limit 1.

set check_function_bodies = off;

-- 1. Vincolo "una sola squadra attiva per utente": rimosso ---------------
-- L'indice unico parziale era l'unica cosa che impediva più membership
-- attive; i lookup per utente restano coperti da un indice non unico.

drop index if exists public.team_members_one_active_team_per_user;

create index if not exists team_members_active_user_idx
  on public.team_members (user_id)
  where left_at is null and removed_at is null;

-- 2. Limite squadre (costante condivisa via variabile di migrazione) ------
-- Usiamo una costante documentata: 3 squadre per utente.

-- 3. create_team: niente più check mono-squadra, solo limite ---------------

create or replace function public.create_team(
  team_name text,
  team_description text default null::text,
  team_avatar_emoji text default null::text,
  team_max_members integer default 10
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_invite_code text;
  v_team_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  select count(*)
  into v_team_count
  from public.team_members
  where user_id = v_user_id
    and left_at is null
    and removed_at is null;

  if v_team_count >= 3 then
    raise exception 'Hai raggiunto il limite massimo di 3 squadre';
  end if;

  if team_max_members < 1 then
    raise exception 'La dimensione della squadra deve essere almeno 1';
  end if;

  v_invite_code :=
    upper(substr(md5(random()::text), 1, 4))
    || '-'
    || upper(substr(md5(random()::text), 1, 4));

  insert into public.teams (
    name,
    description,
    avatar_emoji,
    invite_code,
    max_members
  )
  values (
    trim(team_name),
    team_description,
    team_avatar_emoji,
    v_invite_code,
    team_max_members
  )
  returning id
  into v_team_id;

  insert into public.team_members (
    team_id,
    user_id,
    role
  )
  values (
    v_team_id,
    v_user_id,
    'owner'
  );

  return v_team_id;
end;
$function$
;

-- 4. join_team: limite squadre + guardia "già nella stessa squadra" -------

create or replace function public.join_team(team_invite_code text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_member_count integer;
  v_max_members integer;
  v_team_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  select count(*)
  into v_team_count
  from public.team_members
  where user_id = v_user_id
    and left_at is null
    and removed_at is null;

  if v_team_count >= 3 then
    raise exception 'Hai raggiunto il limite massimo di 3 squadre';
  end if;

  select
    t.id,
    t.max_members
  into
    v_team_id,
    v_max_members
  from public.teams t
  where t.invite_code = upper(trim(team_invite_code))
    and t.invite_enabled = true;

  if v_team_id is null then
    raise exception 'Codice invito non valido';
  end if;

  if exists (
    select 1
    from public.team_members
    where team_id = v_team_id
      and user_id = v_user_id
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Sei già in questa squadra';
  end if;

  select count(*)
  into v_member_count
  from public.team_members
  where team_id = v_team_id
    and left_at is null
    and removed_at is null;

  if v_member_count >= v_max_members then
    raise exception 'La squadra è piena';
  end if;

  insert into public.team_members (
    team_id,
    user_id,
    role
  )
  values (
    v_team_id,
    v_user_id,
    'member'
  );

  insert into public.team_activity (
    team_id,
    user_id,
    activity_type
  )
  values (
    v_team_id,
    v_user_id,
    'member_joined'
  );

  return v_team_id;
end;
$function$
;

-- 5. leave_team(p_team_id): uscita esplicita da una squadra ---------------
-- Nota: leave_team() 0-arg (firma di main) NON viene droppata: viene
-- ridefinita come wrapper di compatibilità nella sezione 12.

create or replace function public.leave_team(p_team_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_role text;
  v_active_members integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  select tm.role
  into v_role
  from public.team_members tm
  where tm.team_id = p_team_id
    and tm.user_id = v_user_id
    and tm.left_at is null
    and tm.removed_at is null;

  if v_role is null then
    raise exception 'Squadra non trovata';
  end if;

  if v_role = 'member' then
    insert into public.team_activity (
      team_id,
      user_id,
      activity_type
    )
    values (
      p_team_id,
      v_user_id,
      'member_left'
    );

    update public.team_members
    set left_at = now()
    where team_id = p_team_id
      and user_id = v_user_id
      and left_at is null
      and removed_at is null;

    return;
  end if;

  select count(*)
  into v_active_members
  from public.team_members
  where team_id = p_team_id
    and left_at is null
    and removed_at is null;

  if v_active_members > 1 then
    raise exception
      'Trasferisci la proprietà della squadra prima di uscire';
  end if;

  update public.team_members
  set left_at = now()
  where team_id = p_team_id
    and user_id = v_user_id
    and left_at is null
    and removed_at is null;

  delete from public.teams
  where id = p_team_id;
end;
$function$
;

-- 6. Letture: lista squadre + squadra singola ------------------------------
-- Nota: get_my_team() 0-arg (firma di main) NON viene droppata: wrapper di
-- compatibilità nella sezione 12.

create or replace function public.get_my_teams()
 returns table(
   team_id uuid,
   team_name text,
   description text,
   avatar_emoji text,
   role text,
   joined_at timestamp with time zone,
   member_count bigint
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    t.id,
    t.name,
    t.description,
    t.avatar_emoji,
    tm.role,
    tm.joined_at,
    (
      select count(*)
      from public.team_members act
      where act.team_id = t.id
        and act.left_at is null
        and act.removed_at is null
    ) as member_count
  from public.teams t
  join public.team_members tm
    on tm.team_id = t.id
  where tm.user_id = auth.uid()
    and tm.left_at is null
    and tm.removed_at is null
  order by tm.joined_at;
$function$
;

create or replace function public.get_team(p_team_id uuid)
 returns table(
   team_id uuid,
   team_name text,
   description text,
   avatar_emoji text,
   invite_code text,
   invites_enabled boolean,
   max_members integer,
   role text,
   joined_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
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
  where tm.team_id = p_team_id
    and tm.user_id = auth.uid()
    and tm.left_at is null
    and tm.removed_at is null;
$function$
;

-- 7. Getter dashboard con p_team_id esplicito ------------------------------
-- Nota: get_team_activity() e get_team_activity(integer, integer) (firme di
-- main) NON vengono droppate: wrapper di compatibilità nella sezione 12.

create or replace function public.get_team_members(p_team_id uuid)
 returns table(
   user_id uuid,
   display_name text,
   avatar_url text,
   role text,
   joined_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    tm.user_id,
    p.display_name,
    p.avatar_url,
    tm.role,
    tm.joined_at
  from public.team_members tm
  join public.profiles p
    on p.user_id = tm.user_id
  where tm.team_id = p_team_id
    and tm.left_at is null
    and tm.removed_at is null
    and exists (
      select 1
      from public.team_members me
      where me.team_id = p_team_id
        and me.user_id = auth.uid()
        and me.left_at is null
        and me.removed_at is null
    )
  order by
    case when tm.role = 'owner' then 0 else 1 end,
    tm.joined_at;
$function$
;

create or replace function public.get_team_leaderboard(p_team_id uuid)
 returns table(
   user_id uuid,
   display_name text,
   weekly_total bigint,
   lifetime_total bigint,
   current_streak bigint,
   xp bigint
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  with today as (
    select current_date as d
  ),
  team_users as (
    select tm.user_id
    from public.team_members tm
    where tm.team_id = p_team_id
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

  where tm.team_id = p_team_id
    and tm.left_at is null
    and tm.removed_at is null
    and exists (
      select 1
      from public.team_members me
      where me.team_id = p_team_id
        and me.user_id = auth.uid()
        and me.left_at is null
        and me.removed_at is null
    )

  group by
    p.user_id,
    p.display_name,
    s.current_streak

  order by weekly_total desc;
$function$
;

create or replace function public.get_team_activity(
  p_limit integer,
  p_offset integer,
  p_team_id uuid
)
 returns table(
   id uuid,
   user_id uuid,
   display_name text,
   activity_type text,
   points integer,
   metadata jsonb,
   target_user_id uuid,
   target_display_name text,
   created_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
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

  where ta.team_id = p_team_id
    and exists (
      select 1
      from public.team_members me
      where me.team_id = p_team_id
        and me.user_id = auth.uid()
        and me.left_at is null
        and me.removed_at is null
    )

  order by ta.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$function$
;

-- 8. create_team_activity: fan-out su tutte le squadre ----------------------
-- p_team_ids null => tutte le squadre dell'utente. La dedup key viene
-- qualificata con il team id per non collidere sull'indice unico globale.

create or replace function public.create_team_activity(
  p_activity_type text,
  p_points integer DEFAULT NULL::integer,
  p_metadata jsonb DEFAULT NULL::jsonb,
  p_dedup_key text DEFAULT NULL::text,
  p_team_ids uuid[] DEFAULT NULL::uuid[]
)
 returns uuid[]
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_id uuid;
  v_ids uuid[] := ARRAY[]::uuid[];
  v_dedup text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return ARRAY[]::uuid[];
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
    v_dedup :=
      case
        when p_dedup_key is null then null
        else p_dedup_key || ':' || v_team_id::text
      end;

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
      v_user_id,
      p_activity_type,
      p_points,
      p_metadata,
      v_dedup
    )
    on conflict (dedup_key) where dedup_key is not null
    do nothing
    returning id into v_id;

    if v_id is not null then
      v_ids := v_ids || v_id;
      v_id := null;
    end if;
  end loop;

  return v_ids;
end;
$function$
;

-- 9. remove_team_activity: annullamento su tutte le squadre ----------------
-- Riconosce sia le dedup qualificate (multisquadra) sia quelle legacy.

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
        and (
          p_dedup_key is null
          or sub.dedup_key in (
            p_dedup_key,
            p_dedup_key || ':' || v_team_id::text
          )
        )
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

-- 10. Azioni owner con p_team_id esplicito ---------------------------------
-- Nota: le firme vecchie (transfer_ownership(uuid), remove_team_member(uuid),
-- regenerate_invite_code(), toggle_team_invites(boolean),
-- update_team(text, text, text, integer)) NON vengono droppate: wrapper di
-- compatibilità nella sezione 12.

create or replace function public.transfer_ownership(
  new_owner_user_id uuid,
  p_team_id uuid
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if new_owner_user_id is null then
    raise exception 'Seleziona un membro valido';
  end if;

  if new_owner_user_id = v_user_id then
    raise exception 'Non puoi trasferire la proprietà a te stesso';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = v_user_id
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  ) then
    raise exception 'Solo l''owner può trasferire la proprietà';
  end if;

  perform 1
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Squadra non trovata';
  end if;

  if not exists (
    select 1
    from public.team_members
    where team_id = p_team_id
      and user_id = new_owner_user_id
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Utente non appartenente alla squadra';
  end if;

  update public.team_members
  set role = 'member'
  where team_id = p_team_id
    and user_id = v_user_id
    and role = 'owner'
    and left_at is null
    and removed_at is null;

  update public.team_members
  set role = 'owner'
  where team_id = p_team_id
    and user_id = new_owner_user_id
    and left_at is null
    and removed_at is null;

  insert into public.team_activity (
    team_id,
    user_id,
    activity_type,
    metadata
  )
  values (
    p_team_id,
    v_user_id,
    'ownership_transferred',
    jsonb_build_object('targetUserId', new_owner_user_id)
  );
end;
$function$
;

create or replace function public.remove_team_member(
  target_user_id uuid,
  p_team_id uuid
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  ) then
    raise exception 'Solo l''owner può rimuovere membri';
  end if;

  if exists (
    select 1
    from public.team_members
    where team_id = p_team_id
      and user_id = target_user_id
      and role = 'owner'
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Non puoi rimuovere l''owner';
  end if;

  update public.team_members
  set removed_at = now()
  where team_id = p_team_id
    and user_id = target_user_id
    and left_at is null
    and removed_at is null;

  insert into public.team_activity (
    team_id,
    user_id,
    activity_type,
    metadata
  )
  values (
    p_team_id,
    auth.uid(),
    'member_removed',
    jsonb_build_object('targetUserId', target_user_id)
  );
end;
$function$
;

create or replace function public.regenerate_invite_code(p_team_id uuid)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  ) then
    raise exception 'Solo l''owner può rigenerare il codice';
  end if;

  v_code :=
    upper(substr(md5(random()::text), 1, 4))
    || '-' ||
    upper(substr(md5(random()::text), 1, 4));

  update public.teams
  set invite_code = v_code
  where id = p_team_id;

  return v_code;
end;
$function$
;

create or replace function public.toggle_team_invites(
  p_enabled boolean,
  p_team_id uuid
)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  ) then
    raise exception 'Solo il proprietario puo'' gestire gli inviti';
  end if;

  update public.teams
  set invite_enabled = p_enabled
  where id = p_team_id;
end;
$function$
;

create or replace function public.update_team(
  p_name text,
  p_description text,
  p_avatar_emoji text,
  p_max_members integer,
  p_team_id uuid
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
      and tm.left_at is null
      and tm.removed_at is null
  ) then
    raise exception 'Solo il proprietario può modificare la squadra';
  end if;

  if p_max_members is not null and p_max_members < 1 then
    raise exception 'La dimensione della squadra deve essere almeno 1';
  end if;

  update public.teams
  set
    name = trim(p_name),
    description = nullif(trim(p_description), ''),
    avatar_emoji = p_avatar_emoji,
    max_members = case
      when p_max_members is not null then p_max_members
      else max_members
    end,
    updated_at = now()
  where id = p_team_id;

  return p_team_id;
end;
$function$
;

-- 11. Privilegi sui nuovi argomenti/segnature -------------------------------

grant execute on function public.create_team(text, text, text, integer) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.leave_team(uuid) to authenticated;
grant execute on function public.get_my_teams() to authenticated;
grant execute on function public.get_team(uuid) to authenticated;
grant execute on function public.get_team_members(uuid) to authenticated;
grant execute on function public.get_team_leaderboard(uuid) to authenticated;
grant execute on function public.get_team_activity(integer, integer, uuid) to authenticated;
grant execute on function public.create_team_activity(text, integer, jsonb, text, uuid[]) to authenticated;
grant execute on function public.remove_team_activity(text, text, uuid[]) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.toggle_team_invites(boolean, uuid) to authenticated;
grant execute on function public.update_team(text, text, text, integer, uuid) to authenticated;

-- 12. Compatibilità firme vecchie (branch main) -----------------------------

set check_function_bodies = off;

-- Helper: prima squadra attiva dell'utente corrente -------------------------

create or replace function public.first_active_team_id()
 returns uuid
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select team_id
  from public.team_members
  where user_id = auth.uid()
    and left_at is null
    and removed_at is null
  order by joined_at
  limit 1;
$function$
;

-- get_my_team(): squadra attiva (prima) con il formato esatto di main ------

create or replace function public.get_my_team()
 returns table(
   team_id uuid,
   team_name text,
   description text,
   avatar_emoji text,
   invite_code text,
   invites_enabled boolean,
   max_members integer,
   role text,
   joined_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select gt.*
  from public.get_team(public.first_active_team_id()) gt;
$function$
;

-- leave_team(): abbandona la prima squadra attiva ---------------------------

create or replace function public.leave_team()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  perform public.leave_team(public.first_active_team_id());
end;
$function$
;

-- get_team_members(): membri della prima squadra attiva ---------------------

create or replace function public.get_team_members()
 returns table(
   user_id uuid,
   display_name text,
   avatar_url text,
   role text,
   joined_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select gm.*
  from public.get_team_members(public.first_active_team_id()) gm;
$function$
;

-- get_team_leaderboard(): classifica della prima squadra attiva -------------

create or replace function public.get_team_leaderboard()
 returns table(
   user_id uuid,
   display_name text,
   weekly_total bigint,
   lifetime_total bigint,
   current_streak bigint,
   xp bigint
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select gl.*
  from public.get_team_leaderboard(public.first_active_team_id()) gl;
$function$
;

-- get_team_activity() (0-arg, shape esatta di main) -------------------------

create or replace function public.get_team_activity()
 returns table(
   id uuid,
   user_id uuid,
   display_name text,
   activity_type text,
   points integer,
   created_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    ta.id,
    ta.user_id,
    ta.display_name,
    ta.activity_type,
    ta.points,
    ta.created_at
  from public.get_team_activity(20, 0, public.first_active_team_id()) ta;
$function$
;

-- get_team_activity(integer, integer): shape esatta di main ----------------

create or replace function public.get_team_activity(p_limit integer default 20, p_offset integer default 0)
 returns table(
   id uuid,
   user_id uuid,
   display_name text,
   activity_type text,
   points integer,
   metadata jsonb,
   target_user_id uuid,
   target_display_name text,
   created_at timestamp with time zone
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select gt.*
  from public.get_team_activity(p_limit, p_offset, public.first_active_team_id()) gt;
$function$
;

-- Azioni owner (0-arg) sulla prima squadra attiva ---------------------------

create or replace function public.transfer_ownership(new_owner_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  perform public.transfer_ownership(new_owner_user_id, public.first_active_team_id());
end;
$function$
;

create or replace function public.remove_team_member(target_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  perform public.remove_team_member(target_user_id, public.first_active_team_id());
end;
$function$
;

create or replace function public.regenerate_invite_code()
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  return public.regenerate_invite_code(public.first_active_team_id());
end;
$function$
;

create or replace function public.toggle_team_invites(p_enabled boolean)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  perform public.toggle_team_invites(p_enabled, public.first_active_team_id());
end;
$function$
;

create or replace function public.update_team(
  p_name text,
  p_description text,
  p_avatar_emoji text,
  p_max_members integer default null::integer
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if public.first_active_team_id() is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;
  return public.update_team(
    p_name,
    p_description,
    p_avatar_emoji,
    p_max_members,
    public.first_active_team_id()
  );
end;
$function$
;

-- 13. Privilegi sulle firme di compatibilità --------------------------------

grant execute on function public.first_active_team_id() to authenticated;
grant execute on function public.get_my_team() to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.get_team_members() to authenticated;
grant execute on function public.get_team_leaderboard() to authenticated;
grant execute on function public.get_team_activity() to authenticated;
grant execute on function public.get_team_activity(integer, integer) to authenticated;
grant execute on function public.transfer_ownership(uuid) to authenticated;
grant execute on function public.remove_team_member(uuid) to authenticated;
grant execute on function public.regenerate_invite_code() to authenticated;
grant execute on function public.toggle_team_invites(boolean) to authenticated;
grant execute on function public.update_team(text, text, text, integer) to authenticated;