import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Clock } from "lucide-react";

interface WelcomeStepProps {
  userName: string;
  clinicName: string;
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ userName, clinicName, onNext, onSkip }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Bem-vindo ao Yesclin, {userName}! 👋
        </h2>
      </div>

      <p className="text-muted-foreground max-w-md mx-auto">
        Vamos configurar o essencial para você começar a usar o sistema.
        Em poucos minutos sua clínica estará pronta para atender!
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Leva cerca de 5 minutos</span>
      </div>

      <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
        <Button onClick={onNext} size="lg" className="w-full">
          Começar agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} size="sm">
          Fazer depois
        </Button>
      </div>
    </motion.div>
  );
}
