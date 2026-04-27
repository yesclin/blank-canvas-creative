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

// Allowed origins for CORS.
// We accept exact matches AND any Lovable-managed preview/sandbox/published
// host. This prevents the front-end from being blocked when the project is
// renamed, re-previewed under a new id, or accessed from a custom domain.
export const ALLOWED_EXACT_ORIGINS = [
  "https://yesclin.com",
  "https://www.yesclin.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

export const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/i,
  /^https:\/\/[a-z0-9.-]+\.yesclin\.com$/i,
];

export const ALLOWED_REQUEST_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export const ALLOWED_METHODS = "POST, OPTIONS";

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_EXACT_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  // Echo back the caller's origin when it's allowed; otherwise fall back to
  // the canonical production origin so the browser still sees a valid header
  // (the request will simply fail the same-origin check, which is fine).
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_EXACT_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_REQUEST_HEADERS,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Builds the diagnostics payload describing the current CORS configuration
 * and whether the caller's origin is currently accepted. Exposed so tests
 * (and the GET /diagnostics route) can share the exact same logic.
 */
export function buildDiagnosticsPayload(req: Request) {
  const origin = req.headers.get("origin") || "";
  const accepted = isAllowedOrigin(origin);
  return {
    function: "send-invite",
    request: {
      method: req.method,
      origin: origin || null,
      accepted,
    },
    cors: {
      allowed_exact_origins: ALLOWED_EXACT_ORIGINS,
      allowed_origin_patterns: ALLOWED_ORIGIN_PATTERNS.map((re) => re.source),
      allowed_methods: ALLOWED_METHODS,
      allowed_headers: ALLOWED_REQUEST_HEADERS,
      max_age_seconds: 86400,
      vary: "Origin",
    },
    effective_response_headers: getCorsHeaders(req),
    timestamp: new Date().toISOString(),
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
  // When set, reuse the existing invitation (same token) instead of creating
  // a new one. Used by the "Reenviar convite" action.
  invitationId?: string;
}

const INVITATION_EXPIRATION_DAYS = 7;

class EdgeTimeoutError extends Error {
  constructor(message = "Tempo limite atingido") {
    super(message);
    this.name = "EdgeTimeoutError";
  }
}

function withEdgeTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 12000,
  message = "Tempo limite atingido. Tente novamente.",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new EdgeTimeoutError(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  }) as Promise<T>;
}

