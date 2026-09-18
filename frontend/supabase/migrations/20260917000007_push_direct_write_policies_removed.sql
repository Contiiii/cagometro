-- Hardening: rimozione delle policy RLS "write" residue su push_subscriptions.
--
-- INSERT/UPDATE/DELETE sono gia' stati revocati a livello di grant from
-- "authenticated" in 20260917000005_push_ownership_explicit.sql: queste policy
-- non concedono nessun privilegio ma introducono ambiguita' sul modello di
-- accesso. Tutte le scritture passano esclusivamente dalle RPC SECURITY
-- DEFINER:
--   - subscribe_push          (creazione / upsert del proprio endpoint)
--   - unsubscribe_push        (rimozione del proprio endpoint)
--   - claim_push_subscription (trasferimento volontario di ownership, con audit)
--
-- La SELECT e la policy di lettura restano per la UI (NotificationsPanel legge
-- i propri dispositivi tramite get_my_push_subscriptions / grant select).

drop policy if exists "Users can insert own push subscriptions"
  on "public"."push_subscriptions";

drop policy if exists "Users can update own push subscriptions"
  on "public"."push_subscriptions";

drop policy if exists "Users can delete own push subscriptions"
  on "public"."push_subscriptions";