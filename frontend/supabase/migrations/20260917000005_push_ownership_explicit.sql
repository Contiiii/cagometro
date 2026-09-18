-- Ownership esplicita delle push subscription.
--
-- subscribe_push resta l'unico punto di creazione: crea nuove righe, aggiorna
-- solo quelle dell'utente corrente e rifiuta esplicitamente (errcode PUSH1)
-- gli endpoint già associati a un altro account. Nessun adottamento silenzioso.
--
-- Il trasferimento di ownership è un'operazione volontaria e atomica eseguita
-- SOLO tramite claim_push_subscription, che richiede auth.uid(), non accetta un
-- user_id dal client e registra il cambio proprietario su push_claim_audit.
--
-- I grant diretti INSERT/UPDATE/DELETE su push_subscriptions vengono revocati:
-- tutte le scritture passano dalle RPC SECURITY DEFINER.

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.subscribe_push(
  p_endpoint text,
  p_keys_p256dh text,
  p_keys_auth text,
  p_user_agent text default null,
  p_device_name text default null
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato' using errcode = 'PUSH1';
  end if;

  if p_endpoint !~ '^https://' then
    raise exception 'Endpoint non valido';
  end if;

  select user_id into v_owner
  from public.push_subscriptions
  where endpoint = p_endpoint
  for update;

  if v_owner is not null and v_owner <> auth.uid() then
    raise 'PUSH_OWNED_BY_OTHER|Subscription already owned by another user'
      using errcode = 'PUSH1';
  end if;

  insert into public.push_subscriptions (
    user_id,
    endpoint,
    keys_p256dh,
    keys_auth,
    user_agent,
    device_name,
    last_seen_at
  )
  values (
    auth.uid(),
    p_endpoint,
    p_keys_p256dh,
    p_keys_auth,
    p_user_agent,
    p_device_name,
    now()
  )
  on conflict (endpoint) do update
  set
    keys_p256dh = excluded.keys_p256dh,
    keys_auth = excluded.keys_auth,
    user_agent = excluded.user_agent,
    device_name = excluded.device_name,
    last_seen_at = now()
  where public.push_subscriptions.user_id = auth.uid();

  -- Riga concorrente creata da un altro utente: l'update filtrato non agisce e
  -- l'inserimento risulta in conflitto. Mai trasferire l'ownership.
  if not exists (
    select 1 from public.push_subscriptions
    where endpoint = p_endpoint
      and user_id = auth.uid()
  ) then
    raise 'PUSH_OWNED_BY_OTHER|Subscription already owned by another user'
      using errcode = 'PUSH1';
  end if;
end;
$function$
;

create table "public"."push_claim_audit" (
  "id" bigint generated always as identity primary key,
  "endpoint" text not null,
  "previous_user_id" uuid not null,
  "claimed_by_user_id" uuid not null,
  "claimed_at" timestamp with time zone not null default now()
);

alter table "public"."push_claim_audit" enable row level security;

CREATE OR REPLACE FUNCTION public.claim_push_subscription(
  p_endpoint text,
  p_keys_p256dh text,
  p_keys_auth text,
  p_user_agent text default null,
  p_device_name text default null
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_current_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  if p_endpoint !~ '^https://' then
    raise exception 'Endpoint non valido';
  end if;

  select user_id into v_current_user_id
  from public.push_subscriptions
  where endpoint = p_endpoint
  for update;

  if v_current_user_id is not distinct from auth.uid() then
    -- Riga assente oppure già di questo utente: upsert idempotente e sicuro.
    insert into public.push_subscriptions (
      user_id,
      endpoint,
      keys_p256dh,
      keys_auth,
      user_agent,
      device_name,
      last_seen_at
    )
    values (
      auth.uid(),
      p_endpoint,
      p_keys_p256dh,
      p_keys_auth,
      p_user_agent,
      p_device_name,
      now()
    )
    on conflict (endpoint) do update
    set
      keys_p256dh = excluded.keys_p256dh,
      keys_auth = excluded.keys_auth,
      user_agent = excluded.user_agent,
      device_name = excluded.device_name,
      last_seen_at = now()
    where public.push_subscriptions.user_id = auth.uid();

    if not exists (
      select 1 from public.push_subscriptions
      where endpoint = p_endpoint
        and user_id = auth.uid()
    ) then
      raise 'PUSH_OWNED_BY_OTHER|Subscription already owned by another user'
        using errcode = 'PUSH1';
    end if;
    return;
  end if;

  insert into public.push_claim_audit (
    endpoint,
    previous_user_id,
    claimed_by_user_id
  )
  values (
    p_endpoint,
    v_current_user_id,
    auth.uid()
  );

  update public.push_subscriptions
  set
    user_id = auth.uid(),
    keys_p256dh = p_keys_p256dh,
    keys_auth = p_keys_auth,
    user_agent = p_user_agent,
    device_name = p_device_name,
    last_seen_at = now()
  where endpoint = p_endpoint;
end;
$function$
;

revoke insert on table "public"."push_subscriptions" from "authenticated";

revoke update on table "public"."push_subscriptions" from "authenticated";

revoke delete on table "public"."push_subscriptions" from "authenticated";

grant execute on function "public"."claim_push_subscription"(text, text, text, text, text) to "authenticated";