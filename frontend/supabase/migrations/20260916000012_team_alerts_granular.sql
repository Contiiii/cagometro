-- Notifiche team: preferenze granulari + rate limit sulle nuove registrazioni

alter table "public"."user_settings"
  add column "team_entry_alerts" boolean not null default false,
  add column "team_member_alerts" boolean not null default false,
  add column "team_achievement_alerts" boolean not null default false,
  add column "last_team_entry_push_at" timestamp with time zone;

-- Eredita la preferenza unica esistente sui tre tipi
update "public"."user_settings"
set
  team_entry_alerts = team_alerts,
  team_member_alerts = team_alerts,
  team_achievement_alerts = team_alerts
where team_alerts = true;

alter table "public"."user_settings" drop column "team_alerts";

set check_function_bodies = off;

drop function if exists public.upsert_my_settings(boolean, boolean, boolean, boolean);

CREATE OR REPLACE FUNCTION public.get_my_settings()
 RETURNS TABLE(daily_reminder boolean, streak_alerts boolean, achievement_alerts boolean, team_entry_alerts boolean, team_member_alerts boolean, team_achievement_alerts boolean, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    us.daily_reminder,
    us.streak_alerts,
    us.achievement_alerts,
    us.team_entry_alerts,
    us.team_member_alerts,
    us.team_achievement_alerts,
    us.updated_at
  from public.user_settings us
  where us.user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_my_settings(
  p_daily_reminder boolean,
  p_streak_alerts boolean,
  p_achievement_alerts boolean,
  p_team_entry_alerts boolean,
  p_team_member_alerts boolean,
  p_team_achievement_alerts boolean
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.user_settings (
    user_id,
    daily_reminder,
    streak_alerts,
    achievement_alerts,
    team_entry_alerts,
    team_member_alerts,
    team_achievement_alerts
  )
  values (
    auth.uid(),
    p_daily_reminder,
    p_streak_alerts,
    p_achievement_alerts,
    p_team_entry_alerts,
    p_team_member_alerts,
    p_team_achievement_alerts
  )
  on conflict (user_id) do update
  set
    daily_reminder = excluded.daily_reminder,
    streak_alerts = excluded.streak_alerts,
    achievement_alerts = excluded.achievement_alerts,
    team_entry_alerts = excluded.team_entry_alerts,
    team_member_alerts = excluded.team_member_alerts,
    team_achievement_alerts = excluded.team_achievement_alerts,
    updated_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_team_activity_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
  v_title text;
  v_body text;
  v_members jsonb;
  v_entry_like boolean;
  v_entry_cooldown interval := interval '30 minutes';
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return new;
  end if;

  v_entry_like := new.activity_type = 'entry_created'
    or new.activity_type not in ('member_joined', 'member_left', 'achievement_unlocked');

  select jsonb_agg(tm.user_id)
  into v_members
  from public.team_members tm
  join public.user_settings us on us.user_id = tm.user_id
  where tm.team_id = new.team_id
    and tm.left_at is null
    and tm.removed_at is null
    and tm.user_id <> new.user_id
    and exists (
      select 1 from public.push_subscriptions ps
      where ps.user_id = tm.user_id
    )
    and case
      when v_entry_like then
        us.team_entry_alerts = true
        and (
          us.last_team_entry_push_at is null
          or us.last_team_entry_push_at < now() - v_entry_cooldown
        )
      when new.activity_type in ('member_joined', 'member_left') then
        us.team_member_alerts = true
      else
        us.team_achievement_alerts = true
    end;

  if v_members is null then
    return new;
  end if;

  select
    case new.activity_type
      when 'entry_created' then 'Nuove registrazioni in squadra'
      when 'member_joined' then 'Nuovo membro'
      when 'member_left' then 'Un membro ha lasciato la squadra'
      when 'achievement_unlocked' then 'Traguardo sbloccato'
      else 'Attività in squadra'
    end,
    case new.activity_type
      when 'entry_created' then 'Un membro ha registrato un nuovo traguardo'
      when 'member_joined' then 'Un nuovo membro si è unito alla squadra'
      when 'member_left' then 'Un membro ha lasciato la squadra'
      when 'achievement_unlocked' then 'Un membro ha sbloccato un traguardo'
      else 'C\'è una novità nella tua squadra'
    end
  into v_title, v_body;

  perform net.http_post(
    url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
    body => jsonb_build_object(
      'to', v_members,
      'type', 'team',
      'title', v_title,
      'body', v_body,
      'url', '/team'
    ),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    )
  );

  if v_entry_like then
    update public.user_settings
    set last_team_entry_push_at = now()
    where user_id in (
      select m.value::uuid
      from jsonb_array_elements_text(v_members) m
    );
  end if;

  return new;
end;
$function$
;

grant execute on function "public"."get_my_settings"() to "authenticated";

grant execute on function "public"."ensure_my_settings"() to "authenticated";

grant execute on function "public"."upsert_my_settings"(boolean, boolean, boolean, boolean, boolean, boolean) to "authenticated";