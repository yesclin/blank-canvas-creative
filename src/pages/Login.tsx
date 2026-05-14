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
import { clearAuthenticatedTab, rememberAuthenticatedUser } from "@/lib/authSessionIsolation";

/**
 * Decide para onde mandar o usuário autenticado.
 *
 * Super Admins (tabela platform_admins) entram no painel da plataforma.
 * Demais usuários vão para /app. Falha de rede no RPC NÃO trava o login —
 * caímos para /app por padrão.
 */
async function resolveRedirectPath(userId: string, fallback: string): Promise<string> {
  try {
    const { data } = await supabase.rpc("is_platform_admin", { _user_id: userId });
    if (data === true) return "/super-admin";
  } catch (err) {
    console.warn("[AUTH] is_platform_admin falhou — usando destino padrão", err);
  }
  return fallback || "/app";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const navigatedRef = useRef(false);
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

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
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const dest = await resolveRedirectPath(userId, fromPath || "/app");
      if (!mounted) return;
      if (import.meta.env.DEV) {
        console.log("[AUTH] Login redirect", { source, dest, userId });
      }
      navigate(dest, { replace: true });
    };

    // 1) Sessão já existente ao abrir /login
    supabase.auth.getSession().then(({ data }: any) => {
      const uid = data?.session?.user?.id;
      if (uid && mounted) void goTo(uid, "getSession");
    });

    // 2) Evento posterior (SIGNED_IN, INITIAL_SESSION com sessão)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session?.user?.id) {
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

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    clearAuthenticatedTab();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      console.error("[AUTH] signIn error:", error);
      toast({
        title: "Erro ao entrar",
        description:
          error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : error.message,
        variant: "destructive",
      });
      return;
    }

    if (!data?.session || !data?.user) {
      setIsLoading(false);
      toast({
        title: "Não foi possível iniciar a sessão",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[AUTH] signIn ok", { userId: data.user.id });
    }

    rememberAuthenticatedUser(data.user.id);

    // Aguarda a sessão estar persistida no storage antes de navegar
    // (evita race com o RequireAuth no destino).
    try {
      for (let i = 0; i < 10; i += 1) {
        const { data: sessionData } = await supabase.auth.getSession();
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
      const dest = await resolveRedirectPath(data.user.id, fromPath || "/app");
      navigate(dest, { replace: true });
    }

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
