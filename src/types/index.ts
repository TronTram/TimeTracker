// Core application types and interfaces

export interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  pomodoroWorkDuration: number; // in minutes
  pomodoroShortBreakDuration: number; // in minutes
  pomodoroLongBreakDuration: number; // in minutes
  pomodoroLongBreakInterval: number; // every N pomodoros
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  defaultProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  timeSessions?: TimeSession[];
  _count?: {
    timeSessions: number;
  };
}

export interface TimeSession {
  id: string;
  userId: string;
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
  isPomodoro: boolean;
  sessionType: 'work' | 'short-break' | 'long-break' | 'focus';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  iconName: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
  category: 'time' | 'streak' | 'project' | 'focus' | 'special';
}

export type AchievementType =
  | 'first-session'
  | 'first-hour'
  | 'first-day'
  | 'first-week'
  | 'marathon-session'
  | 'early-bird'
  | 'night-owl'
  | 'consistency-champion'
  | 'project-master'
  | 'focus-master'
  | 'break-master';

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Timer-related types
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type SessionType = 'work' | 'short-break' | 'long-break' | 'focus';

export interface TimerConfig {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

// Analytics types
export interface AnalyticsData {
  totalTime: number;
  sessionsCount: number;
  averageSessionLength: number;
  projectBreakdown: ProjectTimeBreakdown[];
  dailyStats: DailyStat[];
  weeklyStats: WeeklyStat[];
  monthlyStats: MonthlyStat[];
}

export interface ProjectTimeBreakdown {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTime: number;
  sessionsCount: number;
  percentage: number;
}

export interface DailyStat {
  date: string;
  totalTime: number;
  sessionsCount: number;
  focusTime: number;
  breakTime: number;
}

export interface WeeklyStat {
  weekStart: string;
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
}

export interface MonthlyStat {
  month: string;
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface CreateProjectData {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  isArchived?: boolean;
}

export interface CreateSessionData {
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
  isPomodoro: boolean;
  sessionType: SessionType;
  tags: string[];
}

export interface UpdateSessionData extends Partial<CreateSessionData> {}

// Export utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
