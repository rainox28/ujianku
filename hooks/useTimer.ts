// hooks/useTimer.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerOptions {
  initialMinutes: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isWarning: boolean;
  isDanger: boolean;
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
  const [isRunning, setIsRunning] = useState(false); // Start false, will be set by effect
  const onTimeUpRef = useRef(onTimeUp);
  const hasStartedRef = useRef(false);

  // Update callback ref
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // ✅ FIX: React to autoStart changes
  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      setIsRunning(true);
      hasStartedRef.current = true;
    }
  }, [autoStart]);

  // ✅ FIX: React to initialMinutes changes (reset timer)
  useEffect(() => {
    setTimeRemaining(initialMinutes * 60);
  }, [initialMinutes]);

  // Countdown effect
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

  const start = useCallback(() => {
    setIsRunning(true);
    hasStartedRef.current = true;
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setTimeRemaining(initialMinutes * 60);
    setIsRunning(false);
    hasStartedRef.current = false;
  }, [initialMinutes]);

  // Format time as MM:SS or HH:MM:SS if > 60 minutes
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    timeRemaining,
    isRunning,
    isWarning: timeRemaining <= 300 && timeRemaining > 60,
    isDanger: timeRemaining <= 60,
    formattedTime: formatTime(timeRemaining),
    start,
    pause,
    reset,
  };
}
