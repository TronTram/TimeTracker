/**
 * Analytics Service
 * Business logic for data aggregation and analysis
 */

import { 
  TimeBreakdownData, 
  TrendData, 
  ProjectAnalyticsData,
  ProductivityInsights,
  DailyAnalytics,
  WeeklyAnalytics,
  MonthlyAnalytics,
  PomodoroAnalytics,
  HeatMapData,
  SessionTypeBreakdown,
  ComparisonData,
  PerformanceMetrics,
  TimeRange
} from '@/types/analytics';
import { PaginatedResponse } from '@/types/actions';
import { SessionService, ProjectService } from './database-service';
import { CacheService } from './cache-service';
import { formatDuration, getDateRange } from '@/lib/time-utils';

export class AnalyticsService {
  
  /**
   * Calculate time breakdown for a given period
   */
  static async calculateTimeBreakdown(
    userId: string, 
    timeRange: TimeRange = 'week',
    startDate?: string,
    endDate?: string,
    projectId?: string
  ): Promise<TimeBreakdownData> {
    const cacheKey = `analytics:breakdown:${userId}:${timeRange}:${startDate}:${endDate}:${projectId}`;
    
    // Try cache first
    const cached = CacheService.getAnalytics(cacheKey);
    if (cached) {
      return cached as TimeBreakdownData;
    }

    // Get date range
    const { start, end } = getDateRange(timeRange, startDate, endDate);

    // Fetch sessions data
    const sessions = await SessionService.getUserSessions(userId, {
      dateFrom: start,
      dateTo: end,
      projectId,
      page: 1,
      pageSize: 10000, // Get all sessions for accurate analytics
    });

    // Calculate breakdown
    let focusTime = 0;
    let breakTime = 0;
    let totalTime = 0;
    let pomodoroCount = 0;

    if (sessions.data) {
      sessions.data.forEach((session: any) => {
        totalTime += session.duration;
        
        if (session.sessionType === 'FOCUS') {
          focusTime += session.duration;
        } else {
          breakTime += session.duration;
        }
        
        if (session.isPomodoro) {
          pomodoroCount++;
        }
      });
    }

    const breakdown: TimeBreakdownData = {
      focusTime,
      breakTime,
      totalTime,
      sessionsCount: sessions.data?.length || 0,
      pomodoroCount,
      averageSessionLength: sessions.data?.length > 0 ? totalTime / sessions.data.length : 0,
    };

    // Cache for 10 minutes
    CacheService.setAnalytics(cacheKey, breakdown, 10 * 60 * 1000);
    
    return breakdown;
  }

  /**
   * Get time trends for chart visualization
   */
  static async getTimeTrends(
    userId: string,
    timeRange: TimeRange = 'week',
    startDate?: string,
    endDate?: string
  ): Promise<TrendData[]> {
    const cacheKey = `analytics:trends:${userId}:${timeRange}:${startDate}:${endDate}`;
    
    // Try cache first
    const cached = CacheService.getAnalytics(cacheKey);
    if (cached) {
      return cached as TrendData[];
    }

    const { start, end } = getDateRange(timeRange, startDate, endDate);
    const trends: TrendData[] = [];

    // Generate date array
    const dates: string[] = [];
    const currentDate = new Date(start);
    const endDateTime = new Date(end);

    while (currentDate <= endDateTime) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dateStr) {
        dates.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get daily stats for each date
    for (const date of dates) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStats = await SessionService.getDailyStats(userId, dayStart);
      
      trends.push({
        date,
        totalTime: dayStats.totalTime,
        focusTime: dayStats.focusTime,
        sessionsCount: dayStats.sessionsCount,
        pomodoroCount: dayStats.pomodoroSessions,
      });
    }

    // Cache for 20 minutes
    CacheService.setAnalytics(cacheKey, trends, 20 * 60 * 1000);
    
