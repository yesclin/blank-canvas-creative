import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, ArrowLeft, Check, X, Bell, Clock, Calendar } from "lucide-react";

interface CommunicationStepProps {
  onNext: () => void;
  onBack: () => void;
  onUpdatePreferences: (prefs: { wants_reminders: boolean }) => void;
}

export function CommunicationStep({ onNext, onBack, onUpdatePreferences }: CommunicationStepProps) {
  const [wantsReminders, setWantsReminders] = useState<boolean | null>(null);

  const handleChoice = (wants: boolean) => {
    setWantsReminders(wants);
    onUpdatePreferences({ wants_reminders: wants });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Comunicação</h2>
          <p className="text-sm text-muted-foreground">
            Deseja ativar lembretes automáticos?
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          Envie lembretes automáticos por WhatsApp para reduzir faltas e melhorar o relacionamento com pacientes.
        </p>

        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Confirmação de Consulta</p>
              <p className="text-xs text-muted-foreground">
                Envie lembretes 24h antes da consulta
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Lembrete de Horário</p>
              <p className="text-xs text-muted-foreground">
                Avise 2h antes do atendimento
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Aniversário e Retorno</p>
              <p className="text-xs text-muted-foreground">
                Mensagens personalizadas em datas especiais
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2"
          onClick={() => handleChoice(true)}
        >
          <Check className="h-6 w-6 text-emerald-600" />
          <span>Sim, ativar</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col gap-2"
          onClick={() => handleChoice(false)}
        >
          <X className="h-6 w-6 text-muted-foreground" />
          <span>Agora não</span>
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    </motion.div>
  );
}
