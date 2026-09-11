drop extension if exists "pg_net";


  create table "public"."entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "count" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."entries" enable row level security;


  create table "public"."feedback" (
    "id" bigint generated always as identity not null,
    "category" text not null default 'altro'::text,
    "message" text not null,
    "author_name" text not null,
    "user_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."feedback" enable row level security;


  create table "public"."profiles" (
    "user_id" uuid not null,
    "display_name" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."team_activity" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid not null,
    "user_id" uuid not null,
    "activity_type" text not null,
    "points" integer,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."team_activity" enable row level security;


  create table "public"."team_members" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "joined_at" timestamp with time zone not null default now(),
    "left_at" timestamp with time zone,
    "removed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."team_members" enable row level security;


  create table "public"."teams" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "avatar_emoji" text,
    "invite_code" text,
    "invite_enabled" boolean not null default true,
    "max_members" integer not null default 10,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."teams" enable row level security;

CREATE UNIQUE INDEX entries_pkey ON public.entries USING btree (id);

CREATE UNIQUE INDEX entries_user_date_unique ON public.entries USING btree (user_id, date);

CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX team_activity_pkey ON public.team_activity USING btree (id);

CREATE UNIQUE INDEX team_members_one_active_team_per_user ON public.team_members USING btree (user_id) WHERE ((left_at IS NULL) AND (removed_at IS NULL));

CREATE UNIQUE INDEX team_members_one_owner_per_team ON public.team_members USING btree (team_id) WHERE ((role = 'owner'::text) AND (left_at IS NULL) AND (removed_at IS NULL));

CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);

CREATE UNIQUE INDEX teams_invite_code_key ON public.teams USING btree (invite_code);

CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);

alter table "public"."entries" add constraint "entries_pkey" PRIMARY KEY using index "entries_pkey";

alter table "public"."feedback" add constraint "feedback_pkey" PRIMARY KEY using index "feedback_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."team_activity" add constraint "team_activity_pkey" PRIMARY KEY using index "team_activity_pkey";

alter table "public"."team_members" add constraint "team_members_pkey" PRIMARY KEY using index "team_members_pkey";

alter table "public"."teams" add constraint "teams_pkey" PRIMARY KEY using index "teams_pkey";

alter table "public"."entries" add constraint "entries_count_non_negative" CHECK ((count >= 0)) not valid;

alter table "public"."entries" validate constraint "entries_count_non_negative";

alter table "public"."entries" add constraint "entries_count_reasonable" CHECK ((count <= 100)) not valid;

alter table "public"."entries" validate constraint "entries_count_reasonable";

alter table "public"."entries" add constraint "entries_user_date_unique" UNIQUE using index "entries_user_date_unique";

alter table "public"."feedback" add constraint "feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."feedback" validate constraint "feedback_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_display_name_length" CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 50))) not valid;

alter table "public"."profiles" validate constraint "profiles_display_name_length";

alter table "public"."profiles" add constraint "profiles_display_name_not_blank" CHECK ((btrim(display_name) <> ''::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_display_name_not_blank";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."team_activity" add constraint "team_activity_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE not valid;

alter table "public"."team_activity" validate constraint "team_activity_team_id_fkey";

alter table "public"."team_members" add constraint "team_members_not_left_and_removed" CHECK ((NOT ((left_at IS NOT NULL) AND (removed_at IS NOT NULL)))) not valid;

alter table "public"."team_members" validate constraint "team_members_not_left_and_removed";

alter table "public"."team_members" add constraint "team_members_role_valid" CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text]))) not valid;

alter table "public"."team_members" validate constraint "team_members_role_valid";

alter table "public"."team_members" add constraint "team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_team_id_fkey";

alter table "public"."team_members" add constraint "team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_user_id_fkey";

alter table "public"."teams" add constraint "teams_invite_code_key" UNIQUE using index "teams_invite_code_key";

alter table "public"."teams" add constraint "teams_max_members_positive" CHECK ((max_members > 0)) not valid;

alter table "public"."teams" validate constraint "teams_max_members_positive";

alter table "public"."teams" add constraint "teams_name_length" CHECK (((char_length(name) >= 3) AND (char_length(name) <= 50))) not valid;

alter table "public"."teams" validate constraint "teams_name_length";

alter table "public"."teams" add constraint "teams_name_not_blank" CHECK ((btrim(name) <> ''::text)) not valid;

