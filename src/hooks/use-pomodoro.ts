// Hook for Pomodoro timer logic and state management

import { useEffect, useCallback, useRef, useState } from 'react';
import { usePomodoroStore, usePomodoroState, usePomodoroConfig } from '@/stores/pomodoro-store';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { CyclePhase, PomodoroSession, PomodoroEvents } from '@/types/pomodoro';

export interface UsePomodoroOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // in seconds
  enableNotifications?: boolean;
  enableSound?: boolean;
  onCycleStart?: (phase: CyclePhase, cycleNumber: number) => void;
  onCyclePause?: () => void;
  onCycleResume?: () => void;
  onCycleComplete?: (session: PomodoroSession) => void;
  onCycleSkip?: (phase: CyclePhase) => void;
  onPhaseChange?: (fromPhase: CyclePhase, toPhase: CyclePhase) => void;
  onGoalReached?: (completedSessions: number, goal: number) => void;
  onStreakUpdate?: (currentStreak: number, longestStreak: number) => void;
}

export interface UsePomodoroReturn {
  // State
  currentPhase: CyclePhase;
  nextPhase: CyclePhase;
  currentCycle: number;
  isActive: boolean;
  isPaused: boolean;
  elapsedTime: number;
  remainingTime: number;
  formattedTime: string;
  progress: number; // 0-100
  
  // Phase info
  phaseDuration: number; // in minutes
  phaseLabel: string;
  phaseColor: string;
  
  // Progress
  todayProgress: {
    completed: number;
    goal: number;
    percentage: number;
  };
  
  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
  
  // Configuration
  updateConfig: (config: any) => void;
  
  // State checks
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canComplete: boolean;
  canSkip: boolean;
  canReset: boolean;
}

