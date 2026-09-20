-- Aggiorna il testo della notifica push quando un membro fa una registrazione.
--
-- La definizione live di notify_team_activity_push() era quella di
-- 20260917000010_push_endpoint_config.sql. La replica integralmente cambiando
-- una sola riga del body per 'entry_created':
--   prima: 'Un membro ha registrato un nuovo traguardo'
--   dopo:  'Un membro ha effettuato una nuova registrazione'

CREATE OR REPLACE FUNCTION public.notify_team_activity_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_key text;
  v_base_url text;
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

    select decrypted_secret into v_base_url
    from vault.decrypted_secrets
    where name = 'supabase_functions_base_url';

    if v_base_url is null then
      raise warning 'supabase_functions_base_url non configurato';
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
        when 'entry_created' then 'Un membro ha effettuato una nuova registrazione'
        when 'member_joined' then 'Un nuovo membro si è unito alla squadra'
        when 'member_left' then 'Un membro ha lasciato la squadra'
        when 'member_removed' then 'Un membro è stato rimosso dalla squadra'
        when 'ownership_transferred' then 'La proprietà della squadra è stata trasferita'
        when 'achievement_unlocked' then 'Un membro ha sbloccato un traguardo'
        else 'C''è una novità nella tua squadra'
      end
    into v_title, v_body;

    perform net.http_post(
      url => v_base_url || '/send-push',
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