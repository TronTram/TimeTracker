/**
 * TypeScript interfaces and types for gamification features
 */

// Streak-related types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  daysToNextMilestone: number;
  nextMilestone: number;
  streakPercentage: number;
  isActiveToday: boolean;
  gracePeriodsUsed?: number;
  maxGracePeriods?: number;
}

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  emoji: string;
  reward?: string;
  category?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';
}

export interface StreakStatistics {
  totalStreaksStarted: number;
  averageStreakLength: number;
  longestStreakEver: number;
  currentActiveStreak: number;
  milestonesReached: number;
  consistencyScore: number; // 0-100
  streakScore: number;
}

// Motivational content types
export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: 'focus' | 'motivation' | 'productivity' | 'success' | 'perseverance' | 'general';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  streakRange?: {
    min: number;
    max?: number;
  };
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  mood?: 'encouraging' | 'challenging' | 'inspirational' | 'calming';
}

export interface MotivationalContent {
  quote: MotivationalQuote;
  personalizedMessage?: string;
  actionPrompt?: string;
  encouragement?: string;
}

export interface QuotePreferences {
  enabled: boolean;
  categories: MotivationalQuote['category'][];
  frequency: 'high' | 'medium' | 'low'; // How often to show new quotes
  mood: 'encouraging' | 'challenging' | 'mixed';
  includeAuthor: boolean;
  autoRefresh: boolean;
}

// Progress visualization types
export interface ProgressVisualization {
  currentLevel: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  totalExperience: number;
  progressPercentage: number;
  levelTitle: string;
  levelDescription: string;
  milestones: LevelMilestone[];
}

export interface LevelMilestone {
  level: number;
  title: string;
  description: string;
  icon: string;
  experienceRequired: number;
  rewards?: string[];
  unlocked: boolean;
}

export interface GrowthStage {
  stage: 'seed' | 'sprout' | 'seedling' | 'young' | 'growing' | 'strong' | 'mighty' | 'legendary';
  name: string;
  icon: string;
  color: string;
  description: string;
  streakRange: {
    min: number;
    max?: number;
  };
}

// Habit formation types
export interface HabitData {
  habitId: string;
  name: string;
  description: string;
  targetFrequency: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  consistency: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'focus' | 'productivity' | 'wellness' | 'learning' | 'custom';
  isActive: boolean;
  createdAt: Date;
  lastCompletedAt: Date | null;
}

export interface HabitMilestone {
  id: string;
  habitId: string;
  type: 'streak' | 'consistency' | 'total_completions';
  target: number;
  current: number;
  isCompleted: boolean;
  completedAt: Date | null;
  reward?: string;
}

// Goal tracking types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  target: number;
  current: number;
  unit: 'minutes' | 'hours' | 'sessions' | 'days' | 'projects';
  category: 'time' | 'sessions' | 'consistency' | 'productivity';
  deadline?: Date;
  isActive: boolean;
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'paused';
}

export interface GoalProgress {
  goalId: string;
  date: Date;
  value: number;
  notes?: string;
}

// Celebration and rewards types
export interface Celebration {
  id: string;
  type: 'streak' | 'achievement' | 'milestone' | 'goal' | 'level_up';
  title: string;
  message: string;
  icon: string;
  animation: 'confetti' | 'sparkles' | 'fireworks' | 'bounce' | 'pulse';
  duration: number; // milliseconds
  sound?: string;
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'title' | 'theme' | 'feature' | 'discount';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockConditions: {
    type: 'streak' | 'sessions' | 'time' | 'achievement' | 'level';
    value: number;
    operator: 'gte' | 'eq' | 'lte';
  }[];
  isUnlocked: boolean;
  unlockedAt: Date | null;
}

