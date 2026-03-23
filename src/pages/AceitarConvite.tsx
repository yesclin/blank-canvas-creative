import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Mail, Building2, UserCircle, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

interface InvitationInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleLabel: string;
  clinicName: string;
  expiresAt: string;
}

// Password strength calculation - minimum 8 characters only
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  // Simple validation: just check minimum length
  if (password.length < 8) {
    // Proportional progress towards 8 characters
    const progress = Math.min((password.length / 8) * 100, 99);
    return { score: progress, label: "Mínimo 8 caracteres", color: "bg-destructive" };
  }
  
  // Once 8+ characters are met, show as valid
  return { score: 100, label: "Válida", color: "bg-emerald-500" };
}

export default function AceitarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"expired" | "invalid" | "used" | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = password.length >= 8;

  useEffect(() => {
    if (!token) {
      setError("Link de convite inválido. Verifique se você copiou o link completo.");
      setErrorType("invalid");
      setIsValidating(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-invite?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.valid) {
        // Determine error type for better UX
        const errorMsg = result.error || "Convite inválido";
        if (errorMsg.toLowerCase().includes("expirou") || errorMsg.toLowerCase().includes("expired")) {
          setErrorType("expired");
        } else if (errorMsg.toLowerCase().includes("usado") || errorMsg.toLowerCase().includes("aceito")) {
          setErrorType("used");
        } else {
          setErrorType("invalid");
        }
        setError(errorMsg);
        setIsValidating(false);
        return;
      }

      setInvitation(result.invitation);
      setIsValidating(false);
    } catch (err: any) {
      console.error("Error validating invitation:", err);
      setError("Erro ao validar convite. Tente novamente.");
      setErrorType("invalid");
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("A senha deve conter no mínimo 8 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao aceitar convite");
      }

      // Auto-login after account creation
      if (invitation?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: password,
        });

        if (!signInError) {
          toast.success("Conta criada! Redirecionando...");
          navigate("/app", { replace: true });
          return;
        }
        // If auto-login fails, fall back to manual login
        console.warn("Auto-login failed, redirecting to login page:", signInError);
      }

      setSuccess(true);
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast.error(err.message || "Erro ao aceitar convite");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Validando convite...</p>
                <p className="text-sm text-muted-foreground mt-1">Aguarde um momento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    const getErrorIcon = () => {
      switch (errorType) {
        case "expired": return <Clock className="h-8 w-8 text-warning" />;
        case "used": return <CheckCircle2 className="h-8 w-8 text-primary" />;
        default: return <XCircle className="h-8 w-8 text-destructive" />;
      }
    };

    const getErrorTitle = () => {
      switch (errorType) {
        case "expired": return "Convite Expirado";
        case "used": return "Convite Já Utilizado";
        default: return "Convite Inválido";
      }
    };

    const getErrorBg = () => {
      switch (errorType) {
        case "expired": return "bg-warning/10";
        case "used": return "bg-primary/10";
        default: return "bg-destructive/10";
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto ${getErrorBg()} p-4 rounded-full w-fit mb-4`}>
              {getErrorIcon()}
            </div>
            <CardTitle className="text-xl">{getErrorTitle()}</CardTitle>
            <CardDescription className="mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  {errorType === "expired" ? (
                    <>
                      <p className="font-medium text-foreground mb-1">O que fazer?</p>
                      <p>Entre em contato com o administrador da clínica e solicite um novo convite.</p>
                    </>
                  ) : errorType === "used" ? (
                    <>
                      <p className="font-medium text-foreground mb-1">Já tem uma conta?</p>
                      <p>Este convite já foi aceito anteriormente. Use o botão abaixo para fazer login.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground mb-1">Verifique o link</p>
                      <p>Certifique-se de que você copiou o link completo do e-mail. Se o problema persistir, solicite um novo convite.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Ir para Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-success/10 p-4 rounded-full w-fit mb-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <CardTitle className="text-xl">Conta Criada com Sucesso! 🎉</CardTitle>
            <CardDescription className="mt-2">
              Bem-vindo ao Yesclin! Sua conta está pronta para uso.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Você já pode fazer login usando o e-mail <strong className="text-foreground">{invitation?.email}</strong>
                </p>
              </div>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link to="/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Aceitar Convite</CardTitle>
          <CardDescription>
            Crie sua senha para acessar o Yesclin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="space-y-4 mb-6">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clínica</p>
                    <p className="font-medium truncate">{invitation.clinicName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg">
                    <UserCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Seu nome</p>
                    <p className="font-medium truncate">{invitation.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium truncate">{invitation.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Perfil</p>
                    <Badge variant="secondary" className="mt-0.5">{invitation.roleLabel}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <Progress value={passwordStrength.score} className="h-1.5 flex-1" />
                    <span className={`text-xs font-medium ${
                      passwordStrength.score < 100 ? 'text-destructive' : 'text-success'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  className={`pl-9 pr-10 ${
                    confirmPassword.length > 0 
                      ? passwordsMatch 
                        ? 'border-success focus-visible:ring-success' 
                        : 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta e Aceitar Convite"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}