import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { motion } from "framer-motion";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

type PageState = "loading" | "ready" | "invalid" | "success";

const RedefinirSenha = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const recoveryDetected = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if URL hash contains recovery tokens (Supabase puts them there)
    const hash = window.location.hash;
    const hasRecoveryInHash =
      hash.includes("type=recovery") ||
      hash.includes("type=signup") ||
      hash.includes("access_token=");

    // Also check query params (some configurations use query strings)
    const params = new URLSearchParams(window.location.search);
    const hasRecoveryInQuery =
      params.get("type") === "recovery" || !!params.get("access_token");

    const hasTokenInUrl = hasRecoveryInHash || hasRecoveryInQuery;

    // 1. Listen for auth state changes FIRST (before getSession processes tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[RedefinirSenha] Auth event:", event, "session:", !!session);

      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryDetected.current = true;
        setPageState("ready");
        return;
      }

      // If we got a session from the recovery token (sometimes fires as SIGNED_IN)
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session &&
        hasTokenInUrl &&
        !recoveryDetected.current
      ) {
        recoveryDetected.current = true;
        setPageState("ready");
        return;
      }
    });

    // 2. getSession() triggers processing of hash tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[RedefinirSenha] getSession result:", !!session);
      // If we already have a session and there's a token in URL, allow reset
      if (session && hasTokenInUrl && !recoveryDetected.current) {
        recoveryDetected.current = true;
        setPageState("ready");
      }
    });

    // 3. Fallback: give Supabase enough time to process the token
    const timeout = setTimeout(() => {
      if (!recoveryDetected.current) {
        // One final check
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !recoveryDetected.current) {
            // We have a session — might be a recovery that fired as SIGNED_IN
            // Check if there were tokens in URL
            if (hasTokenInUrl) {
              recoveryDetected.current = true;
              setPageState("ready");
            } else {
              setPageState("invalid");
            }
          } else if (!recoveryDetected.current) {
            setPageState("invalid");
          }
        });
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passwordValidation = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword,
  };

  const isValid =
    passwordValidation.minLength &&
    passwordValidation.hasLetter &&
    passwordValidation.hasNumber &&
    passwordValidation.matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setPageState("success");
      await supabase.auth.signOut();

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Faça login com sua nova senha.",
      });
    } catch (err: any) {
      console.error("Password update error:", err);
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("weak") || msg.includes("pwned") || msg.includes("easy to guess") || msg.includes("compromised")) {
        setError("Não foi possível usar essa senha. Tente uma combinação um pouco diferente.");
      } else if (msg.includes("session") || msg.includes("token") || msg.includes("expired")) {
        setError("Sessão expirada. Solicite um novo link de recuperação.");
      } else {
        setError("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Rule = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle className="w-4 h-4 text-success" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span className={met ? "text-success" : "text-muted-foreground"}>{label}</span>
    </div>
  );

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md text-center"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
          </Link>
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </motion.div>
      </div>
    );
  }

  // Invalid/expired token
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
          </Link>
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-muted-foreground mb-6">
            Este link de recuperação é inválido ou expirou. Solicite um novo e-mail.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="hero" asChild>
              <Link to="/recuperar-senha">Solicitar novo link</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
          </Link>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Senha redefinida!
          </h1>
          <p className="text-muted-foreground mb-6">
            Sua senha foi alterada com sucesso. Faça login com sua nova senha.
          </p>
          <Button variant="hero" className="w-full" asChild>
            <Link to="/login">Ir para o login</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Ready — show form
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        <Link to="/" className="flex items-center mb-8">
          <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Criar nova senha
          </h1>
          <p className="text-muted-foreground">
            Defina uma nova senha segura para sua conta
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="h-12 pr-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                className="h-12 pr-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
            <Rule met={passwordValidation.minLength} label="Mínimo 8 caracteres" />
            <Rule met={passwordValidation.hasLetter} label="Pelo menos uma letra" />
            <Rule met={passwordValidation.hasNumber} label="Pelo menos um número" />
            <Rule met={passwordValidation.matches} label="Senhas coincidem" />
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default RedefinirSenha;
