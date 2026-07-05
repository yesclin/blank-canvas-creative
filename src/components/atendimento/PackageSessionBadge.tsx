import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointmentPackageContext } from "@/hooks/finance/useTreatmentPackageIntegration";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

interface Props {
  appointmentId: string | null | undefined;
  patientId?: string | null;
  /** Se true, mostra CTA para agendar próxima sessão (usar após finalizar) */
  showScheduleNext?: boolean;
  compact?: boolean;
}

/**
 * Exibe contexto do pacote quando o atendimento está vinculado a um pacote.
 * Renderiza null se não houver vínculo.
 */
export function PackageSessionBadge({ appointmentId, showScheduleNext = false, compact = false }: Props) {
  const navigate = useNavigate();
  const { data: ctx } = useAppointmentPackageContext(appointmentId);
  if (!ctx) return null;

  const { package: pkg, session_index, session_total } = ctx;
  const balance = pkg.total_amount - pkg.paid_amount;
  const financeLabel = balance <= 0.009 ? "Quitado" : pkg.paid_amount > 0 ? "Parcial" : "Em aberto";
  const financeClass = balance <= 0.009 ? "text-emerald-600" : "text-amber-600";

  const openSchedule = () => {
    const params = new URLSearchParams();
    params.set("patient_id", pkg.patient_id);
    params.set("package_id", pkg.id);
    if (pkg.procedure_id) params.set("procedure_id", pkg.procedure_id);
    if (pkg.professional_id) params.set("professional_id", pkg.professional_id);
    navigate(`/app/agenda?${params.toString()}`);
  };

  if (compact) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Package className="h-3 w-3" />
        Sessão {session_index} de {session_total} · {pkg.name}
      </Badge>
    );
  }

  const remainingSessions = Math.max(0, pkg.total_sessions - pkg.used_sessions);
  const canScheduleNext = showScheduleNext && remainingSessions > 0 && pkg.status === "ativo";

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{pkg.name}</div>
              <div className="text-xs text-muted-foreground">
                {pkg.procedure_name ?? "—"} · <strong>Sessão {session_index} de {session_total}</strong>
              </div>
            </div>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Financeiro:</span>{" "}
            <span className={financeClass}>{financeLabel}</span>{" "}
            <span className="text-muted-foreground">· saldo {fmt(balance)}</span>
          </div>
          {canScheduleNext && (
            <Button size="sm" variant="outline" onClick={openSchedule}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Agendar próxima
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PackageSessionBadge;