export const usePomodoro = (options: UsePomodoroOptions = {}): UsePomodoroReturn => {
  const {
    autoSave = true,
    autoSaveInterval = 30,
    enableNotifications = true,
    enableSound = true,
    onCycleStart,
    onCyclePause,
    onCycleResume,
    onCycleComplete,
    onCycleSkip,
    onPhaseChange,
    onGoalReached,
    onStreakUpdate,
  } = options;

  // Store state and actions
  const {
    currentPhase,
    nextPhase,
    currentCycle,
    isActive,
    isPaused,
    startCycle,
    startBreak,
    pauseCycle,
    resumeCycle,
    completeCycle,
    skipCurrentPhase,
    resetCycle,
    updateConfig,
    getCurrentPhaseDuration,
    getTodayProgress,
  } = usePomodoroStore();

  const config = usePomodoroConfig();

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phaseStartTime, setPhaseStartTime] = useState<Date | null>(null);
  const [lastPhase, setLastPhase] = useState<CyclePhase>(currentPhase);

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();

  // Page visibility
  const isPageVisible = usePageVisibility();

  // Phase configuration
  const phaseLabels: Record<CyclePhase, string> = {
    work: 'Work Session',
    'short-break': 'Short Break',
    'long-break': 'Long Break',
  };

  const phaseColors: Record<CyclePhase, string> = {
    work: '#ef4444',
    'short-break': '#22c55e',
    'long-break': '#3b82f6',
  };

  // Calculate derived values
  const phaseDuration = getCurrentPhaseDuration();
  const phaseDurationSeconds = phaseDuration * 60;
  const remainingTime = Math.max(0, phaseDurationSeconds - elapsedTime);
  const progress = phaseDurationSeconds > 0 ? (elapsedTime / phaseDurationSeconds) * 100 : 0;
  const todayProgress = getTodayProgress();

  // Format time
  const formatTime = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Timer tick function
  const tick = useCallback(() => {
    if (isActive && !isPaused && phaseStartTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - phaseStartTime.getTime()) / 1000);
      setElapsedTime(elapsed);

      // Auto-complete when time is up
      if (elapsed >= phaseDurationSeconds && phaseDurationSeconds > 0) {
        completeCycle();
        if (onCycleComplete) {
          const session: PomodoroSession = {
            id: crypto.randomUUID(),
            date: new Date(),
            phase: currentPhase,
            duration: phaseDurationSeconds,
            completed: true,
            cycleNumber: currentCycle,
          };
          onCycleComplete(session);
        }
        setElapsedTime(0);
        setPhaseStartTime(null);
      }
    }
  }, [
    isActive,
    isPaused,
    phaseStartTime,
    phaseDurationSeconds,
    completeCycle,
    onCycleComplete,
    currentPhase,
    currentCycle,
  ]);

  // Start timer interval
  useEffect(() => {
    if (isActive && !isPaused) {
      timerIntervalRef.current = setInterval(tick, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isActive, isPaused, tick]);

  // Handle phase changes
  useEffect(() => {
    if (currentPhase !== lastPhase) {
      if (onPhaseChange) {
        onPhaseChange(lastPhase, currentPhase);
      }
      setLastPhase(currentPhase);
      setElapsedTime(0);
      setPhaseStartTime(null);
    }
  }, [currentPhase, lastPhase, onPhaseChange]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isPageVisible && isActive && !isPaused && phaseStartTime) {
      // Store the time when page became hidden
      const now = Date.now();
      const backgroundElapsed = Math.floor((now - phaseStartTime.getTime()) / 1000);
      setElapsedTime(backgroundElapsed);
    } else if (isPageVisible && isActive && !isPaused && phaseStartTime) {
      // Resync when page becomes visible
      tick();
    }
  }, [isPageVisible, isActive, isPaused, phaseStartTime, tick]);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Action handlers
  const start = useCallback(() => {
    if (!isActive && currentPhase === 'work') {
      startCycle();
    } else if (!isActive && currentPhase !== 'work') {
      startBreak(currentPhase);
    }
    
    setPhaseStartTime(new Date());
    setElapsedTime(0);
    
    if (onCycleStart) {
      onCycleStart(currentPhase, currentCycle);
    }
  }, [isActive, currentPhase, currentCycle, startCycle, startBreak, onCycleStart]);

  const pause = useCallback(() => {
    pauseCycle();
    if (onCyclePause) {
      onCyclePause();
    }
  }, [pauseCycle, onCyclePause]);

  const resume = useCallback(() => {
    if (phaseStartTime) {
      // Adjust start time to account for pause duration
      const now = new Date();
      const pausedDuration = elapsedTime * 1000; // Convert back to milliseconds
      const adjustedStartTime = new Date(now.getTime() - pausedDuration);
      setPhaseStartTime(adjustedStartTime);
    }
    
    resumeCycle();
    if (onCycleResume) {
      onCycleResume();
    }
  }, [phaseStartTime, elapsedTime, resumeCycle, onCycleResume]);

  const complete = useCallback(() => {
    completeCycle();
    
    if (onCycleComplete) {
      const session: PomodoroSession = {
        id: crypto.randomUUID(),
        date: new Date(),
        phase: currentPhase,
        duration: elapsedTime,
        completed: true,
        cycleNumber: currentCycle,
      };
      onCycleComplete(session);
    }
    
    setElapsedTime(0);
    setPhaseStartTime(null);
  }, [completeCycle, onCycleComplete, currentPhase, elapsedTime, currentCycle]);

  const skip = useCallback(() => {
    if (config.allowSkipBreaks || currentPhase === 'work') {
      skipCurrentPhase();
      
      if (onCycleSkip) {
        onCycleSkip(currentPhase);
      }
      
      setElapsedTime(0);
      setPhaseStartTime(null);
    }
  }, [config.allowSkipBreaks, currentPhase, skipCurrentPhase, onCycleSkip]);

  const reset = useCallback(() => {
    resetCycle();
    setElapsedTime(0);
    setPhaseStartTime(null);
  }, [resetCycle]);

  // State checks
  const canStart = !isActive;
  const canPause = isActive && !isPaused;
  const canResume = isActive && isPaused;
  const canComplete = isActive;
  const canSkip = isActive && (currentPhase === 'work' || config.allowSkipBreaks);
  const canReset = true;

  return {
    // State
    currentPhase,
    nextPhase,
    currentCycle,
    isActive,
    isPaused,
    elapsedTime,
    remainingTime,
    formattedTime: formatTime(remainingTime),
    progress,
    
    // Phase info
    phaseDuration,
    phaseLabel: phaseLabels[currentPhase as CyclePhase],
    phaseColor: phaseColors[currentPhase as CyclePhase],
    
    // Progress
    todayProgress,
    
    // Actions
    start,
    pause,
    resume,
    complete,
    skip,
    reset,
    
    // Configuration
    updateConfig,
    
    // State checks
    canStart,
    canPause,
    canResume,
    canComplete,
    canSkip,
    canReset,
  };
};

// Simplified hook for just phase display
export const usePomodoroDisplay = () => {
  const { currentPhase, currentCycle, isActive, isPaused } = usePomodoroState();
  const config = usePomodoroConfig();
  
  const phaseLabels: Record<CyclePhase, string> = {
    work: 'Work',
    'short-break': 'Break',
    'long-break': 'Long Break',
  };

  const phaseColors: Record<CyclePhase, string> = {
    work: 'text-red-600',
    'short-break': 'text-green-600',
    'long-break': 'text-blue-600',
  };

  return {
    currentPhase,
    currentCycle,
    isActive,
    isPaused,
    phaseLabel: phaseLabels[currentPhase as CyclePhase],
    phaseColor: phaseColors[currentPhase as CyclePhase],
    config,
  };
};
