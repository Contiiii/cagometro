import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

import { createLogger } from "../_shared/logger.ts";
import { sendWithRetry } from "../_shared/pushRetry.ts";
import { isVapidRejected, loadVapidConfig } from "../_shared/vapid.ts";
import { verifyVapidKeyPair } from "../_shared/vapidCrypto.ts";

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

type AppEventsClient = {
  from: (table: string) => {
    insert: (
      row: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
  };
};

// Riga tecnica/amministrativa in app_events (user_id null): e' l'unico canale
// persistente visibile all'admin per i problemi di configurazione VAPID, dato
// che send-push e' invocata via net.http_post e la risposta viene ignorata.
async function recordVapidIssue(
  supabase: AppEventsClient,
  event: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from("app_events").insert({
    user_id: null,
    device_id: null,
    event,
    payload,
  });

  if (error) {
    logger.error("vapid app_event insert failed", {
      event,
      reason: error.message,
    });
  }
}

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

    const vapidResult = loadVapidConfig(Deno.env.toObject());

    if (!vapidResult.ok) {
      logger.error("vapid_config_invalid", {
        missing: vapidResult.missing,
        errors: vapidResult.errors,
      });
      await recordVapidIssue(supabase, "push_vapid_config_invalid", {
        missing: vapidResult.missing,
        errors: vapidResult.errors,
      });

      return new Response(
        JSON.stringify({
          error: "VAPID_CONFIG_INVALID",
          missing: vapidResult.missing,
          errors: vapidResult.errors,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vapidConfig = vapidResult.config;

    if (
      !verifyVapidKeyPair(vapidConfig.publicKey, vapidConfig.privateKey)
    ) {
      const reason =
        "VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY non sono una coppia valida";

      logger.error("vapid_pair_mismatch", { reason });
      await recordVapidIssue(supabase, "push_vapid_pair_mismatch", {
        reason,
      });

      return new Response(
        JSON.stringify({ error: "VAPID_CONFIG_INVALID", errors: [reason] }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    try {
      webpush.setVapidDetails(
        vapidConfig.subject,
        vapidConfig.publicKey,
        vapidConfig.privateKey,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      logger.error("vapid_config_invalid", { reason });
      await recordVapidIssue(supabase, "push_vapid_config_invalid", {
        reason,
      });

      return new Response(
        JSON.stringify({ error: "VAPID_CONFIG_INVALID", errors: [reason] }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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

    const staleEndpoints: string[] = [];
    let delivered = 0;
    let failed = 0;
    let retries = 0;
    let vapidRejected = 0;

    const sendNotification = (
      subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      },
      payload: string,
    ) => webpush.sendNotification(subscription, payload, { timeout: SEND_TIMEOUT_MS });

    for (
      let index = 0;
      index < subscriptions.length;
      index += SEND_BATCH_SIZE
    ) {
      const batch = subscriptions.slice(index, index + SEND_BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (subscription) => {
          const payload = JSON.stringify({
            title,
            body: messageBody,
            url,
            type,
          });

          return sendWithRetry(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys_p256dh,
                auth: subscription.keys_auth,
              },
            },
            payload,
            sendNotification,
            { timeoutMs: SEND_TIMEOUT_MS },
          );
        }),
      );

      results.forEach((result, batchIndex) => {
        const endpoint = batch[batchIndex].endpoint;

        if (result.status === "rejected") {
          failed += 1;
          logger.error("notification failed", {
            statusCode: null,
            endpoint,
            reason: String(result.reason),
          });
          return;
        }

        const outcome = result.value;

        retries += Math.max(0, outcome.attempts - 1);

        if (outcome.delivered) {
          delivered += 1;
          return;
        }

        if (outcome.removeEndpoint) {
          staleEndpoints.push(endpoint);
          return;
        }

        failed += 1;

        if (outcome.forbidden) {
          if (
            isVapidRejected({
              statusCode: outcome.statusCode,
              reason: outcome.reason,
            })
          ) {
            vapidRejected += 1;
            logger.error("vapid_rejected", {
              statusCode: outcome.statusCode,
              endpoint,
              reason: outcome.reason,
            });
            return;
          }

          logger.error("push forbidden", {
            statusCode: outcome.statusCode,
            endpoint,
            reason: outcome.reason,
          });
          return;
        }

        logger.error("notification failed", {
          statusCode: outcome.statusCode,
          endpoint,
          reason: outcome.reason,
          retries: outcome.retries,
        });
      });
    }

    if (staleEndpoints.length > 0) {
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);

      if (deleteError) {
        logger.error("stale subscriptions removal failed", {
          count: staleEndpoints.length,
          reason: deleteError.message,
        });
      } else {
        logger.info("stale subscriptions removed", {
          count: staleEndpoints.length,
        });
      }
    }

    const removedEndpoints = staleEndpoints.length;

    if (vapidRejected > 0) {
      await recordVapidIssue(supabase, "push_vapid_rejected", {
        type,
        count: vapidRejected,
        subscriptions: subscriptions.length,
        recipients: targetUsers.length,
      });
    }

    logger.info("batch processed", {
      type,
      recipients: targetUsers.length,
      subscriptions: subscriptions.length,
      delivered,
      failed,
      retries,
      removedEndpoints,
      vapidRejected,
      truncated,
    });

    return new Response(
      JSON.stringify({
        delivered,
        failed,
        retries,
        removedEndpoints,
        sent: delivered,
        stale: removedEndpoints,
        vapidRejected,
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
