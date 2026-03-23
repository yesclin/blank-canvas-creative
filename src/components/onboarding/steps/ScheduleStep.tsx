import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
}

export function ScheduleStep({ clinicId, onNext, onBack }: ScheduleStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    startTime: "08:00",
    endTime: "18:00",
    defaultDuration: 30,
  });

  useEffect(() => {
    async function loadScheduleConfig() {
      setIsLoading(true);
      const { data } = await supabase
        .from("clinic_schedule_config")
        .select("*")
        .eq("clinic_id", clinicId)
        .maybeSingle();

      if (data) {
        setFormData({
          startTime: data.start_time?.slice(0, 5) || "08:00",
          endTime: data.end_time?.slice(0, 5) || "18:00",
          defaultDuration: data.default_duration_minutes || 30,
        });
      }
      setIsLoading(false);
    }

    if (clinicId) {
      loadScheduleConfig();
    }
  }, [clinicId]);

  const handleSave = async () => {
    setIsSaving(true);

    // Check if config exists
    const { data: existing } = await supabase
      .from("clinic_schedule_config")
      .select("id")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    let error;

    if (existing) {
      const result = await supabase
        .from("clinic_schedule_config")
        .update({
          start_time: formData.startTime,
          end_time: formData.endTime,
          default_duration_minutes: formData.defaultDuration,
        })
        .eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase.from("clinic_schedule_config").insert({
        clinic_id: clinicId,
        start_time: formData.startTime,
        end_time: formData.endTime,
        default_duration_minutes: formData.defaultDuration,
      });
      error = result.error;
    }

    setIsSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Agenda configurada!",
    });

    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Configuração da Agenda</h2>
          <p className="text-sm text-muted-foreground">
            Defina os horários padrão de atendimento
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startTime">Início dos Atendimentos</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">Fim dos Atendimentos</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="defaultDuration">Duração Padrão da Consulta (minutos)</Label>
          <Input
            id="defaultDuration"
            type="number"
            min={10}
            max={120}
            step={5}
            value={formData.defaultDuration}
            onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 30 })}
          />
          <p className="text-xs text-muted-foreground">
            Este será o tempo padrão para novos agendamentos
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">Resumo da Agenda</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Horário: {formData.startTime} às {formData.endTime}</li>
            <li>• Consulta padrão: {formData.defaultDuration} minutos</li>
            <li>
              • Slots por dia: ~{Math.floor(
                ((parseInt(formData.endTime.split(":")[0]) * 60 + parseInt(formData.endTime.split(":")[1])) -
                  (parseInt(formData.startTime.split(":")[0]) * 60 + parseInt(formData.startTime.split(":")[1]))) /
                  formData.defaultDuration
              )} consultas
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Pular etapa
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
