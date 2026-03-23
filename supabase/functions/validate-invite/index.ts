import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  "https://id-preview--e2305a67-dd71-4dc6-bb28-50ab8384c9ab.lovable.app",
  "https://yesclin.com",
  "https://www.yesclin.com",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting validate-invite function");

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token não fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("user_invitations")
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        expires_at,
        clinic_id,
        clinics (name)
      `)
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: "Convite não encontrado" 
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check status
    if (invitation.status !== "pending") {
      const statusMessages: Record<string, string> = {
        accepted: "Este convite já foi utilizado",
        expired: "Este convite expirou",
        cancelled: "Este convite foi cancelado",
      };

      return new Response(
        JSON.stringify({ 
          valid: false,
          error: statusMessages[invitation.status] || "Convite inválido" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from("user_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ 
          valid: false,
          error: "Este convite expirou. Solicite um novo convite ao administrador." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      profissional: "Profissional",
      recepcionista: "Recepção",
    };

    console.log("Invitation valid:", invitation.id);

    return new Response(
      JSON.stringify({
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          fullName: invitation.full_name,
          role: invitation.role,
          roleLabel: roleLabels[invitation.role] || invitation.role,
          clinicName: (invitation.clinics as any)?.name || "Clínica",
          expiresAt: invitation.expires_at,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in validate-invite function:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
