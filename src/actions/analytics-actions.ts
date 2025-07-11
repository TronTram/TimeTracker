'use server';

import { revalidatePath } from 'next/cache';
import { SessionService, ProjectService, UserService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { requireDatabaseUser } from '@/lib/auth-helpers';
import type { ActionResult } from '@/types/actions';
import { AppError } from '@/lib/errors';

// Type definitions for analytics parameters
type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';

type AnalyticsParams = {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  projectId?: string;
};

type TimeBreakdownData = {
  focusTime: number;
  breakTime: number;
  totalTime: number;
  sessionsCount: number;
  pomodoroCount: number;
  averageSessionLength: number;
};

type ProjectAnalytics = {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTime: number;
  sessionsCount: number;
  percentage: number;
};

type TrendData = {
  date: string;
  totalTime: number;
  focusTime: number;
  sessionsCount: number;
  pomodoroCount: number;
};

// Helper function to handle action errors
function handleError(error: unknown, fallbackMessage: string): ActionResult<never> {
  console.error('Analytics action error:', error);
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: fallbackMessage,
  };
}

// Helper function to create success responses
function createSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

// Helper function to get date range
function getDateRange(timeRange: TimeRange, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (timeRange) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
      end = endDate ? new Date(endDate) : now;
      break;
    default:
      start = new Date(now);
      start.setDate(now.getDate() - 7);
  }

  return { start, end };
}

// =============================================================================
// Time Analytics Actions
// =============================================================================

/**
 * Get overall time breakdown analytics
 */
export async function getTimeBreakdown(params: AnalyticsParams = {}): Promise<ActionResult<TimeBreakdownData>> {
  try {
    const user = await requireDatabaseUser();
    const { timeRange = 'week', startDate, endDate, projectId } = params;
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'time-breakdown', params);
    
    // Try cache first
    let breakdown = CacheService.getAnalytics(cacheKey);
    if (breakdown) {
      return createSuccess(breakdown);
    }

    // Get date range
    const { start, end } = getDateRange(timeRange, startDate, endDate);

    // Get sessions data
    const sessions = await SessionService.getUserSessions(user.id, {
      dateFrom: start,
      dateTo: end,
      projectId,
      page: 1,
      pageSize: 10000, // Get all sessions for accurate analytics
    });

    // Calculate breakdown
    const focusTime = sessions.data.reduce((sum: number, session: any) => 
      session.sessionType === 'FOCUS' ? sum + session.duration : sum, 0
    );
    
    const breakTime = sessions.data.reduce((sum: number, session: any) => 
      session.sessionType !== 'FOCUS' ? sum + session.duration : sum, 0
    );
    
    const totalTime = sessions.data.reduce((sum: number, session: any) => sum + session.duration, 0);
    const sessionsCount = sessions.data.length;
    const pomodoroCount = sessions.data.filter((session: any) => session.isPomodoro).length;
    const averageSessionLength = sessionsCount > 0 ? totalTime / sessionsCount : 0;

    breakdown = {
      focusTime,
      breakTime,
      totalTime,
      sessionsCount,
      pomodoroCount,
      averageSessionLength,
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, breakdown, 10 * 60 * 1000); // 10 minutes

    return createSuccess(breakdown);
  } catch (error) {
    return handleError(error, 'Failed to get time breakdown');
  }
}

/**
 * Get project time breakdown
 */
