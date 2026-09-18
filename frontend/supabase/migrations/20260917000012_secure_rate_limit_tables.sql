-- Le tabelle di rate limit sono interne: le scrivono solo le funzioni
-- SECURITY DEFINER (owner postgres). I default privileges di Supabase
-- concedevano però ad anon/authenticated accesso DML completo via PostgREST,
-- permettendo di azzerare i limiti (brute force inviti / spam push), leggere gli
-- user_id o svuotare le tabelle. RLS senza policy + revoke chiudono l'esposizione;
-- le funzioni SECURITY DEFINER continuano a funzionare perché girano come owner.

alter table public.team_invite_preview_calls enable row level security;
alter table public.push_notify_calls enable row level security;

revoke all on table public.team_invite_preview_calls from anon, authenticated;
revoke all on table public.push_notify_calls from anon, authenticated;
