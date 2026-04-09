import { Clock, Pause, PlayCircle, Square, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { useAppointmentSession, usePauseSession, useResumeSession } from "@/hooks/useAppointmentSession";
import { cn } from "@/lib/utils";

interface ActiveSessionBarProps {
  appointmentId: string;
  startedAt: string | null | undefined;
  onFinalize?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ActiveSessionBar({
  appointmentId,
  startedAt,
  onFinalize,
  onCancel,
  className,
}: ActiveSessionBarProps) {
  const { data: session } = useAppointmentSession(appointmentId);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();
  const effectiveStartedAt = startedAt ?? session?.created_at;

  const { formattedTime } = useSessionTimer({
    startedAt: effectiveStartedAt,
    isPaused: session?.is_paused || false,
    totalPausedSeconds: session?.total_paused_seconds || 0,
    currentPauseStartedAt: session?.current_pause_started_at,
  });

  if (!effectiveStartedAt) return null;

  const isPaused = session?.is_paused || false;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* Left: Timer + Status */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                isPaused
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"
              )}
            />
            {isPaused ? (
              <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span
              className={cn(
                "font-mono tabular-nums text-lg font-semibold tracking-wide",
                isPaused
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-emerald-700 dark:text-emerald-300"
              )}
            >
              {formattedTime}
            </span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1">
            <Lock className="h-3 w-3" />
            <span>{isPaused ? "Pausado" : "Privado"}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {/* Pause / Resume */}
          {isPaused ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
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
              className="gap-1.5"
              onClick={() => pauseSession.mutate({ appointmentId })}
              disabled={pauseSession.isPending}
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
          )}

          {/* Cancel */}
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}

          {/* Finalize */}
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={onFinalize}
          >
            <Square className="h-4 w-4" />
            Finalizar atendimento
          </Button>
        </div>
      </div>
    </div>
  );
}
