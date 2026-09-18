-- Fix di consegna delle push:
--  1. notify_team_activity_push: deep link corretto in '/teams' (la route reale
--     dell'app); prima puntava a '/team' che finiva nel NotFound.
--  2. send_daily_reminder_push: i destinatari vengono inviati in chunk da 200,
--     così il cap di 500 di send-push non tronca mai la lista e il tetto di
--     righe di PostgREST non taglia le subscription di chi ha più device.
-- Restano invariati l'exception wrapper (l'insert su team_activity non deve mai
-- fallire per colpa della push) e il calcolo set-based delle serie a rischio.

set check_function_bodies = off;

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
        else 'C''è una novità nella tua squadra'
      end
    into v_title, v_body;

    perform net.http_post(
      url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
      body => jsonb_build_object(
        'to', v_members,
        'type', 'team',
        'title', v_title,
        'body', v_body,
        'url', '/teams'
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
  exception
    when others then
      raise warning
        'notify_team_activity_push ignorato (team_activity insert proseguire): %',
        sqlerrm;
  end;

  return new;
end;
$function$
;

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
        url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
        body => jsonb_build_object(
          'to', v_chunk,
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
        url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
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
