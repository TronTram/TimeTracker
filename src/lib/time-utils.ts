// Utility functions for time formatting and calculations

/**
 * Format seconds into a human-readable time string
 * @param seconds - Time in seconds
 * @param format - Format type ('mm:ss', 'hh:mm:ss', 'minimal', 'verbose')
 * @returns Formatted time string
 */
export function formatTime(seconds: number, format: 'mm:ss' | 'hh:mm:ss' | 'minimal' | 'verbose' = 'mm:ss'): string {
  const totalSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  switch (format) {
    case 'hh:mm:ss':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    case 'mm:ss':
      const totalMinutes = Math.floor(totalSeconds / 60);
      return `${totalMinutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    case 'minimal':
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    
    case 'verbose':
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
      return parts.join(', ');
    
    default:
      return formatTime(seconds, 'mm:ss');
  }
}

/**
 * Parse a time string into seconds
 * @param timeString - Time string in format 'mm:ss' or 'hh:mm:ss'
 * @returns Time in seconds
 */
export function parseTimeString(timeString: string): number {
  const parts = timeString.split(':').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
  
  if (parts.length === 2) {
    // mm:ss format
    const [minutes = 0, seconds = 0] = parts;
    return (minutes * 60) + seconds;
  } else if (parts.length === 3) {
    // hh:mm:ss format
    const [hours = 0, minutes = 0, seconds = 0] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  
  throw new Error('Invalid time string format. Expected mm:ss or hh:mm:ss');
}

/**
 * Convert minutes to seconds
 * @param minutes - Time in minutes
 * @returns Time in seconds
 */
export function minutesToSeconds(minutes: number): number {
  return Math.floor(minutes * 60);
}

/**
 * Convert seconds to minutes
 * @param seconds - Time in seconds
 * @returns Time in minutes
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Calculate the elapsed time between two dates
 * @param startTime - Start date
 * @param endTime - End date (defaults to now)
 * @returns Elapsed time in seconds
 */
export function calculateElapsedTime(startTime: Date, endTime: Date = new Date()): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

/**
 * Calculate remaining time based on elapsed time and target duration
 * @param elapsedSeconds - Elapsed time in seconds
 * @param targetSeconds - Target duration in seconds
 * @returns Remaining time in seconds (can be negative for overtime)
 */
export function calculateRemainingTime(elapsedSeconds: number, targetSeconds: number): number {
  return targetSeconds - elapsedSeconds;
}

/**
 * Calculate progress percentage
 * @param elapsedSeconds - Elapsed time in seconds
 * @param targetSeconds - Target duration in seconds
 * @returns Progress as percentage (0-100), capped at 100
 */
export function calculateProgress(elapsedSeconds: number, targetSeconds: number): number {
  if (targetSeconds <= 0) return 0;
  const progress = (elapsedSeconds / targetSeconds) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Add time to a date
 * @param date - Base date
 * @param seconds - Seconds to add
 * @returns New date with added time
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + (seconds * 1000));
}

/**
 * Subtract time from a date
 * @param date - Base date
 * @param seconds - Seconds to subtract
 * @returns New date with subtracted time
 */
export function subtractSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() - (seconds * 1000));
}

/**
 * Check if a time is within business hours
 * @param date - Date to check
 * @param startHour - Business day start hour (0-23)
 * @param endHour - Business day end hour (0-23)
 * @returns True if within business hours
 */
export function isWithinBusinessHours(date: Date, startHour: number = 9, endHour: number = 17): boolean {
  const hour = date.getHours();
  return hour >= startHour && hour < endHour;
}

/**
 * Get the start of the day for a given date
 * @param date - Input date
 * @returns Date at start of day (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get the end of the day for a given date
 * @param date - Input date
 * @returns Date at end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Validate time input values
 * @param minutes - Time in minutes
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if valid
 */
export function validateTimeInput(minutes: number, min: number = 1, max: number = 180): boolean {
  return Number.isInteger(minutes) && minutes >= min && minutes <= max;
}

/**
 * Round time to nearest interval
 * @param seconds - Time in seconds
 * @param intervalSeconds - Interval to round to (default: 60 seconds)
 * @returns Rounded time in seconds
 */
export function roundTimeToInterval(seconds: number, intervalSeconds: number = 60): number {
  return Math.round(seconds / intervalSeconds) * intervalSeconds;
}

/**
 * Get a human-readable relative time description
 * @param seconds - Time in seconds
 * @returns Relative time description
 */
export function getRelativeTimeDescription(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Create a timer display object with formatted values
 * @param elapsedSeconds - Elapsed time in seconds
 * @param targetSeconds - Target duration in seconds
 * @param showNegative - Whether to show negative time for overtime
 * @returns Timer display object
 */
export function createTimerDisplay(
  elapsedSeconds: number, 
  targetSeconds: number, 
  showNegative: boolean = true
): {
  elapsed: string;
  remaining: string;
  target: string;
  progress: number;
  isOvertime: boolean;
  overtimeSeconds: number;
} {
  const remaining = calculateRemainingTime(elapsedSeconds, targetSeconds);
  const isOvertime = remaining < 0;
  const overtimeSeconds = isOvertime ? Math.abs(remaining) : 0;
  
  return {
    elapsed: formatTime(elapsedSeconds),
    remaining: showNegative ? formatTime(remaining) : formatTime(Math.max(0, remaining)),
    target: formatTime(targetSeconds),
    progress: calculateProgress(elapsedSeconds, targetSeconds),
    isOvertime,
    overtimeSeconds,
  };
}

/**
 * Debounce function for timer operations
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for frequent timer updates
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45m", "30s")
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Get date range for analytics
 * @param timeRange - Time range type
 * @param startDate - Custom start date (optional)
 * @param endDate - Custom end date (optional)
 * @returns Object with start and end dates
 */
export function getDateRange(
  timeRange: 'today' | 'week' | 'month' | 'year' | 'custom' = 'week',
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  const now = new Date();
  let end = new Date(now);
  let start = new Date(now);

  switch (timeRange) {
    case 'today':
      start = getStartOfDay(now);
      end = getEndOfDay(now);
      break;
    
    case 'week':
      // Get Monday of current week
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now);
      start.setDate(now.getDate() - daysToMonday);
      start = getStartOfDay(start);
      end = getEndOfDay(now);
      break;
    
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start = getStartOfDay(start);
      end = getEndOfDay(now);
      break;
    
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      start = getStartOfDay(start);
      end = getEndOfDay(now);
      break;
    
    case 'custom':
      if (startDate) {
        start = getStartOfDay(new Date(startDate));
      }
      if (endDate) {
        end = getEndOfDay(new Date(endDate));
      }
      break;
  }

  return { start, end };
}
