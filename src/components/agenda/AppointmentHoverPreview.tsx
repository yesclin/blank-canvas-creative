import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, User, Stethoscope, FileText, CreditCard, Video } from "lucide-react";
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

  // On mobile, just render children without hover
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 p-0 hidden md:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 flex items-center gap-3">
          <PatientAvatar
            name={preview.patientName}
            avatarUrl={preview.patientAvatarUrl}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{preview.patientName}</p>
            {preview.patientAge !== undefined && (
              <p className="text-xs text-muted-foreground">{preview.patientAge} anos</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className={cn("text-[10px]", statusColors[appointment.status])}>
                {statusLabels[appointment.status]}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="px-3 py-2 space-y-1.5">
          {preview.patientPhone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{preview.patientPhone}</span>
            </div>
          )}
          {preview.professionalName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span>{preview.professionalName}</span>
            </div>
          )}
          {preview.specialtyName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Stethoscope className="h-3 w-3 shrink-0" />
              <span>{preview.specialtyName}</span>
            </div>
          )}
          {preview.procedureName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              <span>{preview.procedureName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-3 w-3 shrink-0" />
            <span>{preview.paymentTypeLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-muted-foreground">Tipo:</span>
            <span>{preview.appointmentTypeLabel}</span>
          </div>
          {appointment.care_mode !== "presencial" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Video className="h-3 w-3 shrink-0" />
              <span>{preview.careModeLabel}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Financial */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status financeiro</span>
            <AppointmentPaymentBadge
              paymentStatus={financial.paymentStatus}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Valor previsto</span>
            <span className="font-medium">{formatCurrency(financial.amountExpected)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Recebido</span>
            <span className="font-medium text-green-600">{formatCurrency(financial.amountReceived)}</span>
          </div>
          {financial.amountDue > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pendente</span>
              <span className="font-medium text-red-600">{formatCurrency(financial.amountDue)}</span>
            </div>
          )}
        </div>

        {/* Clinical alert - hidden for receptionist */}
        {!isReceptionist && appointment.patient?.has_clinical_alert && (
          <>
            <Separator />
            <div className="px-3 py-2">
              <p className="text-xs text-destructive font-medium">⚠ Alerta clínico</p>
              <p className="text-xs text-destructive/80 line-clamp-2">{appointment.patient.clinical_alert_text}</p>
            </div>
          </>
        )}

        {/* Notes */}
        {preview.notes && (
          <>
            <Separator />
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{preview.notes}</p>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
