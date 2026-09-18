create extension if not exists pg_net;
create extension if not exists pg_cron;

create table "public"."push_subscriptions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "endpoint" text not null,
  "keys_p256dh" text not null,
  "keys_auth" text not null,
  "user_agent" text,
  "device_name" text,
  "last_seen_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."push_subscriptions" enable row level security;

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_endpoint_key" UNIQUE using index "push_subscriptions_endpoint_key";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_user_id_fkey";

alter table "public"."user_settings" add column "last_daily_push_at" timestamp with time zone;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_push_subscriptions()
 RETURNS TABLE(endpoint text, keys_p256dh text, keys_auth text, user_agent text, device_name text, last_seen_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    ps.endpoint,
    ps.keys_p256dh,
    ps.keys_auth,
    ps.user_agent,
    ps.device_name,
    ps.last_seen_at,
    ps.created_at
  from public.push_subscriptions ps
  where ps.user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.subscribe_push(
  p_endpoint text,
  p_keys_p256dh text,
  p_keys_auth text,
  p_user_agent text default null,
  p_device_name text default null
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
begin
  select user_id into v_owner
  from public.push_subscriptions
  where endpoint = p_endpoint;

  if v_owner is not null and v_owner <> auth.uid() then
    raise exception 'Subscription already owned by another user';
  end if;

  insert into public.push_subscriptions (
    user_id,
    endpoint,
    keys_p256dh,
    keys_auth,
    user_agent,
    device_name,
    last_seen_at
  )
  values (
    auth.uid(),
    p_endpoint,
    p_keys_p256dh,
    p_keys_auth,
    p_user_agent,
    p_device_name,
    now()
  )
  on conflict (endpoint) do update
  set
    keys_p256dh = excluded.keys_p256dh,
    keys_auth = excluded.keys_auth,
    user_agent = excluded.user_agent,
    device_name = excluded.device_name,
    last_seen_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.unsubscribe_push(p_endpoint text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  delete from public.push_subscriptions
  where endpoint = p_endpoint
    and user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.notify_my_push(
  p_type text,
  p_title text,
  p_body text,
  p_url text default '/'
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return;
  end if;

  perform net.http_post(
    url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
    body => jsonb_build_object(
      'to', jsonb_build_array(auth.uid()),
      'type', p_type,
      'title', p_title,
      'body', p_body,
      'url', p_url
    ),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    )
  );
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
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return new;
  end if;

  select jsonb_agg(tm.user_id)
  into v_members
  from public.team_members tm
  join public.user_settings us on us.user_id = tm.user_id
  where tm.team_id = new.team_id
    and tm.left_at is null
    and tm.removed_at is null
    and tm.user_id <> new.user_id
    and us.team_alerts = true
    and exists (
      select 1 from public.push_subscriptions ps
      where ps.user_id = tm.user_id
    );

  if v_members is null then
    return new;
  end if;

  select
    case new.activity_type
      when 'entry_created' then 'Nuova registrazione in squadra'
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

  return new;
end;
$function$
;

create trigger notify_team_activity_push
  after insert on public.team_activity
  for each row
  execute function public.notify_team_activity_push();

CREATE OR REPLACE FUNCTION public.send_daily_reminder_push()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
  v_members jsonb;
  v_user_ids uuid[];
  v_local_hhmm text;
begin
  select to_char(now() at time zone 'Europe/Rome', 'HH24:MI')
  into v_local_hhmm;

  if v_local_hhmm not in ('20:00', '20:30') then
    return;
  end if;

  select array_agg(us.user_id)
  into v_user_ids
  from public.user_settings us
  where us.daily_reminder = true
    and (
      us.last_daily_push_at is null
      or (us.last_daily_push_at at time zone 'Europe/Rome')::date <>
        (now() at time zone 'Europe/Rome')::date
    )
    and exists (
      select 1 from public.push_subscriptions ps
      where ps.user_id = us.user_id
    );

  if v_user_ids is null then
    return;
  end if;

  v_members := to_jsonb(v_user_ids);

  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return;
  end if;

  perform net.http_post(
    url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
    body => jsonb_build_object(
      'to', v_members,
      'type', 'daily',
      'title', 'Promemoria Cagometro',
      'body', 'Un nuovo giorno, un nuovo traguardo. Registralo!',
      'url', '/'
    ),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    )
  );

  update public.user_settings
  set last_daily_push_at = now()
  where user_id = any(v_user_ids);
end;
$function$
;

select cron.schedule(
  'daily-reminder-push',
  '*/30 17-20 * * *',
  $$ select public.send_daily_reminder_push(); $$
);

grant select on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant execute on function "public"."get_my_push_subscriptions"() to "authenticated";

grant execute on function "public"."subscribe_push"(text, text, text, text, text) to "authenticated";

grant execute on function "public"."unsubscribe_push"(text) to "authenticated";

grant execute on function "public"."notify_my_push"(text, text, text, text) to "authenticated";

create policy "Users can read own push subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));

create policy "Users can insert own push subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));

create policy "Users can update own push subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));

create policy "Users can delete own push subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));