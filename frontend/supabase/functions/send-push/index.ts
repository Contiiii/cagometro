import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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
    const body = await req.json();

    const {
      to,
      type = "general",
      title,
      body: messageBody,
      url = "/",
    } = body ?? {};

    if (!Array.isArray(to) || to.length === 0) {
      return new Response("Missing recipients", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!title || !messageBody) {
      return new Response("Missing title or body", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, keys_p256dh, keys_auth")
      .in("user_id", to);

    if (error) {
      throw error;
    }

    webpush.setVapidDetails(
      `mailto:${Deno.env.get("VAPID_SUBJECT") || "admin@cagometro.app"}`,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const results = await Promise.allSettled(
      (subscriptions ?? []).map(async (subscription) => {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys_p256dh,
              auth: subscription.keys_auth,
            },
          },
          JSON.stringify({
            title,
            body: messageBody,
            url,
            type,
          }),
        );
      }),
    );

    const staleEndpoints = results
      .map((result, index) => {
        if (
          result.status === "rejected" &&
          (result.reason?.statusCode === 404 ||
            result.reason?.statusCode === 410)
        ) {
          return subscriptions?.[index]?.endpoint;
        }

        return null;
      })
      .filter(Boolean);

    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return new Response(
      JSON.stringify({
        sent,
        stale: staleEndpoints.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("send-push error:", error);

    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});