import { useState, useEffect, useCallback } from "react";

interface UseSessionTimerProps {
  startedAt: string | null | undefined;
  isPaused: boolean;
  totalPausedSeconds: number;
  currentPauseStartedAt: string | null | undefined;
}

export function useSessionTimer({
  startedAt,
  isPaused,
  totalPausedSeconds,
  currentPauseStartedAt,
}: UseSessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  const calculateElapsed = useCallback(() => {
    if (!startedAt) return 0;
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const totalSeconds = Math.floor((now - start) / 1000);

    let paused = totalPausedSeconds || 0;
    // If currently paused, add the ongoing pause time
    if (isPaused && currentPauseStartedAt) {
      const pauseStart = new Date(currentPauseStartedAt).getTime();
      paused += Math.floor((now - pauseStart) / 1000);
    }

    return Math.max(0, totalSeconds - paused);
  }, [startedAt, isPaused, totalPausedSeconds, currentPauseStartedAt]);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    setElapsed(calculateElapsed());

    // Only tick if not paused
    if (!isPaused) {
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startedAt, isPaused, calculateElapsed]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return {
    elapsedSeconds: elapsed,
    formattedTime: formatTime(elapsed),
    isRunning: !!startedAt && !isPaused,
  };
}
