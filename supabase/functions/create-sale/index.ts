import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req, { methods: "POST, OPTIONS" });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const reqId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolver clínica do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.clinic_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Clínica não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();

    if (!payload?.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "A venda deve ter pelo menos um item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chamada transacional única — ACID garantido pelo Postgres
    const { data, error } = await supabase.rpc("create_sale_transaction", {
      p_clinic_id: profile.clinic_id,
      p_user_id: user.id,
      p_payload: payload,
    });

    if (error) {
      console.error(`[create-sale] [${reqId}] RPC error:`, error);

      // Mensagens user-friendly para erros conhecidos
      const msg = error.message || "";
      let userMessage = "Não foi possível concluir a venda. Tente novamente.";
      let status = 400;

      if (msg.includes("INSUFFICIENT_STOCK")) {
        const parts = msg.split("INSUFFICIENT_STOCK:")[1]?.split(":") || [];
        userMessage = `Estoque insuficiente para ${parts[0] || "produto"} (solicitado ${parts[1]}, disponível ${parts[2]}).`;
      } else if (msg.includes("PRODUCT_NOT_FOUND")) {
        userMessage = `Produto não encontrado: ${msg.split("PRODUCT_NOT_FOUND:")[1] || ""}`;
      } else if (msg.includes("NOT_AUTHORIZED")) {
        userMessage = "Você não tem permissão para criar vendas nesta clínica.";
        status = 403;
      } else if (msg.includes("EMPTY_ITEMS")) {
        userMessage = "A venda deve ter pelo menos um item.";
      } else if (msg.includes("INVALID_QUANTITY")) {
        userMessage = "Quantidade inválida em um dos itens.";
      }

      return new Response(
        JSON.stringify({ success: false, error: userMessage, request_id: reqId }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sale: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`[create-sale] [${reqId}] Unhandled:`, err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Não foi possível concluir a venda. Tente novamente.",
        request_id: reqId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
