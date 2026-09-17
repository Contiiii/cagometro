-- Schedulazione giornaliera del rilevamento quota via check-quota.
-- Replica il pattern di daily-reminder-push (push_infrastructure):
-- secret in vault + net.http_* + cron.schedule.

create or replace function public.record_quota_snapshot()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_key text;
begin
  select decrypted_secret
  into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return;
  end if;

  perform net.http_get(
    url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/check-quota',
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    )
  );
end;
$function$
;

select cron.schedule(
  'check-quota-daily',
  '0 6 * * *',
  $$ select public.record_quota_snapshot(); $$
);