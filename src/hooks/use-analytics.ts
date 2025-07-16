/**
 * Analytics Hook
 * Custom hook for analytics data fetching and calculations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  TimeBreakdownData,
  TrendData,
  ProjectAnalyticsData,
  ProductivityInsights,
  TimeRange,
  StatsCardData,
  LineChartData,
  PieChartData,
  SessionTypeBreakdown,
  GoalProgress,
} from '@/types/analytics';
import {
  getTimeBreakdown,
  getTimeTrends,
  getProjectBreakdown,
  getProductivityInsights,
  getGoalProgress,
} from '@/actions/analytics-actions';
import { formatTime, formatDuration } from '@/lib/time-utils';

interface UseAnalyticsParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAnalyticsReturn {
  // Data
  timeBreakdown: TimeBreakdownData | null;
  timeTrends: TrendData[];
  projectBreakdown: ProjectAnalyticsData[];
  insights: ProductivityInsights | null;
  goalProgress: GoalProgress | null;
  sessionTypeBreakdown: SessionTypeBreakdown | null;
  
  // Chart data (formatted for recharts)
  lineChartData: LineChartData[];
  pieChartData: PieChartData[];
  statsCards: StatsCardData[];
  
  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refetch: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  setDateRange: (start?: string, end?: string) => void;
  clearCache: () => Promise<void>;
}

export function useAnalytics(params: UseAnalyticsParams = {}): UseAnalyticsReturn {
  const { user } = useUser();
  const {
    timeRange = 'week',
    startDate,
    endDate,
    projectId,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
  } = params;

  // State
  const [currentTimeRange, setCurrentTimeRange] = useState<TimeRange>(timeRange);
  const [currentStartDate, setCurrentStartDate] = useState<string | undefined>(startDate);
  const [currentEndDate, setCurrentEndDate] = useState<string | undefined>(endDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data state
  const [timeBreakdown, setTimeBreakdown] = useState<TimeBreakdownData | null>(null);
  const [timeTrends, setTimeTrends] = useState<TrendData[]>([]);
  const [projectBreakdown, setProjectBreakdown] = useState<ProjectAnalyticsData[]>([]);
  const [insights, setInsights] = useState<ProductivityInsights | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);

  // Computed data
  const [lineChartData, setLineChartData] = useState<LineChartData[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [statsCards, setStatsCards] = useState<StatsCardData[]>([]);
  const [sessionTypeBreakdown, setSessionTypeBreakdown] = useState<SessionTypeBreakdown | null>(null);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        timeRange: currentTimeRange,
        startDate: currentStartDate,
        endDate: currentEndDate,
        projectId,
      };

      // Fetch all data in parallel
      const [
        timeBreakdownResult,
        timeTrendsResult,
        projectBreakdownResult,
        insightsResult,
        goalProgressResult,
      ] = await Promise.all([
        getTimeBreakdown(params),
        getTimeTrends(params),
        getProjectBreakdown(params),
        getProductivityInsights(params),
        getGoalProgress(),
      ]);

      // Handle results
      if (timeBreakdownResult.success && timeBreakdownResult.data) {
        setTimeBreakdown(timeBreakdownResult.data);
      }
      
      if (timeTrendsResult.success && timeTrendsResult.data) {
        setTimeTrends(timeTrendsResult.data);
        
        // Convert to line chart data
        const chartData: LineChartData[] = timeTrendsResult.data.map(trend => ({
          date: trend.date,
          totalTime: Math.round(trend.totalTime / 60), // Convert to minutes
          focusTime: Math.round(trend.focusTime / 60),
          sessions: trend.sessionsCount,
        }));
        setLineChartData(chartData);
      }
      
      if (projectBreakdownResult.success && projectBreakdownResult.data) {
        setProjectBreakdown(projectBreakdownResult.data);
        
        // Convert to pie chart data
        const chartData: PieChartData[] = projectBreakdownResult.data.map(project => ({
          name: project.projectName,
          value: Math.round(project.totalTime / 60), // Convert to minutes
          color: project.projectColor,
          percentage: project.percentage,
        }));
        setPieChartData(chartData);
      }
      
      if (insightsResult.success && insightsResult.data) {
        setInsights(insightsResult.data);
      }
      
      if (goalProgressResult.success && goalProgressResult.data) {
        setGoalProgress(goalProgressResult.data);
      }

      // Generate stats cards
      if (timeBreakdownResult.success && timeBreakdownResult.data) {
        const breakdown = timeBreakdownResult.data;
        const cards: StatsCardData[] = [
          {
            title: 'Total Time',
            value: formatDuration(breakdown.totalTime),
            icon: 'clock',
            trend: insightsResult.success && insightsResult.data?.improvements ? {
              value: insightsResult.data.improvements.totalTime,
              isPositive: insightsResult.data.improvements.totalTime > 0,
              period: `vs last ${currentTimeRange}`,
            } : undefined,
            color: '#3b82f6',
          },
          {
            title: 'Sessions',
            value: breakdown.sessionsCount.toString(),
            icon: 'activity',
            trend: insightsResult.success && insightsResult.data?.improvements ? {
              value: insightsResult.data.improvements.sessions,
              isPositive: insightsResult.data.improvements.sessions > 0,
              period: `vs last ${currentTimeRange}`,
            } : undefined,
            color: '#10b981',
          },
          {
            title: 'Avg Session',
            value: formatDuration(breakdown.averageSessionLength),
            icon: 'trending-up',
            color: '#f59e0b',
          },
          {
            title: 'Focus Ratio',
            value: `${Math.round(breakdown.totalTime > 0 ? (breakdown.focusTime / breakdown.totalTime) * 100 : 0)}%`,
            icon: 'target',
            color: '#8b5cf6',
          },
        ];
        setStatsCards(cards);
      }

      // Calculate session type breakdown
      if (timeBreakdownResult.success && timeBreakdownResult.data) {
        const breakdown = timeBreakdownResult.data;
        setSessionTypeBreakdown({
          focus: breakdown.focusTime,
          shortBreak: breakdown.breakTime * 0.7, // Estimate
          longBreak: breakdown.breakTime * 0.3, // Estimate
          custom: 0,
        });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user, currentTimeRange, currentStartDate, currentEndDate, projectId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, autoRefresh, refreshInterval]);

  // Initial fetch and dependency updates
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Public methods
  const refetch = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  const setTimeRange = useCallback((range: TimeRange) => {
    setCurrentTimeRange(range);
    if (range !== 'custom') {
      setCurrentStartDate(undefined);
      setCurrentEndDate(undefined);
    }
  }, []);

  const setDateRange = useCallback((start?: string, end?: string) => {
    setCurrentStartDate(start);
    setCurrentEndDate(end);
    if (start || end) {
      setCurrentTimeRange('custom');
    }
  }, []);

  const clearCache = useCallback(async () => {
    // TODO: Implement cache clearing action
    console.log('Cache clearing not implemented yet');
  }, []);

  return {
    // Data
    timeBreakdown,
    timeTrends,
    projectBreakdown,
    insights,
    goalProgress,
    sessionTypeBreakdown,
    
    // Chart data
    lineChartData,
    pieChartData,
    statsCards,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refetch,
    setTimeRange,
    setDateRange,
    clearCache,
  };
}

// Utility hook for real-time analytics updates
export function useRealTimeAnalytics(enabled: boolean = true) {
  const analytics = useAnalytics({
    autoRefresh: enabled,
    refreshInterval: 30 * 1000, // 30 seconds for real-time
  });

  return analytics;
}

// Utility hook for dashboard analytics
export function useDashboardAnalytics() {
  const analytics = useAnalytics({
    timeRange: 'today',
    autoRefresh: true,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
  });

  return {
    ...analytics,
    todayStats: analytics.timeBreakdown,
    isActive: analytics.timeBreakdown && analytics.timeBreakdown.totalTime > 0,
  };
}

// Utility hook for project-specific analytics
export function useProjectAnalytics(projectId: string, timeRange: TimeRange = 'month') {
  const analytics = useAnalytics({
    projectId,
    timeRange,
    autoRefresh: false,
  });

  return analytics;
}
