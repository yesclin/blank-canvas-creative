import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const clinicId = url.searchParams.get("clinic_id");

    if (!clinicId) {
      return new Response(
        JSON.stringify({ error: "clinic_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate clinic_id is a valid UUID to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinicId)) {
      return new Response(
        JSON.stringify({ error: "Invalid clinic_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the clinic exists and has an active WhatsApp integration
    const { data: integration, error: integrationError } = await supabase
      .from("clinic_channel_integrations")
      .select("id, access_token")
      .eq("clinic_id", clinicId)
      .eq("channel", "whatsapp")
      .eq("status", "active")
      .maybeSingle();

    if (integrationError || !integration) {
      console.warn("Webhook rejected: no active integration for clinic", clinicId);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook token if provided via apikey header
    const providedApiKey = req.headers.get("apikey") || url.searchParams.get("apikey");
    if (providedApiKey && integration.access_token) {
      if (providedApiKey !== integration.access_token) {
        console.warn("Webhook rejected: invalid apikey for clinic", clinicId);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload = await req.json();
    console.log("Evolution API Webhook received for clinic:", clinicId);

    // Evolution API webhook events
    // Message status: { event: "messages.update", data: { key: { id }, status } }
    // Message received: { event: "messages.upsert", data: { key: { remoteJid, id }, message } }
    const event = payload.event;
    const data = payload.data;

    if (!data) {
      return new Response(
        JSON.stringify({ received: true, action: "ignored", reason: "no data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle message status updates from Evolution API
    if (event === "messages.update") {
      const messageId = data.key?.id;
      const status = data.status;

      if (messageId && status) {
        const mappedStatus = mapEvolutionStatus(status);

        if (mappedStatus) {
          const { data: logs } = await supabase
            .from("message_logs")
            .select("id, status")
            .eq("clinic_id", clinicId)
            .eq("external_id", messageId)
            .limit(1);

          if (logs && logs.length > 0) {
            const log = logs[0];
            if (shouldUpdateStatus(log.status, mappedStatus)) {
              const now = new Date().toISOString();
              const updatePayload: Record<string, unknown> = {
                status: mappedStatus,
                status_updated_at: now,
                provider_response: payload,
              };

              if (mappedStatus === "sent") updatePayload.sent_at = now;
              else if (mappedStatus === "delivered") updatePayload.delivered_at = now;
              else if (mappedStatus === "read") updatePayload.read_at = now;

              await supabase.from("message_logs").update(updatePayload).eq("id", log.id);

              // Also update queue item if exists
              const { data: queueItems } = await supabase
                .from("message_queue")
                .select("id")
                .eq("clinic_id", clinicId)
                .eq("external_id", messageId)
                .limit(1);

              if (queueItems && queueItems.length > 0) {
                await supabase.from("message_queue").update({
                  status: mappedStatus === "delivered" || mappedStatus === "read" ? "sent" : mappedStatus,
                  provider_response: payload,
                }).eq("id", queueItems[0].id);
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ received: true, action: "status_updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, action: "acknowledged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("webhook-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mapEvolutionStatus(status: string | number): string | null {
  const statusMap: Record<string, string> = {
    "PENDING": "pending",
    "SERVER_ACK": "sent",
    "DELIVERY_ACK": "delivered",
    "READ": "read",
    "PLAYED": "read",
    "ERROR": "failed",
    "FAILED": "failed",
    // Numeric codes from Evolution API
    "0": "pending",
    "1": "sent",
    "2": "delivered",
    "3": "read",
    "4": "read",
    "5": "failed",
  };

  return statusMap[String(status)] || null;
}

function shouldUpdateStatus(current: string, incoming: string): boolean {
  const order: Record<string, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: -1,
  };

  if (incoming === "failed") return true;
  return (order[incoming] ?? 0) > (order[current] ?? 0);
}
