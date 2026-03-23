import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendViaEvolution(integration: any, phone: string, message: string) {
  const apiUrl = (integration.api_url || integration.base_url || "").replace(/\/$/, "");
  const { instance_id, access_token } = integration;
  const url = `${apiUrl}/message/sendText/${instance_id}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": access_token },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: pendingMessages, error: fetchError } = await supabase
      .from("message_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", 3)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "Nenhuma mensagem pendente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clinicIds = [...new Set(pendingMessages.map((m: any) => m.clinic_id))];
    
    const { data: integrations } = await supabase
      .from("clinic_channel_integrations")
      .select("*")
      .in("clinic_id", clinicIds)
      .eq("channel", "whatsapp")
      .eq("status", "active");

    const integrationMap = new Map(
      (integrations || []).map((i: any) => [i.clinic_id, i])
    );

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const msg of pendingMessages) {
      const integration = integrationMap.get(msg.clinic_id);

      if (!integration) {
        skipped++;
        continue;
      }

      const messageText = msg.rendered_message || msg.message_body;

      try {
        const result = await sendViaEvolution(integration, msg.phone, messageText);
        const newAttempts = (msg.attempts || 0) + 1;

        if (result.ok) {
          await supabase.from("message_queue").update({
            status: "sent",
            attempts: newAttempts,
            provider_response: result.body,
            sent_at: new Date().toISOString(),
            error_message: null,
          }).eq("id", msg.id);

          await supabase.from("message_logs").insert({
            clinic_id: msg.clinic_id,
            patient_id: msg.patient_id,
            appointment_id: msg.appointment_id,
            template_id: msg.template_id,
            automation_rule_id: msg.automation_rule_id,
            channel: "whatsapp",
            message_type: msg.automation_rule_id ? "automation" : "manual",
            content: messageText,
            status: "sent",
            phone: msg.phone,
            provider_response: result.body,
            external_id: result.body?.key?.id || result.body?.messageId || null,
            sent_at: new Date().toISOString(),
            metadata: { queue_id: msg.id },
          });

          sent++;
        } else {
          const shouldRetry = newAttempts < 3;
          await supabase.from("message_queue").update({
            status: shouldRetry ? "pending" : "failed",
            attempts: newAttempts,
            provider_response: result.body,
            error_message: `API ${result.status}`,
            scheduled_for: shouldRetry
              ? new Date(Date.now() + 120000).toISOString()
              : null,
            next_retry_at: shouldRetry
              ? new Date(Date.now() + 120000).toISOString()
              : null,
          }).eq("id", msg.id);

          failed++;
        }
      } catch (fetchErr: any) {
        const newAttempts = (msg.attempts || 0) + 1;
        const shouldRetry = newAttempts < 3;

        await supabase.from("message_queue").update({
          status: shouldRetry ? "pending" : "failed",
          attempts: newAttempts,
          error_message: `Erro de rede: ${fetchErr.message}`,
          scheduled_for: shouldRetry
            ? new Date(Date.now() + 120000).toISOString()
            : null,
          next_retry_at: shouldRetry
            ? new Date(Date.now() + 120000).toISOString()
            : null,
        }).eq("id", msg.id);

        failed++;
      }

      processed++;
    }

    return new Response(
      JSON.stringify({ processed, sent, failed, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("queue-worker error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
