import { useOutletContext, useSearchParams } from "react-router-dom";
import { PublicClinicData } from "@/hooks/usePublicClinic";
import { CheckCircle2, CalendarCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function BookingConfirmationStep() {
  const { clinic } = useOutletContext<{ clinic: PublicClinicData }>();
  const [searchParams] = useSearchParams();

  const bookingRef = searchParams.get("ref") || "";
  const patientName = searchParams.get("name") || "";
  const dateStr = searchParams.get("date") || "";
  const startTime = searchParams.get("start") || "";
  const endTime = searchParams.get("end") || "";

  const settings = clinic.public_booking_settings || {};
  const confirmationMessage = settings.confirmation_message || "Seu agendamento foi realizado com sucesso! Você receberá uma confirmação em breve.";

  let displayDate = dateStr;
  try {
    const d = new Date(dateStr + "T12:00:00");
    displayDate = format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {}

  const copyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    toast.success("Protocolo copiado!");
  };

  return (
    <div className="space-y-8 py-8">
      {/* Success icon */}
      <div className="text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{confirmationMessage}</p>
      </div>

      {/* Booking details */}
      <div className="rounded-xl border bg-card p-6 space-y-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 text-primary">
          <CalendarCheck className="h-5 w-5" />
          <span className="font-semibold">Detalhes do Agendamento</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paciente</span>
            <span className="font-medium text-foreground">{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium text-foreground capitalize">{displayDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horário</span>
            <span className="font-medium text-foreground">{startTime} — {endTime}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-muted-foreground">Protocolo</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary">{bookingRef}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyRef}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {clinic.phone && (
        <p className="text-center text-xs text-muted-foreground">
          Dúvidas? Entre em contato: <strong>{clinic.phone}</strong>
        </p>
      )}
    </div>
  );
}
