import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, User, Stethoscope, FileText, Clock, DollarSign, Video, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientAvatar } from "./PatientAvatar";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";
import { useAppointmentPreviewData } from "@/hooks/useAppointmentPreviewData";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { usePermissions } from "@/hooks/usePermissions";
import type { Appointment } from "@/types/agenda";
import { statusLabels, statusColors } from "@/types/agenda";

interface AppointmentHoverPreviewProps {
  appointment: Appointment;
  children: React.ReactNode;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AppointmentHoverPreview({ appointment, children }: AppointmentHoverPreviewProps) {
  const preview = useAppointmentPreviewData(appointment);
  const financial = useAppointmentFinancialStatus(appointment);
  const { role } = usePermissions();
  const isReceptionist = role === "recepcionista";

  if (!preview) return <>{children}</>;

  return (
    <HoverCard openDelay={350} closeDelay={150}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 p-0 hidden md:block rounded-xl shadow-xl border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-center gap-3 bg-muted/30">
          <PatientAvatar
            name={preview.patientName}
            avatarUrl={preview.patientAvatarUrl}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{preview.patientName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusColors[appointment.status])}>
                {statusLabels[appointment.status]}
              </Badge>
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Atendimento */}
        <div className="px-4 py-2.5 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Atendimento</p>
          <PreviewRow icon={Clock} value={`${appointment.start_time.slice(0,5)} – ${appointment.end_time.slice(0,5)}`} />
          {preview.professionalName && <PreviewRow icon={User} value={preview.professionalName} />}
          {preview.specialtyName && <PreviewRow icon={Stethoscope} value={preview.specialtyName} />}
          {preview.procedureName && <PreviewRow icon={FileText} value={preview.procedureName} />}
          {appointment.care_mode !== "presencial" && (
            <PreviewRow icon={Video} value={preview.careModeLabel} />
          )}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
              {preview.appointmentTypeLabel}
            </Badge>
            {preview.isFirstVisit && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">1ª Consulta</Badge>
            )}
            {preview.isReturn && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Retorno</Badge>
            )}
            {preview.isFitIn && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Encaixe</Badge>
            )}
            {preview.bookingSourceLabel && preview.bookingSourceLabel !== "Manual" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                {preview.bookingSourceLabel}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Financeiro */}
        <div className="px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Financeiro</p>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-md bg-muted/50 p-1.5">
              <p className="text-[10px] text-muted-foreground">Previsto</p>
              <p className="text-xs font-semibold">{formatCurrency(financial.amountExpected)}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-1.5">
              <p className="text-[10px] text-muted-foreground">Recebido</p>
              <p className="text-xs font-semibold text-green-600">{formatCurrency(financial.amountReceived)}</p>
            </div>
            {financial.amountDue > 0 && (
              <div className="rounded-md bg-destructive/5 p-1.5">
                <p className="text-[10px] text-muted-foreground">Pendente</p>
                <p className="text-xs font-semibold text-red-600">{formatCurrency(financial.amountDue)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contato */}
        {(preview.patientPhone || preview.patientAge !== undefined) && (
          <>
            <Separator />
            <div className="px-4 py-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contato</p>
              {preview.patientPhone && <PreviewRow icon={Phone} value={preview.patientPhone} />}
              {preview.patientAge !== undefined && (
                <PreviewRow icon={Calendar} value={`${preview.patientAge} anos`} />
              )}
            </div>
          </>
        )}

        {/* Clinical alert */}
        {!isReceptionist && appointment.patient?.has_clinical_alert && (
          <>
            <Separator />
            <div className="px-4 py-2.5">
              <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10">
                <span className="text-destructive text-xs">⚠</span>
                <p className="text-xs text-destructive/90 line-clamp-2">{appointment.patient.clinical_alert_text}</p>
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {preview.notes && (
          <>
            <Separator />
            <div className="px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Observações</p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{preview.notes}</p>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

function PreviewRow({ icon: Icon, value }: { icon: typeof Clock; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
