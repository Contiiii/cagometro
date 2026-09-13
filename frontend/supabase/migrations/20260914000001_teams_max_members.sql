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
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if exists (
    select 1
    from public.team_members
    where user_id = v_user_id
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'L''utente appartiene già a una squadra';
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
declare
  v_team_id uuid;
begin
  select tm.team_id
  into v_team_id
  from public.team_members tm
  where tm.user_id = auth.uid()
    and tm.role = 'owner'
    and tm.left_at is null
    and tm.removed_at is null
  limit 1;

  if v_team_id is null then
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
  where id = v_team_id;

  return v_team_id;
end;
$function$
;

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
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if exists (
    select 1
    from public.team_members
    where user_id = v_user_id
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Appartieni già a una squadra';
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

  return v_team_id;
end;
$function$
;