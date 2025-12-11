// hooks/useTimer.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerOptions {
  initialMinutes: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number; // dalam detik
  isRunning: boolean;
  isWarning: boolean; // < 5 menit
  isDanger: boolean; // < 1 menit
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer({
  initialMinutes,
  onTimeUp,
  autoStart = true,
}: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onTimeUpRef = useRef(onTimeUp);

  // Update ref when callback changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTimeRemaining(initialMinutes * 60);
    setIsRunning(false);
  }, [initialMinutes]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    timeRemaining,
    isRunning,
    isWarning: timeRemaining <= 300 && timeRemaining > 60, // 5 menit
    isDanger: timeRemaining <= 60, // 1 menit
    formattedTime: formatTime(timeRemaining),
    start,
    pause,
    reset,
  };
}
