-- Fix del trigger notify_team_activity_push (migration 20260916000010).
--
-- 1) Bug sintattico: nel literal 'C\'è una novità nella tua squadra' il backslash
--    NON è un escape dentro un corpo dollar-quoted: la funzione veniva compilata
--    solo a runtime e falliva con errore 42601 ad ogni insert in team_activity,
--    abortendo anche join_team/leave_team (check_function_bodies era off).
--    Corretto con l'escape SQL '' (doppio apice).
--
-- 2) Fail-safe: il corpo è avvolto in un blocco exception; un qualsiasi errore
--    dell'infrastruttura push (coda pg_net piena, secret mancante, edge function
--    non raggiungibile) non deve mai rompere le scritture core delle squadre.

set check_function_bodies = on;

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
        'url', '/team'
      ),
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-key', v_key
      )
    );
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