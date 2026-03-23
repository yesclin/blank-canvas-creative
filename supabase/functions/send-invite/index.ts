/**
 * YESCLIN Send Invite Edge Function
 * 
 * Handles user invitation flow:
 * 1. Validates admin permissions and user limits
 * 2. Creates invitation record with secure token
 * 3. Sends professional email using shared templates
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getEmailService, sanitizeEmail, isValidEmail } from "../_shared/email-service.ts";
import { generateInviteEmail, getRoleLabel } from "../_shared/email-templates.ts";

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface InviteRequest {
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
  // Professional data (optional)
  isProfessional?: boolean;
  professionalType?: string;
  registrationNumber?: string;
  specialtyIds?: string[];
}

// Invitation expiration in days
const INVITATION_EXPIRATION_DAYS = 7;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-invite] Starting function");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[send-invite] No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client for user auth check
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("[send-invite] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-invite] User authenticated:", user.id);

    // Get user's clinic and profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id, full_name")
      .eq("user_id", user.id)
      .single();

    if (!profile?.clinic_id) {
      return new Response(
        JSON.stringify({ error: "Clínica não encontrada" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin
      .rpc("is_clinic_admin", { _user_id: user.id, _clinic_id: profile.clinic_id });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem convidar usuários" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get clinic info
    const { data: clinic } = await supabaseAdmin
      .from("clinics")
      .select("name, logo_url")
      .eq("id", profile.clinic_id)
      .single();

    // Check active users limit (max 3)
    const { data: activeProfiles, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("clinic_id", profile.clinic_id)
      .eq("is_active", true);

    if (countError) {
      console.error("[send-invite] Error counting profiles:", countError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar limite de usuários" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Count pending invitations too
    const { data: pendingInvites } = await supabaseAdmin
      .from("user_invitations")
      .select("id", { count: "exact" })
      .eq("clinic_id", profile.clinic_id)
      .eq("status", "pending");

    const totalActive = (activeProfiles?.length || 0) + (pendingInvites?.length || 0);
    if (totalActive >= 3) {
      return new Response(
        JSON.stringify({ error: "Limite de 3 usuários ativos atingido neste plano" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate request body
    const { 
      email, 
      fullName, 
      role, 
      permissions,
      isProfessional,
      professionalType,
      registrationNumber,
      specialtyIds,
    }: InviteRequest = await req.json();

    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: "E-mail, nome e perfil são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate professional data if isProfessional is true
    if (isProfessional && (!specialtyIds || specialtyIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Profissionais devem ter pelo menos uma especialidade" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-invite] Creating invitation for:", sanitizedEmail);

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabaseAdmin
      .from("user_invitations")
      .select("id")
      .eq("clinic_id", profile.clinic_id)
      .eq("email", sanitizedEmail)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "Já existe um convite pendente para este e-mail" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already exists in this clinic
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users.find(
      u => u.email?.toLowerCase() === sanitizedEmail
    );
    
    if (existingAuthUser) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", existingAuthUser.id)
        .eq("clinic_id", profile.clinic_id)
        .single();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Este usuário já faz parte da clínica" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        clinic_id: profile.clinic_id,
        email: sanitizedEmail,
        full_name: fullName,
        role: role,
        invited_by: user.id,
        permissions: permissions || null,
        // Professional fields
        is_professional: isProfessional || false,
        professional_type: professionalType || null,
        registration_number: registrationNumber || null,
        specialty_ids: specialtyIds || [],
      })
      .select()
      .single();

    if (inviteError) {
      console.error("[send-invite] Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar convite" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-invite] Invitation created:", invitation.id);

    // Generate accept URL
    const baseUrl = req.headers.get("origin") || "https://yesclin.com";
    const acceptUrl = `${baseUrl}/aceitar-convite?token=${invitation.token}`;

    // Send invitation email using shared service and template
    const emailService = getEmailService();
    
    const emailHtml = generateInviteEmail({
      recipientName: fullName,
      inviterName: profile.full_name || "Administrador",
      clinicName: clinic?.name || "Clínica",
      clinicLogoUrl: clinic?.logo_url || undefined,
      role: role,
      roleLabel: getRoleLabel(role),
      acceptUrl: acceptUrl,
      expiresInDays: INVITATION_EXPIRATION_DAYS,
    });

    const emailResult = await emailService.sendWithRetry({
      to: sanitizedEmail,
      subject: `Convite para participar de ${clinic?.name || "clínica"} no YESCLIN`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("[send-invite] Failed to send email:", emailResult.error);
      
      // Mark invitation as failed but don't delete it
      await supabaseAdmin
        .from("user_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);
      
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email. Tente novamente." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-invite] Email sent successfully. ID:", emailResult.messageId);

    // Log the action
    await supabaseAdmin.from("user_audit_logs").insert({
      clinic_id: profile.clinic_id,
      action: "user_invited",
      target_email: email,
      performed_by: user.id,
      details: {
        full_name: fullName,
        role,
        permissions,
        invitation_id: invitation.id,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso",
        invitation_id: invitation.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
