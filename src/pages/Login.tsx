import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { clearAuthQuarantine, hasRecentAuthQuarantine, rememberAuthenticatedUser } from "@/lib/authSessionIsolation";
import { useQueryClient } from "@tanstack/react-query";
import { clearReactQueryCache } from "@/lib/queryClientDiagnostics";
import { withTimeout } from "@/lib/asyncTimeout";

type AuthErrorLike = { message?: unknown; code?: unknown; status?: unknown; name?: unknown; cause?: unknown; stack?: unknown };
type QueryResult<T> = { data: T | null; error: unknown };
type AuthUserLike = { id: string; email?: string | null };
type AuthSessionLike = { user?: AuthUserLike | null } | null;
type AuthSignInResult = { data: { session: AuthSessionLike; user: AuthUserLike | null }; error: unknown };
type ProfileRow = { clinic_id: string | null; user_id: string | null; full_name: string | null; is_active: boolean | null };
type ClinicRow = { id: string; name: string | null };
type RoleRow = { role: string; clinic_id: string | null; user_id: string | null };
type AuthFailureKind = "NONE" | "ENV_MISSING" | "NETWORK_ERROR" | "CORS_ERROR" | "AUTH_ERROR" | "POST_LOGIN_ERROR";
type SupabaseHealthDiagnostic = {
  kind: AuthFailureKind;
  ok: boolean;
  message: string;
  status?: number;
};
type DevAuthDiagnosticState = {
  supabaseUrlPresent: boolean;
  anonKeyPresent: boolean;
  publishableKeyPresent: boolean;
  currentHost: string;
  projectRef: string;
  keyRef: string;
  refMatch: boolean | null;
  getSessionResult: string;
  healthResult: string;
  lastFailureKind: AuthFailureKind;
  lastFailureMessage: string;
};

function errorField(error: unknown, field: keyof AuthErrorLike): unknown {
  return typeof error === "object" && error !== null ? (error as AuthErrorLike)[field] : undefined;
}

const LOGIN_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const LOGIN_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const LOGIN_SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
const LOGIN_SUPABASE_AUTH_KEY = LOGIN_SUPABASE_ANON_KEY || LOGIN_SUPABASE_PUBLISHABLE_KEY;

function getProjectRefFromUrl(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

function decodeJwtRef(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(window.atob(normalized));
    return typeof json?.ref === "string" ? json.ref : "";
  } catch {
    return "";
  }
}

const LOGIN_SUPABASE_PROJECT_REF = getProjectRefFromUrl(LOGIN_SUPABASE_URL);

function buildDevAuthDiagnosticState(overrides: Partial<DevAuthDiagnosticState> = {}): DevAuthDiagnosticState {
  const keyRef = typeof window === "undefined" || !LOGIN_SUPABASE_AUTH_KEY ? "" : decodeJwtRef(LOGIN_SUPABASE_AUTH_KEY);
  const refMatch = LOGIN_SUPABASE_PROJECT_REF && keyRef ? LOGIN_SUPABASE_PROJECT_REF === keyRef : null;
  return {
    supabaseUrlPresent: Boolean(LOGIN_SUPABASE_URL),
    anonKeyPresent: Boolean(LOGIN_SUPABASE_ANON_KEY),
    publishableKeyPresent: Boolean(LOGIN_SUPABASE_PUBLISHABLE_KEY),
    currentHost: typeof window === "undefined" ? "server" : window.location.origin,
    projectRef: LOGIN_SUPABASE_PROJECT_REF || "não identificado",
    keyRef: keyRef || "não identificado",
    refMatch,
    getSessionResult: "não testado",
    healthResult: "não testado",
    lastFailureKind: "NONE",
    lastFailureMessage: "",
    ...overrides,
  };
}

function hasSupabaseEnvProblem(): string | null {
  if (!LOGIN_SUPABASE_URL) return "VITE_SUPABASE_URL ausente.";
  if (!LOGIN_SUPABASE_AUTH_KEY) return "VITE_SUPABASE_ANON_KEY ausente.";
  const keyRef = typeof window === "undefined" ? "" : decodeJwtRef(LOGIN_SUPABASE_AUTH_KEY);
  if (LOGIN_SUPABASE_PROJECT_REF && keyRef && LOGIN_SUPABASE_PROJECT_REF !== keyRef) {
    return `Anon key pertence ao projeto ${keyRef}, mas a URL aponta para ${LOGIN_SUPABASE_PROJECT_REF}.`;
  }
  return null;
}

