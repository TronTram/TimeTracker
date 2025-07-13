import { useEffect, useCallback, useRef } from 'react';
import { useTimerStore } from '@/stores/timer-store';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { SessionType } from '@/types/timer';

export interface UseTimerOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // in seconds
  onTick?: (elapsedTime: number, remainingTime: number) => void;
  onSessionComplete?: () => void;
  enableNotifications?: boolean;
}

export interface UseTimerReturn {
  // State
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentSession: any;
  elapsedTime: number;
  remainingTime: number;
  currentCycle: number;
  completedCycles: number;
  isBreakTime: boolean;
  nextSessionType: SessionType;
  
  // Actions
  start: (sessionType: SessionType, projectId?: string, description?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  addTime: (minutes: number) => void;
  complete: () => void;
  
  // State checks
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  
  // Auto-save status
  hasUnsavedChanges: boolean;
}

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const {
    autoSave = true,
    autoSaveInterval = 30,
    onTick,
    onSessionComplete,
    enableNotifications = true,
  } = options;

  // Get store state and actions
  const {
    status,
    currentSession,
    elapsedTime,
    remainingTime,
    currentCycle,
    completedCycles,
    isBreakTime,
    nextSessionType,
    hasUnsavedChanges,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    adjustTime,
    updateElapsedTime,
    completeCurrentSession,
    markSaved,
    resetState,
  } = useTimerStore();

  // Refs for intervals
  const tickIntervalRef = useRef<NodeJS.Timeout>();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();

  // Page visibility hook
  const isPageVisible = usePageVisibility();

  // Tick function to update elapsed time
  const tick = useCallback(() => {
    if (status === 'running' && currentSession) {
      const now = Date.now();
      const startTime = currentSession.startTime;
      
      if (startTime) {
        const elapsed = Math.floor((now - new Date(startTime).getTime()) / 1000);
        const remaining = Math.max(0, currentSession.targetDuration - elapsed);
        
        updateElapsedTime(elapsed, remaining);
        
        // Call onTick callback if provided
        if (onTick) {
          onTick(elapsed, remaining);
        }
        
        // Auto-complete session if time is up
        if (remaining === 0 && currentSession.targetDuration > 0) {
          completeCurrentSession();
          if (onSessionComplete) {
            onSessionComplete();
          }
        }
      }
    }
  }, [status, currentSession, updateElapsedTime, onTick, completeCurrentSession, onSessionComplete]);

  // Start tick interval when timer is running
  useEffect(() => {
    if (status === 'running') {
      tickIntervalRef.current = setInterval(tick, 100); // Update every 100ms
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [status, tick]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      autoSaveIntervalRef.current = setTimeout(() => {
        // In a real app, this would save to backend
        markSaved();
      }, autoSaveInterval * 1000);
    }
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, markSaved]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isPageVisible && status === 'running') {
      // Timer continues running in background
      console.log('Timer running in background');
    } else if (isPageVisible && status === 'running') {
      // Resync timer when page becomes visible
      tick();
    }
  }, [isPageVisible, status, tick]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Action wrapper functions
  const start = useCallback((sessionType: SessionType, projectId?: string, description?: string) => {
    startTimer(sessionType, projectId, description);
  }, [startTimer]);

  const pause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const resume = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  const stop = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  const reset = useCallback(() => {
    resetState();
  }, [resetState]);

  const addTime = useCallback((minutes: number) => {
    adjustTime(minutes * 60); // Convert minutes to seconds
  }, [adjustTime]);

  const complete = useCallback(() => {
    completeCurrentSession();
    if (onSessionComplete) {
      onSessionComplete();
    }
  }, [completeCurrentSession, onSessionComplete]);

  // State checks
  const canStart = status === 'idle';
  const canPause = status === 'running';
  const canResume = status === 'paused';
  const canStop = status === 'running' || status === 'paused';

  return {
    // State
    status,
    currentSession,
    elapsedTime,
    remainingTime,
    currentCycle,
    completedCycles,
    isBreakTime,
    nextSessionType,
    
    // Actions
    start,
    pause,
    resume,
    stop,
    reset,
    addTime,
    complete,
    
    // State checks
    canStart,
    canPause,
    canResume,
    canStop,
    
    // Auto-save status
    hasUnsavedChanges,
  };
};
