import type { AchievementType, AchievementEvaluationData, AchievementRule } from '@/types/achievement';

// Achievement rule definitions with evaluation logic
export const achievementRules: Record<AchievementType, AchievementRule> = {
  // Time-based achievements
  FIRST_SESSION: {
    type: 'FIRST_SESSION',
    maxProgress: 1,
    category: 'TIME',
    description: 'Complete your first focus session',
    evaluator: (data: AchievementEvaluationData) => {
      return data.totalSessions >= 1 ? 1 : 0;
    },
  },

  TOTAL_TIME_10_HOURS: {
    type: 'TOTAL_TIME_10_HOURS',
    maxProgress: 3600, // 1 hour in seconds
    category: 'TIME',
    description: 'Accumulate 1 hour of focus time',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalFocusTime, 3600);
    },
  },

  TOTAL_TIME_100_HOURS: {
    type: 'TOTAL_TIME_100_HOURS',
    maxProgress: 36000, // 10 hours in seconds
    category: 'TIME',
    description: 'Accumulate 10 hours of focus time',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalFocusTime, 36000);
    },
  },

  TOTAL_TIME_1000_HOURS: {
    type: 'TOTAL_TIME_1000_HOURS',
    maxProgress: 180000, // 50 hours in seconds
    category: 'TIME',
    description: 'Accumulate 50 hours of focus time',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalFocusTime, 180000);
    },
  },

  // Session-based achievements
  SESSIONS_100: {
    type: 'SESSIONS_100',
    maxProgress: 5,
    category: 'FOCUS',
    description: 'Complete 5 focus sessions',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalSessions, 5);
    },
  },

  SESSIONS_500: {
    type: 'SESSIONS_500',
    maxProgress: 25,
    category: 'FOCUS',
    description: 'Complete 25 focus sessions',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalSessions, 25);
    },
  },

  SESSIONS_1000: {
    type: 'SESSIONS_1000',
    maxProgress: 100,
    category: 'FOCUS',
    description: 'Complete 100 focus sessions',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalSessions, 100);
    },
  },

  // Streak-based achievements
  STREAK_7_DAYS: {
    type: 'STREAK_7_DAYS',
    maxProgress: 3,
    category: 'STREAK',
    description: 'Maintain a 3-day focus streak',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.currentStreak, 3);
    },
  },

  STREAK_30_DAYS: {
    type: 'STREAK_30_DAYS',
    maxProgress: 7,
    category: 'STREAK',
    description: 'Maintain a 7-day focus streak',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.currentStreak, 7);
    },
  },

  STREAK_100_DAYS: {
    type: 'STREAK_100_DAYS',
    maxProgress: 30,
    category: 'STREAK',
    description: 'Maintain a 30-day focus streak',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.currentStreak, 30);
    },
  },

  // Project-based achievements
  PROJECTS_10: {
    type: 'PROJECTS_10',
    maxProgress: 1,
    category: 'PROJECT',
    description: 'Create your first project',
    evaluator: (data: AchievementEvaluationData) => {
      return data.projectCount >= 1 ? 1 : 0;
    },
  },

  PROJECT_MASTER: {
    type: 'PROJECT_MASTER',
    maxProgress: 5,
    category: 'PROJECT',
    description: 'Create 5 projects',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.projectCount, 5);
    },
  },

  PERFECT_WEEK: {
    type: 'PERFECT_WEEK',
    maxProgress: 36000, // 10 hours in seconds
    category: 'PROJECT',
    description: 'Spend 10 hours on a single project',
    evaluator: (data: AchievementEvaluationData) => {
      const maxProjectTime = Math.max(...data.projectTimeData.map(p => p.totalTime), 0);
      return Math.min(maxProjectTime, 36000);
    },
  },

  // Special achievements
  NIGHT_OWL: {
    type: 'NIGHT_OWL',
    maxProgress: 1,
    category: 'SPECIAL',
    description: 'Complete a session after 10 PM',
    evaluator: (data: AchievementEvaluationData) => {
      // This needs to be checked when sessions are created
      // For now, assume it's tracked separately
      return 0; // Will be set to 1 when condition is met
    },
  },

  EARLY_BIRD: {
    type: 'EARLY_BIRD',
    maxProgress: 1,
    category: 'SPECIAL',
    description: 'Complete a session before 6 AM',
    evaluator: (data: AchievementEvaluationData) => {
      // This needs to be checked when sessions are created
      // For now, assume it's tracked separately
      return 0; // Will be set to 1 when condition is met
    },
  },

  BREAK_MASTER: {
    type: 'BREAK_MASTER',
    maxProgress: 10,
    category: 'SPECIAL',
    description: 'Complete 10 Pomodoro sessions',
    evaluator: (data: AchievementEvaluationData) => {
      // This needs Pomodoro-specific tracking
      // For now, assume it's tracked separately
      return 0; // Will be updated based on Pomodoro sessions
    },
  },

  // Legacy/placeholder achievements for compatibility
  FIRST_HOUR: {
    type: 'FIRST_HOUR',
    maxProgress: 3600,
    category: 'TIME',
    description: 'Complete your first hour of focus',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalFocusTime, 3600);
    },
  },

  FIRST_DAY: {
    type: 'FIRST_DAY',
    maxProgress: 1,
    category: 'SPECIAL',
    description: 'Complete sessions on your first day',
    evaluator: (data: AchievementEvaluationData) => {
      return data.todaySessionCount >= 1 ? 1 : 0;
    },
  },

  FIRST_WEEK: {
    type: 'FIRST_WEEK',
    maxProgress: 1,
    category: 'SPECIAL',
    description: 'Complete sessions for a full week',
    evaluator: (data: AchievementEvaluationData) => {
      return data.weekSessionCount >= 7 ? 1 : 0;
    },
  },

  MARATHON_SESSION: {
    type: 'MARATHON_SESSION',
    maxProgress: 7200, // 2 hours
    category: 'TIME',
    description: 'Complete a 2-hour focus session',
    evaluator: (data: AchievementEvaluationData) => {
      // This needs session-length tracking
      return 0; // Will be updated based on longest session
    },
  },

  CONSISTENCY_CHAMPION: {
    type: 'CONSISTENCY_CHAMPION',
    maxProgress: 14,
    category: 'STREAK',
    description: 'Maintain a 14-day consistency streak',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.currentStreak, 14);
    },
  },

  FOCUS_MASTER: {
    type: 'FOCUS_MASTER',
    maxProgress: 50,
    category: 'FOCUS',
    description: 'Complete 50 focus sessions',
    evaluator: (data: AchievementEvaluationData) => {
      return Math.min(data.totalSessions, 50);
    },
  },
};

