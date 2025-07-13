// Core timer business logic and calculation service

import { 
  TimerConfig, 
  TimerSession, 
  SessionType, 
  TimerError, 
  TIMER_ERROR_CODES,
  TimerOptions 
} from '@/types/timer';
import { TIMER_DEFAULTS, TIMER_LIMITS } from '@/lib/constants';
import { 
  minutesToSeconds, 
  calculateElapsedTime, 
  calculateRemainingTime,
  validateTimeInput,
  addSeconds
} from '@/lib/time-utils';

export class TimerService {
  private config: TimerConfig;
  private options: TimerOptions;
  
  constructor(config?: Partial<TimerConfig>, options?: Partial<TimerOptions>) {
    this.config = {
      workDuration: TIMER_DEFAULTS.WORK_DURATION,
      shortBreakDuration: TIMER_DEFAULTS.SHORT_BREAK_DURATION,
      longBreakDuration: TIMER_DEFAULTS.LONG_BREAK_DURATION,
      longBreakInterval: TIMER_DEFAULTS.LONG_BREAK_INTERVAL,
      focusDuration: TIMER_DEFAULTS.FOCUS_DURATION,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      notificationsEnabled: true,
      sessionHistory: [],
      ...config,
    };
    
    this.options = {
      autoSave: true,
      autoSaveInterval: 10, // seconds
      persistenceKey: 'timer-session',
      enableAnalytics: true,
      enableNotifications: true,
      strictPomodoro: false,
      allowOvertime: true,
      maxOvertimeMinutes: 30,
      ...options,
    };
    
    this.validateConfig();
  }

  /**
   * Validate timer configuration
   */
  private validateConfig(): void {
    const { workDuration, shortBreakDuration, longBreakDuration, focusDuration } = this.config;
    
    if (!validateTimeInput(workDuration, TIMER_LIMITS.MIN_DURATION, TIMER_LIMITS.MAX_DURATION)) {
      throw new TimerError(
        `Work duration must be between ${TIMER_LIMITS.MIN_DURATION} and ${TIMER_LIMITS.MAX_DURATION} minutes`,
        TIMER_ERROR_CODES.INVALID_CONFIG
      );
    }
    
    if (!validateTimeInput(shortBreakDuration, TIMER_LIMITS.MIN_BREAK, TIMER_LIMITS.MAX_BREAK)) {
      throw new TimerError(
        `Short break duration must be between ${TIMER_LIMITS.MIN_BREAK} and ${TIMER_LIMITS.MAX_BREAK} minutes`,
        TIMER_ERROR_CODES.INVALID_CONFIG
      );
    }
    
    if (!validateTimeInput(longBreakDuration, TIMER_LIMITS.MIN_BREAK, TIMER_LIMITS.MAX_BREAK)) {
      throw new TimerError(
        `Long break duration must be between ${TIMER_LIMITS.MIN_BREAK} and ${TIMER_LIMITS.MAX_BREAK} minutes`,
        TIMER_ERROR_CODES.INVALID_CONFIG
      );
    }
    
    if (!validateTimeInput(focusDuration, TIMER_LIMITS.MIN_DURATION, TIMER_LIMITS.MAX_DURATION)) {
      throw new TimerError(
        `Focus duration must be between ${TIMER_LIMITS.MIN_DURATION} and ${TIMER_LIMITS.MAX_DURATION} minutes`,
        TIMER_ERROR_CODES.INVALID_CONFIG
      );
    }
  }

