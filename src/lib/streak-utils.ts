/**
 * Utility functions for streak calculations and grace periods
 */

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  streakBroken: boolean;
  daysInactive: number;
  gracePeriodsUsed: number;
}

export interface SessionData {
  completedAt: Date;
  duration: number;
  isPomodoro?: boolean;
  projectId?: string;
}

export interface StreakRules {
  minimumSessionDuration: number; // minutes
  gracePeriodDays: number;
  maxGracePeriods: number;
  streakTimeWindow: 'calendar-day' | '24-hours';
  requireMinimumSessions: number;
}

/**
 * Default streak rules
 */
export const DEFAULT_STREAK_RULES: StreakRules = {
  minimumSessionDuration: 5, // 5 minutes minimum
  gracePeriodDays: 1, // 1 day grace period
  maxGracePeriods: 3, // Max 3 grace periods per month
  streakTimeWindow: 'calendar-day',
  requireMinimumSessions: 1, // At least 1 session per day
};

/**
 * Calculate streak from session history
 */
export function calculateStreakFromSessions(
  sessions: SessionData[],
  rules: StreakRules = DEFAULT_STREAK_RULES
): StreakCalculationResult {
  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakBroken: false,
      daysInactive: 0,
      gracePeriodsUsed: 0,
    };
  }

  // Filter sessions by minimum duration
  const validSessions = sessions.filter(
    session => session.duration >= rules.minimumSessionDuration
  );

  if (validSessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakBroken: false,
      daysInactive: 0,
      gracePeriodsUsed: 0,
    };
  }

  // Group sessions by day
  const sessionsByDay = groupSessionsByDay(validSessions, rules.streakTimeWindow);
  const sortedDays = Array.from(sessionsByDay.keys()).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Calculate current streak (working backwards from today)
  const { currentStreak, gracePeriodsUsed, lastActiveDate } = calculateCurrentStreak(
    sessionsByDay, 
    sortedDays, 
    rules
  );

  // Calculate longest streak from history
  const longestStreak = calculateLongestStreakFromHistory(sessionsByDay, sortedDays, rules);

  // Calculate days inactive
  const today = new Date();
  const daysInactive = lastActiveDate 
    ? Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
    : Number.MAX_SAFE_INTEGER;

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActiveDate,
    streakBroken: currentStreak === 0 && validSessions.length > 0,
    daysInactive,
    gracePeriodsUsed,
  };
}

/**
 * Group sessions by day
 */
function groupSessionsByDay(
  sessions: SessionData[], 
  timeWindow: 'calendar-day' | '24-hours'
): Map<string, SessionData[]> {
  const sessionsByDay = new Map<string, SessionData[]>();

  sessions.forEach(session => {
    let dayKey: string;
    
    if (timeWindow === 'calendar-day') {
      // Use calendar day (midnight to midnight)
      dayKey = session.completedAt.toDateString();
    } else {
      // Use 24-hour rolling window
      const timestamp = session.completedAt.getTime();
      const dayStart = Math.floor(timestamp / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24);
      dayKey = new Date(dayStart).toDateString();
    }

    if (!sessionsByDay.has(dayKey)) {
      sessionsByDay.set(dayKey, []);
    }
    sessionsByDay.get(dayKey)!.push(session);
  });

  return sessionsByDay;
}

/**
 * Calculate current streak working backwards from today
 */
