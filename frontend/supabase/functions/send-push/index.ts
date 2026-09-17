import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("send-push");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_RECIPIENTS = 500;
const SUBSCRIPTIONS_PAGE_SIZE = 1000;
const SEND_BATCH_SIZE = 50;
const SEND_TIMEOUT_MS = 10000;

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

    const recipients = Array.isArray(to)
      ? [...new Set(to.filter((id) => typeof id === "string" && id.length > 0))]
      : [];

    if (recipients.length === 0) {
      return new Response("Missing recipients", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const truncated = recipients.length > MAX_RECIPIENTS;

    if (truncated) {
      logger.error("recipients exceed cap", {
        requested: recipients.length,
        max: MAX_RECIPIENTS,
      });
    }

    const targetUsers = recipients.slice(0, MAX_RECIPIENTS);

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

    const subscriptions: {
      endpoint: string;
      keys_p256dh: string;
      keys_auth: string;
    }[] = [];

    for (let from = 0; ; from += SUBSCRIPTIONS_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, keys_p256dh, keys_auth")
        .in("user_id", targetUsers)
        .order("id", { ascending: true })
        .range(from, from + SUBSCRIPTIONS_PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      subscriptions.push(...(data ?? []));

      if (!data || data.length < SUBSCRIPTIONS_PAGE_SIZE) {
        break;
      }
    }

    webpush.setVapidDetails(
      `mailto:${Deno.env.get("VAPID_SUBJECT") || "admin@cagometro.app"}`,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const staleEndpoints: string[] = [];
    let sent = 0;

    for (
      let index = 0;
      index < subscriptions.length;
      index += SEND_BATCH_SIZE
    ) {
      const batch = subscriptions.slice(index, index + SEND_BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (subscription) => {
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
            { timeout: SEND_TIMEOUT_MS },
          );
        }),
      );

      results.forEach((result, batchIndex) => {
        if (result.status === "fulfilled") {
          sent += 1;
          return;
        }

        const statusCode = result.reason?.statusCode ?? null;

        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(batch[batchIndex].endpoint);
          return;
        }

        logger.error("notification failed", {
          statusCode,
          endpoint: batch[batchIndex].endpoint,
          reason: String(result.reason?.message ?? result.reason ?? "unknown"),
        });
      });
    }

    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);

      logger.info("stale subscriptions removed", {
        count: staleEndpoints.length,
      });
    }

    logger.info("batch processed", {
      type,
      recipients: targetUsers.length,
      subscriptions: subscriptions.length,
      sent,
      stale: staleEndpoints.length,
      truncated,
    });

    return new Response(
      JSON.stringify({
        sent,
        stale: staleEndpoints.length,
        truncated,
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
