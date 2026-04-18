import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UAZAPI_BASE_URL = (Deno.env.get("UAZAPI_BASE_URL") || "").replace(/\/$/, "");
const UAZAPI_ADMIN_TOKEN = Deno.env.get("UAZAPI_ADMIN_TOKEN") || "";

type Action =
  | "create"
  | "connect"
  | "status"
  | "disconnect"
  | "reset"
  | "send_test"
  | "sync";

interface RequestBody {
  action: Action;
  clinic_id: string;
  payload?: Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function uazapiFetch(path: string, opts: { token?: string; useAdmin?: boolean; method?: string; body?: unknown }) {
  if (!UAZAPI_BASE_URL) throw new Error("UAZAPI_BASE_URL não configurada");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.useAdmin) {
    if (!UAZAPI_ADMIN_TOKEN) throw new Error("UAZAPI_ADMIN_TOKEN não configurada");
    headers["admintoken"] = UAZAPI_ADMIN_TOKEN;
  } else if (opts.token) {
    headers["token"] = opts.token;
  }
  const url = `${UAZAPI_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

function mapStatus(s: string | undefined | null): string {
  const v = (s || "").toLowerCase();
  if (["connected", "open", "online"].includes(v)) return "connected";
  if (["connecting", "pairing", "qrcode", "qr"].includes(v)) return "connecting";
  if (["disconnected", "close", "closed", "offline"].includes(v)) return "disconnected";
  return v || "disconnected";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { action, clinic_id, payload = {} } = body;

    if (!action || !clinic_id) return jsonResponse({ error: "action e clinic_id obrigatórios" }, 400);

    // Authorization: user must belong to clinic and be owner/admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", userId)
      .single();
    if (!profile || profile.clinic_id !== clinic_id) return jsonResponse({ error: "Forbidden" }, 403);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("clinic_id", clinic_id)
      .maybeSingle();
    const role = roleRow?.role;
    if (!["owner", "admin"].includes(role || "")) return jsonResponse({ error: "Apenas owner/admin" }, 403);

    // Get current integration (if any)
    const { data: existing } = await supabase
      .from("clinic_channel_integrations")
      .select("*")
      .eq("clinic_id", clinic_id)
      .eq("channel", "whatsapp")
      .eq("provider", "uazapi")
      .maybeSingle();

    // Helper to update integration row
    async function patchIntegration(values: Record<string, unknown>) {
      if (existing?.id) {
        const { data, error } = await supabase
          .from("clinic_channel_integrations")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("clinic_channel_integrations")
        .insert({
          clinic_id,
          channel: "whatsapp",
          provider: "uazapi",
          is_active: true,
          is_default: true,
          status: "not_configured",
          ...values,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // ========== ACTIONS ==========
    if (action === "create") {
      const instanceName = (payload.instance_name as string) || `clinic-${clinic_id.substring(0, 8)}`;
      const res = await uazapiFetch("/instance/init", {
        useAdmin: true,
        method: "POST",
        body: { name: instanceName, systemName: "YesClin" },
      });
      if (!res.ok) {
        await patchIntegration({ last_error: `create: ${res.status} ${JSON.stringify(res.data)}`, last_connection_check_at: new Date().toISOString() });
        return jsonResponse({ error: "Falha ao criar instância na UAZAPI", details: res.data }, res.status);
      }
      const inst = res.data?.instance || res.data;
      const updated = await patchIntegration({
        instance_name: inst?.name || instanceName,
        instance_external_id: inst?.id || inst?.token || null,
        instance_token: inst?.token || null,
        instance_status: mapStatus(inst?.status),
        status: "connecting",
        last_error: null,
        last_connection_check_at: new Date().toISOString(),
        last_connection_status: mapStatus(inst?.status),
      });
      return jsonResponse({ success: true, integration: { ...updated, instance_token: undefined } });
    }

    if (!existing?.instance_token && action !== "create") {
      return jsonResponse({ error: "Instância não criada ainda. Use action=create primeiro." }, 422);
    }

    const instToken = existing!.instance_token as string;

    if (action === "connect") {
      const phone = (payload.phone as string) || existing!.instance_phone || "";
      const res = await uazapiFetch("/instance/connect", {
        token: instToken,
        method: "POST",
        body: phone ? { phone } : {},
      });
      const inst = res.data?.instance || res.data;
      const updated = await patchIntegration({
        instance_status: mapStatus(inst?.status) || "connecting",
        status: "connecting",
        last_error: res.ok ? null : `connect: ${JSON.stringify(res.data)}`,
        last_connection_check_at: new Date().toISOString(),
      });
      return jsonResponse({
        success: res.ok,
        qrcode: inst?.qrcode || res.data?.qrcode || null,
        paircode: inst?.paircode || res.data?.paircode || null,
        instance_status: updated.instance_status,
      }, res.ok ? 200 : res.status);
    }

    if (action === "status") {
      const res = await uazapiFetch("/instance/status", { token: instToken, method: "GET" });
      const inst = res.data?.instance || res.data;
      const updated = await patchIntegration({
        instance_status: mapStatus(inst?.status),
        instance_phone: inst?.phone || inst?.wid || existing!.instance_phone,
        instance_profile_name: inst?.profileName || inst?.name || existing!.instance_profile_name,
        instance_profile_pic_url: inst?.profilePicUrl || existing!.instance_profile_pic_url,
        is_business: !!inst?.isBusiness,
        status: mapStatus(inst?.status) === "connected" ? "active" : (existing!.status || "not_configured"),
        last_connection_status: mapStatus(inst?.status),
        last_connection_check_at: new Date().toISOString(),
        last_error: res.ok ? null : `status: ${JSON.stringify(res.data)}`,
      });
      return jsonResponse({
        success: res.ok,
        integration: { ...updated, instance_token: undefined },
        qrcode: inst?.qrcode || null,
        paircode: inst?.paircode || null,
      });
    }

    if (action === "disconnect") {
      const res = await uazapiFetch("/instance/disconnect", { token: instToken, method: "POST" });
      const updated = await patchIntegration({
        instance_status: "disconnected",
        status: "not_configured",
        last_connection_status: "disconnected",
        last_connection_check_at: new Date().toISOString(),
        last_error: res.ok ? null : `disconnect: ${JSON.stringify(res.data)}`,
      });
      return jsonResponse({ success: res.ok, integration: { ...updated, instance_token: undefined } });
    }

    if (action === "reset") {
      // Disconnect + clear instance data
      await uazapiFetch("/instance/disconnect", { token: instToken, method: "POST" });
      const updated = await patchIntegration({
        instance_token: null,
        instance_external_id: null,
        instance_status: null,
        instance_phone: null,
        instance_profile_name: null,
        instance_profile_pic_url: null,
        is_business: false,
        status: "not_configured",
        last_connection_status: "disconnected",
        last_error: null,
        last_connection_check_at: new Date().toISOString(),
      });
      return jsonResponse({ success: true, integration: { ...updated, instance_token: undefined } });
    }

    if (action === "send_test") {
      const phone = String(payload.phone || "").replace(/\D/g, "");
      const message = String(payload.message || "✅ Teste de conexão YesClin via UAZAPI");
      if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);
      const res = await uazapiFetch("/send/text", {
        token: instToken,
        method: "POST",
        body: { number: phone, text: message },
      });
      return jsonResponse({ success: res.ok, response: res.data }, res.ok ? 200 : res.status);
    }

    return jsonResponse({ error: "Ação desconhecida" }, 400);
  } catch (err: any) {
    console.error("uazapi-instance error:", err);
    return jsonResponse({ error: err.message || "Erro interno" }, 500);
  }
});
