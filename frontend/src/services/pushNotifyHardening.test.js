import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/20260917000008_push_notify_hardening.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const INTERNAL_SEGMENTS = [
  "team",
  "teams",
  "report",
  "achievements",
  "settings",
  "login",
  "privacy",
  "changelog",
  "join",
];

describe("hardening notify_my_push (migration 20260917000008)", () => {
  it("crea la tabella di log delle chiamate e il relativo indice", () => {
    expect(MIGRATION).toMatch(/create table if not exists public\.push_notify_calls/i);
    expect(MIGRATION).toMatch(/user_id uuid not null/i);
    expect(MIGRATION).toMatch(/push_notify_calls_identity_idx/i);
  });

  it("espone il predicato push_url_is_internal", () => {
    expect(MIGRATION).toMatch(/create or replace function public\.push_url_is_internal/i);
  });

  it("whitelist: root + tutti i first-segment ammessi", () => {
    expect(MIGRATION).toMatch(/p_url = '\/'/);

    for (const segment of INTERNAL_SEGMENTS) {
      expect(MIGRATION, segment).toMatch(new RegExp(`\\b${segment}\\b`));
    }
  });

  it("blocca URL esterne e schemi pericolosi", () => {
    expect(MIGRATION).toContain("p_url ~ '^\\/(?!\\/)'");
    expect(MIGRATION).toContain("p_url !~ ':'");
    expect(MIGRATION).toContain("p_url !~ '\\\\'");
    expect(MIGRATION).toContain("p_url !~ '[[:cntrl:]]'");
  });

  it("notify_my_push rifiuta URL non interni con errore chiaro", () => {
    expect(MIGRATION).toMatch(/not public\.push_url_is_internal\(p_url\)/);
    expect(MIGRATION).toMatch(/URL non valido: consentiti solo percorsi interni/);
  });

  it("notify_my_push applica il rate limit 30/min a finestra scorrevole", () => {
    expect(MIGRATION).toMatch(/insert into public\.push_notify_calls/);
    expect(MIGRATION).toMatch(/created_at < now\(\) - interval '1 minute'/);
    expect(MIGRATION).toMatch(/v_calls > 30/);
    expect(MIGRATION).toMatch(/Troppe notifiche\. Riprova tra qualche minuto\./);
  });

  it("notify_my_push richiede un utente autenticato", () => {
    expect(MIGRATION).toMatch(/v_user_id uuid := auth\.uid\(\)/);
    expect(MIGRATION).toMatch(/Utente non autenticato/);
  });

  it("il grant esistente su notify_my_push resta valido (signature invariata)", () => {
    expect(MIGRATION).toContain("CREATE OR REPLACE FUNCTION public.notify_my_push(");
    expect(MIGRATION).toContain("p_url text default '/'");
  });
});