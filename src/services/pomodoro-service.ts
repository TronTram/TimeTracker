// Business logic for Pomodoro cycles and session tracking

import { CyclePhase, PomodoroConfig, PomodoroSession, PomodoroStatistics } from '@/types/pomodoro';

export class PomodoroService {
  private config: PomodoroConfig;

  constructor(config: PomodoroConfig) {
    this.config = config;
  }

  /**
   * Calculate the next phase based on current cycle and configuration
   */
  calculateNextPhase(currentCycle: number, currentPhase: CyclePhase): CyclePhase {
    if (currentPhase === 'work') {
      // After work, determine if it's time for a long break
      const isLongBreakTime = currentCycle > 0 && currentCycle % this.config.longBreakInterval === 0;
      return isLongBreakTime ? 'long-break' : 'short-break';
    } else {
      // After any break, always return to work
      return 'work';
    }
  }

  /**
   * Get the duration for a specific phase in seconds
   */
  getPhaseDuration(phase: CyclePhase): number {
    switch (phase) {
      case 'work':
        return this.config.workDuration * 60;
      case 'short-break':
        return this.config.shortBreakDuration * 60;
      case 'long-break':
        return this.config.longBreakDuration * 60;
      default:
        return this.config.workDuration * 60;
    }
  }

  /**
   * Validate if a phase transition is allowed
   */
  isPhaseTransitionAllowed(
    currentPhase: CyclePhase,
    targetPhase: CyclePhase,
    isSkipping: boolean = false
  ): boolean {
    // Always allow work to break transitions
    if (currentPhase === 'work' && targetPhase !== 'work') {
      return true;
    }

    // Allow break to work transitions
    if (currentPhase !== 'work' && targetPhase === 'work') {
      return true;
    }

    // Allow skipping breaks if configured
    if (isSkipping && currentPhase !== 'work' && this.config.allowSkipBreaks) {
      return true;
    }

    // In strict mode, don't allow arbitrary transitions
    if (this.config.strictMode && !isSkipping) {
      return false;
    }

    return true;
  }

  /**
   * Create a new Pomodoro session
   */
  createSession(
    phase: CyclePhase,
    cycleNumber: number,
    projectId?: string,
    description?: string,
    tags?: string[]
  ): PomodoroSession {
    return {
      id: crypto.randomUUID(),
      date: new Date(),
      phase,
      duration: this.getPhaseDuration(phase),
      completed: false,
      cycleNumber,
      projectId,
      description,
      tags,
    };
  }

  /**
   * Calculate completion percentage for a cycle
   */
  calculateCycleProgress(currentCycle: number): number {
    const cyclePosition = currentCycle % this.config.longBreakInterval || this.config.longBreakInterval;
    return (cyclePosition / this.config.longBreakInterval) * 100;
  }

  /**
   * Check if it's time for a long break
   */
  isLongBreakTime(currentCycle: number): boolean {
    return currentCycle > 0 && currentCycle % this.config.longBreakInterval === 0;
  }

  /**
   * Get remaining sessions until long break
   */
  getSessionsUntilLongBreak(currentCycle: number): number {
    const cyclePosition = currentCycle % this.config.longBreakInterval;
    return this.config.longBreakInterval - cyclePosition;
  }

  /**
   * Calculate daily progress
   */
  calculateDailyProgress(sessions: PomodoroSession[], dailyGoal: number) {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      session => 
        session.date.toDateString() === today && 
        session.completed && 
        session.phase === 'work'
    );

