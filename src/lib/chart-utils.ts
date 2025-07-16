/**
 * Chart Utils
 * Utilities for chart data transformation and formatting
 */

import { formatTime, formatDuration } from '@/lib/time-utils';
import {
  TimeBreakdownData,
  TrendData,
  ProjectAnalyticsData,
  LineChartData,
  PieChartData,
  BarChartData,
  ChartDataPoint,
} from '@/types/analytics';

/**
 * Format time for chart tooltips
 */
export function formatChartTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format time for chart labels (shorter format)
 */
export function formatChartLabel(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Generate colors for charts
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const color = baseColors[i % baseColors.length];
    if (color) {
      colors.push(color);
    }
  }
  return colors;
}

/**
 * Convert trend data to line chart format
 */
export function formatTrendDataForChart(trends: TrendData[]): LineChartData[] {
  return trends.map(trend => ({
    date: formatDateForChart(trend.date),
    totalTime: Math.round(trend.totalTime / 60), // Convert to minutes
    focusTime: Math.round(trend.focusTime / 60),
    sessions: trend.sessionsCount,
  }));
}

/**
 * Convert project breakdown to pie chart format
 */
export function formatProjectDataForPieChart(projects: ProjectAnalyticsData[]): PieChartData[] {
  return projects.map(project => ({
    name: project.projectName,
    value: Math.round(project.totalTime / 60), // Convert to minutes
    color: project.projectColor,
    percentage: project.percentage,
  }));
}

/**
 * Convert time breakdown to bar chart format
 */
export function formatTimeBreakdownForChart(breakdown: TimeBreakdownData): BarChartData[] {
  return [
    {
      name: 'Today',
      focus: Math.round(breakdown.focusTime / 60),
      break: Math.round(breakdown.breakTime / 60),
      total: Math.round(breakdown.totalTime / 60),
    },
  ];
}

/**
 * Format date for chart display
 */
export function formatDateForChart(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Check if it's today or yesterday
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }
  
  // Format as MM/DD for this year, or MM/DD/YY for other years
  const isCurrentYear = date.getFullYear() === today.getFullYear();
  
  if (isCurrentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }
}

/**
 * Helper function to check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Generate tooltip formatter for time-based charts
 */
export function createTimeTooltipFormatter() {
  return (value: number, name: string) => {
    const formattedValue = formatChartTime(value * 60); // Convert minutes back to seconds
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    return [formattedValue, label];
  };
}

/**
 * Generate label formatter for time-based charts
 */
export function createTimeLabelFormatter() {
  return (value: number) => formatChartLabel(value * 60); // Convert minutes back to seconds
}

/**
 * Calculate chart dimensions based on container size
 */
export function calculateChartDimensions(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number = 16 / 9
): { width: number; height: number } {
  const maxWidth = containerWidth - 40; // Account for padding
  const maxHeight = containerHeight - 40;
  
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

/**
 * Smooth data for better chart visualization
 */
export function smoothChartData(data: ChartDataPoint[], windowSize: number = 3): ChartDataPoint[] {
  if (data.length <= windowSize) return data;
  
  const smoothed: ChartDataPoint[] = [...data];
  
  for (let i = Math.floor(windowSize / 2); i < data.length - Math.floor(windowSize / 2); i++) {
    let sum = 0;
    for (let j = i - Math.floor(windowSize / 2); j <= i + Math.floor(windowSize / 2); j++) {
      const point = data[j];
      if (point) {
        sum += point.value;
      }
    }
    const currentPoint = data[i];
    if (currentPoint) {
      smoothed[i] = {
        ...currentPoint,
        value: sum / windowSize,
      };
    }
  }
  
  return smoothed;
}

/**
 * Filter chart data based on minimum threshold
 */
export function filterChartData(data: ChartDataPoint[], minValue: number = 0): ChartDataPoint[] {
  return data.filter(point => point.value >= minValue);
}

/**
 * Aggregate chart data by time period
 */
export function aggregateChartData(
  data: TrendData[],
  period: 'day' | 'week' | 'month'
): TrendData[] {
  if (period === 'day') return data;
  
  const aggregated = new Map<string, TrendData>();
  
  data.forEach(trend => {
    const date = new Date(trend.date);
    let key: string;
    
    if (period === 'week') {
      // Get Monday of the week
      const monday = new Date(date);
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(date.getDate() - daysToMonday);
      const mondayStr = monday.toISOString().split('T')[0];
      key = mondayStr || date.toISOString().split('T')[0] || trend.date;
    } else { // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }
    
    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.totalTime += trend.totalTime;
      existing.focusTime += trend.focusTime;
      existing.sessionsCount += trend.sessionsCount;
      existing.pomodoroCount += trend.pomodoroCount;
    } else {
      aggregated.set(key, { ...trend, date: key });
    }
  });
  
  return Array.from(aggregated.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate moving average for trend data
 */
export function calculateMovingAverage(data: TrendData[], windowSize: number = 7): TrendData[] {
  const result: TrendData[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    
    const avgTotalTime = window.reduce((sum, item) => sum + item.totalTime, 0) / window.length;
    const avgFocusTime = window.reduce((sum, item) => sum + item.focusTime, 0) / window.length;
    const avgSessions = window.reduce((sum, item) => sum + item.sessionsCount, 0) / window.length;
    const avgPomodoros = window.reduce((sum, item) => sum + item.pomodoroCount, 0) / window.length;
    
    const currentItem = data[i];
    if (currentItem) {
      result.push({
        date: currentItem.date,
        totalTime: avgTotalTime,
        focusTime: avgFocusTime,
        sessionsCount: Math.round(avgSessions),
        pomodoroCount: Math.round(avgPomodoros),
      });
    }
  }
  
  return result;
}

/**
 * Generate responsive chart configuration
 */
export function getResponsiveChartConfig(isMobile: boolean) {
  return {
    fontSize: isMobile ? 10 : 12,
    margin: isMobile 
      ? { top: 10, right: 10, left: 10, bottom: 20 }
      : { top: 20, right: 30, left: 20, bottom: 40 },
    tickCount: isMobile ? 3 : 5,
    labelAngle: isMobile ? -45 : 0,
  };
}