// Helper function to calculate achievement progress
export function calculateAchievementProgress(
  achievementType: AchievementType,
  data: AchievementEvaluationData
): { progress: number; isUnlocked: boolean; progressPercentage: number } {
  const rule = achievementRules[achievementType];
  if (!rule) {
    return { progress: 0, isUnlocked: false, progressPercentage: 0 };
  }

  const progress = rule.evaluator(data);
  const isUnlocked = progress >= rule.maxProgress;
  const progressPercentage = Math.min((progress / rule.maxProgress) * 100, 100);

  return { progress, isUnlocked, progressPercentage };
}

// Helper function to get achievement rule
export function getAchievementRule(type: AchievementType): AchievementRule | null {
  return achievementRules[type] || null;
}

// Helper function to get all achievement types by category
export function getAchievementsByCategory(category: string) {
  return Object.values(achievementRules).filter(rule => 
    rule.category.toLowerCase() === category.toLowerCase()
  );
}

// Helper function to check if achievement should celebrate
export function shouldCelebrate(achievement: AchievementType): boolean {
  // Major milestones should have celebrations
  const majorAchievements: AchievementType[] = [
    'FIRST_SESSION',
    'TOTAL_TIME_100_HOURS',
    'TOTAL_TIME_1000_HOURS',
    'SESSIONS_500',
    'SESSIONS_1000',
    'STREAK_30_DAYS',
    'STREAK_100_DAYS',
    'PROJECT_MASTER',
    'PERFECT_WEEK',
  ];

  return majorAchievements.includes(achievement);
}
