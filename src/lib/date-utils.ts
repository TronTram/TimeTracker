/**
 * Date utilities for analytics and time tracking
 * Provides enhanced date manipulation and formatting functions
 */

import { formatTime } from './time-utils';

// =============================================================================
// Date Range Utilities
// =============================================================================

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Get predefined date ranges
 */
export function getDateRange(range: TimeRange, customFrom?: Date, customTo?: Date): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
      
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      return {
        from: weekStart,
        to: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
      };
      
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        from: monthStart,
        to: monthEnd,
      };
      
    case 'quarter':
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);
      return {
        from: quarterStart,
        to: quarterEnd,
      };
      
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        from: yearStart,
        to: yearEnd,
      };
      
    case 'custom':
      return {
        from: customFrom || today,
        to: customTo || today,
      };
      
    default:
      return {
        from: today,
        to: today,
      };
  }
}

/**
 * Get the previous period for the given range
 */
export function getPreviousPeriod(range: TimeRange, current?: DateRange): DateRange {
  const currentRange = current || getDateRange(range);
  const duration = currentRange.to.getTime() - currentRange.from.getTime();
  
  return {
    from: new Date(currentRange.from.getTime() - duration),
    to: new Date(currentRange.to.getTime() - duration),
  };
}

/**
 * Check if a date falls within a date range
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(from: Date, to: Date): number {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate an array of dates between two dates
 */
export function getDatesBetween(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  
  while (current <= to) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// =============================================================================
// Date Formatting Utilities
// =============================================================================

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'short':
      options.month = 'numeric';
      options.day = 'numeric';
      break;
    case 'medium':
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'long':
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'full':
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format date range for display
 */
export function formatDateRange(range: DateRange, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const fromStr = formatDate(range.from, format);
  const toStr = formatDate(range.to, format);
  
  // If same day, return just one date
  if (range.from.toDateString() === range.to.toDateString()) {
    return fromStr;
  }
  
  // If same month, optimize display
  if (range.from.getMonth() === range.to.getMonth() && range.from.getFullYear() === range.to.getFullYear()) {
    const fromDay = range.from.getDate();
    const toDay = range.to.getDate();
    const month = new Intl.DateTimeFormat('en-US', { month: format === 'short' ? 'numeric' : 'short' }).format(range.from);
    return `${month} ${fromDay}-${toDay}`;
  }
  
  return `${fromStr} - ${toStr}`;
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day');
  }
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour');
  }
  if (Math.abs(diffMinutes) >= 1) {
    return rtf.format(diffMinutes, 'minute');
  }
  return rtf.format(diffSeconds, 'second');
}

// =============================================================================
// Business Date Utilities
// =============================================================================

/**
 * Check if a date is a weekday
 */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
}

/**
 * Get the start of the week (Monday)
 */
export function getStartOfWeek(date: Date, startOnMonday: boolean = true): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of the week (Sunday)
 */
export function getEndOfWeek(date: Date, startOnMonday: boolean = true): Date {
  const end = new Date(date);
  const day = end.getDay();
  const diff = startOnMonday ? (day === 0 ? 0 : 7 - day) : 6 - day;
  end.setDate(end.getDate() + diff);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get the start of the month
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get the end of the month
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the start of the year
 */
export function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/**
 * Get the end of the year
 */
export function getEndOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

// =============================================================================
// Time Zone Utilities
// =============================================================================

/**
 * Convert UTC date to local timezone
 */
export function utcToLocal(date: Date): Date {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
}

/**
 * Convert local date to UTC
 */
export function localToUtc(date: Date): Date {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
}

/**
 * Get the user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// =============================================================================
// Calendar Utilities
// =============================================================================

/**
 * Get calendar weeks for a month
 */
export function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = getStartOfWeek(firstDay, true);
  const endDate = getEndOfWeek(lastDay, true);
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    currentWeek.push(new Date(current));
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return weeks;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

// =============================================================================
// Analytics-Specific Date Utilities
// =============================================================================

/**
 * Get optimal date grouping for analytics based on date range
 */
export function getAnalyticsGrouping(range: DateRange): 'hour' | 'day' | 'week' | 'month' {
  const days = getDaysBetween(range.from, range.to);
  
  if (days <= 1) return 'hour';
  if (days <= 31) return 'day';
  if (days <= 365) return 'week';
  return 'month';
}

/**
 * Generate time labels for analytics charts
 */
export function generateTimeLabels(range: DateRange, grouping?: 'hour' | 'day' | 'week' | 'month'): string[] {
  const actualGrouping = grouping || getAnalyticsGrouping(range);
  const labels: string[] = [];
  
  switch (actualGrouping) {
    case 'hour':
      for (let hour = 0; hour < 24; hour++) {
        labels.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      break;
      
    case 'day':
      const dates = getDatesBetween(range.from, range.to);
      dates.forEach(date => {
        labels.push(formatDate(date, 'short'));
      });
      break;
      
    case 'week':
      const current = new Date(getStartOfWeek(range.from));
      while (current <= range.to) {
        labels.push(`Week of ${formatDate(current, 'short')}`);
        current.setDate(current.getDate() + 7);
      }
      break;
      
    case 'month':
      const monthCurrent = new Date(getStartOfMonth(range.from));
      while (monthCurrent <= range.to) {
        labels.push(new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(monthCurrent));
        monthCurrent.setMonth(monthCurrent.getMonth() + 1);
      }
      break;
  }
  
  return labels;
}

/**
 * Parse date string safely
 */
export function parseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format date for API calls (ISO string)
 */
export function formatForApi(date: Date): string {
  return date.toISOString();
}

/**
 * Create a safe date range (ensure from <= to)
 */
export function createSafeDateRange(from: Date, to: Date): DateRange {
  if (from > to) {
    return { from: to, to: from };
  }
  return { from, to };
}
