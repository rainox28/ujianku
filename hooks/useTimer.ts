"use client";

import { useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  /** Deadline in epoch ms, from the server. The countdown starts once this is set. */
  endsAt: number | null;
  onTimeUp?: () => void;
}

interface UseTimerReturn {
  timeRemaining: number;
  isWarning: boolean;
  isDanger: boolean;
  formattedTime: string;
}

function secondsUntil(endsAt: number) {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function useTimer({ endsAt, onTimeUp }: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    endsAt ? secondsUntil(endsAt) : 0
  );
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Recomputed from the deadline each tick, so a refresh or a throttled background tab cannot add time.
  useEffect(() => {
    if (endsAt === null) return;

    let fired = false;
    const tick = () => {
      const left = secondsUntil(endsAt);
      setTimeRemaining(left);
      if (left === 0 && !fired) {
        fired = true;
        onTimeUpRef.current?.();
      }
      return left;
    };

    if (tick() === 0) return;
    const interval = setInterval(() => {
      if (tick() === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return {
    timeRemaining,
    isWarning: timeRemaining <= 300 && timeRemaining > 60,
    isDanger: timeRemaining <= 60,
    formattedTime: formatTime(timeRemaining),
  };
}
