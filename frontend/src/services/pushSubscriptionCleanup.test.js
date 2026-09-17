import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CLEANUP_MIGRATION = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260917000009_cleanup_stale_push_subscriptions.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const OWNERSHIP_MIGRATION = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260917000005_push_ownership_explicit.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("cleanup subscription obsolete (migration 20260917000009)", () => {
  it("indice su last_seen_at per il cleanup", () => {
    expect(CLEANUP_MIGRATION).toContain(
      "push_subscriptions_last_seen_at_idx",
    );
    expect(CLEANUP_MIGRATION).toContain(
      "on public.push_subscriptions (last_seen_at)",
    );
  });

  it("funzione cleanup: elimina solo le subscription inattive da oltre 90 giorni", () => {
    expect(CLEANUP_MIGRATION).toContain(
      "create or replace function public.cleanup_stale_push_subscriptions()",
    );
    expect(CLEANUP_MIGRATION).toContain(
      "delete from public.push_subscriptions",
    );
    expect(CLEANUP_MIGRATION).toContain(
      "last_seen_at < now() - interval '90 days'",
    );
    expect(CLEANUP_MIGRATION).toContain("row_count");
    expect(CLEANUP_MIGRATION).toContain("return v_deleted;");
  });

  it("cron automatico giornaliero alla stessa soglia", () => {
    expect(CLEANUP_MIGRATION).toContain("cron.schedule(");
    expect(CLEANUP_MIGRATION).toContain(
      "'cleanup-stale-push-subscriptions'",
    );
    expect(CLEANUP_MIGRATION).toContain("'0 3 * * *'");
  });

  it("get_my_push_subscriptions nasconde i dispositivi stale/ghost", () => {
    expect(CLEANUP_MIGRATION).toContain(
      "create or replace function public.get_my_push_subscriptions()",
    );
    expect(CLEANUP_MIGRATION).toContain(
      "ps.last_seen_at >= now() - interval '90 days'",
    );
  });

  it("la signature di get_my_push_subscriptions è invariata", () => {
    expect(CLEANUP_MIGRATION).toContain(
      "RETURNS TABLE(endpoint text, keys_p256dh text, keys_auth text, user_agent text, device_name text, last_seen_at timestamp with time zone, created_at timestamp with time zone)",
    );
  });
});

describe("aggiornamento last_seen_at in tutti i flussi", () => {
  it("subscribe_push aggiorna last_seen_at a ogni insert e upsert", () => {
    expect(OWNERSHIP_MIGRATION).toContain(
      "CREATE OR REPLACE FUNCTION public.subscribe_push(",
    );
    expect(OWNERSHIP_MIGRATION).toContain("last_seen_at = now()");
  });

  it("claim_push_subscription aggiorna last_seen_at su upsert e trasferimento", () => {
    expect(OWNERSHIP_MIGRATION).toContain(
      "CREATE OR REPLACE FUNCTION public.claim_push_subscription(",
    );
    expect(OWNERSHIP_MIGRATION).toContain("last_seen_at = now()");
  });
});