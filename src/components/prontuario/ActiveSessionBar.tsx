import { Clock, Pause, PlayCircle, Square, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useAppointmentSession, usePauseSession, useResumeSession } from "@/hooks/useAppointmentSession";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
        "flex items-center justify-between gap-3 px-4 py-2 border-b",
        isPaused
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
        className
      )}
    >
      {/* Left: Status + Timer */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 font-mono tabular-nums text-sm px-3 py-1",
            isPaused
              ? "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700 animate-pulse"
              : "border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700"
          )}
        >
          {isPaused ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          {formattedTime}
        </Badge>
        <span className="text-sm font-medium text-foreground">
          {isPaused ? "Atendimento pausado" : "Atendimento em andamento"}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {isPaused ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900"
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
            className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900"
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
