import { useState, useEffect } from "react";
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

const RedefinirSenha = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event (fires when Supabase processes the hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasSession(true);
      }
    });

    // Also check if there's already a valid session (handles race condition
    // where the event fired before this component mounted)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
    });

    // Check URL hash for recovery tokens that Supabase hasn't processed yet
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("type=magiclink"))) {
      // Supabase client will auto-process this, just wait for the event
      setHasSession(false); // Will be set to true by the listener above
    }

    return () => subscription.unsubscribe();
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

      setSuccess(true);

      // Sign out so user logs in with the new password
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

  if (!hasSession && !success) {
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
            O link de recuperação pode ter expirado ou já foi utilizado. Solicite um novo link.
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

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
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
        ) : (
          <>
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

              {/* Password rules */}
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
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RedefinirSenha;
