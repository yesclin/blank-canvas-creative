import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_ORIGINS = new Set([
  "https://yesclin.com.br",
  "https://www.yesclin.com.br",
  "https://yesclin.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isLovableOrigin = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin);
  return {
    ...sdkCorsHeaders,
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) || isLovableOrigin
      ? origin
      : "https://yesclin.com.br",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(req, { error: "Não autenticado" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[list-clinic-users] Supabase environment is incomplete");
    return json(req, { error: "Serviço temporariamente indisponível" }, 500);
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const requesterId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
    if (claimsError || !requesterId) return json(req, { error: "Sessão inválida" }, 401);

    const { data: requesterProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", requesterId)
      .maybeSingle();
    if (profileError || !requesterProfile?.clinic_id) {
      return json(req, { error: "Clínica do usuário não encontrada" }, 403);
    }

    const clinicId = requesterProfile.clinic_id;
    const { data: requesterRole, error: requesterRoleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (requesterRoleError || !requesterRole || !["owner", "admin"].includes(requesterRole.role)) {
      return json(req, { error: "Sem permissão para visualizar usuários" }, 403);
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, user_id, full_name, email, avatar_url, is_active, created_at, clinic_id")
      .eq("clinic_id", clinicId)
      .order("full_name");
    if (profilesError) throw profilesError;

    const userIds = (profiles ?? []).map((profile) => profile.user_id);
    const { data: roles, error: rolesError } = userIds.length
      ? await adminClient
          .from("user_roles")
          .select("user_id, role, clinic_id")
          .eq("clinic_id", clinicId)
          .in("user_id", userIds)
      : { data: [], error: null };
    if (rolesError) throw rolesError;

    const roleByUserId = new Map((roles ?? []).map((role) => [role.user_id, role.role]));
    const users = await Promise.all((profiles ?? []).map(async (profile) => {
      const { data: authData, error: authUserError } = await adminClient.auth.admin.getUserById(profile.user_id);
      if (authUserError) {
        console.error("[list-clinic-users] Auth lookup failed", {
          profileId: profile.id,
          userId: profile.user_id,
          message: authUserError.message,
        });
      }

      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.full_name ?? "Usuário",
        email: authData?.user?.email ?? profile.email ?? null,
        role: roleByUserId.get(profile.user_id) ?? "profissional",
        status: profile.is_active === false ? "inactive" : "active",
        clinic_id: clinicId,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      };
    }));

    return json(req, { users });
  } catch (error) {
    console.error("[list-clinic-users] Unexpected error", error);
    return json(req, { error: "Erro ao carregar usuários da clínica" }, 500);
  }
});