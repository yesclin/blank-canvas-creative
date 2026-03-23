import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompletionStepProps {
  onComplete: () => Promise<void>;
  clinicId: string;
}

type CompletionStatus = "pending" | "completing" | "completed" | "error";

const checklistItems = [
  "Dados da clínica configurados",
  "Especialidade principal definida",
  "Sistema pronto para uso",
];

const nextSteps = [
  {
    icon: Users,
    title: "Cadastrar primeiro paciente",
    path: "/app/pacientes",
  },
  {
    icon: Calendar,
    title: "Agendar primeiro atendimento",
    path: "/app/agenda",
  },
  {
    icon: LayoutDashboard,
    title: "Explorar o dashboard",
    path: "/app",
  },
];

// Simple navigate-only handler — no extra persistence
function useNavigateOnly() {
  const navigate = useNavigate();
  return (path: string) => navigate(path);
}

export function CompletionStep({ onComplete, clinicId }: CompletionStepProps) {
  const goTo = useNavigateOnly();
  const [status, setStatus] = useState<CompletionStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const finalizeOnboarding = useCallback(async () => {
    if (!clinicId) {
      setStatus("error");
      setErrorMessage("ID da clínica não encontrado.");
      return;
    }

    setStatus("completing");
    setErrorMessage(null);
    setHasAttempted(true);

    try {
      await onComplete();
      setStatus("completed");
      // Auto-redirect to dashboard after a brief celebration
      setTimeout(() => goTo("/app"), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "";
      if (errorMsg.includes("já concluído") || errorMsg.includes("already completed")) {
        setStatus("completed");
        setTimeout(() => goTo("/app"), 1000);
        return;
      }
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erro ao finalizar. Tente novamente.");
    }
  }, [onComplete, clinicId, goTo]);

  useEffect(() => {
    if (!hasAttempted) finalizeOnboarding();
  }, [finalizeOnboarding, hasAttempted]);

  const handleNavigate = (path: string) => goTo(path);
  const handleRetry = () => finalizeOnboarding();
  const isActionable = status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-4"
    >
      {/* Status Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          status === "error" 
            ? "bg-destructive/10" 
            : status === "completing" 
            ? "bg-muted" 
            : "bg-primary/10"
        }`}
      >
        {status === "completing" && (
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        )}
        {status === "completed" && (
          <CheckCircle2 className="h-10 w-10 text-primary" />
        )}
        {status === "error" && (
          <AlertCircle className="h-10 w-10 text-destructive" />
        )}
        {status === "pending" && (
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
        )}
      </motion.div>

      {/* Title & Description */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {status === "completing" && "Finalizando configuração..."}
          {status === "completed" && "Tudo pronto! 🎉"}
          {status === "error" && "Ops! Algo deu errado"}
          {status === "pending" && "Preparando..."}
        </h2>
        <p className="text-muted-foreground">
          {status === "completing" && "Salvando suas configurações..."}
          {status === "completed" && "Seu sistema está configurado e pronto para uso."}
          {status === "error" && "Não foi possível concluir a configuração."}
          {status === "pending" && "Aguarde um momento..."}
        </p>
      </div>

      {/* Error Alert */}
      {status === "error" && errorMessage && (
        <Alert variant="destructive" className="max-w-sm mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Retry Button */}
      {status === "error" && (
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}

      {/* Checklist (only show when completed) */}
      {status === "completed" && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left max-w-sm mx-auto">
          <p className="text-sm font-medium text-foreground">Configuração concluída:</p>
          {checklistItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {item}
            </motion.div>
          ))}
        </div>
      )}

      {/* Next Steps (only show when completed) */}
      {status === "completed" && (
        <div className="space-y-3 pt-4">
          <p className="text-sm font-medium text-foreground">Próximos passos sugeridos:</p>
          <div className="grid gap-2 max-w-sm mx-auto">
            {nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => handleNavigate(step.path)}
                  disabled={!isActionable}
                >
                  <step.icon className="h-4 w-4 text-primary" />
                  {step.title}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main CTA */}
      {status === "completed" && (
        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={() => handleNavigate("/app")}
            disabled={!isActionable}
          >
            Ir para o Dashboard
          </Button>
        </div>
      )}

      {/* Loading placeholder for buttons */}
      {status === "completing" && (
        <div className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Aguarde enquanto salvamos suas configurações...
          </p>
        </div>
      )}
    </motion.div>
  );
}
