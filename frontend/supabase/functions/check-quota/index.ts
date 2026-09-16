import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const FREE_PLAN_LIMITS = {
  mau: 50000,
  monthlyActiveUsers: 50000,
  dbSizeMb: 500,
  egressGb: 5,
  dailyActiveUsers: 2000,
  storageSizeGb: 1,
  edgeInvocationsMonthly: 500000,
  realtimeMonthlyMessages: 500000,
};

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
    const projectRef = Deno.env.get("SUPABASE_PROJECT_REF");

    if (!managementToken || !projectRef) {
      return new Response(
        JSON.stringify({
          configured: false,
          error: "Management token or project ref not configured",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL(`https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-counts`);

    url.searchParams.set("grant_type", "daily");
    url.searchParams.set("iso_timestamp_start", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    url.searchParams.set("iso_timestamp_end", new Date().toISOString());

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Management API error: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const results = Array.isArray(payload?.result)
      ? payload.result
      : [];

    const usage = results.reduce(
      (acc, entry) => {
        acc.total_auth_requests += entry.total_auth_requests ?? 0;
        acc.total_realtime_requests += entry.total_realtime_requests ?? 0;
        acc.total_rest_requests += entry.total_rest_requests ?? 0;
        acc.total_storage_requests += entry.total_storage_requests ?? 0;
        return acc;
      },
      {
        total_auth_requests: 0,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
    );

    const requests = usage.total_rest_requests + usage.total_realtime_requests;
    const requestsPct = FREE_PLAN_LIMITS.mau > 0
      ? Math.min(100, Math.round((requests / FREE_PLAN_LIMITS.mau) * 100))
      : 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const snapshot = {
      recorded_at: new Date().toISOString(),
      period_end: new Date().toISOString().slice(0, 10),
      requests,
      usage: {
        ...usage,
        requests_pct: requestsPct,
        rest_requests_pct: Math.min(
          100,
          Math.round(((usage.total_rest_requests + usage.total_realtime_requests + usage.total_auth_requests + usage.total_storage_requests) / FREE_PLAN_LIMITS.mau) * 100),
        ),
      },
      limits: FREE_PLAN_LIMITS,
    };

    const { error } = await supabase.from("quota_snapshots").insert(snapshot);

    if (error) {
      console.error("check-quota snapshot insert error:", error.message);
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
    console.error("check-quota error:", error);

    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});