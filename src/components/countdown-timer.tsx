'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  estimatedTimeMinutes: number;
  startTime: string; // ISO string
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ 
  estimatedTimeMinutes, 
  startTime, 
  onComplete,
  className = '' 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsed = now - start;
      const totalTimeMs = estimatedTimeMinutes * 60 * 1000;
      const remaining = Math.max(0, totalTimeMs - elapsed);
      
      return Math.floor(remaining / 1000); // Convert to seconds
    };

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onComplete?.();
      }
    };

    // Initial calculation
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [estimatedTimeMinutes, startTime, isExpired, onComplete]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getProgressPercentage = () => {
    const totalTimeSeconds = estimatedTimeMinutes * 60;
    return Math.max(0, Math.min(100, ((totalTimeSeconds - timeRemaining) / totalTimeSeconds) * 100));
  };

  if (isExpired) {
    return (
      <div className={`flex items-center space-x-2 text-orange-600 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Processing time exceeded</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">
          Time remaining: {formatTime(timeRemaining)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500">
        {Math.round(getProgressPercentage())}% complete
      </div>
    </div>
  );
}