export async function getProjectBreakdown(params: AnalyticsParams = {}): Promise<ActionResult<ProjectAnalytics[]>> {
  try {
    const user = await requireDatabaseUser();
    const { timeRange = 'week', startDate, endDate } = params;
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'project-breakdown', params);
    
    // Try cache first
    let breakdown = CacheService.getAnalytics(cacheKey);
    if (breakdown) {
      return createSuccess(breakdown);
    }

    // Get date range
    const { start, end } = getDateRange(timeRange, startDate, endDate);

    // Get sessions data
    const sessions = await SessionService.getUserSessions(user.id, {
      dateFrom: start,
      dateTo: end,
      page: 1,
      pageSize: 10000,
    });

    // Calculate total time for percentage calculations
    const totalTime = sessions.data.reduce((sum: number, session: any) => sum + session.duration, 0);

    // Group by project
    const projectMap = new Map();
    
    sessions.data.forEach((session: any) => {
      const projectId = session.projectId || 'no-project';
      const projectName = session.project?.name || 'No Project';
      const projectColor = session.project?.color || '#6b7280';
      
      if (projectMap.has(projectId)) {
        const existing = projectMap.get(projectId);
        existing.totalTime += session.duration;
        existing.sessionsCount += 1;
      } else {
        projectMap.set(projectId, {
          projectId,
          projectName,
          projectColor,
          totalTime: session.duration,
          sessionsCount: 1,
          percentage: 0,
        });
      }
    });

    // Calculate percentages and convert to array
    breakdown = Array.from(projectMap.values()).map((project: any) => ({
      ...project,
      percentage: totalTime > 0 ? (project.totalTime / totalTime) * 100 : 0,
    })).sort((a: any, b: any) => b.totalTime - a.totalTime);
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, breakdown, 15 * 60 * 1000); // 15 minutes

    return createSuccess(breakdown);
  } catch (error) {
    return handleError(error, 'Failed to get project breakdown');
  }
}

/**
 * Get time trends over the specified period
 */
export async function getTimeTrends(params: AnalyticsParams = {}): Promise<ActionResult<TrendData[]>> {
  try {
    const user = await requireDatabaseUser();
    const { timeRange = 'week', startDate, endDate } = params;
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'time-trends', params);
    
    // Try cache first
    let trends = CacheService.getAnalytics(cacheKey);
    if (trends) {
      return createSuccess(trends);
    }

    // Get date range
    const { start, end } = getDateRange(timeRange, startDate, endDate);

    // Generate date array for the period
    const dates: string[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (dateString) {
        dates.push(dateString);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get daily stats for each date
    const trendPromises = dates.map(async (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStats = await SessionService.getDailyStats(user.id, dayStart);
      
      return {
        date,
        totalTime: dayStats.totalTime,
        focusTime: dayStats.focusTime,
        sessionsCount: dayStats.sessionsCount,
        pomodoroCount: dayStats.pomodoroSessions,
      };
    });

    trends = await Promise.all(trendPromises);
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, trends, 20 * 60 * 1000); // 20 minutes

    return createSuccess(trends);
  } catch (error) {
    return handleError(error, 'Failed to get time trends');
  }
}

// =============================================================================
// Productivity Analytics Actions
// =============================================================================

/**
 * Get productivity insights and metrics
 */
export async function getProductivityInsights(params: AnalyticsParams = {}): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    const { timeRange = 'week' } = params;
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'productivity-insights', params);
    
    // Try cache first
    let insights = CacheService.getAnalytics(cacheKey);
    if (insights) {
      return createSuccess(insights);
    }

    // Get current period breakdown
    const currentBreakdown = await getTimeBreakdown(params);
    if (!currentBreakdown.success || !currentBreakdown.data) {
      return createSuccess({});
    }

    // Get previous period for comparison
    const previousParams = { ...params };
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        previousParams.startDate = yesterday.toISOString().split('T')[0];
        previousParams.endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - 7);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
        previousParams.startDate = lastWeekStart.toISOString().split('T')[0];
        previousParams.endDate = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        const lastMonthEnd = new Date(now);
        lastMonthEnd.setMonth(now.getMonth() - 1);
        const lastMonthStart = new Date(lastMonthEnd);
        lastMonthStart.setMonth(lastMonthEnd.getMonth() - 1);
        previousParams.startDate = lastMonthStart.toISOString().split('T')[0];
        previousParams.endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
    }

    const previousBreakdown = await getTimeBreakdown({ ...previousParams, timeRange: 'custom' });
    const previousData = previousBreakdown.success ? previousBreakdown.data : null;

    // Calculate improvements
    const calculateImprovement = (current: number, previous: number) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    insights = {
      current: currentBreakdown.data,
      previous: previousData,
      improvements: previousData ? {
        totalTime: calculateImprovement(currentBreakdown.data.totalTime, previousData.totalTime),
        focusTime: calculateImprovement(currentBreakdown.data.focusTime, previousData.focusTime),
        sessions: calculateImprovement(currentBreakdown.data.sessionsCount, previousData.sessionsCount),
        pomodoros: calculateImprovement(currentBreakdown.data.pomodoroCount, previousData.pomodoroCount),
      } : null,
      streakData: {
        currentStreak: 0, // TODO: Implement streak calculation
        longestStreak: 0,
        totalDays: 0,
      },
      focusRatio: currentBreakdown.data.totalTime > 0 
        ? (currentBreakdown.data.focusTime / currentBreakdown.data.totalTime) * 100 
        : 0,
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, insights, 15 * 60 * 1000); // 15 minutes

    return createSuccess(insights);
  } catch (error) {
    return handleError(error, 'Failed to get productivity insights');
  }
}

