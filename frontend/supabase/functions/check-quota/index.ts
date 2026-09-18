import { createClient } from "jsr:@supabase/supabase-js@2";

import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("check-quota");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const API_ROOT = "https://api.supabase.com/v1";
const USAGE_WINDOW = "7day";
const EDGE_WINDOW = "1day";
const REQUEST_TIMEOUT_MS = 15000;

const FREE_PLAN_LIMITS = {
  database_size_bytes: 500 * 1024 * 1024,
  storage_bytes: 1024 * 1024 * 1024,
  mau: 50_000,
  egress_bytes: 5 * 1024 * 1024 * 1024,
};

type JsonObject = Record<string, unknown>;

type CollectorResult =
  | { ok: true; value: JsonObject }
  | { ok: false; error: string };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Il project ref viene ricavato da SUPABASE_URL (iniettata dal runtime) perché
// non è possibile creare secret con prefisso SUPABASE_ e non è tra quelle
// iniettate di default.
function resolveProjectRef(): string | null {
  const explicit = Deno.env.get("PROJECT_REF");

  if (explicit) {
    return explicit;
  }

  const url = Deno.env.get("SUPABASE_URL");

  if (!url) {
    return null;
  }

  try {
    const ref = new URL(url).hostname.split(".")[0];

    return ref || null;
  } catch {
    return null;
  }
}

async function managementGet(
  ref: string,
  token: string,
  path: string,
): Promise<JsonObject> {
  const response = await fetch(`${API_ROOT}/projects/${ref}/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Management API ${response.status} on GET ${path}`);
  }

  return await response.json();
}

async function managementPost(
  ref: string,
  token: string,
  path: string,
  body: JsonObject,
): Promise<unknown> {
  const response = await fetch(`${API_ROOT}/projects/${ref}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Management API ${response.status} on POST ${path}`);
  }

  return await response.json();
}

async function collectApiCounts(
  ref: string,
  token: string,
): Promise<CollectorResult> {
  try {
    const path = `analytics/endpoints/usage.api-counts?interval=${encodeURIComponent(USAGE_WINDOW)}`;

    const payload = await managementGet(ref, token, path);
    const results = Array.isArray(payload?.result) ? payload.result : [];

    const usage = (results as JsonObject[]).reduce(
      (acc, entry) => {
        acc.total_auth_requests += Number(entry.total_auth_requests ?? 0);
        acc.total_realtime_requests += Number(
          entry.total_realtime_requests ?? 0,
        );
        acc.total_rest_requests += Number(entry.total_rest_requests ?? 0);
        acc.total_storage_requests += Number(entry.total_storage_requests ?? 0);
        return acc;
      },
      {
        total_auth_requests: 0,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
    );

    return {
      ok: true,
      value: {
        ...usage,
        window: USAGE_WINDOW,
      },
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

async function collectDatabaseAndStorage(
  ref: string,
  token: string,
): Promise<CollectorResult> {
  try {
    const query = [
      "select",
      "  pg_database_size(current_database()) as database_size,",
      "  (select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects) as storage_bytes,",
      "  (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days') as monthly_active_users",
    ].join(" ");

    const payload = await managementPost(
      ref,
      token,
      "database/query/read-only",
      { query },
    );

    const rows = Array.isArray(payload) ? payload : [];
    const row = (rows[0] ?? {}) as JsonObject;

    return {
      ok: true,
      value: {
        database_size_bytes: Number(row.database_size ?? 0),
        storage_bytes: Number(row.storage_bytes ?? 0),
        mau: Number(row.monthly_active_users ?? 0),
      },
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function rowTotal(row: unknown): number {
  if (!row || typeof row !== "object") return 0;

  const record = row as JsonObject;

  for (const key of [
    "count",
    "total_count",
    "total_requests",
    "requests",
    "total",
  ]) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  if (record.data && typeof record.data === "object") {
    return rowTotal(record.data);
  }

  return 0;
}

async function collectEdgeFunctions(
  ref: string,
  token: string,
): Promise<CollectorResult> {
  try {
    const payload = await managementGet(ref, token, "functions");
    const functions = Array.isArray(payload) ? payload : [];
    const stats: JsonObject[] = [];
    let totalInvocations = 0;

    for (const fn of functions as JsonObject[]) {
      const id = typeof fn?.id === "string" ? fn.id : null;
      const slug =
        typeof fn?.slug === "string"
          ? fn.slug
          : String(fn?.name ?? "unknown");

      if (!id) {
        stats.push({ slug, invocations: null });
        continue;
      }

      try {
        const path = [
          "analytics/endpoints/functions.combined-stats",
          `?interval=${EDGE_WINDOW}`,
          `&function_id=${encodeURIComponent(id)}`,
        ].join("");

        const stat = await managementGet(ref, token, path);

        logger.info("edge combined-stats", {
          slug,
          payload: stat,
        });

        const rows = Array.isArray(stat?.result) ? stat.result : [];
        const invocations = rows.reduce((acc, row) => acc + rowTotal(row), 0);

        totalInvocations += invocations;
        stats.push({ slug, invocations });
      } catch (error) {
        stats.push({ slug, invocations: null });
      }
    }

    return {
      ok: true,
      value: {
        edge_functions: stats,
        edge_total_invocations: totalInvocations,
      },
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const pushKey = Deno.env.get("PUSH_TRIGGER_KEY");

  if (!pushKey || req.headers.get("x-push-key") !== pushKey) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const managementToken = Deno.env.get("MANAGEMENT_ACCESS_TOKEN");
    const projectRef = resolveProjectRef();

    if (!managementToken || !projectRef) {
      const missing = [
        !managementToken ? "MANAGEMENT_ACCESS_TOKEN" : null,
        !projectRef ? "PROJECT_REF/SUPABASE_URL" : null,
      ].filter(Boolean);

      return new Response(
        JSON.stringify({
          configured: false,
          error: "Management token or project ref not configured",
          missing,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const collectors = await Promise.all([
      collectApiCounts(projectRef, managementToken),
      collectDatabaseAndStorage(projectRef, managementToken),
      collectEdgeFunctions(projectRef, managementToken),
    ]);

    const [apiCounts, databaseAndStorage, edge] = collectors;

    const usage: JsonObject = { window: USAGE_WINDOW };

    if (apiCounts.ok) {
      Object.assign(usage, apiCounts.value);
    } else {
      logger.error("api-counts collector failed", { reason: apiCounts.error });
    }

    if (databaseAndStorage.ok) {
      Object.assign(usage, databaseAndStorage.value);
    } else {
      logger.error("database query collector failed", {
        reason: databaseAndStorage.error,
      });
    }

    if (edge.ok) {
      Object.assign(usage, edge.value);
    } else {
      logger.error("edge functions collector failed", { reason: edge.error });
    }

    const requests =
      Number(usage.total_auth_requests ?? 0) +
      Number(usage.total_rest_requests ?? 0) +
      Number(usage.total_realtime_requests ?? 0) +
      Number(usage.total_storage_requests ?? 0);

    const snapshot = {
      recorded_at: new Date().toISOString(),
      period_end: new Date().toISOString().slice(0, 10),
      requests,
      usage,
      limits: FREE_PLAN_LIMITS,
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("quota_snapshots").insert(snapshot);

    if (error) {
      logger.error("snapshot insert failed", { reason: error.message });
    }

    return new Response(
      JSON.stringify({
        configured: true,
        snapshot,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error("unhandled error", {
      reason: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});