  /**
   * Create a new timer session
   */
  createSession(
    sessionType: SessionType,
    projectId?: string,
    description?: string,
    customDuration?: number
  ): TimerSession {
    const now = new Date();
    let targetDuration: number;
    
    // Determine target duration based on session type
    switch (sessionType) {
      case 'work':
        targetDuration = minutesToSeconds(customDuration || this.config.workDuration);
        break;
      case 'short-break':
        targetDuration = minutesToSeconds(customDuration || this.config.shortBreakDuration);
        break;
      case 'long-break':
        targetDuration = minutesToSeconds(customDuration || this.config.longBreakDuration);
        break;
      case 'focus':
        targetDuration = minutesToSeconds(customDuration || this.config.focusDuration);
        break;
      default:
        throw new TimerError(
          `Invalid session type: ${sessionType}`,
          TIMER_ERROR_CODES.INVALID_CONFIG
        );
    }
    
    // Validate custom duration if provided
    if (customDuration && !validateTimeInput(customDuration, TIMER_LIMITS.MIN_DURATION, TIMER_LIMITS.MAX_DURATION)) {
      throw new TimerError(
        `Custom duration must be between ${TIMER_LIMITS.MIN_DURATION} and ${TIMER_LIMITS.MAX_DURATION} minutes`,
        TIMER_ERROR_CODES.INVALID_DURATION
      );
    }
    
    return {
      startTime: now,
      duration: 0,
      targetDuration,
      sessionType,
      isPomodoro: sessionType === 'work' || sessionType === 'short-break' || sessionType === 'long-break',
      projectId,
      description,
      tags: [],
      isCompleted: false,
      isPaused: false,
    };
  }

  /**
   * Calculate elapsed time for a session
   */
  calculateElapsedTime(session: TimerSession, pausedTime?: Date): number {
    const endTime = pausedTime || new Date();
    return calculateElapsedTime(session.startTime, endTime);
  }

  /**
   * Calculate remaining time for a session
   */
  calculateRemainingTime(session: TimerSession, pausedTime?: Date): number {
    const elapsed = this.calculateElapsedTime(session, pausedTime);
    return calculateRemainingTime(elapsed, session.targetDuration);
  }

  /**
   * Check if a session is complete
   */
  isSessionComplete(session: TimerSession, currentTime?: Date): boolean {
    const remaining = this.calculateRemainingTime(session, currentTime);
    return remaining <= 0;
  }

  /**
   * Check if a session is in overtime
   */
  isSessionOvertime(session: TimerSession, currentTime?: Date): boolean {
    const remaining = this.calculateRemainingTime(session, currentTime);
    return remaining < 0;
  }

  /**
   * Get overtime duration in seconds
   */
  getOvertimeDuration(session: TimerSession, currentTime?: Date): number {
    const remaining = this.calculateRemainingTime(session, currentTime);
    return remaining < 0 ? Math.abs(remaining) : 0;
  }

  /**
   * Check if overtime is allowed and within limits
   */
  isOvertimeAllowed(session: TimerSession, currentTime?: Date): boolean {
    if (!this.options.allowOvertime) return false;
    
    const overtimeSeconds = this.getOvertimeDuration(session, currentTime);
    const maxOvertimeSeconds = this.options.maxOvertimeMinutes * 60;
    
    return overtimeSeconds <= maxOvertimeSeconds;
  }

  /**
   * Update session duration
   */
  updateSessionDuration(session: TimerSession, currentTime?: Date): TimerSession {
    const elapsed = this.calculateElapsedTime(session, currentTime);
    
    return {
      ...session,
      duration: elapsed,
      endTime: currentTime,
    };
  }

  /**
   * Complete a session
   */
  completeSession(session: TimerSession, currentTime?: Date): TimerSession {
    const completedSession = this.updateSessionDuration(session, currentTime);
    
    return {
      ...completedSession,
      isCompleted: true,
      endTime: currentTime || new Date(),
    };
  }

  /**
   * Determine next session type in Pomodoro cycle
   */
  getNextSessionType(completedCycles: number): SessionType {
    if (completedCycles > 0 && completedCycles % this.config.longBreakInterval === 0) {
      return 'long-break';
    }
    return 'short-break';
  }

  /**
   * Add time to a session (for manual adjustments)
   */
  addTimeToSession(session: TimerSession, additionalMinutes: number): TimerSession {
    if (!validateTimeInput(additionalMinutes, -30, 60)) {
      throw new TimerError(
        'Additional time must be between -30 and 60 minutes',
        TIMER_ERROR_CODES.INVALID_DURATION
      );
    }
    
    const additionalSeconds = minutesToSeconds(additionalMinutes);
    
    return {
      ...session,
      targetDuration: Math.max(60, session.targetDuration + additionalSeconds), // Minimum 1 minute
    };
  }