    return {
      completed: todaySessions.length,
      goal: dailyGoal,
      percentage: Math.round((todaySessions.length / dailyGoal) * 100),
      remaining: Math.max(0, dailyGoal - todaySessions.length),
    };
  }

  /**
   * Calculate weekly statistics
   */
  calculateWeeklyStats(sessions: PomodoroSession[]): PomodoroStatistics {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekSessions = sessions.filter(session => session.date >= oneWeekAgo);
    const completedSessions = weekSessions.filter(session => session.completed);
    const workSessions = completedSessions.filter(session => session.phase === 'work');
    const breakSessions = completedSessions.filter(session => session.phase !== 'work');

    const totalWorkTime = workSessions.reduce((total, session) => total + session.duration, 0);
    const totalBreakTime = breakSessions.reduce((total, session) => total + session.duration, 0);

    return {
      totalSessions: weekSessions.length,
      completedSessions: completedSessions.length,
      totalWorkTime,
      totalBreakTime,
      averageSessionLength: completedSessions.length > 0 
        ? Math.round((totalWorkTime + totalBreakTime) / completedSessions.length)
        : 0,
      longestStreak: this.calculateLongestStreak(sessions),
      currentStreak: this.calculateCurrentStreak(sessions),
      completionRate: weekSessions.length > 0 
        ? Math.round((completedSessions.length / weekSessions.length) * 100)
        : 0,
    };
  }

  /**
   * Calculate current streak of consecutive days with completed goals
   */
  calculateCurrentStreak(sessions: PomodoroSession[]): number {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateString = currentDate.toDateString();
      const dayWorkSessions = sessions.filter(
        session => 
          session.date.toDateString() === dateString && 
          session.completed && 
          session.phase === 'work'
      );

      // For now, we'll use a simple goal of 4 work sessions per day
      const dailyGoal = 4;
      if (dayWorkSessions.length >= dailyGoal) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }

      // Prevent infinite loop
      if (streak > 365) break;
    }

    return streak;
  }

  /**
   * Calculate longest streak in the session history
   */
  calculateLongestStreak(sessions: PomodoroSession[]): number {
    if (sessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = new Map<string, PomodoroSession[]>();
    sessions.forEach(session => {
      const dateString = session.date.toDateString();
      if (!sessionsByDate.has(dateString)) {
        sessionsByDate.set(dateString, []);
      }
      sessionsByDate.get(dateString)!.push(session);
    });

    let longestStreak = 0;
    let currentStreak = 0;
    const dailyGoal = 4; // Simple goal for calculation

    // Sort dates
    const sortedDates = Array.from(sessionsByDate.keys()).sort();

    for (const dateString of sortedDates) {
      const daySessions = sessionsByDate.get(dateString)!;
      const workSessions = daySessions.filter(s => s.completed && s.phase === 'work');

      if (workSessions.length >= dailyGoal) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  }

  /**
   * Get productivity insights based on session data
   */
  getProductivityInsights(sessions: PomodoroSession[], dailyGoal: number): {
    focusScore: number;
    consistency: number;
    efficiency: number;
    recommendations: string[];
  } {
    const completedSessions = sessions.filter(s => s.completed);
    const workSessions = completedSessions.filter(s => s.phase === 'work');
    
    // Focus Score: Based on work session completion rate
    const focusScore = sessions.length > 0 
      ? Math.round((workSessions.length / sessions.filter(s => s.phase === 'work').length) * 100)
      : 0;

    // Consistency: Based on how many days in the last week had sessions
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentSessions = sessions.filter(s => s.date >= oneWeekAgo);
    const uniqueDays = new Set(recentSessions.map(s => s.date.toDateString())).size;
    const consistency = Math.round((uniqueDays / 7) * 100);

    // Efficiency: Based on average session length vs. configured length
    const avgWorkSessionLength = workSessions.length > 0
      ? workSessions.reduce((sum, s) => sum + s.duration, 0) / workSessions.length
      : 0;
    const targetWorkLength = this.config.workDuration * 60;
    const efficiency = targetWorkLength > 0
      ? Math.min(100, Math.round((avgWorkSessionLength / targetWorkLength) * 100))
      : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (focusScore < 70) {
      recommendations.push('Try to complete more work sessions to improve focus');
    }
    if (consistency < 50) {
      recommendations.push('Maintain a more regular schedule for better consistency');
    }
    if (efficiency < 80) {
      recommendations.push('Consider adjusting work session duration to match your focus span');
    }
    if (workSessions.length < dailyGoal) {
      recommendations.push(`Aim for ${dailyGoal} work sessions per day`);
    }

    return {
      focusScore,
      consistency,
      efficiency,
      recommendations,
    };
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
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
   * Get time until next phase
   */
  getTimeUntilNextPhase(elapsedTime: number, currentPhase: CyclePhase): number {
    const phaseDuration = this.getPhaseDuration(currentPhase);
    return Math.max(0, phaseDuration - elapsedTime);
  }

  /**
   * Check if session should auto-transition
   */
  shouldAutoTransition(currentPhase: CyclePhase, isPhaseComplete: boolean): boolean {
    if (!isPhaseComplete) return false;

    if (currentPhase === 'work' && this.config.autoStartBreaks) {
      return true;
    }

    if (currentPhase !== 'work' && this.config.autoStartPomodoros) {
      return true;
    }

    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PomodoroConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PomodoroConfig {
    return { ...this.config };
  }
}
