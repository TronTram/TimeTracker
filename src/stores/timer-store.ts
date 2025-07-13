import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { TimerService } from '@/services/timer-service';
import { 
  TimerStore, 
  TimerState, 
  SessionType, 
  TimerSession,
  TimerConfig,
  TimerError,
  TIMER_ERROR_CODES
} from '@/types/timer';
import { STORAGE_KEYS } from '@/lib/constants';

// Default timer configuration
const defaultConfig: TimerConfig = {
  workDuration: 25, // 25 minutes  
  shortBreakDuration: 5, // 5 minutes
  longBreakDuration: 15, // 15 minutes
  longBreakInterval: 4, // Every 4 work sessions
  focusDuration: 50, // 50 minutes
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  sessionHistory: [],
};

// Initial state
const initialState: TimerState = {
  status: 'idle',
  currentSession: null,
  startTime: null,
  pausedTime: null,
  elapsedTime: 0,
  remainingTime: 0,
  sessionHistory: [],
  config: defaultConfig,
  currentCycle: 0,
  completedCycles: 0,
  isBreakTime: false,
  nextSessionType: 'work',
  hasUnsavedChanges: false,
  lastSaveTime: null,
  isPageVisible: true,
  backgroundStartTime: null,
};

// Create timer service instance
let timerService: TimerService | null = null;

