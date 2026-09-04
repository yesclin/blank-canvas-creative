import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prepareTabForNewLogin, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { clearAuthQuarantine, clearAuthenticatedTab, clearSupabaseAuthStorage, hasRecentAuthQuarantine, rememberAuthenticatedUser, setTabExpectedUserId } from "@/lib/authSessionIsolation";
import { useQueryClient } from "@tanstack/react-query";
import { hardClearReactQueryCache } from "@/lib/queryClientDiagnostics";
import { withTimeout } from "@/lib/asyncTimeout";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { prefetchEssentialClinicData } from "@/lib/postLoginPrefetch";

type AuthErrorLike = { message?: unknown; code?: unknown; status?: unknown; name?: unknown; cause?: unknown; stack?: unknown };
type QueryResult<T> = { data: T | null; error: unknown };
type AuthUserLike = { id: string; email?: string | null };
type AuthSessionLike = { user?: AuthUserLike | null } | null;
type AuthSignInResult = { data: { session: AuthSessionLike; user: AuthUserLike | null }; error: unknown };
type AuthFailureKind = "NONE" | "ENV_MISSING" | "NETWORK_ERROR" | "CORS_ERROR" | "AUTH_ERROR" | "POST_LOGIN_ERROR";
type LoginProfile = { id: string; user_id: string; clinic_id: string | null; full_name: string | null; email: string | null; avatar_url: string | null; is_active: boolean | null };
type LoginRole = "owner" | "admin" | "profissional" | "recepcionista";
type LoginClinic = { id: string; name: string | null };
type PostLoginContext = {
  user: AuthUserLike;
  session: AuthSessionLike;
  profile: LoginProfile | null;
  clinic: LoginClinic | null;
  role: LoginRole | "platform-admin" | null;
  permissionsCount: number;
  isPlatformAdmin: boolean;
};

function errorField(error: unknown, field: keyof AuthErrorLike): unknown {
  return typeof error === "object" && error !== null ? (error as AuthErrorLike)[field] : undefined;
}

const LOGIN_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const LOGIN_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const LOGIN_SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
const LOGIN_SUPABASE_AUTH_KEY = LOGIN_SUPABASE_ANON_KEY || LOGIN_SUPABASE_PUBLISHABLE_KEY;

