// Business logic for session management and validation
import { SessionWithProject, SessionFormData, SessionValidationRules } from '@/types/session';
import { TimeSession, SessionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export class SessionService {
  // Default validation rules
  static readonly DEFAULT_VALIDATION_RULES: SessionValidationRules = {
    maxDuration: 8 * 60 * 60, // 8 hours in seconds
    minDuration: 1 * 60, // 1 minute in seconds
    maxTagsPerSession: 10,
    maxDescriptionLength: 1000,
    allowOverlapping: false,
    allowFutureSessions: false,
    requireProject: false,
    requireDescription: false,
  };

  /**
   * Validate session data against business rules
   */
  static validateSession(
    data: Partial<SessionFormData>, 
    rules: SessionValidationRules = this.DEFAULT_VALIDATION_RULES
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Duration validation
    if (data.duration !== undefined) {
      if (data.duration < rules.minDuration) {
        errors.push(`Duration must be at least ${Math.round(rules.minDuration / 60)} minutes`);
      }
      if (data.duration > rules.maxDuration) {
        errors.push(`Duration cannot exceed ${Math.round(rules.maxDuration / 3600)} hours`);
      }
    }

    // Time validation
    if (data.startTime && data.endTime) {
      if (data.endTime <= data.startTime) {
        errors.push('End time must be after start time');
      }
      
      if (!rules.allowFutureSessions && data.startTime > new Date()) {
        errors.push('Sessions cannot be scheduled in the future');
      }
    }

    // Tags validation
    if (data.tags && data.tags.length > rules.maxTagsPerSession) {
      errors.push(`Maximum ${rules.maxTagsPerSession} tags per session`);
    }

    // Description validation
    if (data.description) {
      if (data.description.length > rules.maxDescriptionLength) {
        errors.push(`Description cannot exceed ${rules.maxDescriptionLength} characters`);
      }
    }

    // Required field validation
    if (rules.requireProject && !data.projectId) {
      errors.push('Project is required');
    }

    if (rules.requireDescription && !data.description) {
      errors.push('Description is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for overlapping sessions
   */
  static async checkOverlappingSessions(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeSessionId?: string
  ): Promise<TimeSession[]> {
    const whereClause: any = {
      userId,
      startTime: { lt: endTime },
      OR: [
        { endTime: { gt: startTime } },
        { endTime: null }, // Active sessions
      ],
    };

    if (excludeSessionId) {
      whereClause.id = { not: excludeSessionId };
    }

    return prisma.timeSession.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  /**
   * Calculate session duration from start and end times
   */
  static calculateDuration(startTime: Date, endTime: Date): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  }

  /**
   * Format session duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Get session status based on current time
   */
  static getSessionStatus(session: TimeSession): 'active' | 'completed' | 'paused' {
    if (session.endTime) {
      return 'completed';
    }
    
    // If no end time but duration > 0, it might be paused
    if (session.duration > 0) {
      return 'paused';
    }
    
    return 'active';
  }

  /**
   * Calculate remaining time for an active session
   */
  static calculateRemainingTime(
    session: TimeSession, 
    targetDuration?: number
  ): number | null {
    if (session.endTime || !targetDuration) {
      return null;
    }

    const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    return Math.max(0, targetDuration - elapsed);
  }

  /**
   * Get session productivity score based on various factors
   */
  static calculateProductivityScore(session: TimeSession): number {
    let score = 50; // Base score

    // Duration factor (longer sessions get higher scores, up to optimal length)
    const optimalDuration = 25 * 60; // 25 minutes (Pomodoro)
    const durationRatio = Math.min(session.duration / optimalDuration, 1);
    score += durationRatio * 30;

    // Completion factor
    if (session.endTime) {
      score += 20;
    }

    // Session type factor
    if (session.sessionType === 'FOCUS') {
      score += 10;
    }

    // Pomodoro factor
    if (session.isPomodoro) {
      score += 10;
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Generate session insights and recommendations
   */
  static generateSessionInsights(sessions: TimeSession[]): {
    insights: string[];
    recommendations: string[];
    patterns: Record<string, any>;
  } {
    if (sessions.length === 0) {
      return {
        insights: ['No sessions to analyze'],
        recommendations: ['Start tracking your time to get insights'],
        patterns: {},
      };
    }

    const insights: string[] = [];
    const recommendations: string[] = [];
    const patterns: Record<string, any> = {};

    // Analyze session patterns
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = totalTime / sessions.length;
    const focusSessions = sessions.filter(s => s.sessionType === 'FOCUS');
    const pomodoroSessions = sessions.filter(s => s.isPomodoro);

    patterns.totalSessions = sessions.length;
    patterns.totalTime = totalTime;
    patterns.averageDuration = avgDuration;
    patterns.focusPercentage = (focusSessions.length / sessions.length) * 100;
    patterns.pomodoroPercentage = (pomodoroSessions.length / sessions.length) * 100;

    // Generate insights
    if (avgDuration < 15 * 60) {
      insights.push('Your sessions are quite short on average');
      recommendations.push('Try longer focus sessions (25-50 minutes) for better deep work');
    } else if (avgDuration > 90 * 60) {
      insights.push('You prefer longer work sessions');
      recommendations.push('Consider taking more frequent breaks to maintain focus');
    }

    if (patterns.focusPercentage > 80) {
      insights.push('You spend most of your time in focused work');
    } else if (patterns.focusPercentage < 60) {
      insights.push('You might benefit from more focused work sessions');
      recommendations.push('Try to increase your focus time ratio');
    }

    if (patterns.pomodoroPercentage > 50) {
      insights.push('You effectively use the Pomodoro technique');
    } else if (patterns.pomodoroPercentage < 20) {
      recommendations.push('Consider trying the Pomodoro technique for better focus');
    }

    return { insights, recommendations, patterns };
  }

  /**
   * Get time distribution by hour of day
   */
  static getHourlyDistribution(sessions: TimeSession[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    
    // Initialize all hours to 0
    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = 0;
    }

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      if (distribution[hour] !== undefined) {
        distribution[hour] += session.duration;
      }
    });

    return distribution;
  }

  /**
   * Get most productive time periods
   */
  static getMostProductivePeriods(sessions: TimeSession[]): {
    hour: number;
    dayOfWeek: number;
    totalTime: number;
  }[] {
    const hourlyStats: Record<number, number> = {};
    const dailyStats: Record<number, number> = {};

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const dayOfWeek = session.startTime.getDay();

      hourlyStats[hour] = (hourlyStats[hour] || 0) + session.duration;
      dailyStats[dayOfWeek] = (dailyStats[dayOfWeek] || 0) + session.duration;
    });

    const mostProductiveHour = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)[0];
    
    const mostProductiveDay = Object.entries(dailyStats)
      .sort(([, a], [, b]) => b - a)[0];

    return [
      {
        hour: mostProductiveHour ? parseInt(mostProductiveHour[0]) : 9,
        dayOfWeek: mostProductiveDay ? parseInt(mostProductiveDay[0]) : 1,
        totalTime: Math.max(
          mostProductiveHour ? mostProductiveHour[1] : 0,
          mostProductiveDay ? mostProductiveDay[1] : 0
        ),
      },
    ];
  }

  /**
   * Calculate session streaks
   */
  static calculateStreaks(sessions: TimeSession[]): {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  } {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );

    // Group sessions by date
    const sessionsByDate = new Map<string, TimeSession[]>();
    sortedSessions.forEach(session => {
      const dateKey = session.startTime.toISOString().split('T')[0];
      if (dateKey) {
        if (!sessionsByDate.has(dateKey)) {
          sessionsByDate.set(dateKey, []);
        }
        sessionsByDate.get(dateKey)!.push(session);
      }
    });

    const dates = Array.from(sessionsByDate.keys()).sort().filter(Boolean);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = new Date(dates[i]!);
      const previousDate = i > 0 ? new Date(dates[i - 1]!) : null;
      
      tempStreak++;
      
      if (previousDate) {
        const dayDiff = Math.floor(
          (date.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (dayDiff > 1) {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          if (i === dates.length - 1) {
            currentStreak = tempStreak;
          }
          tempStreak = 0;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Check if current streak is still active (last session within last 2 days)
    const today = new Date();
    const lastDate = dates[dates.length - 1];
    if (lastDate) {
      const lastSessionDate = new Date(lastDate);
      const daysSinceLastSession = Math.floor(
        (today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastSession <= 1) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveDate: sortedSessions[0]?.startTime || null,
    };
  }

  /**
   * Validate session template data
   */
  static validateSessionTemplate(data: {
    name: string;
    description?: string;
    sessionType: SessionType;
    defaultDuration?: number;
    tags: string[];
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Template name is required');
    }

    if (data.name.length > 100) {
      errors.push('Template name cannot exceed 100 characters');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Template description cannot exceed 500 characters');
    }

    if (data.defaultDuration && (data.defaultDuration < 60 || data.defaultDuration > 28800)) {
      errors.push('Default duration must be between 1 minute and 8 hours');
    }

    if (data.tags.length > 10) {
      errors.push('Maximum 10 tags per template');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Suggest optimal session duration based on historical data
   */
  static suggestOptimalDuration(
    sessions: TimeSession[],
    sessionType: SessionType = 'FOCUS'
  ): number {
    const relevantSessions = sessions.filter(s => s.sessionType === sessionType);
    
    if (relevantSessions.length === 0) {
      // Default suggestions based on session type
      switch (sessionType) {
        case 'FOCUS':
          return 25 * 60; // 25 minutes
        case 'SHORT_BREAK':
          return 5 * 60; // 5 minutes
        case 'LONG_BREAK':
          return 15 * 60; // 15 minutes
        default:
          return 25 * 60;
      }
    }

    // Calculate median duration for better stability
    const durations = relevantSessions.map(s => s.duration).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    
    return median || 25 * 60; // Fallback to 25 minutes
  }
}
