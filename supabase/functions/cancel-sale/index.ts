import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CancelSaleRequest {
  sale_id: string;
  reason?: string;
}

interface CancelSaleResult {
  success: boolean;
  error?: string;
  message?: string;
  sale_id?: string;
  items_reverted?: number;
  amount_reversed?: number;
  reversal_transaction_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role for RPC call
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's clinic to verify access
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.clinic_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Clínica não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CancelSaleRequest = await req.json();
    const { sale_id, reason } = body;

    if (!sale_id) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da venda é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user permissions using database function
    const { data: permissions, error: permError } = await supabase.rpc(
      "get_user_all_permissions",
      { _user_id: user.id }
    );

    if (permError) {
      console.error("[cancel-sale] Error fetching permissions:", permError);
    }

    // Check if user has admin/owner role OR delete permission on financeiro module
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("clinic_id", profile.clinic_id)
      .single();

    const isAdmin = roleData?.role === "owner" || roleData?.role === "admin";
    const financeiroPerms = permissions?.find((p: any) => p.module === "financeiro");
    const canDelete = financeiroPerms?.actions?.includes("delete") || false;
    const canCancelSale = isAdmin || canDelete;

    if (!canCancelSale) {
      console.warn(`[cancel-sale] Permission denied for user ${user.id} on sale ${sale_id}`);
      
      // Log denied attempt to audit
      try {
        await supabase.from("access_logs").insert({
          clinic_id: profile.clinic_id,
          user_id: user.id,
          action: "PERMISSION_DENIED_CANCEL_SALE",
          resource: `sales/${sale_id}`,
          user_agent: req.headers.get("user-agent") || null,
        });
      } catch (auditError) {
        console.warn("[cancel-sale] Failed to log denied attempt:", auditError);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Você não tem permissão para cancelar vendas. Apenas administradores ou usuários com permissão de exclusão no módulo financeiro podem realizar esta ação." 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify sale belongs to user's clinic
    const { data: sale, error: saleCheckError } = await supabase
      .from("sales")
      .select("clinic_id")
      .eq("id", sale_id)
      .single();

    if (saleCheckError || !sale) {
      return new Response(
        JSON.stringify({ success: false, error: "Venda não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sale.clinic_id !== profile.clinic_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Venda não pertence à sua clínica" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cancel-sale] Starting transactional cancellation for sale ${sale_id} by user ${user.id}`);

    // Call the transactional database function
    // This ensures all operations are atomic - if any step fails, everything is rolled back
    const { data: result, error: rpcError } = await supabase.rpc("cancel_sale_transaction", {
      p_sale_id: sale_id,
      p_user_id: user.id,
      p_reason: reason || "Cancelamento de venda",
    });

    if (rpcError) {
      console.error("[cancel-sale] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ success: false, error: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cancelResult = result as CancelSaleResult;

    if (!cancelResult.success) {
      console.error("[cancel-sale] Transaction failed:", cancelResult.error);
      return new Response(
        JSON.stringify({ success: false, error: cancelResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit entry with detailed metadata (non-critical, don't fail if this errors)
    try {
      // Get sale details for audit log
      const { data: saleDetails } = await supabase
        .from("sales")
        .select("patient_id, sale_number, total_amount")
        .eq("id", sale_id)
        .single();

      await supabase.from("access_logs").insert({
        clinic_id: profile.clinic_id,
        user_id: user.id,
        action: "SALE_CANCELLED",
        resource: `sales/${sale_id}|patient:${saleDetails?.patient_id || 'unknown'}|sale_number:${saleDetails?.sale_number || 'N/A'}|amount:${cancelResult.amount_reversed || 0}|reason:${reason || 'Cancelamento de venda'}`,
        user_agent: req.headers.get("user-agent") || null,
      });
    } catch (auditError) {
      console.warn("[cancel-sale] Failed to log audit:", auditError);
    }

    console.log(`[cancel-sale] Successfully cancelled sale ${sale_id} - Items reverted: ${cancelResult.items_reverted}, Amount: ${cancelResult.amount_reversed}`);

    return new Response(
      JSON.stringify(cancelResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[cancel-sale] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao cancelar venda",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
