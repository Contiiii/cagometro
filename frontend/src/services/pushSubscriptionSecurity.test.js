import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../supabase/migrations/", import.meta.url),
);

const OWNERSHIP_MIGRATION = readFileSync(
  join(MIGRATIONS_DIR, "20260917000005_push_ownership_explicit.sql"),
  "utf8",
);

const HARDENING_MIGRATION = readFileSync(
  join(MIGRATIONS_DIR, "20260917000007_push_direct_write_policies_removed.sql"),
  "utf8",
);

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

describe("sicurezza push_subscriptions (scritture solo via RPC)", () => {
  it("revoca INSERT diretto da authenticated", () => {
    expect(
      OWNERSHIP_MIGRATION,
    ).toMatch(/revoke\s+insert\s+on\s+table\s+"public"\."push_subscriptions"\s+from\s+"authenticated"/i);
  });

  it("revoca UPDATE diretto da authenticated", () => {
    expect(
      OWNERSHIP_MIGRATION,
    ).toMatch(/revoke\s+update\s+on\s+table\s+"public"\."push_subscriptions"\s+from\s+"authenticated"/i);
  });

  it("revoca DELETE diretto da authenticated", () => {
    expect(
      OWNERSHIP_MIGRATION,
    ).toMatch(/revoke\s+delete\s+on\s+table\s+"public"\."push_subscriptions"\s+from\s+"authenticated"/i);
  });

  it("nessuna migration successiva ripristina grant diretti di scrittura", () => {
    const files = migrationFiles();
    const ownershipIndex = files.indexOf(
      "20260917000005_push_ownership_explicit.sql",
    );

    const directWriteGrant = /\bgrant\s+(insert|update|delete)\s+on\s+table\s+"public"\."push_subscriptions"\s+to\s+"authenticated"/i;

    for (const file of files.slice(ownershipIndex + 1)) {
      const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

      expect(content, file).not.toMatch(directWriteGrant);
    }
  });

  it("rimuove le policy RLS write residue, lasciando la lettura", () => {
    expect(HARDENING_MIGRATION).toMatch(/drop\s+policy if exists\s+"Users can insert own push subscriptions"/i);
    expect(HARDENING_MIGRATION).toMatch(/drop\s+policy if exists\s+"Users can update own push subscriptions"/i);
    expect(HARDENING_MIGRATION).toMatch(/drop\s+policy if exists\s+"Users can delete own push subscriptions"/i);
  });
});