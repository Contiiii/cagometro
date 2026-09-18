-- A2: classificazione corretta delle notifiche push di squadra.
--
-- member_removed e ownership_transferred erano trattati come eventi
-- entry_like (usavano team_entry_alerts, consumavano il cooldown
-- last_team_entry_push_at e ricevevano il testo generico di "Attività").
-- Ora sono classificate come eventi Team Members: usano team_member_alerts,
-- NON consumano il cooldown delle registrazioni e hanno titolo/testo dedicati.
-- L'esclusione dell'attore (tm.user_id <> new.user_id) è già garantita e resta
-- invariata: per member_removed è chi rimuove, per ownership_transferred è il
-- vecchio proprietario. streak_bonus resta volutamente invariato.

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
      or new.activity_type not in (
        'member_joined', 'member_left', 'achievement_unlocked',
        'member_removed', 'ownership_transferred'
      );

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
        when new.activity_type in ('member_joined', 'member_left', 'member_removed', 'ownership_transferred') then
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
        when 'member_removed' then 'Membro rimosso'
        when 'ownership_transferred' then 'Proprietà trasferita'
        when 'achievement_unlocked' then 'Traguardo sbloccato'
        else 'Attività in squadra'
      end,
      case new.activity_type
        when 'entry_created' then 'Un membro ha registrato un nuovo traguardo'
        when 'member_joined' then 'Un nuovo membro si è unito alla squadra'
        when 'member_left' then 'Un membro ha lasciato la squadra'
        when 'member_removed' then 'Un membro è stato rimosso dalla squadra'
        when 'ownership_transferred' then 'La proprietà della squadra è stata trasferita'
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

set check_function_bodies = on;