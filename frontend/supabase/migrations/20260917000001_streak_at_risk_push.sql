-- Push serale: aggiunta la notifica "serie a rischio" promessa dal toggle
-- "Avvisi streak" (NotificationsPanel) accanto al ramo "va a buon fine" già
-- coperto client-side da Home.jsx.
--
-- send_daily_reminder_push() viene già eseguita dal cron 'daily-reminder-push'
-- alle 20:00/20:30 Europe/Rome: ora ogni utente destinatario riceve il
-- messaggio più pertinente:
--   * serie a rischio (streak_alerts + entry ieri, niente entry oggi):
--     push type 'streak' con il numero di giorni consecutivi ancora vivi;
--   * altrimenti daily_reminder: promemoria generico invariato.
-- Il cooldown giornaliero last_daily_push_at resta unico per entrambi i rami.

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_daily_reminder_push()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
  v_local_hhmm text;
  v_today date;
  v_user record;
  v_streak_at_risk boolean;
  v_streak_days integer;
  v_check_day date;
  v_risk_body text;
  v_body text;
  v_recipients jsonb;
  v_recipient_ids uuid[] := array[]::uuid[];
  v_daily_recipients jsonb := '[]'::jsonb;
begin
  select to_char(now() at time zone 'Europe/Rome', 'HH24:MI')
  into v_local_hhmm;

  if v_local_hhmm not in ('20:00', '20:30') then
    return;
  end if;

  v_today := (now() at time zone 'Europe/Rome')::date;

  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return;
  end if;

  create temp table risk_batches (
    body text primary key,
    members jsonb not null
  ) on commit drop;

  for v_user in
    select
      us.user_id,
      us.daily_reminder,
      us.streak_alerts,
      not exists (
        select 1 from public.entries e
        where e.user_id = us.user_id
          and e.date = v_today - 1
          and e.count > 0
      ) as missing_yesterday,
      not exists (
        select 1 from public.entries e
        where e.user_id = us.user_id
          and e.date = v_today
          and e.count > 0
      ) as missing_today
    from public.user_settings us
    where (us.daily_reminder or us.streak_alerts)
      and (
        us.last_daily_push_at is null
        or (us.last_daily_push_at at time zone 'Europe/Rome')::date <> v_today
      )
      and exists (
        select 1 from public.push_subscriptions ps
        where ps.user_id = us.user_id
      )
  loop
    v_streak_at_risk := v_user.streak_alerts
      and not v_user.missing_yesterday
      and v_user.missing_today;

    if v_streak_at_risk then
      v_streak_days := 0;
      v_check_day := v_today - 1;

      while exists (
        select 1 from public.entries e
        where e.user_id = v_user.user_id
          and e.date = v_check_day
          and e.count > 0
      )
      loop
        v_streak_days := v_streak_days + 1;
        v_check_day := v_check_day - 1;
      end loop;

      v_risk_body := format(
        'Serie di %s giorno%s: registra oggi o perderai tutto.',
        v_streak_days,
        case when v_streak_days = 1 then '' else 's' end
      );

      insert into risk_batches (body, members)
      values (v_risk_body, jsonb_build_array(v_user.user_id))
      on conflict (body) do update
      set members = risk_batches.members || excluded.members;
    elsif v_user.daily_reminder then
      v_daily_recipients := v_daily_recipients || jsonb_build_array(v_user.user_id);
    else
      continue;
    end if;

    v_recipient_ids := array_append(v_recipient_ids, v_user.user_id);
  end loop;

  if jsonb_array_length(v_daily_recipients) > 0 then
    perform net.http_post(
      url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
      body => jsonb_build_object(
        'to', v_daily_recipients,
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
  end if;

  for v_body, v_recipients in
    select rp.body, rp.members
    from risk_batches rp
  loop
    perform net.http_post(
      url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
      body => jsonb_build_object(
        'to', v_recipients,
        'type', 'streak',
        'title', 'Serie a rischio',
        'body', v_body,
        'url', '/'
      ),
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-key', v_key
      )
    );
  end loop;

  if cardinality(v_recipient_ids) > 0 then
    update public.user_settings
    set last_daily_push_at = now()
    where user_id = any(v_recipient_ids);
  end if;
end;
$function$
;

set check_function_bodies = on;