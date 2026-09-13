create table "public"."user_settings" (
  "user_id" uuid not null,
  "daily_reminder" boolean not null default true,
  "streak_alerts" boolean not null default true,
  "achievement_alerts" boolean not null default true,
  "team_alerts" boolean not null default false,
  "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_settings" enable row level security;

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (user_id);

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_settings()
 RETURNS TABLE(daily_reminder boolean, streak_alerts boolean, achievement_alerts boolean, team_alerts boolean, updated_at timestamp with time zone)
 LANGUAGE sql
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

CREATE OR REPLACE FUNCTION public.ensure_my_settings()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.user_settings (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_my_settings(
  p_daily_reminder boolean,
  p_streak_alerts boolean,
  p_achievement_alerts boolean,
  p_team_alerts boolean
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
    team_alerts
  )
  values (
    auth.uid(),
    p_daily_reminder,
    p_streak_alerts,
    p_achievement_alerts,
    p_team_alerts
  )
  on conflict (user_id) do update
  set
    daily_reminder = excluded.daily_reminder,
    streak_alerts = excluded.streak_alerts,
    achievement_alerts = excluded.achievement_alerts,
    team_alerts = excluded.team_alerts,
    updated_at = now();
end;
$function$
;

grant select on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant execute on function "public"."get_my_settings"() to "authenticated";

grant execute on function "public"."ensure_my_settings"() to "authenticated";

grant execute on function "public"."upsert_my_settings"(boolean, boolean, boolean, boolean) to "authenticated";

create policy "Users can read own settings"
  on "public"."user_settings"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));

create policy "Users can insert own settings"
  on "public"."user_settings"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));

create policy "Users can update own settings"
  on "public"."user_settings"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));