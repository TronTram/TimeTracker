// Database types and utilities
// This file will be updated once Prisma client is generated

// Enum types from schema
export type SessionType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
export type AchievementType = 'TIME_BASED' | 'SESSION_BASED' | 'STREAK_BASED' | 'PROJECT_BASED';
export type AchievementCategory = 'PRODUCTIVITY' | 'CONSISTENCY' | 'MILESTONE' | 'SPECIAL';

// Database operation result types
export type DatabaseResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Analytics data types
export type DailyStats = {
  date: string; // YYYY-MM-DD format
  totalTime: number; // seconds
  sessionsCount: number;
  focusTime: number; // seconds
  breakTime: number; // seconds
  pomodoroSessions: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    time: number;
  }>;
};

export type WeeklyStats = {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
  dailyBreakdown: DailyStats[];
};

export type MonthlyStats = {
  month: string; // YYYY-MM format
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
  weeklyBreakdown: WeeklyStats[];
};

export type ProjectTimeBreakdown = {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTime: number;
  sessionsCount: number;
  percentage: number;
  averageSessionLength: number;
};

export type ProductivityInsights = {
  mostProductiveHour: number; // 0-23
  mostProductiveDay: number; // 0-6 (Sunday-Saturday)
  averageSessionLength: number; // seconds
  totalFocusTime: number; // seconds
  totalBreakTime: number; // seconds
  streakData: {
    current: number;
    longest: number;
    lastActiveDate: Date | null;
  };
  achievementProgress: Array<{
    achievementType: AchievementType;
    progress: number;
    maxProgress: number;
    isUnlocked: boolean;
  }>;
};

// Achievement progress calculation helpers
export type AchievementProgress = {
  type: AchievementType;
  current: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progressPercentage: number;
};

/*
TODO: After running `npx prisma generate`, add these imports and extended types:

import type { 
  User,
  UserPreferences,
  Project,
  TimeSession,
  Tag,
  Achievement,
  UserAchievement,
  Streak,
  Prisma
} from '@prisma/client';

// Extended types with relations
export type UserWithPreferences = User & {
  preferences: UserPreferences | null;
};

export type ProjectWithSessions = Project & {
  timeSessions: TimeSession[];
  _count: { timeSessions: number };
};

// ... more extended types
*/
