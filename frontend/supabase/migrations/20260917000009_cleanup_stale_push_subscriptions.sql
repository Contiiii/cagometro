-- Cleanup automatico delle push subscription senza attività da oltre 90 giorni.
--
--  - last_seen_at viene aggiornato a ogni interazione del dispositivo:
--      * subscribe_push        (subscribeToPush e refreshPushSubscription)
--      * claim_push_subscription
--      * pushsubscriptionchange (SW -> queue -> refreshPushSubscription)
--    Un dispositivo è quindi "attivo" se ha interagito nell'ultima finestra.
--
--  - Il cron (giornaliero 03:00) elimina fisicamente le righe stale.
--  - get_my_push_subscriptions nasconde subito le righe stale/ghost (>90 giorni),
--    senza attendere il cron: dashboard = dispositivi recenti e realmente attivi.
--  - Gli endpoint 404/410 vengono già rimossi all'istante da send-push
--    (sendWithRetry -> removeEndpoint), quindi non restano fantasmi in pipeline.

create index if not exists push_subscriptions_last_seen_at_idx
  on public.push_subscriptions (last_seen_at);

set check_function_bodies = off;

create or replace function public.cleanup_stale_push_subscriptions()
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_deleted bigint;
begin
  delete from public.push_subscriptions
  where last_seen_at < now() - interval '90 days';

  get diagnostics v_deleted = row_count;

  return v_deleted;
end;
$function$
;

select cron.schedule(
  'cleanup-stale-push-subscriptions',
  '0 3 * * *',
  $$ select public.cleanup_stale_push_subscriptions(); $$
);

-- La signature (e quindi il grant su get_my_push_subscriptions) resta invariata:
-- cambia solo il filtro per nascondere i dispositivi inattivi da oltre 90 giorni.
create or replace function public.get_my_push_subscriptions()
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
  where ps.user_id = auth.uid()
    and ps.last_seen_at >= now() - interval '90 days';
$function$
;

set check_function_bodies = on;