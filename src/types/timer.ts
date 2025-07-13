// Timer-related TypeScript interfaces and enums

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SessionType = 'work' | 'short-break' | 'long-break' | 'focus';

export interface TimerConfig {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // every N pomodoros
  focusDuration: number; // in minutes
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  sessionHistory: TimerSession[]; // history of completed sessions
}

export interface TimerSession {
  id?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  targetDuration: number; // in seconds
  sessionType: SessionType;
  isPomodoro: boolean;
  projectId?: string;
  description?: string;
  tags: string[];
  isCompleted: boolean;
  isPaused: boolean;
}

export interface TimerState {
  // Current timer state
  status: TimerStatus;
  
  // Current session data
  currentSession: TimerSession | null;
  
  // Timer timing
  startTime: Date | null;
  pausedTime: Date | null;
  elapsedTime: number; // in seconds
  remainingTime: number; // in seconds
  
  // Session history
  sessionHistory: TimerSession[];
  
  // Pomodoro cycle tracking
  currentCycle: number;
  completedCycles: number;
  isBreakTime: boolean;
  nextSessionType: SessionType;
  
  // Configuration
  config: TimerConfig;
  
  // Auto-save functionality
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  
  // Page visibility tracking
  isPageVisible: boolean;
  backgroundStartTime: Date | null;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  addTime: (minutes: number) => void;
  skipSession: () => void;
}

export interface TimerEvents {
  onSessionStart: (session: TimerSession) => void;
  onSessionPause: () => void;
  onSessionResume: () => void;
  onSessionComplete: (session: TimerSession) => void;
  onSessionStop: (session: TimerSession) => void;
  onTick: (elapsedTime: number, remainingTime: number) => void;
  onConfigChange: (config: TimerConfig) => void;
}

export interface TimerDisplay {
  time: string;
  progress: number; // 0-100
  sessionType: SessionType;
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  canPause: boolean;
  canStop: boolean;
  canReset: boolean;
}

export interface SessionSummary {
  session: TimerSession;
  productivity: {
    focusScore: number; // 0-100
    efficiency: number; // 0-100
    consistency: number; // 0-100
  };
  recommendations: string[];
  nextAction: 'break' | 'continue' | 'stop';
}

// Timer service interfaces
export interface TimerPersistence {
  save: (state: Partial<TimerState>) => Promise<void>;
  load: () => Promise<Partial<TimerState> | null>;
  clear: () => Promise<void>;
}

export interface TimerNotifications {
  sessionComplete: (sessionType: SessionType) => void;
  breakReminder: (timeLeft: number) => void;
  sessionReminder: (timeLeft: number) => void;
}

// Timer analytics
export interface TimerAnalytics {
  sessionStarted: (sessionType: SessionType) => void;
  sessionCompleted: (session: TimerSession) => void;
  sessionCancelled: (session: TimerSession, reason: string) => void;
  configChanged: (oldConfig: TimerConfig, newConfig: TimerConfig) => void;
}

// Error types
export class TimerError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'TimerError';
  }
}

export const TIMER_ERROR_CODES = {
  INVALID_DURATION: 'INVALID_DURATION',
  SESSION_ALREADY_RUNNING: 'SESSION_ALREADY_RUNNING',
  NO_ACTIVE_SESSION: 'NO_ACTIVE_SESSION',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  PAGE_VISIBILITY_ERROR: 'PAGE_VISIBILITY_ERROR',
} as const;

// Timer options for customization
export interface TimerOptions {
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  persistenceKey: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  strictPomodoro: boolean; // enforce exact pomodoro rules
  allowOvertime: boolean;
  maxOvertimeMinutes: number;
}

// Timer store interface for Zustand
export interface TimerStore extends TimerState {
  // Timer actions
  startTimer: (sessionType: SessionType, projectId?: string, description?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  adjustTime: (adjustment: number) => void;
  
  // State updates
  updateElapsedTime: (elapsedTime: number, remainingTime: number) => void;
  updateConfig: (newConfig: Partial<TimerConfig>) => void;
  
  // Session management
  addSessionToHistory: (session: TimerSession) => void;
  clearSessionHistory: () => void;
  completeCurrentSession: () => void;
  
  // Persistence
  markSaved: () => void;
  
  // Cycle management
  resetCycle: () => void;
  resetState: () => void;
}
