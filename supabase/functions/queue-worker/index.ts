import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-worker-secret",
};

async function sendViaUazapi(integration: any, phone: string, message: string) {
  const baseUrl = (Deno.env.get("UAZAPI_BASE_URL") || "https://free.uazapi.com").replace(/\/$/, "");
  const token = integration.instance_token;
  if (!token) return { ok: false, status: 422, body: { error: "Instância UAZAPI sem token configurado" } };
  const url = `${baseUrl}/send/text`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "token": token },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const body = await response.json().catch(() => ({}));
  console.log("[queue-worker UAZAPI]", response.status, JSON.stringify(body).slice(0, 300));
  return { ok: response.ok, status: response.status, body };
}

async function sendViaEvolution(integration: any, phone: string, message: string) {
  const apiUrl = (integration.api_url || integration.base_url || "").replace(/\/$/, "");
  const { instance_id, access_token } = integration;
  if (!apiUrl || !instance_id) return { ok: false, status: 422, body: { error: "Evolution não configurado" } };
  const url = `${apiUrl}/message/sendText/${instance_id}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": access_token },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const body = await response.json().catch(() => ({}));
  console.log("[queue-worker Evolution]", response.status, JSON.stringify(body).slice(0, 300));
  return { ok: response.ok, status: response.status, body };
}

async function sendMessage(integration: any, phone: string, message: string) {
  if (integration.provider === "uazapi") return sendViaUazapi(integration, phone, message);
  if (integration.provider === "evolution-api") return sendViaEvolution(integration, phone, message);
  // default: tentar UAZAPI se houver instance_token; senão Evolution
  if (integration.instance_token) return sendViaUazapi(integration, phone, message);
  return sendViaEvolution(integration, phone, message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authentication: aceita (a) x-worker-secret válido, OU (b) Bearer token (cron/usuário autenticado)
  const workerSecret = Deno.env.get("QUEUE_WORKER_SECRET");
  const providedSecret = req.headers.get("x-worker-secret") || "";
  const authHeader = req.headers.get("Authorization") || "";

  const secretMatches = workerSecret && providedSecret && providedSecret === workerSecret;
  const hasBearer = authHeader.startsWith("Bearer ");
  // Se o secret foi fornecido mas não bate, rejeitar
  if (providedSecret && workerSecret && providedSecret !== workerSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized: bad secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!secretMatches && !hasBearer) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Buscar mensagens pendentes (scheduled_for nulo OU já vencido)
    const nowIso = new Date().toISOString();
    const { data: pendingMessages, error: fetchError } = await supabase
      .from("message_queue")
      .select("*")
      .eq("status", "pending")
      .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    console.log(`[queue-worker] pending=${pendingMessages?.length ?? 0}`);

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
      .eq("is_active", true)
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
        await supabase.from("message_queue").update({
          status: "failed",
          error_message: "Integração WhatsApp da clínica não está ativa",
          attempts: (msg.attempts || 0) + 1,
        }).eq("id", msg.id);
        skipped++;
        continue;
      }

      if (!msg.phone || msg.phone.trim().length < 8) {
        await supabase.from("message_queue").update({
          status: "failed",
          error_message: "Telefone do paciente inválido ou ausente",
          attempts: (msg.attempts || 0) + 1,
        }).eq("id", msg.id);
        failed++;
        continue;
      }

      const messageText = msg.rendered_message || msg.message_body;

      try {
        const result = await sendMessage(integration, msg.phone, messageText);
        const newAttempts = (msg.attempts || 0) + 1;

        if (result.ok) {
          await supabase.from("message_queue").update({
            status: "sent",
            attempts: newAttempts,
            provider_response: result.body,
            sent_at: new Date().toISOString(),
            error_message: null,
          }).eq("id", msg.id);

          // Best-effort: registrar em message_logs (ignora erro de schema)
          try {
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
              external_id: result.body?.key?.id || result.body?.messageId || result.body?.id || null,
              sent_at: new Date().toISOString(),
              metadata: { queue_id: msg.id },
            });
          } catch (logErr) {
            console.warn("[queue-worker] message_logs insert failed (ignored):", logErr);
          }

          sent++;
        } else {
          const shouldRetry = newAttempts < 3;
          const errMsg = result.body?.error || result.body?.message || `API ${result.status}`;
          await supabase.from("message_queue").update({
            status: shouldRetry ? "pending" : "failed",
            attempts: newAttempts,
            provider_response: result.body,
            error_message: String(errMsg).slice(0, 500),
            scheduled_for: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
          }).eq("id", msg.id);
          failed++;
        }
      } catch (fetchErr: any) {
        const newAttempts = (msg.attempts || 0) + 1;
        const shouldRetry = newAttempts < 3;
        await supabase.from("message_queue").update({
          status: shouldRetry ? "pending" : "failed",
          attempts: newAttempts,
          error_message: `Network error: ${String(fetchErr?.message || fetchErr).slice(0, 300)}`,
          scheduled_for: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
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
      JSON.stringify({ error: "Internal server error", detail: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
