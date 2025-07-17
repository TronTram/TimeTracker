import type { Achievement as PrismaAchievement, UserAchievement as PrismaUserAchievement, AchievementType, AchievementCategory } from '@prisma/client';

// Core achievement types from Prisma
export type { AchievementType, AchievementCategory } from '@prisma/client';

// Extended achievement with user-specific data
export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  iconName: string;
  category: AchievementCategory;
  maxProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

// User achievement with progress and unlock status
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  unlockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  achievement: Achievement;
}

// Achievement with progress tracking
export interface AchievementWithProgress {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
  progressPercentage: number;
  isRecentlyUnlocked?: boolean;
}

// Achievement notification data
export interface AchievementNotification {
  achievement: Achievement;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  timestamp: Date;
}

// Achievement filter options
export type AchievementFilter = 'all' | 'unlocked' | 'locked' | AchievementCategory;

// Achievement sort options
export type AchievementSort = 'name' | 'category' | 'progress' | 'unlocked-date';

// Achievement criteria for evaluation
export interface AchievementCriteria {
  type: AchievementType;
  evaluate: (data: AchievementEvaluationData) => { progress: number; isUnlocked: boolean };
}

// Data passed to achievement evaluation
export interface AchievementEvaluationData {
  userId: string;
  totalFocusTime: number; // in seconds
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  projectCount: number;
  lastSessionTime?: Date;
  projectTimeData: Array<{ projectId: string; totalTime: number }>;
  todaySessionCount: number;
  weekSessionCount: number;
  monthSessionCount: number;
}

// Achievement rule configuration
export interface AchievementRule {
  type: AchievementType;
  maxProgress: number;
  category: AchievementCategory;
  evaluator: (data: AchievementEvaluationData) => number;
  description: string;
}

// Achievement analytics data
export interface AchievementAnalytics {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  recentUnlocks: Achievement[];
  categoryProgress: Record<AchievementCategory, {
    total: number;
    unlocked: number;
    percentage: number;
  }>;
  streakData: {
    current: number;
    longest: number;
    daysToNextAchievement: number;
  };
}

// Achievement celebration animation types
export type CelebrationAnimationType = 'confetti' | 'sparkles' | 'fireworks' | 'glow';

// Achievement unlock response
export interface AchievementUnlockResult {
  newlyUnlocked: AchievementWithProgress[];
  updated: AchievementWithProgress[];
  celebrationData?: {
    type: CelebrationAnimationType;
    achievement: Achievement;
    message: string;
  };
}