function calculateCurrentStreak(
  sessionsByDay: Map<string, SessionData[]>,
  sortedDays: string[],
  rules: StreakRules
): {
  currentStreak: number;
  gracePeriodsUsed: number;
  lastActiveDate: Date | null;
} {
  const today = new Date();
  const todayKey = today.toDateString();
  
  let currentStreak = 0;
  let gracePeriodsUsed = 0;
  let lastActiveDate: Date | null = null;
  let currentDate = new Date(today);

  // Check if today has qualifying sessions
  const todaySessions = sessionsByDay.get(todayKey) || [];
  if (todaySessions.length >= rules.requireMinimumSessions) {
    currentStreak = 1;
    lastActiveDate = new Date(Math.max(...todaySessions.map(s => s.completedAt.getTime())));
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Work backwards through previous days
  while (true) {
    const dateKey = currentDate.toDateString();
    const daySessions = sessionsByDay.get(dateKey) || [];
    
    if (daySessions.length >= rules.requireMinimumSessions) {
      currentStreak++;
      if (!lastActiveDate) {
        lastActiveDate = new Date(Math.max(...daySessions.map(s => s.completedAt.getTime())));
      }
    } else {
      // No qualifying sessions this day
      if (gracePeriodsUsed < rules.maxGracePeriods) {
        // Use grace period
        gracePeriodsUsed++;
      } else {
        // No more grace periods, streak ends
        break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Safety break for very long streaks
    if (currentStreak > 1000) break;
  }

  return { currentStreak, gracePeriodsUsed, lastActiveDate };
}

/**
 * Calculate longest streak from entire history
 */
function calculateLongestStreakFromHistory(
  sessionsByDay: Map<string, SessionData[]>,
  sortedDays: string[],
  rules: StreakRules
): number {
  let longestStreak = 0;
  let currentStreak = 0;
  let gracePeriodsAvailable = rules.maxGracePeriods;

  for (const dayKey of sortedDays) {
    const daySessions = sessionsByDay.get(dayKey) || [];
    
    if (daySessions.length >= rules.requireMinimumSessions) {
      currentStreak++;
      gracePeriodsAvailable = rules.maxGracePeriods; // Reset grace periods on active day
    } else {
      // No qualifying sessions this day
      if (gracePeriodsAvailable > 0) {
        gracePeriodsAvailable--;
        // Continue streak with grace period
      } else {
        // End streak
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 0;
        gracePeriodsAvailable = rules.maxGracePeriods;
      }
    }
  }

  // Check final streak
  longestStreak = Math.max(longestStreak, currentStreak);
  
  return longestStreak;
}

/**
 * Check if streak is active today
 */
export function isStreakActiveToday(
  sessions: SessionData[],
  rules: StreakRules = DEFAULT_STREAK_RULES
): boolean {
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(session => 
    session.completedAt.toDateString() === today &&
    session.duration >= rules.minimumSessionDuration
  );
  
  return todaySessions.length >= rules.requireMinimumSessions;
}

/**
 * Calculate days until streak is broken (considering grace periods)
 */
export function calculateDaysUntilStreakBreak(
  lastActiveDate: Date | null,
  gracePeriodsUsed: number,
  rules: StreakRules = DEFAULT_STREAK_RULES
): number {
  if (!lastActiveDate) return 0;
  
  const today = new Date();
  const daysSinceActive = Math.floor(
    (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const gracePeriodsRemaining = rules.maxGracePeriods - gracePeriodsUsed;
  const daysUntilBreak = Math.max(0, gracePeriodsRemaining - daysSinceActive + 1);
  
  return daysUntilBreak;
}

/**
 * Get streak maintenance suggestions
 */
export function getStreakMaintenanceSuggestions(
  currentStreak: number,
  daysInactive: number,
  gracePeriodsUsed: number,
  rules: StreakRules = DEFAULT_STREAK_RULES
): {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: boolean;
  suggestions: string[];
} {
  const gracePeriodsRemaining = rules.maxGracePeriods - gracePeriodsUsed;
  
  if (daysInactive === 0) {
    return {
      urgency: 'low',
      message: 'Great! Your streak is active today.',
      actionRequired: false,
      suggestions: [
        'Consider doing an additional session to build momentum',
        'Plan tomorrow\'s focus session to maintain consistency',
      ],
    };
  }
  
  if (daysInactive === 1 && gracePeriodsRemaining > 0) {
    return {
      urgency: 'medium',
      message: 'You missed yesterday, but you have grace periods available.',
      actionRequired: true,
      suggestions: [
        'Complete a focus session today to maintain your streak',
        'Set a reminder for tomorrow to avoid using another grace period',
      ],
    };
  }
  
  if (gracePeriodsRemaining <= 1) {
    return {
      urgency: 'critical',
      message: 'Critical: Your streak will break soon without action!',
      actionRequired: true,
      suggestions: [
        'Complete a session immediately to save your streak',
        'Start with just a 5-10 minute session if time is limited',
        'Set up notifications to prevent future missed days',
      ],
    };
  }
  
  if (gracePeriodsRemaining > 1) {
    return {
      urgency: 'high',
      message: `You have ${gracePeriodsRemaining} grace periods remaining.`,
      actionRequired: true,
      suggestions: [
        'Complete a session today to stop using grace periods',
        'Review your schedule to identify consistent focus times',
        'Consider adjusting your daily goals if they\'re too ambitious',
      ],
    };
  }
  
  return {
    urgency: 'high',
    message: 'Your streak needs attention.',
    actionRequired: true,
    suggestions: [
      'Complete a focus session to continue your streak',
      'Review what\'s preventing consistent daily focus',
    ],
  };
}

/**
 * Format streak duration for display
 */
export function formatStreakDuration(days: number): string {
  if (days === 0) return 'No streak';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    return `${weeks}w ${remainingDays}d`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${months}mo ${remainingDays}d`;
  }
  
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years}y ${remainingDays}d`;
}

/**
 * Get streak emoji based on length
 */
export function getStreakEmoji(days: number): string {
  if (days >= 365) return '👑'; // Year+
  if (days >= 100) return '🔥'; // 100+ days
  if (days >= 50) return '⚡'; // 50+ days
  if (days >= 30) return '🌟'; // Month
  if (days >= 14) return '💪'; // Two weeks
  if (days >= 7) return '🎯'; // Week
  if (days >= 3) return '🌱'; // Few days
  if (days >= 1) return '🌿'; // Started
  return '💤'; // No streak
}

/**
 * Calculate streak score for gamification
 */
export function calculateStreakScore(
  currentStreak: number,
  longestStreak: number,
  consistency: number // 0-1, based on active days / total days
): number {
  const streakScore = Math.min(currentStreak * 10, 1000); // Max 1000 from current streak
  const longestScore = Math.min(longestStreak * 5, 500); // Max 500 from longest streak
  const consistencyScore = Math.floor(consistency * 500); // Max 500 from consistency
  
  return streakScore + longestScore + consistencyScore;
}
