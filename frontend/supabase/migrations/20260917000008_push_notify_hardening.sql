-- Hardening notify_my_push:
--   - rate limit: finestra scorrevole 30 chiamate/min per utente (stesso pattern
--     di get_team_invite_preview, tabella di log delle chiamate, senza grant/RLS:
--     scrive solo la funzione SECURITY DEFINER);
--   - URL whitelist: solo percorsi interni dell'app (root o first-segment in una
--     lista di rotte top-level). Blocca URL assolute, //evil.com, javascript:,
--     data:, backslash, caratteri di controllo.
--   - check esplicito di autenticazione (notify_my_push non deve girare per
--     chiamanti anonimi: prima inoltrava auth.uid() null a send-push).

set check_function_bodies = off;

create table if not exists public.push_notify_calls (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists push_notify_calls_identity_idx
  on public.push_notify_calls (user_id, created_at);

-- Predicato condiviso: indica se un URL push è un percorso interno valido.
-- Nota: deve restare allineato al validatore JS in src/services/pushUrl.js.
create or replace function public.push_url_is_internal(p_url text)
 returns boolean
 language sql
 immutable
 set search_path to 'public'
as $function$
  select
    p_url is not null
    and p_url <> ''
    and length(p_url) <= 2048
    and p_url ~ '^\/(?!\/)'
    and p_url !~ ':'
    and p_url !~ '\\'
    and p_url !~ '[[:cntrl:]]'
    and (
      p_url = '/'
      or p_url ~* '^/(team|teams|report|achievements|settings|login|privacy|changelog|join)(/|\?|#|$)'
    )
$function$
;

CREATE OR REPLACE FUNCTION public.notify_my_push(
  p_type text,
  p_title text,
  p_body text,
  p_url text default '/'
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_key text;
  v_calls bigint;
begin
  if v_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if not public.push_url_is_internal(p_url) then
    raise exception 'URL non valido: consentiti solo percorsi interni';
  end if;

  insert into public.push_notify_calls (user_id)
  values (v_user_id);

  delete from public.push_notify_calls
  where created_at < now() - interval '1 minute';

  select count(*)
  into v_calls
  from public.push_notify_calls
  where user_id = v_user_id
    and created_at > now() - interval '1 minute';

  if v_calls > 30 then
    raise exception 'Troppe notifiche. Riprova tra qualche minuto.';
  end if;

  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'push_trigger_key';

  if v_key is null then
    return;
  end if;

  perform net.http_post(
    url => 'https://ojxqrboyxzkkgiiycluk.supabase.co/functions/v1/send-push',
    body => jsonb_build_object(
      'to', jsonb_build_array(v_user_id),
      'type', p_type,
      'title', p_title,
      'body', p_body,
      'url', p_url
    ),
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    )
  );
end;
$function$
;

set check_function_bodies = on;