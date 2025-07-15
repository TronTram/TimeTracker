// Pomodoro-related TypeScript interfaces

export type CyclePhase = 'work' | 'short-break' | 'long-break';

export interface PomodoroSession {
  id: string;
  date: Date;
  phase: CyclePhase;
  duration: number; // in seconds
  completed: boolean;
  cycleNumber: number;
  projectId?: string;
  description?: string;
  tags?: string[];
}

export interface PomodoroStatistics {
  totalSessions: number;
  completedSessions: number;
  totalWorkTime: number; // in seconds
  totalBreakTime: number; // in seconds
  averageSessionLength: number; // in seconds
  longestStreak: number; // days
  currentStreak: number; // days
  completionRate: number; // percentage
}

export interface PomodoroConfig {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // every N work sessions
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  strictMode: boolean; // enforce exact Pomodoro rules
  allowSkipBreaks: boolean;
  showCycleProgress: boolean;
}

export interface PomodoroState {
  // Current cycle state
  currentCycle: number;
  completedCycles: number;
  currentPhase: CyclePhase;
  nextPhase: CyclePhase;
  isActive: boolean;
  isPaused: boolean;
  
  // Session tracking
  sessionsToday: PomodoroSession[];
  dailyGoal: number; // number of work sessions per day
  
  // Configuration
  config: PomodoroConfig;
  
  // Statistics
  statistics: PomodoroStatistics;
  
  // Tracking
  lastSessionDate: Date | null;
  cycleStartTime: Date | null;
}

export interface PomodoroTodayProgress {
  completed: number;
  goal: number;
  percentage: number;
}

export interface PomodoroStore extends PomodoroState {
  // Cycle management
  startCycle: () => void;
  startBreak: (breakType: 'short-break' | 'long-break') => void;
  pauseCycle: () => void;
  resumeCycle: () => void;
  completeCycle: () => void;
  skipCurrentPhase: () => void;
  resetCycle: () => void;
  
  // Configuration
  updateConfig: (config: Partial<PomodoroConfig>) => void;
  setDailyGoal: (goal: number) => void;
  
  // Session management
  clearTodaySessions: () => void;
  
  // Statistics
  updateStreak: () => void;
  resetStatistics: () => void;
  
  // Helper functions
  getTodayProgress: () => PomodoroTodayProgress;
  getCurrentPhaseDuration: () => number;
  getNextPhaseDuration: () => number;
}

export interface PomodoroControlsProps {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

export interface CycleIndicatorProps {
  currentCycle: number;
  currentPhase: CyclePhase;
  nextPhase: CyclePhase;
  longBreakInterval: number;
  showNext?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface PomodoroTimerProps {
  projectId?: string;
  description?: string;
  showCycleProgress?: boolean;
  autoStart?: boolean;
  onSessionComplete?: (session: PomodoroSession) => void;
  onCycleComplete?: (completedCycles: number) => void;
}

export interface PomodoroSettingsData {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  dailyGoal: number;
  strictMode: boolean;
  allowSkipBreaks: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

// Event types for Pomodoro timer
export interface PomodoroEvents {
  onCycleStart: (phase: CyclePhase, cycleNumber: number) => void;
  onCyclePause: () => void;
  onCycleResume: () => void;
  onCycleComplete: (session: PomodoroSession) => void;
  onCycleSkip: (phase: CyclePhase) => void;
  onPhaseChange: (fromPhase: CyclePhase, toPhase: CyclePhase) => void;
  onGoalReached: (completedSessions: number, goal: number) => void;
  onStreakUpdate: (currentStreak: number, longestStreak: number) => void;
}

// Helper types for phase-specific styling and labels
export interface PhaseConfig {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}

export type PhaseConfigMap = Record<CyclePhase, PhaseConfig>;

// Notification types for Pomodoro
export interface PomodoroNotification {
  type: 'phase-complete' | 'cycle-complete' | 'goal-reached' | 'streak-updated';
  title: string;
  message: string;
  phase?: CyclePhase;
  data?: any;
}
