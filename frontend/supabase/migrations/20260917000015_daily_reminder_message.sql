-- M5: nuovo testo del promemoria giornaliero.
--
-- Modifica il corpo della push "daily" inviata dal cron 'daily-reminder-push'
-- (20:00/20:30 Europe/Rome): da "Un nuovo giorno, un nuovo traguardo.
-- Registralo!" a "Ricordati di inserire la registrazione di oggi!".
-- La push "Serie a rischio" resta invariata.

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_daily_reminder_push()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
  v_base_url text;
  v_local_hhmm text;
  v_today date;
  v_daily_recipients jsonb := '[]'::jsonb;
  v_recipient_ids uuid[] := array[]::uuid[];
  v_body text;
  v_chunk jsonb;
  v_batch_size constant integer := 200;
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

  select decrypted_secret into v_base_url
  from vault.decrypted_secrets
  where name = 'supabase_functions_base_url';

  if v_base_url is null then
    raise warning 'supabase_functions_base_url non configurato';
    return;
  end if;

  begin
    create temp table risk_batches (
      body text primary key,
      members jsonb not null
    ) on commit drop;

    -- Utenti potenzialmente destinatari: preferenze attive, non ancora
    -- notificati oggi, con almeno una subscription attiva.
    with candidates as (
      select us.user_id
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
    ),
    active_days as (
      select e.user_id, e.date
      from public.entries e
      join candidates c on c.user_id = e.user_id
      where e.count > 0
        and e.date between v_today - 400 and v_today - 1
    ),
    islands as (
      select
        a.user_id,
        a.date,
        a.date - (row_number() over (partition by a.user_id order by a.date))::int as grp
      from active_days a
    ),
    streaks as (
      select i.user_id, count(*)::int as days
      from islands i
      group by i.user_id, i.grp
      having max(i.date) = v_today - 1
    )
    insert into risk_batches (body, members)
    select
      format(
        'Serie di %s giorno%s: registra oggi o perderai tutto.',
        s.days,
        case when s.days = 1 then '' else 's' end
      ),
      jsonb_agg(s.user_id)
    from streaks s
    join public.user_settings us on us.user_id = s.user_id
    where us.streak_alerts = true
      and not exists (
        select 1 from public.entries e
        where e.user_id = s.user_id
          and e.date = v_today
          and e.count > 0
      )
    group by s.days;

    -- Gli utenti a rischio ricevono solo la push "serie"; tutti gli altri con
    -- daily_reminder attivo ricevono il promemoria generico.
    select coalesce(jsonb_agg(us.user_id), '[]'::jsonb)
    into v_daily_recipients
    from public.user_settings us
    where us.daily_reminder = true
      and (
        us.last_daily_push_at is null
        or (us.last_daily_push_at at time zone 'Europe/Rome')::date <> v_today
      )
      and exists (
        select 1 from public.push_subscriptions ps
        where ps.user_id = us.user_id
      )
      and us.user_id not in (
        select (m.value)::uuid
        from risk_batches rb,
             jsonb_array_elements_text(rb.members) as m(value)
      );

    -- Chunk del promemoria generico.
    for v_chunk in
      select jsonb_agg(s.value)
      from (
        select
          t.value,
          ((t.ordinality - 1) / v_batch_size)::int as bucket
        from jsonb_array_elements(v_daily_recipients)
          with ordinality as t(value, ordinality)
      ) as s
      group by s.bucket
      order by s.bucket
    loop
      perform net.http_post(
        url => v_base_url || '/send-push',
        body => jsonb_build_object(
          'to', v_chunk,
          'type', 'daily',
          'title', 'Promemoria Cagometro',
          'body', 'Ricordati di inserire la registrazione di oggi!',
          'url', '/'
        ),
        headers => jsonb_build_object(
          'Content-Type', 'application/json',
          'x-push-key', v_key
        )
      );
    end loop;

    -- Chunk delle push "serie a rischio", una per lunghezza della serie.
    for v_body, v_chunk in
      select b.body, jsonb_agg(b.member order by b.ord)
      from (
        select
          rb.body,
          chunk.value as member,
          chunk.ordinality as ord,
          ((chunk.ordinality - 1) / v_batch_size)::int as bucket
        from risk_batches rb
        cross join lateral jsonb_array_elements(rb.members)
          with ordinality as chunk(value, ordinality)
      ) as b
      group by b.body, b.bucket
      order by b.body, b.bucket
    loop
      perform net.http_post(
        url => v_base_url || '/send-push',
        body => jsonb_build_object(
          'to', v_chunk,
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

    select coalesce(array_agg(distinct uid), array[]::uuid[])
    into v_recipient_ids
    from (
      select (m.value)::uuid as uid
      from jsonb_array_elements_text(v_daily_recipients) as m(value)
      union all
      select (m.value)::uuid as uid
      from risk_batches rb,
           jsonb_array_elements_text(rb.members) as m(value)
    ) pushed;

    if cardinality(v_recipient_ids) > 0 then
      update public.user_settings
      set last_daily_push_at = now()
      where user_id = any(v_recipient_ids);
    end if;
  exception
    when others then
      raise warning 'send_daily_reminder_push ignorato: %', sqlerrm;
  end;
end;
$function$
;

set check_function_bodies = on;