alter table "public"."teams" validate constraint "teams_name_not_blank";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_team(team_name text, team_description text DEFAULT NULL::text, team_avatar_emoji text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  v_invite_code :=
    upper(substr(md5(random()::text), 1, 4))
    || '-'
    || upper(substr(md5(random()::text), 1, 4));

  insert into public.teams (
    name,
    description,
    avatar_emoji,
    invite_code
  )
  values (
    trim(team_name),
    team_description,
    team_avatar_emoji,
    v_invite_code
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

CREATE OR REPLACE FUNCTION public.create_team_activity(p_activity_type text, p_points integer DEFAULT NULL::integer)
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
    points
  )
  values (
    v_team_id,
    auth.uid(),
    p_activity_type,
    p_points
  )
  returning id into v_id;

  return v_id;
end;
$function$
;

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

  select team_id
  into v_team_id
  from public.team_members
  where user_id = auth.uid()
    and left_at is null
    and removed_at is null
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

CREATE OR REPLACE FUNCTION public.get_my_team()
 RETURNS TABLE(team_id uuid, team_name text, description text, avatar_emoji text, invite_code text, invites_enabled boolean, max_members integer, role text, joined_at timestamp with time zone)
 LANGUAGE sql
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
    count(tm.user_id)::bigint as member_count
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

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin

  insert into public.profiles (
    user_id,
    display_name,
    avatar_url
  )
  values (
    new.id,

    left(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        'Utente'
      ),
      50
    ),

    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )

  on conflict (user_id) do nothing;

  return new;

end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_active_team_member(checked_team_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.team_members as tm
    where tm.team_id = checked_team_id
      and tm.user_id = (select auth.uid())
      and tm.left_at is null
      and tm.removed_at is null
  );
$function$
;

