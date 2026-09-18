-- Il grant implicito a PUBLIC veniva ereditato da anon, rendendo vano il
-- "revoke execute ... from anon" della migrazione precedente: anon restava
-- eseguibile su tutte le funzioni di public. Si revoca da PUBLIC e si
-- ripristinano solo le RPC legittimamente anonime.
--
-- Solo 5 funzioni interne sono prive di grant esplicito ad authenticated
-- (push_url_is_internal, set_*_updated_at, update_updated_at_column) e restano
-- quindi accessibili al solo owner/service_role.

revoke execute on all functions in schema public from public;

grant execute on function public.submit_feedback(text, text, text) to anon;
grant execute on function public.record_app_event(text, jsonb, text) to anon;

-- Evita ricadute per gli oggetti creati dalle prossime migrazioni.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
