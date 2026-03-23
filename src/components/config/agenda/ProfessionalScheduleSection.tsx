import { Users, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalScheduleCard } from "./ProfessionalScheduleCard";
import { useProfessionalSchedules } from "@/hooks/useProfessionalSchedules";
import { getDefaultWeekSchedule, WeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";

export function ProfessionalScheduleSection() {
  const {
    professionals,
    clinicSchedule,
    isLoading,
    isSaving,
    getScheduleForProfessional,
    saveProfessionalSchedule,
  } = useProfessionalSchedules();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Horários por Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (professionals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Horários por Profissional
          </CardTitle>
          <CardDescription>
            Configure horários personalizados para cada profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Nenhum profissional cadastrado. Cadastre profissionais em{" "}
              <span className="font-medium">Configurações → Usuários</span> para
              configurar horários individuais.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const defaultClinicSchedule = clinicSchedule || getDefaultWeekSchedule();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Horários por Profissional
        </CardTitle>
        <CardDescription>
          Por padrão, os profissionais usam o horário da clínica. 
          Clique em um profissional para definir um horário personalizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {professionals.map((professional) => {
          const { effectiveSchedule, useClinicDefault, config } = 
            getScheduleForProfessional(professional.id);

          return (
            <ProfessionalScheduleCard
              key={professional.id}
              professional={professional}
              clinicSchedule={defaultClinicSchedule}
              currentConfig={{
                useClinicDefault,
                schedule: effectiveSchedule,
                durationMinutes: config?.default_duration_minutes || 30,
              }}
              onSave={async (useDefault, schedule, duration) => {
                return await saveProfessionalSchedule(
                  professional.id,
                  useDefault,
                  schedule,
                  duration
                );
              }}
              isSaving={isSaving}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
