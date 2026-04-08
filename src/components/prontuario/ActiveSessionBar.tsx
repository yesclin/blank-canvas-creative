import { Clock, Pause, PlayCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useAppointmentSession, usePauseSession, useResumeSession } from "@/hooks/useAppointmentSession";
import { cn } from "@/lib/utils";

interface ActiveSessionBarProps {
  appointmentId: string;
  startedAt: string | null | undefined;
  onFinalize?: () => void;
  className?: string;
}

export function ActiveSessionBar({
  appointmentId,
  startedAt,
  onFinalize,
  className,
}: ActiveSessionBarProps) {
  const { data: session } = useAppointmentSession(appointmentId);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();

  const { formattedTime, isRunning } = useSessionTimer({
    startedAt,
    isPaused: session?.is_paused || false,
    totalPausedSeconds: session?.total_paused_seconds || 0,
    currentPauseStartedAt: session?.current_pause_started_at,
  });

  if (!startedAt) return null;

  const isPaused = session?.is_paused || false;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col gap-2 rounded-2xl border shadow-xl backdrop-blur-sm px-5 py-4 min-w-[240px] max-w-[320px] transition-colors duration-300",
        isPaused
          ? "bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700"
          : "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700",
        className
      )}
    >
      {/* Status label */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "h-2.5 w-2.5 rounded-full",
          isPaused
            ? "bg-amber-500 animate-pulse"
            : "bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"
        )} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isPaused ? "Pausado" : "Em atendimento"}
        </span>
      </div>

      {/* Timer */}
      <Badge
        variant="outline"
        className={cn(
          "gap-2 font-mono tabular-nums text-xl px-4 py-2 justify-center border-0 bg-transparent",
          isPaused
            ? "text-amber-800 dark:text-amber-200"
            : "text-emerald-800 dark:text-emerald-200"
        )}
      >
        {isPaused ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Clock className="h-5 w-5" />
        )}
        {formattedTime}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isPaused ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900"
            onClick={() => resumeSession.mutate({ appointmentId })}
            disabled={resumeSession.isPending}
          >
            <PlayCircle className="h-4 w-4" />
            Retomar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900"
            onClick={() => pauseSession.mutate({ appointmentId })}
            disabled={pauseSession.isPending}
          >
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900"
          onClick={onFinalize}
        >
          <Square className="h-4 w-4" />
          Finalizar
        </Button>
      </div>
    </div>
  );
}
