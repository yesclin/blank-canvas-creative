import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendRequest {
  clinic_id: string;
  phone: string;
  message: string;
  patient_id?: string;
  appointment_id?: string;
  template_id?: string;
  automation_rule_id?: string;
  queue_id?: string;
}

function formatPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.substring(1);
  if (!digits.startsWith("55") && digits.length <= 11) digits = "55" + digits;
  return digits;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getIntegration(supabase: any, clinicId: string) {
  const { data, error } = await supabase
    .from("clinic_channel_integrations")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("channel", "whatsapp")
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function sendViaEvolution(integration: any, phone: string, message: string) {
  const apiUrl = (integration.api_url || integration.base_url || "").replace(/\/$/, "");
  const { instance_id, access_token } = integration;
  const url = `${apiUrl}/message/sendText/${instance_id}`;

  console.log("[Evolution] URL:", url);
  console.log("[Evolution] Phone:", phone);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": access_token,
    },
    body: JSON.stringify({ number: phone, text: message }),
  });

  const body = await response.json().catch(() => ({}));
  console.log("[Evolution] Status:", response.status, "Body:", JSON.stringify(body));
  return { ok: response.ok, status: response.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    const supabase = getSupabase();

    const body: SendRequest = await req.json();
    const { clinic_id, phone, message, patient_id, appointment_id, template_id, automation_rule_id, queue_id } = body;

    if (!clinic_id || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "clinic_id, phone e message são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Clinic authorization ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", userId)
      .single();

    if (!profile || profile.clinic_id !== clinic_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const integration = await getIntegration(supabase, clinic_id);

    if (!integration) {
      return new Response(
        JSON.stringify({ error: "WhatsApp não configurado", status: "not_configured" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhone(phone);
    
    let currentQueueId = queue_id;
    let currentAttempts = 0;

    if (queue_id) {
      const { data: existing } = await supabase
        .from("message_queue")
        .select("attempts")
        .eq("id", queue_id)
        .single();
      currentAttempts = existing?.attempts || 0;
    } else {
      const { data: newQueue, error: qErr } = await supabase
        .from("message_queue")
        .insert({
          clinic_id,
          phone: formattedPhone,
          message_body: message,
          rendered_message: message,
          patient_id: patient_id || null,
          appointment_id: appointment_id || null,
          template_id: template_id || null,
          automation_rule_id: automation_rule_id || null,
          status: "pending",
          scheduled_for: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (qErr) throw qErr;
      currentQueueId = newQueue.id;
    }

    let result;
    try {
      result = await sendViaEvolution(integration, formattedPhone, message);
    } catch (fetchErr: any) {
      const newAttempts = currentAttempts + 1;
      const shouldRetry = newAttempts < 3;

      await supabase.from("message_queue").update({
        status: shouldRetry ? "pending" : "failed",
        attempts: newAttempts,
        error_message: `Erro de rede: ${fetchErr.message}`,
        scheduled_for: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
        next_retry_at: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
      }).eq("id", currentQueueId);

      return new Response(
        JSON.stringify({ error: "Falha de rede", queue_id: currentQueueId, retry: shouldRetry }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAttempts = currentAttempts + 1;

    if (result.ok) {
      await supabase.from("message_queue").update({
        status: "sent",
        attempts: newAttempts,
        provider_response: result.body,
        sent_at: new Date().toISOString(),
        error_message: null,
      }).eq("id", currentQueueId);

      await supabase.from("message_logs").insert({
        clinic_id,
        patient_id: patient_id || null,
        appointment_id: appointment_id || null,
        template_id: template_id || null,
        automation_rule_id: automation_rule_id || null,
        channel: "whatsapp",
        message_type: automation_rule_id ? "automation" : "manual",
        content: message,
        status: "sent",
        phone: formattedPhone,
        provider_response: result.body,
        external_id: result.body?.key?.id || result.body?.messageId || null,
        sent_at: new Date().toISOString(),
        metadata: { queue_id: currentQueueId },
      });

      return new Response(
        JSON.stringify({ success: true, queue_id: currentQueueId, provider_response: result.body }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const shouldRetry = newAttempts < 3;

      await supabase.from("message_queue").update({
        status: shouldRetry ? "pending" : "failed",
        attempts: newAttempts,
        provider_response: result.body,
        error_message: `API retornou ${result.status}`,
        scheduled_for: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
        next_retry_at: shouldRetry ? new Date(Date.now() + 120000).toISOString() : null,
      }).eq("id", currentQueueId);

      return new Response(
        JSON.stringify({ error: "Falha no envio", queue_id: currentQueueId, retry: shouldRetry }),
        { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("send-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
