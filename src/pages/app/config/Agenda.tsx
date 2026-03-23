import { CalendarCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicScheduleSection } from "@/components/config/agenda/ClinicScheduleSection";
import { ProfessionalScheduleSection } from "@/components/config/agenda/ProfessionalScheduleSection";
import { ScheduleBlocksSection } from "@/components/config/agenda/ScheduleBlocksSection";
import { AppointmentTypesCard } from "@/components/config/atendimento/AppointmentTypesCard";
import { AppointmentStatusCard } from "@/components/config/atendimento/AppointmentStatusCard";
import { AppointmentRulesCard } from "@/components/config/atendimento/AppointmentRulesCard";
import { IdleAlertSettingsCard } from "@/components/config/atendimento/IdleAlertSettingsCard";

export default function ConfigAgenda() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarCog className="h-6 w-6 text-primary" />
          Regras de Agenda
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure horários, tipos de consulta, status, regras e alertas de agendamento
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="clinic">Horário da Clínica</TabsTrigger>
          <TabsTrigger value="professionals">Por Profissional</TabsTrigger>
          <TabsTrigger value="exceptions">Exceções</TabsTrigger>
          <TabsTrigger value="types">Tipos & Status</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Ociosidade</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-4">
          <ClinicScheduleSection />
        </TabsContent>

        <TabsContent value="professionals" className="space-y-4">
          <ProfessionalScheduleSection />
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <ScheduleBlocksSection />
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AppointmentTypesCard />
            <AppointmentStatusCard />
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <AppointmentRulesCard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <IdleAlertSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
