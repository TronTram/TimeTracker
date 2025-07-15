// Zustand store for Pomodoro state and cycle management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { SessionType, TimerConfig } from '@/types/timer';
import { PomodoroState, PomodoroStore, PomodoroSession, CyclePhase } from '@/types/pomodoro';
import { STORAGE_KEYS } from '@/lib/constants';

// Default Pomodoro configuration
const defaultPomodoroConfig = {
  workDuration: 25, // 25 minutes
  shortBreakDuration: 5, // 5 minutes
  longBreakDuration: 15, // 15 minutes
  longBreakInterval: 4, // Every 4 work sessions
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  strictMode: true, // Enforce exact Pomodoro rules
  allowSkipBreaks: false,
  showCycleProgress: true,
};

// Initial state
const initialState: PomodoroState = {
  currentCycle: 0,
  completedCycles: 0,
  currentPhase: 'work',
  nextPhase: 'short-break',
  isActive: false,
  isPaused: false,
  sessionsToday: [],
  dailyGoal: 8, // 8 pomodoros per day
  config: defaultPomodoroConfig,
  statistics: {
    totalSessions: 0,
    completedSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    averageSessionLength: 0,
    longestStreak: 0,
    currentStreak: 0,
    completionRate: 0,
  },
  lastSessionDate: null,
  cycleStartTime: null,
};

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    immer<PomodoroStore>((set, get) => ({
      ...initialState,

      startCycle: () => {
        set((state: PomodoroState) => {
          state.isActive = true;
          state.isPaused = false;
          state.currentPhase = 'work';
          state.currentCycle = state.currentCycle + 1;
          state.cycleStartTime = new Date();
          
          // Calculate next phase
          const isLongBreakTime = state.currentCycle % state.config.longBreakInterval === 0;
          state.nextPhase = isLongBreakTime ? 'long-break' : 'short-break';
        });
      },

      startBreak: (breakType: 'short-break' | 'long-break') => {
        set((state: PomodoroState) => {
          state.currentPhase = breakType;
          state.nextPhase = 'work';
          
          if (!state.config.autoStartBreaks) {
            state.isActive = false;
          }
        });
      },

      pauseCycle: () => {
        set((state: PomodoroState) => {
          state.isPaused = true;
        });
      },

      resumeCycle: () => {
        set((state: PomodoroState) => {
          state.isPaused = false;
        });
      },

      completeCycle: () => {
        set((state: PomodoroState) => {
          const now = new Date();
          const session: PomodoroSession = {
            id: crypto.randomUUID(),
            date: now,
            phase: state.currentPhase,
            duration: state.currentPhase === 'work' ? state.config.workDuration * 60 : 
                     state.currentPhase === 'short-break' ? state.config.shortBreakDuration * 60 :
                     state.config.longBreakDuration * 60,
            completed: true,
            cycleNumber: state.currentCycle,
          };

          state.sessionsToday.push(session);
          
          // Update statistics
          state.statistics.totalSessions += 1;
          state.statistics.completedSessions += 1;
          
          if (state.currentPhase === 'work') {
            state.statistics.totalWorkTime += state.config.workDuration * 60;
            state.completedCycles += 1;
          } else {
            state.statistics.totalBreakTime += (state.currentPhase === 'short-break' ? 
              state.config.shortBreakDuration : state.config.longBreakDuration) * 60;
          }

          // Calculate completion rate
          state.statistics.completionRate = state.statistics.totalSessions > 0 ? 
            (state.statistics.completedSessions / state.statistics.totalSessions) * 100 : 0;

          // Auto-start next phase if enabled
          if ((state.currentPhase === 'work' && state.config.autoStartBreaks) ||
              (state.currentPhase !== 'work' && state.config.autoStartPomodoros)) {
            if (state.currentPhase === 'work') {
              const isLongBreakTime = state.currentCycle % state.config.longBreakInterval === 0;
              state.currentPhase = isLongBreakTime ? 'long-break' : 'short-break';
              state.nextPhase = 'work';
            } else {
              state.currentPhase = 'work';
              state.currentCycle += 1;
              const nextIsLongBreak = state.currentCycle % state.config.longBreakInterval === 0;
              state.nextPhase = nextIsLongBreak ? 'long-break' : 'short-break';
            }
          } else {
            state.isActive = false;
          }

          state.lastSessionDate = now;
        });
      },

      skipCurrentPhase: () => {
        set((state: PomodoroState) => {
          if (!state.config.allowSkipBreaks && state.currentPhase !== 'work') {
            return; // Don't allow skipping breaks if not configured
          }

          const now = new Date();
          const session: PomodoroSession = {
            id: crypto.randomUUID(),
            date: now,
            phase: state.currentPhase,
            duration: 0,
            completed: false,
            cycleNumber: state.currentCycle,
          };

          state.sessionsToday.push(session);
          state.statistics.totalSessions += 1;

          // Calculate completion rate
          state.statistics.completionRate = state.statistics.totalSessions > 0 ? 
            (state.statistics.completedSessions / state.statistics.totalSessions) * 100 : 0;

          // Move to next phase
          if (state.currentPhase === 'work') {
            const isLongBreakTime = state.currentCycle % state.config.longBreakInterval === 0;
            state.currentPhase = isLongBreakTime ? 'long-break' : 'short-break';
            state.nextPhase = 'work';
          } else {
            state.currentPhase = 'work';
            state.currentCycle += 1;
            const nextIsLongBreak = state.currentCycle % state.config.longBreakInterval === 0;
            state.nextPhase = nextIsLongBreak ? 'long-break' : 'short-break';
          }
        });
      },

      resetCycle: () => {
        set((state: PomodoroState) => {
          state.currentCycle = 0;
          state.currentPhase = 'work';
          state.nextPhase = 'short-break';
          state.isActive = false;
          state.isPaused = false;
          state.cycleStartTime = null;
        });
      },

      updateConfig: (newConfig: Partial<typeof defaultPomodoroConfig>) => {
        set((state: PomodoroState) => {
          state.config = { ...state.config, ...newConfig };
        });
      },

      setDailyGoal: (goal: number) => {
        set((state: PomodoroState) => {
          state.dailyGoal = Math.max(1, Math.min(20, goal)); // Limit between 1-20
        });
      },

      clearTodaySessions: () => {
        set((state: PomodoroState) => {
          state.sessionsToday = [];
        });
      },

      updateStreak: () => {
        set((state: PomodoroState) => {
          const today = new Date().toDateString();
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
          
          const todayCompletedSessions = state.sessionsToday.filter((s: PomodoroSession) => 
            s.completed && s.phase === 'work'
          ).length;

          if (todayCompletedSessions >= state.dailyGoal) {
            if (state.lastSessionDate && 
                new Date(state.lastSessionDate).toDateString() === yesterday) {
              // Continue streak
              state.statistics.currentStreak += 1;
            } else if (!state.lastSessionDate || 
                      new Date(state.lastSessionDate).toDateString() !== today) {
              // Start new streak
              state.statistics.currentStreak = 1;
            }
            
            // Update longest streak
            if (state.statistics.currentStreak > state.statistics.longestStreak) {
              state.statistics.longestStreak = state.statistics.currentStreak;
            }
          } else if (state.lastSessionDate && 
                    new Date(state.lastSessionDate).toDateString() === yesterday) {
            // Break streak if goal not met
            state.statistics.currentStreak = 0;
          }
        });
      },

      resetStatistics: () => {
        set((state: PomodoroState) => {
          state.statistics = {
            totalSessions: 0,
            completedSessions: 0,
            totalWorkTime: 0,
            totalBreakTime: 0,
            averageSessionLength: 0,
            longestStreak: 0,
            currentStreak: 0,
            completionRate: 0,
          };
        });
      },

      // Helper functions for getting state
      getTodayProgress: () => {
        const state = get();
        const completedWorkSessions = state.sessionsToday.filter((s: PomodoroSession) => 
          s.completed && s.phase === 'work'
        ).length;
        
        return {
          completed: completedWorkSessions,
          goal: state.dailyGoal,
          percentage: Math.round((completedWorkSessions / state.dailyGoal) * 100),
        };
      },

      getCurrentPhaseDuration: () => {
        const state = get();
        switch (state.currentPhase) {
          case 'work':
            return state.config.workDuration;
          case 'short-break':
            return state.config.shortBreakDuration;
          case 'long-break':
            return state.config.longBreakDuration;
          default:
            return state.config.workDuration;
        }
      },

      getNextPhaseDuration: () => {
        const state = get();
        switch (state.nextPhase) {
          case 'work':
            return state.config.workDuration;
          case 'short-break':
            return state.config.shortBreakDuration;
          case 'long-break':
            return state.config.longBreakDuration;
          default:
            return state.config.shortBreakDuration;
        }
      },
    })),
    {
      name: STORAGE_KEYS.POMODORO_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        completedCycles: state.completedCycles,
        config: state.config,
        dailyGoal: state.dailyGoal,
        statistics: state.statistics,
        lastSessionDate: state.lastSessionDate,
      }),
    }
  )
);

// Selectors for optimized subscriptions
export const usePomodoroState = () => usePomodoroStore((state) => ({
  currentCycle: state.currentCycle,
  currentPhase: state.currentPhase,
  nextPhase: state.nextPhase,
  isActive: state.isActive,
  isPaused: state.isPaused,
}));

export const usePomodoroProgress = () => usePomodoroStore((state) => {
  const todayProgress = state.getTodayProgress();
  return {
    ...todayProgress,
    currentCycle: state.currentCycle,
    completedCycles: state.completedCycles,
    statistics: state.statistics,
  };
});

export const usePomodoroConfig = () => usePomodoroStore((state) => state.config);

export const usePomodoroSessions = () => usePomodoroStore((state) => state.sessionsToday);
