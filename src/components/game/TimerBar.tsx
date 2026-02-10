'use client';

import { useEffect, useState } from 'react';

interface TimerBarProps {
  /** Total time in seconds */
  duration: number;
  /** Time remaining in seconds (optional - will auto-decrement if not provided) */
  timeRemaining?: number;
  /** Callback when timer reaches 0 */
  onTimeout?: () => void;
  /** Whether the timer is paused */
  paused?: boolean;
  /** Custom color for the progress bar */
  color?: 'gold' | 'success' | 'danger';
}

export function TimerBar({
  duration,
  timeRemaining: externalTimeRemaining,
  onTimeout,
  paused = false,
  color = 'gold',
}: TimerBarProps) {
  const [internalTime, setInternalTime] = useState(duration);
  
  // Use external time if provided, otherwise use internal
  const timeRemaining = externalTimeRemaining ?? internalTime;
  const percentage = (timeRemaining / duration) * 100;

  // Auto-decrement timer if no external time provided
  useEffect(() => {
    if (externalTimeRemaining !== undefined || paused) return;

    const interval = setInterval(() => {
      setInternalTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [externalTimeRemaining, paused, onTimeout]);

  // Reset internal timer when duration changes
  useEffect(() => {
    setInternalTime(duration);
  }, [duration]);

  // Determine color based on remaining time
  function getColorClass() {
    if (color === 'danger' || percentage <= 20) {
      return 'bg-danger';
    }
    if (color === 'success') {
      return 'bg-success';
    }
    if (percentage <= 40) {
      return 'bg-warning';
    }
    return 'bg-gold';
  }

  // Format time as MM:SS
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="w-full max-w-[280px]">
      {/* Time display */}
      <div className="text-center text-white/70 text-sm mb-1 font-mono">
        {formatTime(timeRemaining)}
      </div>
      
      {/* Progress bar container */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        {/* Progress bar fill */}
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
