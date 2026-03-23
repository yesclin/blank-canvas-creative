/**
 * YESCLIN Password Reset Edge Function
 * 
 * Handles password reset requests by:
 * 1. Generating a secure reset token
 * 2. Storing it with expiration
 * 3. Sending a professional email with reset link
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getEmailService, sanitizeEmail, isValidEmail } from "../_shared/email-service.ts";
import { generatePasswordResetEmail } from "../_shared/email-templates.ts";

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

interface PasswordResetRequest {
  email: string;
}

// Token expiration time in minutes
const TOKEN_EXPIRATION_MINUTES = 60;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-password-reset] Starting function");

    // Parse request
    const { email }: PasswordResetRequest = await req.json();

    // Validate email
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
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

    console.log("[send-password-reset] Processing reset for email");

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("[send-password-reset] Error listing users:", listError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Se o email estiver cadastrado, você receberá o link de recuperação." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = existingUsers?.users.find(
      u => u.email?.toLowerCase() === sanitizedEmail
    );

    // If user doesn't exist, add artificial delay to prevent timing-based enumeration
    // then return success (security: don't reveal if email exists)
    if (!user) {
      console.log("[send-password-reset] User not found, returning generic success");
      // Simulate the time it would take to generate link + send email
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Se o email estiver cadastrado, você receberá o link de recuperação." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile for personalization
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, clinic_id, clinics(logo_url)")
      .eq("user_id", user.id)
      .single();

    // Generate password reset link using Supabase Auth
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: sanitizedEmail,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://yesclin.com"}/`,
      }
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error("[send-password-reset] Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar link de recuperação" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email
    const emailService = getEmailService();
    const clinicData = profile?.clinics as { logo_url?: string } | null;
    
    const emailHtml = generatePasswordResetEmail({
      recipientName: profile?.full_name || "",
      clinicName: undefined, // Don't show clinic name for security
      clinicLogoUrl: clinicData?.logo_url || undefined,
      resetUrl: resetData.properties.action_link,
      expiresInMinutes: TOKEN_EXPIRATION_MINUTES,
    });

    const emailResult = await emailService.sendWithRetry({
      to: sanitizedEmail,
      subject: "Redefinição de Senha - YESCLIN",
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("[send-password-reset] Failed to send email:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email. Tente novamente." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-password-reset] Reset email sent successfully");

    // Log the action (without sensitive data)
    if (profile?.clinic_id) {
      try {
        await supabaseAdmin.from("user_audit_logs").insert({
          clinic_id: profile.clinic_id,
          action: "password_reset_requested",
          target_user_id: user.id,
          performed_by: user.id,
          details: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error("[send-password-reset] Failed to log action:", logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Se o email estiver cadastrado, você receberá o link de recuperação." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("[send-password-reset] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