/**
 * Get goal progress
 */
export async function getGoalProgress(): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'goal-progress', {});
    
    // Try cache first
    let progress = CacheService.getAnalytics(cacheKey);
    if (progress) {
      return createSuccess(progress);
    }

    // Get user preferences for goals
    const preferences = await UserService.getUserPreferences(user.id);
    if (!preferences) {
      return createSuccess({
        dailyGoal: { target: 0, current: 0, percentage: 0 },
        weeklyGoal: { target: 0, current: 0, percentage: 0 },
      });
    }

    // Get today's stats
    const todayBreakdown = await getTimeBreakdown({ timeRange: 'today' });
    const todayData = todayBreakdown.success ? todayBreakdown.data : null;

    // Get this week's stats
    const weekBreakdown = await getTimeBreakdown({ timeRange: 'week' });
    const weekData = weekBreakdown.success ? weekBreakdown.data : null;

    // TODO: Implement proper goal calculations based on user preferences
    progress = {
      dailyGoal: {
        target: 480, // 8 hours in minutes - should come from preferences
        current: todayData ? Math.floor(todayData.totalTime / 60) : 0,
        percentage: 0,
      },
      weeklyGoal: {
        target: 2400, // 40 hours in minutes - should come from preferences  
        current: weekData ? Math.floor(weekData.totalTime / 60) : 0,
        percentage: 0,
      },
    };

    // Calculate percentages
    progress.dailyGoal.percentage = progress.dailyGoal.target > 0 
      ? (progress.dailyGoal.current / progress.dailyGoal.target) * 100 
      : 0;
    
    progress.weeklyGoal.percentage = progress.weeklyGoal.target > 0 
      ? (progress.weeklyGoal.current / progress.weeklyGoal.target) * 100 
      : 0;
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, progress, 5 * 60 * 1000); // 5 minutes

    return createSuccess(progress);
  } catch (error) {
    return handleError(error, 'Failed to get goal progress');
  }
}

// =============================================================================
// Export Analytics Actions
// =============================================================================

/**
 * Export analytics data
 */
export async function exportAnalyticsData(params: AnalyticsParams = {}): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get all analytics data
    const [timeBreakdown, projectBreakdown, timeTrends, insights] = await Promise.all([
      getTimeBreakdown(params),
      getProjectBreakdown(params),
      getTimeTrends(params),
      getProductivityInsights(params),
    ]);

    const exportData = {
      generatedAt: new Date().toISOString(),
      period: params,
      timeBreakdown: timeBreakdown.success ? timeBreakdown.data : null,
      projectBreakdown: projectBreakdown.success ? projectBreakdown.data : null,
      timeTrends: timeTrends.success ? timeTrends.data : null,
      insights: insights.success ? insights.data : null,
    };

    return createSuccess(exportData);
  } catch (error) {
    return handleError(error, 'Failed to export analytics data');
  }
}

// =============================================================================
// Cache Management Actions
// =============================================================================

/**
 * Clear analytics cache
 */
export async function clearAnalyticsCache(): Promise<ActionResult<boolean>> {
  try {
    const user = await requireDatabaseUser();
    
    // Clear user's analytics cache
    CacheService.invalidateAnalytics(user.clerkId);
    
    return createSuccess(true);
  } catch (error) {
    return handleError(error, 'Failed to clear analytics cache');
  }
}
