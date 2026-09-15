-- Sposta il logging delle attività di squadra dentro le RPC, nella stessa
-- transazione dell'operazione (o in un blocco atomico dedicato dove serve).
-- Il client non chiama più create_team_activity dopo queste operazioni.

set check_function_bodies = off;

-- join_team ---------------------------------------------------------------

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

-- leave_team ---------------------------------------------------------------

create or replace function public.leave_team()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_role text;
  v_active_members integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  select
    team_id,
    role
  into
    v_team_id,
    v_role
  from public.team_members
  where user_id = v_user_id
    and left_at is null
    and removed_at is null
  limit 1;

  if v_team_id is null then
    raise exception 'Non appartieni a nessuna squadra';
  end if;

  if v_role = 'member' then
    insert into public.team_activity (
      team_id,
      user_id,
      activity_type
    )
    values (
      v_team_id,
      v_user_id,
      'member_left'
    );

    update public.team_members
    set left_at = now()
    where user_id = v_user_id
      and left_at is null
      and removed_at is null;

    return;
  end if;

  select count(*)
  into v_active_members
  from public.team_members
  where team_id = v_team_id
    and left_at is null
    and removed_at is null;

  if v_active_members > 1 then
    raise exception
      'Trasferisci la proprietà della squadra prima di uscire';
  end if;

  update public.team_members
  set left_at = now()
  where user_id = v_user_id
    and left_at is null
    and removed_at is null;

  delete from public.teams
  where id = v_team_id;
end;
$function$
;

-- remove_team_member ---------------------------------------------------------

create or replace function public.remove_team_member(target_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_team_id uuid;
begin
  select team_id
  into v_team_id
  from public.team_members
  where user_id = auth.uid()
    and role = 'owner'
    and left_at is null
    and removed_at is null
  limit 1;

  if v_team_id is null then
    raise exception 'Solo l''owner può rimuovere membri';
  end if;

  if exists (
    select 1
    from public.team_members
    where user_id = target_user_id
      and role = 'owner'
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Non puoi rimuovere l''owner';
  end if;

  update public.team_members
  set removed_at = now()
  where team_id = v_team_id
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
    v_team_id,
    auth.uid(),
    'member_removed',
    jsonb_build_object('targetUserId', target_user_id)
  );
end;
$function$
;

-- transfer_ownership ---------------------------------------------------------

create or replace function public.transfer_ownership(new_owner_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_team_id uuid;
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

  select team_id
  into v_team_id
  from public.team_members
  where user_id = v_user_id
    and role = 'owner'
    and left_at is null
    and removed_at is null
  limit 1;

  if v_team_id is null then
    raise exception 'Solo l''owner può trasferire la proprietà';
  end if;

  /*
    Lock della squadra:
    impedisce a due trasferimenti contemporanei
    di modificare ruoli sulla stessa squadra nello stesso momento.
  */
  perform 1
  from public.teams
  where id = v_team_id
  for update;

  if not found then
    raise exception 'Squadra non trovata';
  end if;

  if not exists (
    select 1
    from public.team_members
    where team_id = v_team_id
      and user_id = new_owner_user_id
      and left_at is null
      and removed_at is null
  ) then
    raise exception 'Utente non appartenente alla squadra';
  end if;

  update public.team_members
  set role = 'member'
  where team_id = v_team_id
    and user_id = v_user_id
    and role = 'owner'
    and left_at is null
    and removed_at is null;

  update public.team_members
  set role = 'owner'
  where team_id = v_team_id
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
    v_team_id,
    v_user_id,
    'ownership_transferred',
    jsonb_build_object('targetUserId', new_owner_user_id)
  );
end;
$function$
;