export const useTimerStore = create<TimerStore>()(
  persist(
    immer<TimerStore>((set, get) => ({
      ...initialState,
      
      startTimer: (sessionType: SessionType, projectId?: string, description?: string) => {
        set((state) => {
          if (state.status === 'running') {
            throw new TimerError(
              'Timer is already running',
              TIMER_ERROR_CODES.SESSION_ALREADY_RUNNING
            );
          }
          
          try {
            // Initialize timer service if needed
            if (!timerService) {
              timerService = new TimerService(state.config);
            }
            
            const now = new Date();
            const session = timerService.createSession(sessionType, projectId, description);
          
          state.status = 'running';
          state.currentSession = session;
          state.startTime = now;
          state.pausedTime = null;
          state.elapsedTime = 0;
          state.remainingTime = session.targetDuration;
          state.hasUnsavedChanges = true;
          state.lastSaveTime = null;
          
          // Update cycle tracking for Pomodoro
          if (session.isPomodoro) {
            if (sessionType === 'work') {
              state.isBreakTime = false;
              state.currentCycle = state.currentCycle + 1;
              state.nextSessionType = state.currentCycle % state.config.longBreakInterval === 0 
                ? 'long-break' 
                : 'short-break';
            } else {
              state.isBreakTime = true;
              state.nextSessionType = 'work';
            }
          } else {
            state.isBreakTime = false;
            state.nextSessionType = 'work';
          }
          } catch (error) {
            console.error('Error starting timer:', error);
            throw error;
          }
        });
      },

      pauseTimer: () => {
        set((state) => {
          if (state.status !== 'running') {
            throw new TimerError(
              'Cannot pause timer that is not running',
              TIMER_ERROR_CODES.INVALID_DURATION
            );
          }
          
          state.status = 'paused';
          state.pausedTime = new Date();
          state.hasUnsavedChanges = true;
        });
      },

      resumeTimer: () => {
        set((state) => {
          if (state.status !== 'paused') {
            throw new TimerError(
              'Cannot resume timer that is not paused',
              TIMER_ERROR_CODES.INVALID_DURATION
            );
          }
          
          if (state.pausedTime && state.startTime) {
            // Adjust start time to account for pause duration
            const pauseDuration = Date.now() - state.pausedTime.getTime();
            state.startTime = new Date(state.startTime.getTime() + pauseDuration);
          }
          
          state.status = 'running';
          state.pausedTime = null;
          state.hasUnsavedChanges = true;
        });
      },

      stopTimer: () => {
        set((state) => {
          if (state.status === 'idle') {
            return; // Already stopped
          }
          
          const endTime = new Date();
          
          if (state.currentSession && state.startTime) {
            // Complete the session
            const actualDuration = Math.floor((endTime.getTime() - state.startTime.getTime()) / 1000);
            
            state.currentSession = {
              ...state.currentSession,
              endTime,
              duration: actualDuration,
              isCompleted: true,
            };
            
            // Add to session history
            state.sessionHistory.push(state.currentSession);
            
            // Update cycle completion
            if (state.currentSession.isPomodoro && state.currentSession.sessionType === 'work') {
              state.completedCycles = state.completedCycles + 1;
            }
          }
          
          // Reset timer state
          state.status = 'idle';
          state.currentSession = null;
          state.startTime = null;
          state.pausedTime = null;
          state.elapsedTime = 0;
          state.remainingTime = 0;
          state.hasUnsavedChanges = true;
        });
      },

      adjustTime: (adjustment: number) => {
        set((state) => {
          if (state.status !== 'running' && state.status !== 'paused') {
            throw new TimerError(
              'Cannot adjust time when timer is not active',
              TIMER_ERROR_CODES.INVALID_DURATION
            );
          }
          
          if (state.startTime && state.currentSession) {
            const adjustmentMs = adjustment * 1000;
            state.startTime = new Date(state.startTime.getTime() - adjustmentMs);
            
            // Recalculate remaining time
            const elapsed = Math.floor((Date.now() - state.startTime.getTime()) / 1000);
            state.elapsedTime = elapsed;
            state.remainingTime = Math.max(0, state.currentSession.targetDuration - elapsed);
            state.hasUnsavedChanges = true;
          }
        });
      },

      updateElapsedTime: (elapsedTime: number, remainingTime: number) => {
        set((state) => {
          state.elapsedTime = elapsedTime;
          state.remainingTime = remainingTime;
        });
      },

      updateConfig: (newConfig: Partial<TimerConfig>) => {
        set((state) => {
          state.config = { ...state.config, ...newConfig };
          state.hasUnsavedChanges = true;
        });
      },

      addSessionToHistory: (session: TimerSession) => {
        set((state) => {
          state.sessionHistory.push(session);
          state.hasUnsavedChanges = true;
        });
      },

      clearSessionHistory: () => {
        set((state) => {
          state.sessionHistory = [];
          state.hasUnsavedChanges = true;
        });
      },

      markSaved: () => {
        set((state) => {
          state.hasUnsavedChanges = false;
          state.lastSaveTime = new Date();
        });
      },

      completeCurrentSession: () => {
        set((state) => {
          if (state.currentSession) {
            const now = new Date();
            state.currentSession = {
              ...state.currentSession,
              endTime: now,
              isCompleted: true,
            };
            
            // Add to history
            state.sessionHistory.push(state.currentSession);
            
            // Update cycle tracking
            if (state.currentSession.isPomodoro && state.currentSession.sessionType === 'work') {
              state.completedCycles = state.completedCycles + 1;
            }
            
            state.hasUnsavedChanges = true;
          }
        });
      },

      resetCycle: () => {
        set((state) => {
          state.currentCycle = 0;
          state.completedCycles = 0;
          state.isBreakTime = false;
          state.nextSessionType = 'work';
          state.hasUnsavedChanges = true;
        });
      },

      resetState: () => {
        set(() => ({
          ...initialState,
          config: get().config, // Preserve config
        }));
      },
    })),
    {
      name: STORAGE_KEYS.TIMER_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        completedCycles: state.completedCycles,
        currentCycle: state.currentCycle,
      }),
    }
  )
);

// Selectors for optimized subscriptions
export const useTimerStatus = () => useTimerStore((state) => state.status);
export const useCurrentSession = () => useTimerStore((state) => state.currentSession);
export const useTimerConfig = () => useTimerStore((state) => state.config);
export const useSessionHistory = () => useTimerStore((state) => state.sessionHistory);
export const useTimerProgress = () => useTimerStore((state) => {
  const progress = state.currentSession?.targetDuration 
    ? Math.min(100, (state.elapsedTime / state.currentSession.targetDuration) * 100)
    : 0;
    
  return {
    elapsedTime: state.elapsedTime,
    remainingTime: state.remainingTime,
    progress,
    status: state.status,
    currentSession: state.currentSession,
  };
});
export const useCycleProgress = () => useTimerStore((state) => ({
  currentCycle: state.currentCycle,
  completedCycles: state.completedCycles,
  isBreakTime: state.isBreakTime,
}));

// Helper functions
export const getTimerService = (): TimerService => {
  if (!timerService) {
    const config = useTimerStore.getState().config;
    timerService = new TimerService(config);
  }
  return timerService;
};