const HEALTH_TIMEOUT_MS = 15000;
const SIGN_IN_TIMEOUT_MS = 30000;

async function fetchSupabaseAuthHealth(): Promise<SupabaseHealthDiagnostic> {
  const envProblem = hasSupabaseEnvProblem();
  if (envProblem) return { kind: "ENV_MISSING", ok: false, message: envProblem };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const healthUrl = `${LOGIN_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`;
  const startedAt = performance.now();
  try {
    // IMPORTANTE: GoTrue health aceita apenas o header `apikey`. Mandar
    // `Authorization: Bearer <anon>` junto faz alguns deploys responderem
    // 401 "No API key found" ou travarem. Mantemos somente `apikey`.
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: { apikey: LOGIN_SUPABASE_AUTH_KEY },
      signal: controller.signal,
      cache: "no-store",
    });
    const elapsed = Math.round(performance.now() - startedAt);
    const body = await response.text().catch(() => "");
    const suffix = body ? ` — ${body.slice(0, 160)}` : "";
    console.info("[AUTH_HEALTH] response", { status: response.status, elapsedMs: elapsed, ok: response.ok });
    return {
      kind: response.ok ? "NONE" : response.status === 401 ? "AUTH_ERROR" : "NETWORK_ERROR",
      ok: response.ok,
      status: response.status,
      message: `HTTP ${response.status} em ${elapsed}ms${suffix}`,
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - startedAt);
    const message = String(errorField(error, "message") || error);
    const name = String(errorField(error, "name") || "");
    console.error("[AUTH_HEALTH] falhou", { name, message, elapsedMs: elapsed });
    if (name === "AbortError") {
      return { kind: "NETWORK_ERROR", ok: false, message: `timeout: Supabase Auth não respondeu em ${HEALTH_TIMEOUT_MS / 1000}s` };
    }
    if (/cors|cross-origin|access-control/i.test(message)) {
      return { kind: "CORS_ERROR", ok: false, message: `CORS_ERROR: ${message}` };
    }
    return { kind: "NETWORK_ERROR", ok: false, message: `NETWORK_ERROR: ${message || "sem resposta do Supabase"}` };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Decide para onde mandar o usuário autenticado.
 *
 * Super Admins (tabela platform_admins) entram no painel da plataforma.
 * Demais usuários vão para /app. Falha de rede no RPC NÃO trava o login —
 * caímos para /app por padrão.
 */
async function resolveRedirectPath(userId: string, fallback: string): Promise<string> {
  try {
    const { data } = await withTimeout<QueryResult<boolean>>(
      supabase.rpc("is_platform_admin", { _user_id: userId }) as PromiseLike<QueryResult<boolean>>,
      2500,
      "Tempo esgotado ao verificar painel administrativo.",
    );
    if (data === true) return "/super-admin";
  } catch (err) {
    console.warn("[AUTH] is_platform_admin falhou — usando destino padrão", err);
  }
  return fallback || "/app";
}

type DiagnosticStepKey = "auth" | "profile" | "clinic" | "role" | "redirect";
type DiagnosticStatus = "idle" | "pending" | "success" | "fail" | "warning";
type DiagnosticState = Record<DiagnosticStepKey, { status: DiagnosticStatus; message: string }>;

const createDiagnosticState = (): DiagnosticState => ({
  auth: { status: "idle", message: "Aguardando login" },
  profile: { status: "idle", message: "Aguardando autenticação" },
  clinic: { status: "idle", message: "Aguardando perfil" },
  role: { status: "idle", message: "Aguardando clínica" },
  redirect: { status: "idle", message: "Aguardando validações" },
});

const POST_AUTH_QUERY_TIMEOUT_MS = 6000;

