import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prepareTabForNewLogin, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import { motion } from "framer-motion";
import { clearAuthQuarantine, hasRecentAuthQuarantine, rememberAuthenticatedUser, setTabExpectedUserId } from "@/lib/authSessionIsolation";
import { useQueryClient } from "@tanstack/react-query";
import { clearReactQueryCache } from "@/lib/queryClientDiagnostics";
import { withTimeout } from "@/lib/asyncTimeout";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";

type AuthErrorLike = { message?: unknown; code?: unknown; status?: unknown; name?: unknown; cause?: unknown; stack?: unknown };
type QueryResult<T> = { data: T | null; error: unknown };
type AuthUserLike = { id: string; email?: string | null };
type AuthSessionLike = { user?: AuthUserLike | null } | null;
type AuthSignInResult = { data: { session: AuthSessionLike; user: AuthUserLike | null }; error: unknown };
type AuthFailureKind = "NONE" | "ENV_MISSING" | "NETWORK_ERROR" | "CORS_ERROR" | "AUTH_ERROR" | "POST_LOGIN_ERROR";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId: currentAuthUserId, isLoading: authIdentityLoading } = useAuthIdentity();
  const navigatedRef = useRef(false);
  const loginInFlightRef = useRef(false);
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

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
      navigatedRef.current = true;
      const dest = await resolveRedirectPath(userId, fromPath || "/app/dashboard");
      if (!mounted) return;
      if (import.meta.env.DEV) {
        console.log("REDIRECT_DECISION", { source: "AuthIdentityProvider", dest, userId, reason: "existing-session" });
      }
      updateDiagnostic("redirect", "success", dest);
      navigate(dest, { replace: true });
    };
    if (!authIdentityLoading && currentAuthUserId) void goTo(currentAuthUserId);

    return () => {
      mounted = false;
    };
  }, [navigate, fromPath, currentAuthUserId, authIdentityLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanEmail = email.trim();
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
    // Apenas limpa a quarentena anterior — NÃO apagamos sessão/binding antes
    // de tentar autenticar: se a chamada falhar por rede/timeout/CORS, o
    // usuário não deve perder a sessão atual.
    clearAuthQuarantine();
    // Fluxo explícito de login: remove binding local antigo antes do Supabase
    // persistir a nova sessão. Sem isso, uma sessão válida pode ser rejeitada
    // pelo storage isolado por aba e o RequireAuth volta para /login.
    setTabExpectedUserId(null);
    prepareTabForNewLogin();
    updateDiagnostic("auth", "pending", "Autenticando no Supabase");

    const envProblem = hasSupabaseEnvProblem();
    if (envProblem) {
      loginInFlightRef.current = false;
      setIsLoading(false);
      updateDiagnostic("auth", "fail", `ENV_MISSING: ${envProblem}`);
      if (import.meta.env.DEV) console.error("[AUTH] login bloqueado por ENV_MISSING", { message: envProblem });
      toast({ title: "Erro ao entrar", description: "Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.", variant: "destructive" });
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
      const res = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      }) as AuthSignInResult;
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
    try { clearReactQueryCache(queryClient, "login-after-auth", { userId: data.user.id }); } catch { /* ignore */ }

    // Não bloquear o login por profile/clinic/role aqui. A sessão já foi
    // autenticada; os dados da clínica são carregados na área /app com tela de
    // erro recuperável se o banco/RLS falhar.

    // Confirma a sessão local uma única vez antes de navegar. Não há timeout
    // manual bloqueando auth: signInWithPassword já retornou com session.
    try {
      const { data: sessionData } = await supabase.auth.getSession() as { data?: { session?: AuthSessionLike } };
      if (import.meta.env.DEV) {
        console.log("SESSION_FOUND", { source: "post-login-getSession", hasSession: !!sessionData?.session, userId: sessionData?.session?.user?.id ?? null });
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
      if (import.meta.env.DEV) console.log("REDIRECT_DECISION", { dest, userId: data.user.id, reason: "login-success" });
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