  /**
   * Pause a session
   */
  pauseSession(session: TimerSession, pauseTime?: Date): TimerSession {
    const currentTime = pauseTime || new Date();
    const updatedSession = this.updateSessionDuration(session, currentTime);
    
    return {
      ...updatedSession,
      isPaused: true,
    };
  }

  /**
   * Resume a paused session
   */
  resumeSession(session: TimerSession, resumeTime?: Date): TimerSession {
    const currentTime = resumeTime || new Date();
    
    // Adjust start time to account for the time spent paused
    const pausedDuration = session.endTime 
      ? calculateElapsedTime(session.endTime, currentTime)
      : 0;
    
    const adjustedStartTime = addSeconds(session.startTime, pausedDuration);
    
    return {
      ...session,
      startTime: adjustedStartTime,
      isPaused: false,
      endTime: undefined,
    };
  }

  /**
   * Calculate session productivity score
   */
  calculateProductivityScore(session: TimerSession): number {
    if (!session.isCompleted) return 0;
    
    const targetDuration = session.targetDuration;
    const actualDuration = session.duration;
    
    // Perfect score for completing exactly the target time
    if (actualDuration >= targetDuration && actualDuration <= targetDuration * 1.1) {
      return 100;
    }
    
    // Reduced score for early completion
    if (actualDuration < targetDuration) {
      return Math.max(0, (actualDuration / targetDuration) * 80);
    }
    
    // Reduced score for overtime
    const overtimeRatio = (actualDuration - targetDuration) / targetDuration;
    return Math.max(0, 100 - (overtimeRatio * 50));
  }

  /**
   * Get session statistics
   */
  getSessionStats(session: TimerSession, currentTime?: Date) {
    const elapsed = this.calculateElapsedTime(session, currentTime);
    const remaining = this.calculateRemainingTime(session, currentTime);
    const progress = Math.min(100, (elapsed / session.targetDuration) * 100);
    const isComplete = this.isSessionComplete(session, currentTime);
    const isOvertime = this.isSessionOvertime(session, currentTime);
    const overtimeDuration = this.getOvertimeDuration(session, currentTime);
    
    return {
      elapsed,
      remaining: Math.max(0, remaining),
      progress,
      isComplete,
      isOvertime,
      overtimeDuration,
      productivityScore: session.isCompleted ? this.calculateProductivityScore(session) : 0,
    };
  }

  /**
   * Update timer configuration
   */
  updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): TimerConfig {
    return { ...this.config };
  }

  /**
   * Get current options
   */
  getOptions(): TimerOptions {
    return { ...this.options };
  }

  /**
   * Update timer options
   */
  updateOptions(newOptions: Partial<TimerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Sync session time after page visibility change
   */
  syncSessionAfterHidden(session: TimerSession, hiddenDuration: number): TimerSession {
    // Adjust start time to account for time spent with page hidden
    const adjustedStartTime = addSeconds(session.startTime, hiddenDuration);
    
    return {
      ...session,
      startTime: adjustedStartTime,
    };
  }

  /**
   * Validate session data integrity
   */
  validateSession(session: TimerSession): boolean {
    try {
      // Check required fields
      if (!session.startTime || !session.targetDuration || !session.sessionType) {
        return false;
      }
      
      // Check session type validity
      const validSessionTypes: SessionType[] = ['work', 'short-break', 'long-break', 'focus'];
      if (!validSessionTypes.includes(session.sessionType)) {
        return false;
      }
      
      // Check duration validity
      if (session.targetDuration < 60 || session.targetDuration > TIMER_LIMITS.MAX_DURATION * 60) {
        return false;
      }
      
      // Check time consistency
      if (session.endTime && session.endTime < session.startTime) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
}
