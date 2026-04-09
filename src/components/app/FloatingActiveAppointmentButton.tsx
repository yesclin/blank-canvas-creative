import { Stethoscope } from "lucide-react";
import { useGlobalActiveAppointment } from "@/contexts/GlobalActiveAppointmentContext";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useAppointmentSession } from "@/hooks/useAppointmentSession";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function MiniTimer({ appointmentId, startedAt }: { appointmentId: string; startedAt?: string | null }) {
  const { data: session } = useAppointmentSession(appointmentId);
  const effectiveStartedAt = startedAt ?? session?.created_at;

  const { formattedTime } = useSessionTimer({
    startedAt: effectiveStartedAt,
    isPaused: session?.is_paused || false,
    totalPausedSeconds: session?.total_paused_seconds || 0,
    currentPauseStartedAt: session?.current_pause_started_at,
  });

  if (!effectiveStartedAt) return null;

  return (
    <span className="font-mono text-[10px] tabular-nums leading-none">
      {formattedTime}
    </span>
  );
}

export function FloatingActiveAppointmentButton() {
  const { appointments, openDrawer } = useGlobalActiveAppointment();

  if (appointments.length === 0) return null;

  const primary = appointments[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => openDrawer(primary)}
            className={cn(
              "relative flex items-center gap-2 rounded-full shadow-lg",
              "bg-primary text-primary-foreground",
              "px-4 py-3 transition-all duration-300",
              "hover:shadow-xl hover:scale-105 active:scale-95",
              "animate-in fade-in slide-in-from-bottom-4 duration-500"
            )}
          >
            <Stethoscope className="h-5 w-5 shrink-0" />
            <div className="flex flex-col items-start">
              <MiniTimer appointmentId={primary.id} startedAt={primary.started_at} />
            </div>

            {/* Badge for multiple */}
            {appointments.length > 1 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold ring-2 ring-background">
                {appointments.length}
              </span>
            )}

            {/* Pulse indicator */}
            <span className="absolute -top-0.5 -left-0.5 h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>
            {appointments.length === 1
              ? "Atendimento em andamento"
              : `${appointments.length} atendimentos em andamento`}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