function isLocalDevelopmentHost(): boolean {
  if (import.meta.env.DEV !== true || typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

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

function hasSupabaseEnvProblem(): string | null {
  if (!LOGIN_SUPABASE_URL) return "VITE_SUPABASE_URL ausente.";
  if (!LOGIN_SUPABASE_AUTH_KEY) return "VITE_SUPABASE_ANON_KEY ausente.";
  const keyRef = typeof window === "undefined" ? "" : decodeJwtRef(LOGIN_SUPABASE_AUTH_KEY);
  if (LOGIN_SUPABASE_PROJECT_REF && keyRef && LOGIN_SUPABASE_PROJECT_REF !== keyRef) {
    return `Anon key pertence ao projeto ${keyRef}, mas a URL aponta para ${LOGIN_SUPABASE_PROJECT_REF}.`;
  }
  return null;
}

async function loadPostLoginContext(expectedUserId: string): Promise<PostLoginContext> {
  const { data: sessionData, error: sessionError } = await withTimeout<any>(
    supabase.auth.getSession(),
    10000,
    "Tempo esgotado ao confirmar sessão.",
  );
  if (sessionError || !sessionData?.session?.user?.id) {
    throw sessionError || new Error("Sessão não encontrada após autenticação.");
  }
  const sessionUserId = sessionData.session.user.id;
  if (sessionUserId !== expectedUserId) {
    throw new Error("Sessão retornada pertence a outro usuário. Login bloqueado por segurança.");
  }

  const { data: userData, error: userError } = await withTimeout<any>(
    supabase.auth.getUser(),
    10000,
    "Tempo esgotado ao validar usuário autenticado.",
  );
  if (userError || !userData?.user?.id) {
    throw userError || new Error("Não foi possível validar o usuário autenticado.");
  }
  if (userData.user.id !== expectedUserId) {
    throw new Error("auth.uid() retornou outro usuário. Login bloqueado por segurança.");
  }

  const isPlatformAdmin = await withTimeout<boolean>(
    checkPlatformAdmin(expectedUserId),
    2500,
    "Tempo esgotado ao verificar painel administrativo.",
  ).catch(() => false);
  if (isPlatformAdmin === true) {
    return {
      user: userData.user,
      session: sessionData.session,
      profile: null,
      clinic: null,
      role: "platform-admin",
      permissionsCount: 0,
      isPlatformAdmin: true,
    };
  }

  const { data: profile, error: profileError } = await withTimeout<QueryResult<LoginProfile>>(
    supabase
      .from("profiles")
      .select("id, user_id, clinic_id, full_name, email, avatar_url, is_active")
      .eq("user_id", expectedUserId)
      .limit(1)
      .maybeSingle() as PromiseLike<QueryResult<LoginProfile>>,
    10000,
    "Tempo esgotado ao carregar perfil.",
  );
  if (profileError) throw profileError;
  if (!profile) throw new Error("Login realizado, mas seu perfil ainda não existe. Contate o administrador da clínica.");
  if (profile.user_id !== expectedUserId) throw new Error("Perfil retornado pertence a outro usuário. Login bloqueado por segurança.");
  if (profile.is_active === false) throw new Error("Sua conta está desativada. Contate o administrador da clínica.");
  if (!profile.clinic_id) throw new Error("Login realizado, mas seu perfil não está vinculado a uma clínica.");

  const { data: clinic, error: clinicError } = await withTimeout<QueryResult<LoginClinic>>(
    supabase
      .from("clinics")
      .select("id, name")
      .eq("id", profile.clinic_id)
      .limit(1)
      .maybeSingle() as PromiseLike<QueryResult<LoginClinic>>,
    10000,
    "Tempo esgotado ao carregar clínica.",
  );
  if (clinicError) throw clinicError;
  if (!clinic?.id) throw new Error("Login realizado, mas não foi possível carregar a clínica vinculada ao seu perfil.");

  const { data: roleData, error: roleError } = await withTimeout<QueryResult<{ role: LoginRole; user_id: string; clinic_id: string }>>(
    supabase
      .from("user_roles")
      .select("role, user_id, clinic_id")
      .eq("user_id", expectedUserId)
      .eq("clinic_id", profile.clinic_id)
      .limit(1)
      .maybeSingle() as PromiseLike<QueryResult<{ role: LoginRole; user_id: string; clinic_id: string }>>,
    10000,
    "Tempo esgotado ao carregar perfil de acesso.",
  );
  if (roleError) throw roleError;
  if (!roleData?.role) throw new Error("Login realizado, mas seu perfil de acesso não está configurado nesta clínica.");
  if (roleData.user_id !== expectedUserId || roleData.clinic_id !== profile.clinic_id) {
    throw new Error("Permissão retornada pertence a outro usuário ou clínica. Login bloqueado por segurança.");
  }

  const { data: permissionsData, error: permissionsError } = await withTimeout<QueryResult<unknown[]>>(
    supabase.rpc("get_user_all_permissions", { _user_id: expectedUserId, _clinic_id: profile.clinic_id }) as PromiseLike<QueryResult<unknown[]>>,
    10000,
    "Tempo esgotado ao carregar permissões.",
  );
  if (permissionsError) throw permissionsError;

  return {
    user: userData.user,
    session: sessionData.session,
    profile,
    clinic,
    role: roleData.role,
    permissionsCount: Array.isArray(permissionsData) ? permissionsData.length : 0,
    isPlatformAdmin: false,
  };
}

type DiagnosticStepKey = "auth" | "profile" | "clinic" | "role" | "redirect";
type DiagnosticStatus = "idle" | "pending" | "success" | "fail" | "warning";

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
    return "Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.";
  }
  return rawMsg || "Auth: erro inesperado ao entrar. Tente novamente.";
}

