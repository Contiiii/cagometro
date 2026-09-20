import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../supabase/migrations/", import.meta.url),
);

const CONFIG_MIGRATION = "20260917000010_push_endpoint_config.sql";
const REMINDER_MIGRATION = "20260917000015_daily_reminder_message.sql";
const ENTRY_PUSH_MESSAGE_MIGRATION = "20260918020000_team_entry_push_message.sql";
const PROJECT_REF = "ojxqrboyxzkkgiiycluk";
const SECRET_NAME = "'supabase_functions_base_url'";

// Versione effettiva per funzione: la migrazione piu' recente che la definisce.
const WINNER_FILES = {
  notify_my_push: CONFIG_MIGRATION,
  notify_team_activity_push: ENTRY_PUSH_MESSAGE_MIGRATION,
  send_daily_reminder_push: REMINDER_MIGRATION,
  record_quota_snapshot: CONFIG_MIGRATION,
};

const MIGRATION_FILES = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

// L'ultima (per nome file, quindi per ordine di applicazione) definizione di una
// funzione e' quella effettiva: le migration precedenti restano nel repo con
// l'URL hardcoded, quindi la guardia deve guardare solo la versione vincente.
function effectiveDefinition(functionName) {
  let found = null;

  for (const file of MIGRATION_FILES) {
    const content = readFileSync(`${MIGRATIONS_DIR}${file}`, "utf8");
    const pattern = new RegExp(
      `create or replace function\\s+public\\.${functionName}\\s*\\(`,
      "gi",
    );

    let match;
    let lastIndex = -1;

    while ((match = pattern.exec(content)) !== null) {
      lastIndex = match.index;
    }

    if (lastIndex !== -1) {
      found = { file, content, index: lastIndex };
    }
  }

  if (!found) {
    throw new Error(`definizione non trovata: ${functionName}`);
  }

  const rest = found.content.slice(found.index + 1);
  const nextIndex = rest.search(/create or replace function/i);

  return {
    file: found.file,
    body:
      nextIndex === -1
        ? found.content.slice(found.index)
        : found.content.slice(found.index, found.index + 1 + nextIndex),
  };
}

// Path invariati: sono i nomi delle funzioni, non l'URL del progetto.
const FUNCTIONS = [
  { name: "notify_my_push", path: "'/send-push'" },
  { name: "notify_team_activity_push", path: "'/send-push'" },
  { name: "send_daily_reminder_push", path: "'/send-push'" },
  { name: "record_quota_snapshot", path: "'/check-quota'" },
];

describe("endpoint Edge Function configurabile (M4)", () => {
  it("nessuna versione effettiva contiene un URL assoluto", () => {
    for (const { name } of FUNCTIONS) {
      const { body } = effectiveDefinition(name);

      expect(body).not.toMatch(/https?:\/\//);
      expect(body).not.toContain(PROJECT_REF);
    }
  });

  it("ogni funzione legge il secret unico e compone solo il path", () => {
    for (const { name, path } of FUNCTIONS) {
      const { body } = effectiveDefinition(name);

      expect(body).toContain(SECRET_NAME);
      expect(body).toContain(`v_base_url || ${path}`);
    }
  });

  it("la base URL non ha fallback hardcoded (nessun default letterale)", () => {
    for (const { name } of FUNCTIONS) {
      const { body } = effectiveDefinition(name);

      expect(body).not.toMatch(/v_base_url\s*:=\s*'/);
      expect(body).toContain("raise warning 'supabase_functions_base_url");
    }
  });

  it("e' indipendente dall'ambiente: solo secret per-env + path", () => {
    // Nessun project-ref nel corpo => il valore (dev/staging/preview/prod)
    // arriva interamente dal Vault dell'ambiente.
    for (const { name } of FUNCTIONS) {
      const { body } = effectiveDefinition(name);

      expect(body).not.toMatch(/supabase\.co/);
      expect(body).not.toMatch(/127\.0\.0\.1|localhost/);
    }
  });

  it("la configurazione effettiva arriva dalla migration dedicata", () => {
    for (const { name } of FUNCTIONS) {
      expect(effectiveDefinition(name).file).toBe(WINNER_FILES[name]);
    }
  });

  it("il promemoria giornaliero invita a inserire la registrazione", () => {
    const { body } = effectiveDefinition("send_daily_reminder_push");

    expect(body).toContain(
      "'body', 'Ricordati di inserire la registrazione di oggi!'",
    );
  });

  it("la migration di configurazione documenta il secret senza ref di produzione", () => {
    const migration = readFileSync(
      `${MIGRATIONS_DIR}${CONFIG_MIGRATION}`,
      "utf8",
    );

    expect(migration).not.toContain(PROJECT_REF);
    expect(migration).toContain("vault.create_secret(");
    expect(migration).toContain(SECRET_NAME);
  });
});
