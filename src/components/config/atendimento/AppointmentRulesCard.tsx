import { useState, useEffect, useRef } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAppointmentRules, AppointmentRulesFormData } from "@/hooks/useAppointmentRules";
import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentRulesCard() {
  const { currentRules, isLoading, isSaving, saveRules, hasFetched } = useAppointmentRules();
  
  const [formData, setFormData] = useState<AppointmentRulesFormData>({
    arrival_tolerance_minutes: 15,
    min_advance_hours: 2,
    confirmation_advance_hours: 24,
    max_reschedules: 3,
  });
  
  // Track if we've initialized form data from server
  const initializedRef = useRef(false);

  // Only set form data once when data first loads
  useEffect(() => {
    if (hasFetched && !initializedRef.current) {
      setFormData(currentRules);
      initializedRef.current = true;
    }
  }, [hasFetched, currentRules]);

  // Reset initialization when component unmounts
  useEffect(() => {
    return () => {
      initializedRef.current = false;
    };
  }, []);

  const handleInputChange = (field: keyof AppointmentRulesFormData, value: string) => {
    const numValue = parseInt(value, 10);
    // Only update if it's a valid non-negative number or empty string
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setFormData(prev => ({
        ...prev,
        [field]: value === '' ? 0 : numValue,
      }));
    }
  };

  const handleSave = async () => {
    const success = await saveRules(formData);
    if (success) {
      // Update the reference to current values after successful save
      initializedRef.current = false;
    }
  };

  const hasChanges = 
    formData.arrival_tolerance_minutes !== currentRules.arrival_tolerance_minutes ||
    formData.min_advance_hours !== currentRules.min_advance_hours ||
    formData.confirmation_advance_hours !== currentRules.confirmation_advance_hours ||
    formData.max_reschedules !== currentRules.max_reschedules;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regras de Atendimento</CardTitle>
          <CardDescription>Configure comportamentos padrão do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Atendimento</CardTitle>
        <CardDescription>
          Configure comportamentos padrão do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="arrival_tolerance">Tempo de tolerância para chegada (minutos)</Label>
            <Input
              id="arrival_tolerance"
              type="number"
              min={0}
              max={60}
              value={formData.arrival_tolerance_minutes}
              onChange={(e) => handleInputChange('arrival_tolerance_minutes', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Após este tempo, o sistema sugere marcar como "Faltou"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_advance">Antecedência mínima para agendamento (horas)</Label>
            <Input
              id="min_advance"
              type="number"
              min={0}
              max={168}
              value={formData.min_advance_hours}
              onChange={(e) => handleInputChange('min_advance_hours', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Pacientes não podem agendar com menos antecedência
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation_advance">Antecedência para confirmação (horas)</Label>
            <Input
              id="confirmation_advance"
              type="number"
              min={0}
              max={168}
              value={formData.confirmation_advance_hours}
              onChange={(e) => handleInputChange('confirmation_advance_hours', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lembrete enviado ao paciente antes do horário
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_reschedules">Limite de reagendamentos</Label>
            <Input
              id="max_reschedules"
              type="number"
              min={0}
              max={10}
              value={formData.max_reschedules}
              onChange={(e) => handleInputChange('max_reschedules', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de reagendamentos permitidos
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