function getAuthErrorMessage(error: unknown): string {
  const message = errorField(error, "message");
  const rawMsg = typeof message === "string" && message !== "{}" ? message : "";
  const code = String(errorField(error, "code") || "").toLowerCase();
  const status = Number(errorField(error, "status") ?? 0);
  const name = String(errorField(error, "name") || "");
  const msgLower = rawMsg.toLowerCase();

  if (
    code === "invalid_credentials" ||
    msgLower.includes("invalid login credentials") ||
    msgLower.includes("invalid_grant") ||
    msgLower.includes("unauthorized") ||
    status === 400 ||
    status === 401
  ) {
    return "Email ou senha inválidos.";
  }
  if (code === "user_not_found" || msgLower.includes("user not found")) {
    return "Usuário não encontrado.";
  }
  if (
    code === "email_not_confirmed" ||
    msgLower.includes("email not confirmed") ||
    msgLower.includes("email_change_requires_confirmation")
  ) {
    return "Email não confirmado. Verifique sua caixa de entrada.";
  }
  if (
    msgLower.includes("blocked") ||
    msgLower.includes("disabled") ||
    msgLower.includes("banned") ||
    msgLower.includes("inactive")
  ) {
    return "Conta bloqueada ou inativa. Contate o administrador.";
  }
  if (
    name === "AuthRetryableFetchError" ||
    name === "TimeoutError" ||
    status === 0 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msgLower.includes("failed to fetch") ||
    msgLower.includes("network") ||
    msgLower.includes("timeout") ||
    msgLower.includes("upstream")
  ) {
    return "Não foi possível conectar ao servidor. Verifique internet ou configuração do Supabase.";
  }
  return rawMsg || "Auth: erro inesperado ao entrar. Tente novamente.";
}

function classifyAuthFailure(error: unknown, health?: SupabaseHealthDiagnostic): AuthFailureKind {
  const envProblem = hasSupabaseEnvProblem();
  if (envProblem) return "ENV_MISSING";
  const name = String(errorField(error, "name") || "");
  const status = Number(errorField(error, "status") ?? 0);
  const msg = String(errorField(error, "message") || "").toLowerCase();
  if (health && !health.ok && health.kind !== "NONE") return health.kind;
  if (name === "AuthRetryableFetchError" || name === "TimeoutError" || status === 0 || status === 502 || status === 503 || status === 504) return "NETWORK_ERROR";
  if (/failed to fetch|network|timeout|upstream|abort/i.test(msg)) return "NETWORK_ERROR";
  if (/cors|cross-origin|access-control/i.test(msg)) return "CORS_ERROR";
  return "AUTH_ERROR";
}

