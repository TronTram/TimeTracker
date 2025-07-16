/**
 * Analytics Types
 * Type definitions for analytics dashboard and reporting
 */

// Time range options for analytics
export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';

// Analytics parameters for data fetching
export interface AnalyticsParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

// Time breakdown data
export interface TimeBreakdownData {
  focusTime: number; // seconds
  breakTime: number; // seconds
  totalTime: number; // seconds
  sessionsCount: number;
  pomodoroCount: number;
  averageSessionLength: number; // seconds
}

// Project analytics data
export interface ProjectAnalyticsData {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTime: number; // seconds
  sessionsCount: number;
  percentage: number;
  averageSessionLength: number; // seconds
}

// Trend data for charts
export interface TrendData {
  date: string; // YYYY-MM-DD format
  totalTime: number; // seconds
  focusTime: number; // seconds
  sessionsCount: number;
  pomodoroCount: number;
}

// Productivity insights
export interface ProductivityInsights {
  current: TimeBreakdownData;
  previous?: TimeBreakdownData;
  improvements?: {
    totalTime: number; // percentage change
    focusTime: number; // percentage change
    sessions: number; // percentage change
    pomodoros: number; // percentage change
  };
  streakData: {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
  };
  focusRatio: number; // percentage of focus time vs total time
  productivityScore: number; // calculated score 0-100
}

// Goal progress data
export interface GoalProgress {
  dailyGoal: {
    target: number; // minutes
    current: number; // minutes
    percentage: number;
  };
  weeklyGoal: {
    target: number; // minutes
    current: number; // minutes
    percentage: number;
  };
  monthlyGoal?: {
    target: number; // minutes
    current: number; // minutes
    percentage: number;
  };
}

// Stats card data
export interface StatsCardData {
  title: string;
  value: string;
  icon: string;
  trend?: {
    value: number; // percentage change
    isPositive: boolean;
    period: string;
  };
  color?: string;
}

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  color?: string;
}

export interface LineChartData {
  date: string;
  totalTime: number;
  focusTime: number;
  sessions: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface BarChartData {
  name: string;
  focus: number;
  break: number;
  total: number;
}

// Session type breakdown
export interface SessionTypeBreakdown {
  focus: number;
  shortBreak: number;
  longBreak: number;
  custom: number;
}

// Daily analytics data
export interface DailyAnalytics {
  date: string;
  totalTime: number;
  sessions: number;
  pomodoroSessions: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    time: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    time: number;
  }>;
}

// Weekly analytics data
export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  totalTime: number;
  averageDaily: number;
  bestDay: {
    date: string;
    time: number;
  };
  dailyBreakdown: DailyAnalytics[];
}

// Monthly analytics data
export interface MonthlyAnalytics {
  month: string;
  totalTime: number;
  averageDaily: number;
  averageWeekly: number;
  bestWeek: {
    weekStart: string;
    time: number;
  };
  weeklyBreakdown: WeeklyAnalytics[];
}

// Export options
export interface AnalyticsExportOptions {
  format: 'csv' | 'json' | 'pdf';
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  includeCharts?: boolean;
  includeSessions?: boolean;
  includeProjects?: boolean;
}

// Analytics filter options
export interface AnalyticsFilters {
  projectIds?: string[];
  sessionTypes?: string[];
  tags?: string[];
  minDuration?: number; // seconds
  maxDuration?: number; // seconds
}

// Comparison data for insights
export interface ComparisonData {
  current: number;
  previous: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

// Pomodoro specific analytics
export interface PomodoroAnalytics {
  totalCycles: number;
  completedCycles: number;
  completionRate: number; // percentage
  averageCycleLength: number; // minutes
  workBreakRatio: number; // work time / break time
  dailyAverage: number; // cycles per day
  streakData: {
    currentStreak: number;
    longestStreak: number;
  };
  cycleTrends: Array<{
    date: string;
    completed: number;
    started: number;
  }>;
}

// Heat map data for calendar view
export interface HeatMapData {
  date: string;
  value: number; // time in minutes
  level: 0 | 1 | 2 | 3 | 4; // intensity level for color coding
}

// Performance metrics
export interface PerformanceMetrics {
  consistency: number; // 0-100 score based on regular usage
  efficiency: number; // 0-100 score based on session completion
  growth: number; // percentage change over time
  engagement: number; // 0-100 score based on feature usage
}
