// Utilities for cycle calculations and break logic

import { CyclePhase, PomodoroConfig, PomodoroSession } from '@/types/pomodoro';

/**
 * Calculate the next phase in the Pomodoro cycle
 */
export function getNextPhase(
  currentCycle: number,
  currentPhase: CyclePhase,
  longBreakInterval: number
): CyclePhase {
  if (currentPhase === 'work') {
    const isLongBreakTime = currentCycle > 0 && currentCycle % longBreakInterval === 0;
    return isLongBreakTime ? 'long-break' : 'short-break';
  }
  return 'work';
}

/**
 * Calculate cycle progress as a percentage
 */
export function calculateCycleProgress(
  currentCycle: number,
  longBreakInterval: number
): number {
  const cyclePosition = (currentCycle % longBreakInterval) || longBreakInterval;
  return (cyclePosition / longBreakInterval) * 100;
}

/**
 * Get sessions remaining until long break
 */
export function getSessionsUntilLongBreak(
  currentCycle: number,
  longBreakInterval: number
): number {
  const cyclePosition = currentCycle % longBreakInterval;
  return longBreakInterval - cyclePosition;
}

/**
 * Check if it's time for a long break
 */
export function isLongBreakTime(
  currentCycle: number,
  longBreakInterval: number
): boolean {
  return currentCycle > 0 && currentCycle % longBreakInterval === 0;
}

/**
 * Calculate the total duration of a Pomodoro cycle
 */
export function getCycleDuration(config: PomodoroConfig): number {
  const workDuration = config.workDuration * config.longBreakInterval;
  const shortBreaks = config.shortBreakDuration * (config.longBreakInterval - 1);
  const longBreak = config.longBreakDuration;
  
  return (workDuration + shortBreaks + longBreak) * 60; // Convert to seconds
}

/**
 * Format time for display (MM:SS or HH:MM:SS)
 */
export function formatPomodoroTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration for human-readable display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate daily progress
 */
export function calculateDailyProgress(
  sessions: PomodoroSession[],
  dailyGoal: number,
  date: Date = new Date()
): {
  completed: number;
  goal: number;
  percentage: number;
  remaining: number;
} {
  const targetDate = date.toDateString();
  const todayWorkSessions = sessions.filter(
    session =>
      session.date.toDateString() === targetDate &&
      session.completed &&
      session.phase === 'work'
  );

  const completed = todayWorkSessions.length;
  const percentage = Math.round((completed / dailyGoal) * 100);
  const remaining = Math.max(0, dailyGoal - completed);

  return {
    completed,
    goal: dailyGoal,
    percentage,
    remaining,
  };
}

/**
 * Calculate weekly progress
 */
export function calculateWeeklyProgress(
  sessions: PomodoroSession[],
  dailyGoal: number
): {
  totalCompleted: number;
  totalGoal: number;
  dailyBreakdown: Array<{
    date: string;
    completed: number;
    goal: number;
    percentage: number;
  }>;
  weeklyPercentage: number;
} {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  const dailyBreakdown = [];
  let totalCompleted = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    
    const dayProgress = calculateDailyProgress(sessions, dailyGoal, date);
    totalCompleted += dayProgress.completed;
    
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0]!,
      completed: dayProgress.completed,
      goal: dayProgress.goal,
      percentage: dayProgress.percentage,
    });
  }
  
  const totalGoal = dailyGoal * 7;
  const weeklyPercentage = Math.round((totalCompleted / totalGoal) * 100);
  
  return {
    totalCompleted,
    totalGoal,
    dailyBreakdown,
    weeklyPercentage,
  };
}

/**
 * Calculate streak information
 */
export function calculateStreak(
  sessions: PomodoroSession[],
  dailyGoal: number
): {
  current: number;
  longest: number;
  lastStreakDate: Date | null;
} {
  if (sessions.length === 0) {
    return { current: 0, longest: 0, lastStreakDate: null };
  }

  // Group sessions by date
  const sessionsByDate = new Map<string, PomodoroSession[]>();
  sessions.forEach(session => {
    const dateKey = session.date.toDateString();
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  });

  // Get sorted dates
  const sortedDates = Array.from(sessionsByDate.keys()).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  let longestStreak = 0;
  let currentStreak = 0;
  let lastStreakDate: Date | null = null;

  // Calculate current streak (working backwards from today)
  const today = new Date().toDateString();
  let currentDate = new Date();
  
  while (true) {
    const dateKey = currentDate.toDateString();
    const daySessions = sessionsByDate.get(dateKey) || [];
    const workSessions = daySessions.filter(s => s.completed && s.phase === 'work');

    if (workSessions.length >= dailyGoal) {
      currentStreak++;
      lastStreakDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateKey === today) {
      // If today doesn't meet the goal, current streak is 0
      currentStreak = 0;
      break;
    } else {
      break;
    }

    // Prevent infinite loop
    if (currentStreak > 365) break;
  }

  // Calculate longest streak from all history
  let tempStreak = 0;
  for (const dateKey of sortedDates) {
    const daySessions = sessionsByDate.get(dateKey)!;
    const workSessions = daySessions.filter(s => s.completed && s.phase === 'work');

    if (workSessions.length >= dailyGoal) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    lastStreakDate,
  };
}