function getQueryErrorMessage(error: unknown, fallback: string): string {
  const message = errorField(error, "message");
  const rawMsg = typeof message === "string" && message !== "{}" ? message : "";
  return rawMsg || fallback;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticState>(() => createDiagnosticState());
  const [devAuthDiagnostic, setDevAuthDiagnostic] = useState<DevAuthDiagnosticState>(() => buildDevAuthDiagnosticState());
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigatedRef = useRef(false);
  const loginInFlightRef = useRef(false);
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const updateDiagnostic = (key: DiagnosticStepKey, status: DiagnosticStatus, message: string) => {
    if (!import.meta.env.DEV) return;
    setDiagnostics((current) => ({ ...current, [key]: { status, message } }));
  };

  const runDevAuthDiagnostics = async (source: string) => {
    const base = buildDevAuthDiagnosticState({ getSessionResult: "testando...", healthResult: "testando..." });
    if (import.meta.env.DEV) {
      setDevAuthDiagnostic(base);
      console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("HAS_ANON_KEY:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log("HAS_PUBLISHABLE_KEY:", !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      console.log("CURRENT_HOST:", window.location.origin);
      console.log("SUPABASE_PROJECT_REF:", base.projectRef);
      console.log("SUPABASE_KEY_REF:", base.keyRef);
    }

    let getSessionResult = "não executado";
    try {
      const sessionCheck = await withTimeout(
        supabase.auth.getSession() as PromiseLike<{ data?: { session?: AuthSessionLike }; error?: unknown }>,
        5000,
        "Auth: tempo esgotado ao testar getSession antes do login.",
      );
      if (sessionCheck.error) throw sessionCheck.error;
      getSessionResult = `OK — sessão: ${sessionCheck.data?.session ? "sim" : "não"}`;
      console.log("Supabase getSession diagnostic:", {
        source,
        hasSession: !!sessionCheck.data?.session,
        userId: sessionCheck.data?.session?.user?.id ?? null,
      });
    } catch (sessionError) {
      getSessionResult = `FALHA — ${String(errorField(sessionError, "message") || sessionError)}`;
      console.error("Supabase getSession diagnostic failed:", {
        source,
        message: errorField(sessionError, "message"),
        name: errorField(sessionError, "name"),
        status: errorField(sessionError, "status"),
        cause: errorField(sessionError, "cause"),
        stack: errorField(sessionError, "stack"),
      });
    }

    const health = await fetchSupabaseAuthHealth();
    const healthResult = `${health.ok ? "OK" : "FALHA"} — ${health.message}`;
    console.log("Supabase auth health diagnostic:", { source, ...health });
    const next = buildDevAuthDiagnosticState({
      getSessionResult,
      healthResult,
      lastFailureKind: health.ok ? "NONE" : health.kind,
      lastFailureMessage: health.ok ? "" : health.message,
    });
    if (import.meta.env.DEV) setDevAuthDiagnostic(next);
    return { state: next, health };
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    void runDevAuthDiagnostics("login-mount");
    // Diagnóstico temporário de desenvolvimento: roda uma vez ao abrir /login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Se o usuário já estiver autenticado ao montar /login (ou se o evento
   * SIGNED_IN chegar depois do remount provocado pelo `AuthScopedProviders`),
   * redireciona automaticamente para o destino correto. Esse efeito é o
   * caminho oficial de navegação pós-login — sobrevive ao remount do
   * ProviderShell que acontece quando a `scopeKey` muda.
   */
  useEffect(() => {
    let mounted = true;

    const goTo = async (userId: string, source: string) => {
      if (hasRecentAuthQuarantine()) {
        if (import.meta.env.DEV) console.warn("[AUTH] redirect ignorado: sessão em quarentena", { source, userId });
        return;
      }
      if (loginInFlightRef.current) {
        if (import.meta.env.DEV) console.log("[AUTH] redirect aguardando validação pós-login", { source, userId });
        return;
      }
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const dest = await resolveRedirectPath(userId, fromPath || "/app/dashboard");
      if (!mounted) return;
      if (import.meta.env.DEV) {
        console.log("[AUTH] Login redirect", { source, dest, userId });
      }
      updateDiagnostic("redirect", "success", dest);
      navigate(dest, { replace: true });
    };

    // 1) Sessão já existente ao abrir /login
    supabase.auth.getSession().then(({ data }: { data?: { session?: AuthSessionLike } }) => {
      const uid = data?.session?.user?.id;
      if (uid && mounted) void goTo(uid, "getSession");
    });

    // 2) Evento posterior (SIGNED_IN, INITIAL_SESSION com sessão)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.id) {
        void goTo(session.user.id, event);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, fromPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    loginInFlightRef.current = true;
    setDiagnostics(createDiagnosticState());
    // Apenas limpa a quarentena anterior — NÃO apagamos sessão/binding antes
    // de tentar autenticar: se a chamada falhar por rede/timeout/CORS, o
    // usuário não deve perder a sessão atual.
    clearAuthQuarantine();
    updateDiagnostic("auth", "pending", "Autenticando no Supabase");

    const preflight = await runDevAuthDiagnostics("handleLogin");
    const envProblem = hasSupabaseEnvProblem();
    if (envProblem) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      updateDiagnostic("auth", "fail", `ENV_MISSING: ${envProblem}`);
      setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: "ENV_MISSING", lastFailureMessage: envProblem }));
      console.error("[AUTH] login bloqueado por ENV_MISSING", { message: envProblem });
      toast({ title: "Configuração Supabase ausente", description: envProblem, variant: "destructive" });
      return;
    }

    let data: AuthSignInResult["data"] | null = null;
    let error: unknown = null;
    try {
      const signInStartedAt = performance.now();
      const res = await withTimeout<AuthSignInResult>(
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        }) as PromiseLike<AuthSignInResult>,
        SIGN_IN_TIMEOUT_MS,
        `Auth: tempo esgotado ao autenticar no Supabase (${SIGN_IN_TIMEOUT_MS / 1000}s).`,
      );
      console.info("[AUTH] signInWithPassword respondeu", { elapsedMs: Math.round(performance.now() - signInStartedAt), hasSession: !!res.data?.session, hasError: !!res.error });
      data = res.data;
      error = res.error;
    } catch (thrown) {
      error = thrown;
    }

    if (error) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      const name = String(errorField(error, "name") || "");
      const status = Number(errorField(error, "status") ?? 0);
      const msg = String(errorField(error, "message") || "");
      const failureKind = classifyAuthFailure(error, preflight.health);
      console.error("Supabase connection diagnostic:", {
        failureKind,
        message: errorField(error, "message"),
        name: errorField(error, "name"),
        status: errorField(error, "status"),
        cause: errorField(error, "cause"),
        stack: errorField(error, "stack"),
      });
      console.error("[AUTH] login falhou", {
        kind: failureKind,
        name, status, message: msg,
        health: preflight.health,
      });
      const baseDescription = getAuthErrorMessage(error);
      const technicalDescription =
        failureKind !== "AUTH_ERROR" && preflight.health.kind !== "NONE"
          ? `${failureKind}: ${preflight.health.message}`
          : `${failureKind}: ${baseDescription}`;
      updateDiagnostic("auth", "fail", technicalDescription);
      setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: failureKind, lastFailureMessage: technicalDescription }));

      toast({
        title: "Erro ao entrar",
        description: technicalDescription,
        variant: "destructive",
      });
      return;
    }

    if (!data?.session || !data?.user) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      toast({
        title: "Não foi possível iniciar a sessão",
        description: "Auth: sessão não retornada pelo Supabase. Tente novamente.",
        variant: "destructive",
      });
      updateDiagnostic("auth", "fail", "Auth: sessão não retornada pelo Supabase");
      return;
    }

    if (import.meta.env.DEV) {
      console.log("AUTH USER:", data.user);
      console.log("AUTH SESSION:", data.session);
    }
    updateDiagnostic("auth", "success", `Auth OK: ${data.user.email ?? data.user.id}`);

    rememberAuthenticatedUser(data.user.id);
    try { clearReactQueryCache(queryClient, "login-after-auth", { userId: data.user.id }); } catch { /* ignore */ }

    updateDiagnostic("profile", "pending", "Buscando profile por auth.uid");
    const { data: profile, error: profileError } = await withTimeout<QueryResult<ProfileRow>>(
      supabase
        .from("profiles")
        .select("clinic_id, user_id, full_name, is_active")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle() as PromiseLike<QueryResult<ProfileRow>>,
      POST_AUTH_QUERY_TIMEOUT_MS,
      "Profile: tempo esgotado ao consultar perfil; seguindo com sessão autenticada.",
    ).catch((error: unknown): QueryResult<ProfileRow> => ({ data: null, error }));
    if (import.meta.env.DEV) console.log("PROFILE:", profile);

    if (profileError) {
      const msg = getQueryErrorMessage(profileError, "Profile: falha ao consultar perfil; seguindo com sessão autenticada.");
      console.warn("[AUTH] PROFILE query failed", profileError);
      updateDiagnostic("profile", "warning", msg);
    } else if (!profile || profile.user_id !== data.user.id) {
      const description = "Conta encontrada, mas sem perfil vinculado. Contate o administrador.";
      updateDiagnostic("profile", "warning", `POST_LOGIN_ERROR: ${description}`);
      setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: "POST_LOGIN_ERROR", lastFailureMessage: description }));
      toast({ title: "Cadastro incompleto", description, variant: "destructive" });
      try { clearReactQueryCache(queryClient, "login-no-profile", { userId: data.user.id }); } catch { /* ignore */ }
    } else if (profile.is_active === false) {
      const description = "Conta bloqueada ou inativa. Contate o administrador.";
      updateDiagnostic("profile", "warning", `POST_LOGIN_ERROR: ${description}`);
      setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: "POST_LOGIN_ERROR", lastFailureMessage: description }));
      toast({ title: "Acesso bloqueado", description, variant: "destructive" });
      try { clearReactQueryCache(queryClient, "login-inactive-profile", { userId: data.user.id }); } catch { /* ignore */ }
    } else {
      updateDiagnostic("profile", "success", `Profile OK: ${profile.full_name ?? data.user.email ?? data.user.id}`);
    }

    const clinicId = profile?.clinic_id ?? null;
    updateDiagnostic("clinic", "pending", "Buscando clínica vinculada");
    if (!clinicId && !profileError) {
      const description = "Conta encontrada, mas sem clínica vinculada. Contate o administrador.";
      updateDiagnostic("clinic", "warning", `POST_LOGIN_ERROR: ${description}`);
      setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: "POST_LOGIN_ERROR", lastFailureMessage: description }));
      toast({ title: "Clínica não vinculada", description, variant: "destructive" });
      try { clearReactQueryCache(queryClient, "login-no-clinic", { userId: data.user.id }); } catch { /* ignore */ }
    }

    let roles: RoleRow[] | null = null;
    if (clinicId) {
      const { data: clinic, error: clinicError } = await withTimeout<QueryResult<ClinicRow>>(
        supabase
          .from("clinics")
          .select("id, name")
          .eq("id", clinicId)
          .limit(1)
          .maybeSingle() as PromiseLike<QueryResult<ClinicRow>>,
        POST_AUTH_QUERY_TIMEOUT_MS,
        "Clinic: tempo esgotado ao consultar clínica; seguindo com sessão autenticada.",
      ).catch((error: unknown): QueryResult<ClinicRow> => ({ data: null, error }));
      if (import.meta.env.DEV) console.log("CLINIC:", clinic);
      if (clinicError) {
        const msg = getQueryErrorMessage(clinicError, "Clinic: falha ao consultar clínica; seguindo com sessão autenticada.");
        console.warn("[AUTH] CLINIC query failed", clinicError);
        updateDiagnostic("clinic", "warning", msg);
      } else if (!clinic) {
        const description = "Conta encontrada, mas sem clínica vinculada. Contate o administrador.";
        updateDiagnostic("clinic", "warning", `POST_LOGIN_ERROR: ${description}`);
        setDevAuthDiagnostic((current) => ({ ...current, lastFailureKind: "POST_LOGIN_ERROR", lastFailureMessage: description }));
        toast({ title: "Clínica não encontrada", description, variant: "destructive" });
        try { clearReactQueryCache(queryClient, "login-clinic-not-found", { userId: data.user.id, clinicId }); } catch { /* ignore */ }
      } else {
        updateDiagnostic("clinic", "success", `Clinic OK: ${clinic.name ?? clinic.id}`);
      }

      updateDiagnostic("role", "pending", "Buscando papéis do usuário");
      const { data: rolesData, error: rolesError } = await withTimeout<QueryResult<RoleRow[]>>(
        supabase
          .from("user_roles")
          .select("role, clinic_id, user_id")
          .eq("user_id", data.user.id)
          .eq("clinic_id", clinicId) as PromiseLike<QueryResult<RoleRow[]>>,
        POST_AUTH_QUERY_TIMEOUT_MS,
        "Role: tempo esgotado ao consultar permissões; seguindo com sessão autenticada.",
      ).catch((error: unknown): QueryResult<RoleRow[]> => ({ data: null, error }));
      roles = rolesData ?? null;
      if (import.meta.env.DEV) console.log("ROLES:", roles);
      if (rolesError) {
        const msg = getQueryErrorMessage(rolesError, "Role: falha ao consultar permissões; seguindo com sessão autenticada.");
        console.warn("[AUTH] ROLES query failed", rolesError);
        updateDiagnostic("role", "warning", msg);
      } else if (!rolesData?.length) {
        updateDiagnostic("role", "warning", "Role não encontrada; o app abrirá e mostrará o bloqueio de permissões se necessário.");
      } else {
        updateDiagnostic("role", "success", rolesData.map((item) => item.role).join(", "));
      }
    } else if (profileError) {
      updateDiagnostic("clinic", "warning", "Clinic não validada porque a consulta de profile falhou.");
      updateDiagnostic("role", "warning", "Role não validada porque a consulta de profile falhou.");
    }

    // Aguarda a sessão estar persistida no storage antes de navegar
    // (evita race com o RequireAuth no destino).
    try {
      for (let i = 0; i < 10; i += 1) {
        const { data: sessionData } = await withTimeout<{ data?: { session?: AuthSessionLike } }>(
          supabase.auth.getSession() as PromiseLike<{ data?: { session?: AuthSessionLike } }>,
          1000,
          "Tempo esgotado ao confirmar sessão local.",
        );
        if (sessionData?.session) break;
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (waitError) {
      console.error("[AUTH] erro aguardando sessão", waitError);
    }

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso.",
    });

    // Navegação determinística — não depende exclusivamente do listener.
    // Se o ProviderShell remontar por causa da mudança de `scopeKey`, o
    // useEffect acima cobre a navegação no novo mount.
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      updateDiagnostic("redirect", "pending", "Redirecionando para o app");
      const dest = await resolveRedirectPath(data.user.id, fromPath || "/app/dashboard");
      updateDiagnostic("redirect", "success", dest);
      loginInFlightRef.current = false;
      navigate(dest, { replace: true });
    }

    loginInFlightRef.current = false;
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>

          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="flex items-center mb-6">
              <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Acesse sua conta
            </h1>
            <p className="text-muted-foreground">
              Entre para gerenciar sua clínica
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/recuperar-senha"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-5 rounded-lg border border-border bg-card p-4 text-xs text-card-foreground shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold">Diagnóstico Auth DEV</p>
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {devAuthDiagnostic.lastFailureKind}
                </span>
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">SUPABASE_URL presente</dt>
                <dd className="font-mono">{devAuthDiagnostic.supabaseUrlPresent ? "sim" : "não"}</dd>
                <dt className="text-muted-foreground">ANON_KEY presente</dt>
                <dd className="font-mono">{devAuthDiagnostic.anonKeyPresent ? "sim" : "não"}</dd>
                <dt className="text-muted-foreground">Host atual</dt>
                <dd className="max-w-48 truncate text-right font-mono" title={devAuthDiagnostic.currentHost}>{devAuthDiagnostic.currentHost}</dd>
                <dt className="text-muted-foreground">URL ref / Key ref</dt>
                <dd className="font-mono">{devAuthDiagnostic.projectRef} / {devAuthDiagnostic.keyRef}</dd>
                <dt className="text-muted-foreground">Mesmo projeto</dt>
                <dd className="font-mono">{devAuthDiagnostic.refMatch === null ? "n/a" : devAuthDiagnostic.refMatch ? "sim" : "não"}</dd>
              </dl>
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p><span className="text-muted-foreground">getSession:</span> <span className="font-mono">{devAuthDiagnostic.getSessionResult}</span></p>
                <p><span className="text-muted-foreground">auth/v1/health:</span> <span className="font-mono">{devAuthDiagnostic.healthResult}</span></p>
                {devAuthDiagnostic.lastFailureMessage && (
                  <p><span className="text-muted-foreground">Falha:</span> <span className="font-mono">{devAuthDiagnostic.lastFailureMessage}</span></p>
                )}
              </div>
              <div className="mt-3 space-y-1 border-t border-border pt-3">
                {Object.entries(diagnostics).map(([step, item]) => (
                  <p key={step} className="flex gap-2">
                    <span className="min-w-14 font-mono text-muted-foreground">{step}</span>
                    <span className="font-mono">{item.status}</span>
                    <span className="truncate">{item.message}</span>
                  </p>
                ))}
              </div>
            </div>
          )}


          {/* Signup Link */}
          <p className="mt-6 text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/criar-conta" className="text-primary font-medium hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6">
            <img src={logoIcon} alt="Yesclin" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Gestão simplificada
          </h2>
          <p className="text-white/80 max-w-md">
            Agenda, prontuário, financeiro e muito mais. Tudo em um só lugar para sua clínica.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