export const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Public diagnostics endpoint — no auth required.
  // Returns the effective CORS configuration and whether the caller's origin
  // is currently accepted. Useful to debug "Failed to send a request to the
  // Edge Function" errors caused by an unrecognized origin.
  // Accessed via: GET <function-url>/diagnostics OR GET <function-url>?diagnostics=1
  {
    const url = new URL(req.url);
    const isDiagnosticsPath = url.pathname.endsWith("/diagnostics");
    const isDiagnosticsQuery = url.searchParams.has("diagnostics");
    if (req.method === "GET" && (isDiagnosticsPath || isDiagnosticsQuery)) {
      return new Response(JSON.stringify(buildDiagnosticsPayload(req), null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  try {
    console.log("[send-invite] Starting function");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[send-invite] No authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
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
        JSON.stringify({ success: false, error: "Não autenticado" }),
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
        JSON.stringify({ success: false, error: "Clínica não encontrada" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin
      .rpc("is_clinic_admin", { _user_id: user.id, _clinic_id: profile.clinic_id });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores podem convidar usuários" }),
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
        JSON.stringify({ success: false, error: "Erro ao verificar limite de usuários" }),
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
        JSON.stringify({ success: false, error: "Limite de 3 usuários ativos atingido neste plano" }),
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
      invitationId,
    }: InviteRequest = await req.json();

    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "E-mail, nome e perfil são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate professional data if isProfessional is true
    if (isProfessional && (!specialtyIds || specialtyIds.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: "Profissionais devem ter pelo menos uma especialidade" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Formato de email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let invitation: any;

    // ───────────────────────────────────────────────────────────────────
    // RESEND PATH: reuse existing invitation (same token), only refresh
    // the expiration window if it already expired.
    // ───────────────────────────────────────────────────────────────────
    if (invitationId) {
      console.log("[send-invite] Resending existing invitation:", invitationId);

      const { data: existing, error: existingError } = await supabaseAdmin
        .from("user_invitations")
        .select("*")
        .eq("id", invitationId)
        .eq("clinic_id", profile.clinic_id)
        .maybeSingle();

      if (existingError || !existing) {
        return new Response(
          JSON.stringify({ success: false, error: "Convite não encontrado" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (existing.status !== "pending") {
        return new Response(
          JSON.stringify({ success: false, error: "Convite não está mais pendente e não pode ser reenviado" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // If expired, refresh the expiration window so the same token stays valid
      const isExpired =
        existing.expires_at && new Date(existing.expires_at).getTime() < Date.now();

      if (isExpired) {
        const newExpiresAt = new Date(
          Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();
        const { data: refreshed, error: refreshError } = await supabaseAdmin
          .from("user_invitations")
          .update({ expires_at: newExpiresAt })
          .eq("id", invitationId)
          .select()
          .single();
        if (refreshError) {
          console.error("[send-invite] Error refreshing invitation expiry:", refreshError);
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao renovar convite" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        invitation = refreshed;
      } else {
        invitation = existing;
      }
    } else {
      // ─────────────────────────────────────────────────────────────────
      // CREATE PATH: brand-new invitation
      // ─────────────────────────────────────────────────────────────────
      console.log("[send-invite] Creating invitation for:", sanitizedEmail);

      // Check if there's already a pending invitation for this email
      const { data: existingInvite } = await supabaseAdmin
        .from("user_invitations")
        .select("id")
        .eq("clinic_id", profile.clinic_id)
        .eq("email", sanitizedEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Já existe um convite pendente para este e-mail. Use a ação 'Reenviar' no convite existente.",
            existing_invitation_id: existingInvite.id,
          }),
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
          .maybeSingle();

        if (existingProfile) {
          return new Response(
            JSON.stringify({ success: false, error: "Este usuário já faz parte da clínica" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Create invitation record
      const { data: created, error: inviteError } = await supabaseAdmin
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
          JSON.stringify({ success: false, error: "Erro ao criar convite" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      invitation = created;
    }

    console.log("[send-invite] Invitation ready:", invitation.id, "(reused:", !!invitationId, ")");

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

    // Single attempt (no retries) to keep total response time well under
    // the frontend's 15s timeout. If delivery fails the invitation is still
    // created and the admin gets a copyable accept_url back.
    const emailResult = await withEdgeTimeout(
      emailService.send({
        to: sanitizedEmail,
        subject: `Convite para participar de ${clinic?.name || "clínica"} no YESCLIN`,
        html: emailHtml,
      }),
      12000,
      "Tempo limite atingido ao enviar email. Convite criado para envio manual.",
    ).catch((error) => ({
      success: false,
      error: error instanceof Error ? error.message : "Falha desconhecida no provedor de email",
    }));

    if (!emailResult.success) {
      console.error("[send-invite] Failed to send email:", emailResult.error);

      // Per spec: keep the invitation as `pending` so the admin can copy the
      // link manually and share it (the token is still valid for 7 days).
      return new Response(
        JSON.stringify({
          success: true,
          warning: "email_delivery_failed",
          message:
            "Convite criado, mas o envio do email falhou. Copie o link abaixo e compartilhe manualmente.",
          invitation_id: invitation.id,
          accept_url: acceptUrl,
          email_error: emailResult.error || "Falha desconhecida no provedor de email",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const messageId = "messageId" in emailResult ? emailResult.messageId : undefined;
    console.log("[send-invite] Email sent successfully. ID:", messageId);

    // Log the action without letting audit logging delay or fail the invite response.
    withEdgeTimeout(supabaseAdmin.from("user_audit_logs").insert({
      clinic_id: profile.clinic_id,
      action: invitationId ? "user_invitation_resent" : "user_invited",
      target_email: email,
      performed_by: user.id,
      details: {
        full_name: fullName,
        role,
        permissions,
        invitation_id: invitation.id,
        reused_token: !!invitationId,
      },
    }), 3000, "Tempo limite ao registrar auditoria").catch((auditError) => {
      console.error("[send-invite] Audit log failed:", auditError);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: invitationId
          ? "Convite reenviado com sucesso"
          : "Convite enviado com sucesso",
        invitation_id: invitation.id,
        accept_url: acceptUrl,
        reused_token: !!invitationId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[send-invite] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