// User preferences for gamification
export interface GamificationPreferences {
  streakTracking: {
    enabled: boolean;
    gracePeriodsEnabled: boolean;
    reminderNotifications: boolean;
    celebrationsEnabled: boolean;
  };
  motivationalQuotes: QuotePreferences;
  progressVisualization: {
    enabled: boolean;
    style: 'minimal' | 'detailed' | 'artistic';
    showAnimations: boolean;
    preferredMetrics: ('time' | 'sessions' | 'streak' | 'achievements')[];
  };
  achievements: {
    enabled: boolean;
    notificationsEnabled: boolean;
    showProgress: boolean;
    celebrationStyle: 'subtle' | 'moderate' | 'enthusiastic';
  };
  habits: {
    trackingEnabled: boolean;
    reminderFrequency: 'none' | 'daily' | 'weekly';
    showInsights: boolean;
  };
  privacy: {
    shareProgress: boolean;
    showInLeaderboards: boolean;
    allowDataAnalytics: boolean;
  };
}

// Analytics and insights types
export interface GamificationInsights {
  streakInsights: {
    averageStreakLength: number;
    streakConsistency: number;
    bestStreakMonth: string;
    streakTrends: Array<{
      period: string;
      averageStreak: number;
      maxStreak: number;
    }>;
  };
  motivationEffectiveness: {
    quotesViewed: number;
    quotesLiked: number;
    mostEffectiveCategories: string[];
    engagementScore: number;
  };
  progressMetrics: {
    levelsGained: number;
    milestonesReached: number;
    totalExperience: number;
    growthRate: number;
  };
  habitFormation: {
    habitsTracked: number;
    averageConsistency: number;
    strongestHabit: string;
    improvementAreas: string[];
  };
}

// Event types for gamification system
export interface GamificationEvent {
  id: string;
  userId: string;
  type: 'session_completed' | 'streak_milestone' | 'achievement_unlocked' | 'level_up' | 'goal_achieved';
  data: {
    sessionId?: string;
    achievementId?: string;
    streakDays?: number;
    newLevel?: number;
    goalId?: string;
    value?: number;
    metadata?: Record<string, any>;
  };
  triggeredAt: Date;
  processed: boolean;
}

// API response types
export interface GamificationSummary {
  streak: StreakData;
  level: ProgressVisualization;
  recentAchievements: Array<{
    id: string;
    title: string;
    unlockedAt: Date;
    category: string;
  }>;
  activeGoals: Goal[];
  todaysProgress: {
    sessionsCompleted: number;
    focusTime: number;
    streakMaintained: boolean;
    goalProgress: number;
  };
  motivationalContent: MotivationalContent;
  celebrations: Celebration[];
}

// Hook return types
export interface UseStreaksReturn {
  streakData: StreakData | null;
  milestones: StreakMilestone[];
  isLoading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
  updateStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  getNextMilestone: () => StreakMilestone | null;
  isNewRecord: boolean;
}

export interface UseMotivationReturn {
  currentQuote: MotivationalQuote | null;
  isLoading: boolean;
  error: string | null;
  refreshQuote: () => void;
  likeQuote: (quoteId: string) => void;
  getQuoteByCategory: (category: MotivationalQuote['category']) => MotivationalQuote;
  preferences: QuotePreferences;
  updatePreferences: (preferences: Partial<QuotePreferences>) => Promise<void>;
}

export interface UseProgressVisualizationReturn {
  progressData: ProgressVisualization | null;
  growthStage: GrowthStage | null;
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  calculateExperience: (sessions: number, focusTime: number) => number;
}

// Utility types
export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all-time';
export type SortOrder = 'asc' | 'desc';
export type FilterCriteria = 'all' | 'active' | 'completed' | 'paused';

// Component prop types
export interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  daysToNextMilestone: number;
  nextMilestone: number;
  streakPercentage: number;
  lastActiveDate: Date | null;
  className?: string;
  showMilestones?: boolean;
  compact?: boolean;
}

export interface MotivationalQuotesProps {
  userStreak?: number;
  currentTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  userPreferences?: {
    quotesEnabled: boolean;
    quoteCategory?: string;
  };
  className?: string;
  autoRefresh?: boolean;
  showControls?: boolean;
}

export interface ProgressVisualizationProps {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalFocusTime: number;
  weeklyGoal: number;
  weeklyProgress: number;
  recentAchievements: Array<{
    id: string;
    title: string;
    unlockedAt: Date;
  }>;
  className?: string;
  style?: 'minimal' | 'detailed';
  showAnimations?: boolean;
}

export default {};
