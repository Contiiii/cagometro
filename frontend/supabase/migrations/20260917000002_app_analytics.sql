-- Analytics PWA (suggerimento readiness produzione): raccolta eventi leggeri
-- da dispositivo per misurare installazioni PWA, uso offline, tasso sync e
-- errori del service worker. Solo raccolta dati: niente UI, aggregati leggibili
-- tramite get_app_analytics().

create table if not exists public.app_events (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  device_id text,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamp with time zone not null default now()
);

alter table public.app_events enable row level security;

alter table public.app_events
  add constraint app_events_id_pkey primary key (id);

alter table public.app_events
  add constraint app_events_user_id_fkey
  foreign key (user_id)
  references public.profiles(user_id)
  on delete cascade;

create index app_events_event_occurred_idx
  on public.app_events (event, occurred_at);

create index app_events_user_id_idx
  on public.app_events (user_id);

set check_function_bodies = off;

-- Registra un evento anonimo o autenticato. L'utente viene derivato dalla
-- sessione (null se non loggato); device_id è l'identità del dispositivo
-- generata dal client e serve a deduplicare installazioni e attribuire
-- al successivo login gli eventi raccolti da anonimo.
CREATE OR REPLACE FUNCTION public.record_app_event(
  p_event text,
  p_payload jsonb default '{}'::jsonb,
  p_device_id text default null
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_event is null or p_event = '' then
    raise exception 'event required';
  end if;

  insert into public.app_events (user_id, device_id, event, payload)
  values (auth.uid(), p_device_id, p_event, coalesce(p_payload, '{}'::jsonb));
end;
$function$
;

-- Aggregati delle metriche per l'utente corrente. Lo scope copre gli eventi
-- dell'account più quelli dei dispositivi con cui l'account ha acceduto, così
-- gli eventi raccolti prima del login vengono attribuiti retroattivamente.
CREATE OR REPLACE FUNCTION public.get_app_analytics()
 RETURNS TABLE(
   installed_devices bigint,
   installed_users bigint,
   install_eligible_devices bigint,
   prompt_accepted bigint,
   prompt_dismissed bigint,
   offline_sessions bigint,
   offline_registrations bigint,
   sync_attempts bigint,
   sync_successes bigint,
   sync_failures bigint,
   sw_errors bigint,
   sw_register_errors bigint
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with scope_devices as (
    select distinct ae.device_id
    from public.app_events ae
    where ae.user_id = auth.uid()
      and ae.device_id is not null
  )
  select
    count(distinct e.device_id) filter (where e.event = 'pwa_installed') as installed_devices,
    count(distinct e.user_id) filter (where e.event = 'pwa_installed') as installed_users,
    count(distinct e.device_id) filter (where e.event = 'pwa_install_available') as install_eligible_devices,
    count(*) filter (where e.event = 'pwa_install_prompt' and e.payload->>'outcome' = 'accepted') as prompt_accepted,
    count(*) filter (where e.event = 'pwa_install_prompt' and e.payload->>'outcome' = 'dismissed') as prompt_dismissed,
    count(*) filter (where e.event = 'offline_session_start') as offline_sessions,
    count(*) filter (where e.event = 'offline_registration') as offline_registrations,
    count(*) filter (where e.event = 'sync_batch') as sync_attempts,
    count(*) filter (where e.event = 'sync_batch' and e.payload->>'ok' = 'true') as sync_successes,
    count(*) filter (where e.event = 'sync_batch' and e.payload->>'ok' = 'false') as sync_failures,
    count(*) filter (where e.event = 'sw_error') as sw_errors,
    count(*) filter (where e.event = 'sw_register_error') as sw_register_errors
  from public.app_events e
  where e.user_id = auth.uid()
     or e.device_id in (select device_id from scope_devices);
$function$
;

set check_function_bodies = on;

grant execute on function "public"."record_app_event"(text, jsonb, text) to "authenticated";

grant execute on function "public"."get_app_analytics"() to "authenticated";