/**
 * Get phase configuration for UI
 */
export function getPhaseConfig(phase: CyclePhase) {
  const configs = {
    work: {
      label: 'Work Session',
      shortLabel: 'Work',
      icon: '🍅',
      color: '#ef4444',
      bgColor: '#fef2f2',
      darkBgColor: '#7f1d1d',
      description: 'Focus on your task',
    },
    'short-break': {
      label: 'Short Break',
      shortLabel: 'Break',
      icon: '☕',
      color: '#22c55e',
      bgColor: '#f0fdf4',
      darkBgColor: '#14532d',
      description: 'Take a quick break',
    },
    'long-break': {
      label: 'Long Break',
      shortLabel: 'Long Break',
      icon: '🌟',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      darkBgColor: '#1e3a8a',
      description: 'Enjoy a longer break',
    },
  };

  return configs[phase];
}

/**
 * Validate Pomodoro configuration
 */
export function validatePomodoroConfig(config: Partial<PomodoroConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.workDuration !== undefined) {
    if (config.workDuration < 1 || config.workDuration > 180) {
      errors.push('Work duration must be between 1 and 180 minutes');
    }
  }

  if (config.shortBreakDuration !== undefined) {
    if (config.shortBreakDuration < 1 || config.shortBreakDuration > 60) {
      errors.push('Short break duration must be between 1 and 60 minutes');
    }
  }

  if (config.longBreakDuration !== undefined) {
    if (config.longBreakDuration < 1 || config.longBreakDuration > 120) {
      errors.push('Long break duration must be between 1 and 120 minutes');
    }
  }

  if (config.longBreakInterval !== undefined) {
    if (config.longBreakInterval < 2 || config.longBreakInterval > 10) {
      errors.push('Long break interval must be between 2 and 10 sessions');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get estimated completion time for current cycle
 */
export function getEstimatedCycleCompletion(
  currentCycle: number,
  currentPhase: CyclePhase,
  elapsedTime: number,
  config: PomodoroConfig
): Date {
  const now = new Date();
  let remainingTime = 0;

  // Calculate remaining time in current phase
  const currentPhaseDuration = getCurrentPhaseDuration(currentPhase, config);
  remainingTime += Math.max(0, currentPhaseDuration - elapsedTime);

  // Calculate time for remaining phases in the cycle
  const cyclePosition = currentCycle % config.longBreakInterval;
  const sessionsUntilLongBreak = config.longBreakInterval - cyclePosition;

  if (currentPhase === 'work') {
    // Add remaining work sessions
    remainingTime += (sessionsUntilLongBreak - 1) * config.workDuration * 60;
    // Add short breaks
    remainingTime += (sessionsUntilLongBreak - 1) * config.shortBreakDuration * 60;
    // Add long break
    remainingTime += config.longBreakDuration * 60;
  } else {
    // We're in a break, add remaining work sessions and breaks
    remainingTime += sessionsUntilLongBreak * config.workDuration * 60;
    if (currentPhase === 'short-break') {
      remainingTime += (sessionsUntilLongBreak - 1) * config.shortBreakDuration * 60;
      remainingTime += config.longBreakDuration * 60;
    } else {
      // We're in long break, no more breaks needed
      remainingTime += (sessionsUntilLongBreak - 1) * config.shortBreakDuration * 60;
    }
  }

  const completionTime = new Date(now.getTime() + remainingTime * 1000);
  return completionTime;
}

/**
 * Get current phase duration in seconds
 */
function getCurrentPhaseDuration(phase: CyclePhase, config: PomodoroConfig): number {
  switch (phase) {
    case 'work':
      return config.workDuration * 60;
    case 'short-break':
      return config.shortBreakDuration * 60;
    case 'long-break':
      return config.longBreakDuration * 60;
    default:
      return config.workDuration * 60;
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}
