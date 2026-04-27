import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FileText, Activity, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSeverityLabel } from "@/utils/clinicalAlertLabels";
import { usePatientClinicalAlerts } from "@/hooks/prontuario/usePatientClinicalAlerts";

interface QuickClinicalSummaryProps {
  patientId: string;
  appointmentId: string;
  clinicId: string;
  specialtyName?: string;
  onCloseDrawer: () => void;
}

// Quantos alertas mostrar inline antes de exibir "+N alertas adicionais"
const ALERTS_PREVIEW_LIMIT = 3;

function useClinicalSummaryData(patientId: string, clinicId: string, enabled: boolean) {
  // Last evolution
  const lastEvolution = useQuery({
    queryKey: ["last-evolution-summary", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinical_evolutions")
        .select("id, created_at, notes, professionals:professional_id(full_name), specialties:specialty_id(name)")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled,
    staleTime: 60000,
  });

  // Last appointment (finalized)
  const lastAppointment = useQuery({
    queryKey: ["last-appointment-summary", patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_date, start_time, procedures:procedure_id(name), professionals:professional_id(full_name)")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .eq("status", "finalizado")
        .order("scheduled_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled,
    staleTime: 60000,
  });

  return {
    lastEvolution: lastEvolution.data,
    lastAppointment: lastAppointment.data,
    isLoading: lastEvolution.isLoading || lastAppointment.isLoading,
  };
}

export function QuickClinicalSummary({
  patientId,
  appointmentId,
  clinicId,
  specialtyName,
  onCloseDrawer,
}: QuickClinicalSummaryProps) {
  const navigate = useNavigate();
  const { alerts, lastEvolution, lastAppointment, isLoading } = useClinicalSummaryData(patientId, clinicId, true);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Resumo Clínico
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyData = alerts.length > 0 || lastEvolution || lastAppointment || specialtyName;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        Resumo Clínico
      </p>

      <div className="space-y-2.5">
        {/* Active specialty */}
        {specialtyName && (
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground text-xs shrink-0">Especialidade ativa</span>
            <Badge variant="secondary" className="text-[10px]">{specialtyName}</Badge>
          </div>
        )}

        {/* Clinical alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 text-xs p-1.5 rounded bg-destructive/5 border border-destructive/10"
              >
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                <span className="truncate text-destructive/90 font-medium">{alert.title}</span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 shrink-0 border-destructive/20 text-destructive/70"
                >
                  {getSeverityLabel(alert.severity)}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Last evolution */}
        {lastEvolution && (
          <div className="flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground">Última evolução</p>
              <p className="font-medium truncate">
                {(lastEvolution.professionals as any)?.full_name || "—"}
                {(lastEvolution.specialties as any)?.name && ` • ${(lastEvolution.specialties as any).name}`}
              </p>
              <p className="text-muted-foreground text-[10px]">
                {formatDistanceToNow(new Date(lastEvolution.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {/* Last procedure */}
        {lastAppointment && (lastAppointment.procedures as any)?.name && (
          <div className="flex items-start gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground">Último procedimento</p>
              <p className="font-medium truncate">{(lastAppointment.procedures as any).name}</p>
              <p className="text-muted-foreground text-[10px]">
                {lastAppointment.scheduled_date}
              </p>
            </div>
          </div>
        )}

        {!hasAnyData && (
          <p className="text-xs text-muted-foreground italic">Nenhum registro clínico encontrado.</p>
        )}

        {/* Link to timeline */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs h-7 px-2"
          onClick={() => {
            onCloseDrawer();
            navigate(`/app/prontuario/${patientId}?appointmentId=${appointmentId}`);
          }}
        >
          <span>Ver prontuário completo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