function classifyAuthFailure(error: unknown): AuthFailureKind {
  const envProblem = hasSupabaseEnvProblem();
  if (envProblem) return "ENV_MISSING";
  const name = String(errorField(error, "name") || "");
  const status = Number(errorField(error, "status") ?? 0);
  const msg = String(errorField(error, "message") || "").toLowerCase();
  if (name === "AuthRetryableFetchError" || name === "TimeoutError" || status === 0 || status === 502 || status === 503 || status === 504) return "NETWORK_ERROR";
  if (/failed to fetch|network|timeout|upstream|abort/i.test(msg)) return "NETWORK_ERROR";
  if (/cors|cross-origin|access-control/i.test(msg)) return "CORS_ERROR";
  return "AUTH_ERROR";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId: currentAuthUserId, isLoading: authIdentityLoading } = useAuthIdentity();
  const navigatedRef = useRef(false);
  const loginInFlightRef = useRef(false);

  const updateDiagnostic = (key: DiagnosticStepKey, status: DiagnosticStatus, message: string) => {
    if (isLocalDevelopmentHost()) console.debug("[AUTH_DIAGNOSTIC]", { key, status, message });
  };

  useEffect(() => {
    if (!isLocalDevelopmentHost()) return;
    const keyRef = LOGIN_SUPABASE_AUTH_KEY ? decodeJwtRef(LOGIN_SUPABASE_AUTH_KEY) : "";
    console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("HAS_ANON_KEY:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log("HAS_PUBLISHABLE_KEY:", !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    console.log("SUPABASE_PROJECT_REF:", LOGIN_SUPABASE_PROJECT_REF || "não identificado");
    console.log("SUPABASE_KEY_REF:", keyRef || "não identificado");
  }, []);

  useEffect(() => {
    let mounted = true;
    const goTo = async (userId: string) => {
      if (hasRecentAuthQuarantine()) {
        if (import.meta.env.DEV) console.warn("[AUTH] redirect ignorado: sessão em quarentena", { source: "AuthIdentityProvider", userId });
        return;
      }
      if (loginInFlightRef.current) {
        if (import.meta.env.DEV) console.log("[AUTH] redirect aguardando validação pós-login", { source: "AuthIdentityProvider", userId });
        return;
      }
      if (navigatedRef.current) return;
      try {
        const context = await loadPostLoginContext(userId);
        const dest = context.isPlatformAdmin ? "/super-admin" : "/app/dashboard";
        navigatedRef.current = true;
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.log("REDIRECT_DECISION", { source: "AuthIdentityProvider", dest, userId, clinicId: context.clinic?.id ?? null, role: context.role, reason: "existing-session" });
        }
        if (context.clinic?.id && !context.isPlatformAdmin) {
          void prefetchEssentialClinicData({ queryClient, userId, clinicId: context.clinic.id });
        }
        updateDiagnostic("redirect", "success", dest);
        navigate(dest, { replace: true });
      } catch (error) {
        console.error("[AUTH] sessão existente sem contexto válido", error);
        setLoginError(getAuthErrorMessage(error));
        const { markUserLogout } = await import("@/lib/authIntent");
        markUserLogout("existing-session-invalid");
        clearAuthenticatedTab();
        clearSupabaseAuthStorage();
        try { hardClearReactQueryCache(queryClient, "existing-session-invalid", { userId }); } catch { /* ignore */ }
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
    };
    if (!authIdentityLoading && currentAuthUserId) void goTo(currentAuthUserId);

    return () => {
      mounted = false;
    };
  }, [navigate, currentAuthUserId, authIdentityLoading, queryClient]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanEmail = email.trim();
    const cleanPassword = password;
    setLoginError(null);

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
    clearAuthQuarantine();
    // Fluxo explícito de login: remove sessão/cache/identidade antigos antes
    // do Supabase persistir a nova sessão. Nada de user_id/profile/clinic_id
    // antigo pode sobreviver ao login de outro usuário.
    clearAuthenticatedTab();
    clearSupabaseAuthStorage();
    try { hardClearReactQueryCache(queryClient, "login-start", { email: cleanEmail }); } catch { /* ignore */ }
    setTabExpectedUserId(null);
    prepareTabForNewLogin();
    updateDiagnostic("auth", "pending", "Autenticando no Supabase");

    const envProblem = hasSupabaseEnvProblem();
    if (envProblem) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      updateDiagnostic("auth", "fail", `ENV_MISSING: ${envProblem}`);
      if (import.meta.env.DEV) console.error("[AUTH] login bloqueado por ENV_MISSING", { message: envProblem });
      const description = "Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.";
      setLoginError(description);
      toast({ title: "Erro ao entrar", description, variant: "destructive" });
      return;
    }

    let data: AuthSignInResult["data"] | null = null;
    let error: unknown = null;
    try {
      const signInStartedAt = performance.now();
      if (import.meta.env.DEV) {
        console.log("LOGIN_START", {
          email: cleanEmail,
          supabaseUrl: LOGIN_SUPABASE_URL,
          urlProjectRef: LOGIN_SUPABASE_PROJECT_REF,
          keyProjectRef: LOGIN_SUPABASE_AUTH_KEY ? decodeJwtRef(LOGIN_SUPABASE_AUTH_KEY) : "",
        });
      }
      // Timeout explícito: se o servidor de auth não responder (ex.: banco do
      // projeto indisponível), o usuário recebe mensagem clara em vez de ficar
      // preso em "Entrando..." indefinidamente.
      const res = await withTimeout<AuthSignInResult>(
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        }) as PromiseLike<AuthSignInResult>,
        20000,
        "Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.",
      );

      if (import.meta.env.DEV) {
        console.info(res.error ? "LOGIN_ERROR" : "LOGIN_SUCCESS", {
          elapsedMs: Math.round(performance.now() - signInStartedAt),
          email: cleanEmail,
          status: errorField(res.error, "status") ?? null,
          error: res.error ?? null,
          hasSession: !!res.data?.session,
          hasUser: !!res.data?.user,
          userId: res.data?.user?.id ?? null,
        });
      }
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
      const failureKind = classifyAuthFailure(error);
      if (import.meta.env.DEV) {
        console.error("LOGIN_ERROR", {
          failureKind,
          email: cleanEmail,
          message: errorField(error, "message"),
          name: errorField(error, "name"),
          status: errorField(error, "status"),
          cause: errorField(error, "cause"),
          stack: errorField(error, "stack"),
        });
        console.error("[AUTH] login falhou", { kind: failureKind, name, status, message: msg });
      }
      const baseDescription = getAuthErrorMessage(error);
      setLoginError(baseDescription);
      updateDiagnostic("auth", "fail", `${failureKind}: ${baseDescription}`);

      toast({
        title: "Erro ao entrar",
        description: baseDescription,
        variant: "destructive",
      });
      return;
    }

    if (!data?.session || !data?.user) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      toast({
        title: "Não foi possível iniciar a sessão",
        description: "Não foi possível iniciar a sessão. Tente novamente em instantes.",
        variant: "destructive",
      });
      setLoginError("Não foi possível iniciar a sessão. Tente novamente em instantes.");
      updateDiagnostic("auth", "fail", "Auth: sessão não retornada pelo Supabase");
      return;
    }

    if (import.meta.env.DEV) {
      console.log("AUTH USER:", data.user);
      console.log("AUTH SESSION:", data.session);
    }
    if (import.meta.env.DEV) console.log("SESSION_FOUND", { hasSession: true, hasUser: true, userId: data.user.id, email: data.user.email ?? cleanEmail });
    updateDiagnostic("auth", "success", `Auth OK: ${data.user.email ?? data.user.id}`);

    rememberAuthenticatedUser(data.user.id);
    try { hardClearReactQueryCache(queryClient, "login-after-auth", { userId: data.user.id }); } catch { /* ignore */ }

    // Confirma sessão + auth.uid() + perfil + clínica + role/permissões antes
    // de redirecionar. Não entramos no /app com contexto incompleto.
    let postLoginContext: PostLoginContext;
    try {
      postLoginContext = await loadPostLoginContext(data.user.id);
      if (import.meta.env.DEV) {
        console.log("PROFILE_LOADED", { userId: postLoginContext.profile?.user_id ?? postLoginContext.user.id, profileId: postLoginContext.profile?.id ?? null, clinicId: postLoginContext.profile?.clinic_id ?? null });
        console.log("CLINIC_LOADED", { clinicId: postLoginContext.clinic?.id ?? null, clinicName: postLoginContext.clinic?.name ?? null });
        console.log("ROLE_LOADED", { role: postLoginContext.role, permissionsCount: postLoginContext.permissionsCount });
      }
    } catch (postLoginError) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      console.error("[AUTH] contexto pós-login inválido", postLoginError);
      updateDiagnostic("profile", "fail", getAuthErrorMessage(postLoginError));
      const { markUserLogout } = await import("@/lib/authIntent");
      markUserLogout("post-login-context-invalid");
      clearAuthenticatedTab();
      clearSupabaseAuthStorage();
      try { hardClearReactQueryCache(queryClient, "post-login-context-invalid", { userId: data.user.id }); } catch { /* ignore */ }
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      toast({
        title: "Não foi possível concluir o login",
        description: getAuthErrorMessage(postLoginError),
        variant: "destructive",
      });
      setLoginError(getAuthErrorMessage(postLoginError));
      return;
    }

    // Pré-carrega em paralelo o que praticamente toda tela usa
    // (specialties, procedures, professionals, rooms, insurances, payment
    // methods). Não bloqueia o redirect — `allSettled` por dentro.
    if (postLoginContext.clinic?.id && !postLoginContext.isPlatformAdmin) {
      void prefetchEssentialClinicData({
        queryClient,
        userId: data.user.id,
        clinicId: postLoginContext.clinic.id,
      });
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
      const dest = postLoginContext.isPlatformAdmin ? "/super-admin" : "/app/dashboard";
      if (import.meta.env.DEV) console.log("REDIRECT_DECISION", { dest, userId: data.user.id, clinicId: postLoginContext.clinic?.id ?? null, role: postLoginContext.role, reason: "login-context-ready" });
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

          {loginError && (
            <div className="mb-5 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{loginError}</span>
            </div>
          )}

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
