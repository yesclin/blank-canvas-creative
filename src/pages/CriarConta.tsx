import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Check, Shield, Users, Calendar, FileText, DollarSign, MessageCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { motion } from "framer-motion";
import { z } from "zod";
import { maskPhone } from "@/lib/validators";
import doctorImage from "@/assets/doctor-signup.jpg";
import { emitIdentityChanged, rememberAuthenticatedUser } from "@/lib/authSessionIsolation";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp deve ter no mínimo 10 dígitos").refine(
    (val) => val.replace(/\D/g, "").length >= 10,
    "WhatsApp inválido"
  ),
  password: z.string().min(8, "A senha deve conter no mínimo 8 caracteres."),
});

const normalizeAuthError = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("user already") || lower.includes("already exists")) {
    return "Este email já está cadastrado. Tente fazer login.";
  }
  if (
    lower.includes("weak") ||
    lower.includes("known to be weak") ||
    lower.includes("compromised") ||
    lower.includes("pwn")
  ) {
    return "Essa senha é considerada fraca ou muito comum. Use uma senha mais forte (mínimo 8 caracteres).";
  }
  if (lower.includes("minimum") && lower.includes("8")) {
    return "A senha deve conter no mínimo 8 caracteres.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Por favor, insira um email válido.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }

  return message;
};

const waitForSignupProvisioning = async (userId: string) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (profile?.clinic_id) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("clinic_id", profile.clinic_id)
        .limit(1)
        .maybeSingle();

      if (role?.role) return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 350));
  }
};

const syncAuthenticatedSignup = async (session: any) => {
  const userId = session?.user?.id;
  if (!userId) return;

  rememberAuthenticatedUser(userId);
  emitIdentityChanged(null, userId, "signup");
  await waitForSignupProvisioning(userId);
};

const CriarConta = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const benefits = [
    { icon: Calendar, text: "Agenda inteligente" },
    { icon: FileText, text: "Prontuário por especialidade" },
    { icon: DollarSign, text: "Financeiro e estoque integrados" },
    { icon: MessageCircle, text: "Comunicação com pacientes" },
  ];

  const trustElements = [
    { icon: Shield, text: "100% Seguro" },
    { icon: Check, text: "Conforme LGPD" },
    { icon: Users, text: "Suporte humano" },
  ];

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(maskPhone(e.target.value));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ name, email, whatsapp, password });
    
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const phoneDigits = whatsapp.replace(/\D/g, "");
    const redirectUrl = `${window.location.origin}/app`;

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name.trim(),
          whatsapp: phoneDigits,
          phone: phoneDigits,
          signup_origin: "web",
        },
      },
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Erro ao criar conta",
        description: normalizeAuthError(error.message),
        variant: "destructive",
      });
      return;
    }

    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setIsLoading(false);
      toast({
        title: "Email já cadastrado",
        description: "Este email já está cadastrado. Tente fazer login.",
        variant: "destructive",
      });
      return;
    }

    // Caminho feliz: signUp já devolveu sessão.
    if (data?.session && data?.user) {
      // Marca identidade imediatamente; provisionamento roda em background
      // para não atrasar a navegação (handle_new_user já cria profile/role).
      rememberAuthenticatedUser(data.session.user.id);
      emitIdentityChanged(null, data.session.user.id, "signup");
      void waitForSignupProvisioning(data.session.user.id);
      setIsLoading(false);
      toast({
        title: "Conta criada com sucesso!",
        description: "Vamos configurar sua clínica.",
      });
      navigate("/app", { replace: true });
      return;
    }

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    setIsLoading(false);

    if (signInError) {
      if (import.meta.env.DEV) {
        console.warn("[AUTH_SIGNUP] Login automático após cadastro falhou", {
          message: signInError.message,
        });
      }
      toast({
        title: "Conta criada, mas não foi possível entrar automaticamente",
        description: "Verifique as configurações de autenticação.",
        variant: "destructive",
      });
      return;
    }

    if (signInData?.session) {
      await syncAuthenticatedSignup(signInData.session);
      toast({
        title: "Conta criada com sucesso!",
        description: "Vamos configurar sua clínica.",
      });
      navigate("/app", { replace: true });
      return;
    }

    toast({
      title: "Conta criada, mas não foi possível entrar automaticamente",
      description: "Verifique as configurações de autenticação.",
      variant: "destructive",
    });
  };


  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center mb-8">
            <img src={logoFull} alt="Yesclin" className="h-10 object-contain" />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Crie sua conta gratuita
            </h1>
            <p className="text-muted-foreground">
              Comece a gerenciar sua clínica em minutos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

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
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={handleWhatsappChange}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
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
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta grátis"}
            </Button>

            {/* Trust indicators below button */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Check size={14} className="text-primary" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <Check size={14} className="text-primary" />
                Cancele quando quiser
              </span>
            </div>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Conversion (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background Image */}
        <img
          src={doctorImage}
          alt="Profissional de saúde"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-display text-3xl font-bold mb-6">
              Tudo que sua clínica precisa em um só lugar
            </h2>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <benefit.icon size={20} className="text-white" />
                  </div>
                  <span className="text-lg text-white/95">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Trust Elements */}
            <div className="flex items-center gap-6 pt-6 border-t border-white/20">
              {trustElements.map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <item.icon size={16} className="text-white/80" />
                  <span className="text-sm text-white/80">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CriarConta;
