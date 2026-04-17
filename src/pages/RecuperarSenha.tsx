import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { motion } from "framer-motion";
import { z } from "zod";

// Email validation schema
const emailSchema = z.string().email("Formato de email inválido").min(1, "Email é obrigatório");

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Use native auth password reset - sends email directly
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      // Success - show email sent screen
      setEmailSent(true);
      
    } catch (err) {
      console.error("Password reset error:", err);
      
      // For security, always show a generic success message
      // This prevents email enumeration attacks
      setEmailSent(true);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setError(null);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        {/* Logo */}
        <Link to="/" className="flex items-center mb-8">
          <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
        </Link>

        {emailSent ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Verifique seu email
            </h1>
            <p className="text-muted-foreground mb-4">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              O link expira em 60 minutos e só pode ser usado uma vez.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" asChild>
                <Link to="/login">Voltar ao login</Link>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleResend}
                className="text-primary"
              >
                Não recebeu? Tentar novamente
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Form State */
          <>
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Recuperar senha
              </h1>
              <p className="text-muted-foreground">
                Informe seu email para receber o link de recuperação
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

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="h-12"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>

            <p className="mt-6 text-center text-muted-foreground">
              Lembrou a senha?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RecuperarSenha;