    return trends;
  }

  /**
   * Get project analytics breakdown
   */
  static async getProjectBreakdown(
    userId: string,
    timeRange: TimeRange = 'week',
    startDate?: string,
    endDate?: string
  ): Promise<ProjectAnalyticsData[]> {
    const cacheKey = `analytics:projects:${userId}:${timeRange}:${startDate}:${endDate}`;
    
    // Try cache first
    const cached = CacheService.getAnalytics(cacheKey);
    if (cached) {
      return cached as ProjectAnalyticsData[];
    }

    const { start, end } = getDateRange(timeRange, startDate, endDate);

    // Get sessions with project data
    const sessions = await SessionService.getUserSessions(userId, {
      dateFrom: start,
      dateTo: end,
      page: 1,
      pageSize: 10000,
    });

    if (!sessions.data) {
      return [];
    }

    // Group by project
    const projectMap = new Map<string, {
      projectId: string;
      projectName: string;
      projectColor: string;
      totalTime: number;
      sessionsCount: number;
    }>();

    let totalTimeAllProjects = 0;

    sessions.data.forEach((session: any) => {
      const projectId = session.projectId || 'no-project';
      const projectName = session.project?.name || 'No Project';
      const projectColor = session.project?.color || '#6b7280';
      
      totalTimeAllProjects += session.duration;
      
      if (projectMap.has(projectId)) {
        const existing = projectMap.get(projectId)!;
        existing.totalTime += session.duration;
        existing.sessionsCount += 1;
      } else {
        projectMap.set(projectId, {
          projectId,
          projectName,
          projectColor,
          totalTime: session.duration,
          sessionsCount: 1,
        });
      }
    });

    // Convert to array and calculate percentages
    const breakdown: ProjectAnalyticsData[] = Array.from(projectMap.values()).map(project => ({
      ...project,
      percentage: totalTimeAllProjects > 0 ? (project.totalTime / totalTimeAllProjects) * 100 : 0,
      averageSessionLength: project.sessionsCount > 0 ? project.totalTime / project.sessionsCount : 0,
    }));

    // Sort by total time descending
    breakdown.sort((a, b) => b.totalTime - a.totalTime);

    // Cache for 15 minutes
    CacheService.setAnalytics(cacheKey, breakdown, 15 * 60 * 1000);
    
    return breakdown;
  }

  /**
   * Calculate productivity insights
   */
  static async getProductivityInsights(
    userId: string,
    timeRange: TimeRange = 'week'
  ): Promise<ProductivityInsights> {
    const cacheKey = `analytics:insights:${userId}:${timeRange}`;
    
    // Try cache first
    const cached = CacheService.getAnalytics(cacheKey);
    if (cached) {
      return cached as ProductivityInsights;
    }

    // Get current period data
    const current = await this.calculateTimeBreakdown(userId, timeRange);
    
    // Get previous period data for comparison
    const { start: currentStart } = getDateRange(timeRange);
    const daysDiff = Math.ceil((new Date().getTime() - currentStart.getTime()) / (1000 * 3600 * 24));
    
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - daysDiff);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    
    const previous = await this.calculateTimeBreakdown(
      userId, 
      'custom',
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    );

    // Calculate improvements
    const improvements = {
      totalTime: this.calculatePercentageChange(current.totalTime, previous.totalTime),
      focusTime: this.calculatePercentageChange(current.focusTime, previous.focusTime),
      sessions: this.calculatePercentageChange(current.sessionsCount, previous.sessionsCount),
      pomodoros: this.calculatePercentageChange(current.pomodoroCount, previous.pomodoroCount),
    };

    // Calculate focus ratio
    const focusRatio = current.totalTime > 0 ? (current.focusTime / current.totalTime) * 100 : 0;

    // Calculate productivity score (0-100)
    const productivityScore = this.calculateProductivityScore({
      focusRatio,
      averageSessionLength: current.averageSessionLength,
      sessionsCount: current.sessionsCount,
      totalTime: current.totalTime,
    });

    // TODO: Implement actual streak calculation from database
    const streakData = {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
    };

    const insights: ProductivityInsights = {
      current,
      previous,
      improvements,
      streakData,
      focusRatio,
      productivityScore,
    };

    // Cache for 30 minutes
    CacheService.setAnalytics(cacheKey, insights, 30 * 60 * 1000);
    
    return insights;
  }

  /**
   * Get session type breakdown
   */
  static async getSessionTypeBreakdown(
    userId: string,
    timeRange: TimeRange = 'week'
  ): Promise<SessionTypeBreakdown> {
    const { start, end } = getDateRange(timeRange);
    
    const sessions = await SessionService.getUserSessions(userId, {
      dateFrom: start,
      dateTo: end,
      page: 1,
      pageSize: 10000,
    });

    const breakdown: SessionTypeBreakdown = {
      focus: 0,
      shortBreak: 0,
      longBreak: 0,
      custom: 0,
    };

    if (sessions.data) {
      sessions.data.forEach((session: any) => {
        switch (session.sessionType) {
          case 'FOCUS':
            breakdown.focus += session.duration;
            break;
          case 'SHORT_BREAK':
            breakdown.shortBreak += session.duration;
            break;
          case 'LONG_BREAK':
            breakdown.longBreak += session.duration;
            break;
          default:
            breakdown.custom += session.duration;
        }
      });
    }

    return breakdown;
  }

  /**
   * Get heat map data for calendar visualization
   */
  static async getHeatMapData(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<HeatMapData[]> {
    const cacheKey = `analytics:heatmap:${userId}:${year}`;
    
    // Try cache first
    const cached = CacheService.getAnalytics(cacheKey);
    if (cached) {
      return cached as HeatMapData[];
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const sessions = await SessionService.getUserSessions(userId, {
      dateFrom: startDate,
      dateTo: endDate,
      page: 1,
      pageSize: 10000,
    });

    const dataMap = new Map<string, number>();
    
    if (sessions.data) {
      sessions.data.forEach((session: any) => {
        const sessionDate = new Date(session.startTime);
        const dateStr = sessionDate.toISOString().split('T')[0];
        if (dateStr) {
          const existing = dataMap.get(dateStr) || 0;
          dataMap.set(dateStr, existing + session.duration);
        }
      });
    }

    // Generate heat map data
    const heatMapData: HeatMapData[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dateStr) {
        const value = Math.round((dataMap.get(dateStr) || 0) / 60); // Convert to minutes
        
        heatMapData.push({
          date: dateStr,
          value,
          level: this.getHeatMapLevel(value),
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Cache for 4 hours
    CacheService.setAnalytics(cacheKey, heatMapData, 4 * 60 * 60 * 1000);
    
    return heatMapData;
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(
    userId: string,
    timeRange: TimeRange = 'month'
  ): Promise<PerformanceMetrics> {
    const trends = await this.getTimeTrends(userId, timeRange);
    const insights = await this.getProductivityInsights(userId, timeRange);
    
    // Calculate consistency (how regular is the usage)
    const nonZeroDays = trends.filter(day => day.totalTime > 0).length;
    const consistency = trends.length > 0 ? (nonZeroDays / trends.length) * 100 : 0;
    
    // Calculate efficiency (session completion rate and focus ratio)
    const efficiency = (insights.focusRatio + insights.productivityScore) / 2;
    
    // Calculate growth (trend over time)
    const growth = insights.improvements ? 
      (insights.improvements.totalTime + insights.improvements.focusTime) / 2 : 0;
    
    // Calculate engagement (feature usage score)
    const engagement = Math.min(100, 
      (insights.current.pomodoroCount * 10) + 
      (insights.current.sessionsCount * 5) + 
      (nonZeroDays * 3)
    );

    return {
      consistency: Math.round(consistency),
      efficiency: Math.round(efficiency),
      growth: Math.round(growth),
      engagement: Math.round(engagement),
    };
  }

  // Helper methods

  /**
   * Calculate percentage change between two values
   */
  private static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate productivity score based on various factors
   */
  private static calculateProductivityScore(data: {
    focusRatio: number;
    averageSessionLength: number;
    sessionsCount: number;
    totalTime: number;
  }): number {
    let score = 0;
    
    // Focus ratio contributes 40% to score
    score += (data.focusRatio / 100) * 40;
    
    // Session length consistency contributes 30%
    const optimalLength = 25 * 60; // 25 minutes in seconds
    const lengthScore = Math.max(0, 100 - Math.abs(data.averageSessionLength - optimalLength) / optimalLength * 100);
    score += (lengthScore / 100) * 30;
    
    // Session frequency contributes 20%
    const frequencyScore = Math.min(100, data.sessionsCount * 10);
    score += (frequencyScore / 100) * 20;
    
    // Total time contributes 10%
    const timeScore = Math.min(100, (data.totalTime / (8 * 60 * 60)) * 100); // 8 hours as max
    score += (timeScore / 100) * 10;
    
    return Math.round(score);
  }

  /**
   * Determine heat map level based on time value
   */
  private static getHeatMapLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
    if (minutes === 0) return 0;
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 120) return 3;
    return 4;
  }
}
