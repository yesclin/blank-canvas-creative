import { Clock, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { cn } from "@/lib/utils";

interface SessionTimerBadgeProps {
  startedAt: string | null | undefined;
  isPaused: boolean;
  totalPausedSeconds: number;
  currentPauseStartedAt: string | null | undefined;
  size?: "sm" | "lg";
}

export function SessionTimerBadge({
  startedAt,
  isPaused,
  totalPausedSeconds,
  currentPauseStartedAt,
  size = "sm",
}: SessionTimerBadgeProps) {
  const { formattedTime, isRunning } = useSessionTimer({
    startedAt,
    isPaused,
    totalPausedSeconds,
    currentPauseStartedAt,
  });

  if (!startedAt) return null;

  const isLarge = size === "lg";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-mono tabular-nums",
        isPaused
          ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 animate-pulse"
          : isRunning
            ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            : "border-muted",
        isLarge ? "text-base px-3 py-1.5" : "text-[11px] px-2 py-0.5"
      )}
    >
      {isPaused ? (
        <Pause className={cn(isLarge ? "h-4 w-4" : "h-3 w-3")} />
      ) : (
        <Clock className={cn(isLarge ? "h-4 w-4" : "h-3 w-3")} />
      )}
      {formattedTime}
    </Badge>
  );
}
