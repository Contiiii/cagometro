-- Hardening dei privilegi sulle funzioni di public.
--
-- Per via dei default privileges di Supabase ogni funzione di public era
-- eseguibile da anon. Le uniche RPC legittimamente anonime sono:
--   - submit_feedback (segnalazioni anonime)
--   - record_app_event (analytics raccolti prima del login)
-- Tutte le altre richiedono una sessione autenticata e vengono revocate.
--
-- Le 4 funzioni trigger non hanno bisogno di essere chiamabili via API e usano
-- solo new.updated_at = now(): search_path vuoto è sufficiente e sicuro.

set check_function_bodies = off;

revoke execute on all functions in schema public from anon;

grant execute on function public.submit_feedback(text, text, text) to anon;
grant execute on function public.record_app_event(text, jsonb, text) to anon;

-- Evita che le migrazioni future ripropongano il grant ad anon.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;

create or replace function public.set_profiles_updated_at()
 returns trigger
 language plpgsql
 set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

create or replace function public.set_team_members_updated_at()
 returns trigger
 language plpgsql
 set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

create or replace function public.set_teams_updated_at()
 returns trigger
 language plpgsql
 set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

create or replace function public.update_updated_at_column()
 returns trigger
 language plpgsql
 set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

revoke execute on function public.set_profiles_updated_at() from anon, authenticated;
revoke execute on function public.set_team_members_updated_at() from anon, authenticated;
revoke execute on function public.set_teams_updated_at() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;

revoke execute on function public.push_url_is_internal(text) from anon, authenticated;

set check_function_bodies = on;
