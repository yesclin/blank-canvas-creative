import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Video, Save, Loader2 } from "lucide-react";
import { useTeleconsultaSettings, useTeleconsultaActions } from "@/hooks/useTeleconsulta";

export function TeleconsultaAgendaRulesCard() {
  const { data: settings, isLoading } = useTeleconsultaSettings();
  const { saveTeleconsultaSettings } = useTeleconsultaActions();

  const [entryWindowMinutes, setEntryWindowMinutes] = useState(10);
  const [lateTolerance, setLateTolerance] = useState(15);
  const [professionalWaitMinutes, setProfessionalWaitMinutes] = useState(5);
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(false);
  const [autoRescheduleOnFailure, setAutoRescheduleOnFailure] = useState(false);

  useEffect(() => {
    if (settings) {
      setLateTolerance(settings.late_tolerance_minutes ?? 15);
    }
  }, [settings]);

  const handleSave = () => {
    saveTeleconsultaSettings.mutate({
      late_tolerance_minutes: lateTolerance,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-5 w-5" />
          Regras de Teleconsulta na Agenda
        </CardTitle>
        <CardDescription>
          Configure regras específicas para agendamentos de teleconsulta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Janela de Entrada (min antes do horário)</Label>
          <Input
            type="number"
            value={entryWindowMinutes}
            onChange={(e) => setEntryWindowMinutes(parseInt(e.target.value) || 0)}
            min={0}
            max={60}
          />
          <p className="text-xs text-muted-foreground">Quantos minutos antes o paciente pode entrar na sala</p>
        </div>

        <div className="space-y-2">
          <Label>Tolerância de Atraso (minutos)</Label>
          <Input
            type="number"
            value={lateTolerance}
            onChange={(e) => setLateTolerance(parseInt(e.target.value) || 0)}
            min={0}
            max={60}
          />
          <p className="text-xs text-muted-foreground">Tempo máximo de atraso permitido</p>
        </div>

        <div className="space-y-2">
          <Label>Tempo de Espera do Profissional (minutos)</Label>
          <Input
            type="number"
            value={professionalWaitMinutes}
            onChange={(e) => setProfessionalWaitMinutes(parseInt(e.target.value) || 0)}
            min={0}
            max={60}
          />
          <p className="text-xs text-muted-foreground">Tempo que o profissional aguarda o paciente</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Marcar Ausência Automática</Label>
            <p className="text-xs text-muted-foreground">Marcar falta se paciente não entrar após tolerância</p>
          </div>
          <Switch checked={autoMarkAbsent} onCheckedChange={setAutoMarkAbsent} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Reagendamento por Falha Técnica</Label>
            <p className="text-xs text-muted-foreground">Permitir reagendamento automático em caso de falha</p>
          </div>
          <Switch checked={autoRescheduleOnFailure} onCheckedChange={setAutoRescheduleOnFailure} />
        </div>

        <Button onClick={handleSave} disabled={saveTeleconsultaSettings.isPending} className="w-full">
          {saveTeleconsultaSettings.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Regras
        </Button>
      </CardContent>
    </Card>
  );
}