CREATE OR REPLACE FUNCTION public.join_team(team_invite_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_member_count integer;
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
    t.id
  into v_team_id
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

  if v_member_count >= 10 then
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

CREATE OR REPLACE FUNCTION public.leave_team()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.regenerate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team_id uuid;
  v_code text;
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
    raise exception 'Solo l''owner può rigenerare il codice';
  end if;

  v_code :=
    upper(substr(md5(random()::text),1,4))
    || '-' ||
    upper(substr(md5(random()::text),1,4));

  update public.teams
  set invite_code = v_code
  where id = v_team_id;

  return v_code;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_team_member(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_team_members_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_teams_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_team_invites(p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team_id uuid;
begin
  select t.id
    into v_team_id
    from public.teams t
    join public.team_members tm
      on tm.team_id = t.id
   where tm.user_id = auth.uid()
     and tm.role = 'owner'
     and tm.left_at is null
     and tm.removed_at is null
   limit 1;

  if v_team_id is null then
    raise exception 'Solo il proprietario puo'' gestire gli inviti';
  end if;

  update public.teams
     set invite_enabled = p_enabled
   where id = v_team_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.transfer_ownership(new_owner_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  /*
    Aggiungi questo UPDATE soltanto se public.teams
    contiene davvero una colonna owner_id.
  */

  -- update public.teams
  -- set owner_id = new_owner_user_id
  -- where id = v_team_id;

  /*
    Inserisci un evento solo se la tabella team_activity
    e le sue colonne corrispondono davvero a questa struttura.
  */

  -- insert into public.team_activity (
  --   team_id,
  --   activity_type,
  --   actor_user_id,
  --   target_user_id,
  --   created_at
  -- )
  -- values (
  --   v_team_id,
  --   'ownership_transfer',
  --   v_user_id,
  --   new_owner_user_id,
  --   now()
  -- );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_team(p_name text, p_description text, p_avatar_emoji text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  update public.teams
  set
    name = trim(p_name),
    description = nullif(trim(p_description), ''),
    avatar_emoji = p_avatar_emoji,
    updated_at = now()
  where id = v_team_id;

  return v_team_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."entries" to "anon";

grant insert on table "public"."entries" to "anon";

grant references on table "public"."entries" to "anon";

grant select on table "public"."entries" to "anon";

grant trigger on table "public"."entries" to "anon";

grant truncate on table "public"."entries" to "anon";

grant update on table "public"."entries" to "anon";

grant delete on table "public"."entries" to "authenticated";

grant insert on table "public"."entries" to "authenticated";

grant references on table "public"."entries" to "authenticated";

grant select on table "public"."entries" to "authenticated";

grant trigger on table "public"."entries" to "authenticated";

grant truncate on table "public"."entries" to "authenticated";

grant update on table "public"."entries" to "authenticated";

grant delete on table "public"."entries" to "service_role";

grant insert on table "public"."entries" to "service_role";

grant references on table "public"."entries" to "service_role";

grant select on table "public"."entries" to "service_role";

grant trigger on table "public"."entries" to "service_role";

grant truncate on table "public"."entries" to "service_role";

grant update on table "public"."entries" to "service_role";

grant delete on table "public"."feedback" to "anon";

grant insert on table "public"."feedback" to "anon";

grant references on table "public"."feedback" to "anon";

grant select on table "public"."feedback" to "anon";

grant trigger on table "public"."feedback" to "anon";

grant truncate on table "public"."feedback" to "anon";

grant update on table "public"."feedback" to "anon";

grant delete on table "public"."feedback" to "authenticated";

grant insert on table "public"."feedback" to "authenticated";

grant references on table "public"."feedback" to "authenticated";

grant select on table "public"."feedback" to "authenticated";

grant trigger on table "public"."feedback" to "authenticated";

grant truncate on table "public"."feedback" to "authenticated";

grant update on table "public"."feedback" to "authenticated";

grant delete on table "public"."feedback" to "service_role";

grant insert on table "public"."feedback" to "service_role";

grant references on table "public"."feedback" to "service_role";

grant select on table "public"."feedback" to "service_role";

grant trigger on table "public"."feedback" to "service_role";

grant truncate on table "public"."feedback" to "service_role";

grant update on table "public"."feedback" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."team_activity" to "anon";

grant insert on table "public"."team_activity" to "anon";

grant references on table "public"."team_activity" to "anon";

grant select on table "public"."team_activity" to "anon";

grant trigger on table "public"."team_activity" to "anon";

grant truncate on table "public"."team_activity" to "anon";

grant update on table "public"."team_activity" to "anon";

grant delete on table "public"."team_activity" to "authenticated";

grant insert on table "public"."team_activity" to "authenticated";

grant references on table "public"."team_activity" to "authenticated";

grant select on table "public"."team_activity" to "authenticated";

grant trigger on table "public"."team_activity" to "authenticated";

grant truncate on table "public"."team_activity" to "authenticated";

grant update on table "public"."team_activity" to "authenticated";

grant delete on table "public"."team_activity" to "service_role";

grant insert on table "public"."team_activity" to "service_role";

grant references on table "public"."team_activity" to "service_role";

grant select on table "public"."team_activity" to "service_role";

grant trigger on table "public"."team_activity" to "service_role";

grant truncate on table "public"."team_activity" to "service_role";

grant update on table "public"."team_activity" to "service_role";

grant delete on table "public"."team_members" to "anon";

grant insert on table "public"."team_members" to "anon";

grant references on table "public"."team_members" to "anon";

grant select on table "public"."team_members" to "anon";

grant trigger on table "public"."team_members" to "anon";

grant truncate on table "public"."team_members" to "anon";

grant update on table "public"."team_members" to "anon";

grant delete on table "public"."team_members" to "authenticated";

grant insert on table "public"."team_members" to "authenticated";

grant references on table "public"."team_members" to "authenticated";

grant select on table "public"."team_members" to "authenticated";

grant trigger on table "public"."team_members" to "authenticated";

grant truncate on table "public"."team_members" to "authenticated";

grant update on table "public"."team_members" to "authenticated";

grant delete on table "public"."team_members" to "service_role";

grant insert on table "public"."team_members" to "service_role";

grant references on table "public"."team_members" to "service_role";

grant select on table "public"."team_members" to "service_role";

grant trigger on table "public"."team_members" to "service_role";

grant truncate on table "public"."team_members" to "service_role";

grant update on table "public"."team_members" to "service_role";

grant delete on table "public"."teams" to "anon";

grant insert on table "public"."teams" to "anon";

grant references on table "public"."teams" to "anon";

grant select on table "public"."teams" to "anon";

grant trigger on table "public"."teams" to "anon";

grant truncate on table "public"."teams" to "anon";

grant update on table "public"."teams" to "anon";

grant delete on table "public"."teams" to "authenticated";

grant insert on table "public"."teams" to "authenticated";

grant references on table "public"."teams" to "authenticated";

grant select on table "public"."teams" to "authenticated";

grant trigger on table "public"."teams" to "authenticated";

grant truncate on table "public"."teams" to "authenticated";

grant update on table "public"."teams" to "authenticated";

grant delete on table "public"."teams" to "service_role";

grant insert on table "public"."teams" to "service_role";

grant references on table "public"."teams" to "service_role";

grant select on table "public"."teams" to "service_role";

grant trigger on table "public"."teams" to "service_role";

grant truncate on table "public"."teams" to "service_role";

grant update on table "public"."teams" to "service_role";


  create policy "Users can delete own entries"
  on "public"."entries"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert own entries"
  on "public"."entries"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can read own entries"
  on "public"."entries"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can update own entries"
  on "public"."entries"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "chiunque segnala"
  on "public"."feedback"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Authenticated users can read profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Team members can read their team activity"
  on "public"."team_activity"
  as permissive
  for select
  to authenticated
using (public.is_active_team_member(team_id));



  create policy "Users can read members of their team"
  on "public"."team_members"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.team_members self
  WHERE ((self.team_id = team_members.team_id) AND (self.user_id = auth.uid()) AND (self.left_at IS NULL) AND (self.removed_at IS NULL)))));



  create policy "Users can read their own team"
  on "public"."teams"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.team_members tm
  WHERE ((tm.team_id = teams.id) AND (tm.user_id = auth.uid()) AND (tm.left_at IS NULL) AND (tm.removed_at IS NULL)))));


CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_team_members_updated_at();

CREATE TRIGGER teams_set_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_teams_updated_at();

CREATE TRIGGER on_auth_user_created_create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


