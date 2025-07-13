// Validation rules for session data integrity
import { SessionFormData, SessionValidationRules } from '@/types/session';
import { SessionType } from '@prisma/client';
import { z } from 'zod';

// Enhanced session validation schema
export const SessionDataSchema = z.object({
  projectId: z.string().cuid().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().min(0).max(86400), // Max 24 hours
  description: z.string().max(1000).optional(),
  sessionType: z.nativeEnum(SessionType),
  isPomodoro: z.boolean(),
  tags: z.array(z.string().min(1).max(50)).max(10),
}).refine(
  (data) => {
    // End time must be after start time
    if (data.endTime && data.startTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    // Duration should match time difference if both times provided
    if (data.startTime && data.endTime && data.duration) {
      const calculatedDuration = Math.floor(
        (data.endTime.getTime() - data.startTime.getTime()) / 1000
      );
      const tolerance = 5; // 5 seconds tolerance
      return Math.abs(data.duration - calculatedDuration) <= tolerance;
    }
    return true;
  },
  {
    message: 'Duration must match the time difference between start and end times',
    path: ['duration'],
  }
);

// Manual time entry validation
export const ManualEntryDataSchema = z.object({
  projectId: z.string().cuid().optional(),
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  description: z.string().min(1, 'Description is required').max(1000),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
}).refine(
  (data) => {
    // Parse times for validation
    const [startHourStr, startMinuteStr] = data.startTime.split(':');
    const [endHourStr, endMinuteStr] = data.endTime.split(':');
    
    const startHour = parseInt(startHourStr || '0', 10);
    const startMinute = parseInt(startMinuteStr || '0', 10);
    const endHour = parseInt(endHourStr || '0', 10);
    const endMinute = parseInt(endMinuteStr || '0', 10);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Allow end time to be next day (e.g., 23:00 to 01:00)
    if (endMinutes <= startMinutes) {
      // Check if it's reasonable (max 8 hours into next day)
      const nextDayEndMinutes = endMinutes + 24 * 60;
      const duration = nextDayEndMinutes - startMinutes;
      return duration <= 8 * 60; // Max 8 hours
    }
    
    const duration = endMinutes - startMinutes;
    return duration >= 1 && duration <= 12 * 60; // Between 1 minute and 12 hours
  },
  {
    message: 'Invalid time range. Session must be between 1 minute and 12 hours.',
    path: ['endTime'],
  }
);

// Bulk operation validation
export const BulkSessionOperationSchema = z.object({
  sessionIds: z.array(z.string().cuid()).min(1, 'At least one session must be selected'),
  operation: z.enum(['delete', 'update', 'export']),
  updates: z.object({
    projectId: z.string().cuid().optional(),
    sessionType: z.nativeEnum(SessionType).optional(),
    tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  }).optional(),
});

// Session filter validation
export const SessionFilterDataSchema = z.object({
  projectId: z.string().cuid().optional(),
  sessionType: z.nativeEnum(SessionType).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isPomodoro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['dateTo'],
  }
).refine(
  (data) => {
    if (data.minDuration && data.maxDuration) {
      return data.maxDuration >= data.minDuration;
    }
    return true;
  },
  {
    message: 'Maximum duration must be greater than or equal to minimum duration',
    path: ['maxDuration'],
  }
);

// Advanced validation functions
export class SessionValidator {
  private static readonly MAX_FUTURE_DAYS = 7; // Allow sessions up to 7 days in future
  private static readonly MAX_PAST_DAYS = 365; // Allow sessions up to 1 year in past
  private static readonly MIN_SESSION_DURATION = 10; // 10 seconds minimum
  private static readonly MAX_SESSION_DURATION = 12 * 60 * 60; // 12 hours maximum

  /**
   * Validate session timing constraints
   */
  static validateSessionTiming(
    startTime: Date,
    endTime?: Date,
    allowFutureSessions = false
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const now = new Date();

    // Check if session is too far in the future
    if (!allowFutureSessions) {
      const maxFutureDate = new Date();
      maxFutureDate.setDate(maxFutureDate.getDate() + this.MAX_FUTURE_DAYS);
      
      if (startTime > maxFutureDate) {
        errors.push(`Sessions cannot be scheduled more than ${this.MAX_FUTURE_DAYS} days in the future`);
      }
    }

    // Check if session is too far in the past
    const maxPastDate = new Date();
    maxPastDate.setDate(maxPastDate.getDate() - this.MAX_PAST_DAYS);
    
    if (startTime < maxPastDate) {
      errors.push(`Sessions cannot be created more than ${this.MAX_PAST_DAYS} days in the past`);
    }

    // Check end time if provided
    if (endTime) {
      if (endTime <= startTime) {
        errors.push('End time must be after start time');
      }

      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      if (duration < this.MIN_SESSION_DURATION) {
        errors.push(`Session must be at least ${this.MIN_SESSION_DURATION} seconds long`);
      }
      
      if (duration > this.MAX_SESSION_DURATION) {
        errors.push(`Session cannot exceed ${this.MAX_SESSION_DURATION / 3600} hours`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate session data for business rules
   */
  static validateSessionData(
    data: Partial<SessionFormData>,
    rules?: Partial<SessionValidationRules>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validationRules = {
      maxDuration: 8 * 60 * 60, // 8 hours
      minDuration: 1 * 60, // 1 minute
      maxTagsPerSession: 10,
      maxDescriptionLength: 1000,
      allowOverlapping: false,
      allowFutureSessions: false,
      requireProject: false,
      requireDescription: false,
      ...rules,
    };

    // Required field validation
    if (validationRules.requireProject && !data.projectId) {
      errors.push('Project selection is required');
    }

    if (validationRules.requireDescription && !data.description?.trim()) {
      errors.push('Description is required');
    }

    // Duration validation
    if (data.duration !== undefined) {
      if (data.duration < validationRules.minDuration) {
        errors.push(`Duration must be at least ${Math.round(validationRules.minDuration / 60)} minutes`);
      }
      
      if (data.duration > validationRules.maxDuration) {
        errors.push(`Duration cannot exceed ${Math.round(validationRules.maxDuration / 3600)} hours`);
      }
    }

    // Description validation
    if (data.description && data.description.length > validationRules.maxDescriptionLength) {
      errors.push(`Description cannot exceed ${validationRules.maxDescriptionLength} characters`);
    }

    // Tags validation
    if (data.tags) {
      if (data.tags.length > validationRules.maxTagsPerSession) {
        errors.push(`Maximum ${validationRules.maxTagsPerSession} tags allowed per session`);
      }

      // Validate individual tags
      const invalidTags = data.tags.filter(tag => 
        !tag.trim() || 
        tag.length > 50 || 
        !/^[a-zA-Z0-9\s\-_]+$/.test(tag)
      );

      if (invalidTags.length > 0) {
        errors.push('Tags can only contain letters, numbers, spaces, hyphens, and underscores');
      }
    }

    // Time validation
    if (data.startTime && data.endTime) {
      const timingValidation = this.validateSessionTiming(
        data.startTime,
        data.endTime,
        validationRules.allowFutureSessions
      );
      errors.push(...timingValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate session against existing sessions for overlaps
   */
  static async validateSessionOverlap(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeSessionId?: string
  ): Promise<{ isValid: boolean; overlappingSessions: any[] }> {
    // This would integrate with the database service
    // For now, return a placeholder implementation
    return {
      isValid: true,
      overlappingSessions: [],
    };
  }

  /**
   * Validate Pomodoro session rules
   */
  static validatePomodoroRules(
    data: Partial<SessionFormData>,
    userPreferences?: {
      pomodoroWorkDuration: number;
      pomodoroShortBreakDuration: number;
      pomodoroLongBreakDuration: number;
    }
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.isPomodoro) {
      return { isValid: true, errors, warnings };
    }

    const prefs = userPreferences || {
      pomodoroWorkDuration: 25,
      pomodoroShortBreakDuration: 5,
      pomodoroLongBreakDuration: 15,
    };

    // Convert to seconds for comparison
    const workDuration = prefs.pomodoroWorkDuration * 60;
    const shortBreakDuration = prefs.pomodoroShortBreakDuration * 60;
    const longBreakDuration = prefs.pomodoroLongBreakDuration * 60;

    if (data.duration) {
      let expectedDuration: number;
      
      switch (data.sessionType) {
        case 'FOCUS':
          expectedDuration = workDuration;
          break;
        case 'SHORT_BREAK':
          expectedDuration = shortBreakDuration;
          break;
        case 'LONG_BREAK':
          expectedDuration = longBreakDuration;
          break;
        default:
          expectedDuration = workDuration;
      }

      const tolerance = expectedDuration * 0.1; // 10% tolerance
      const difference = Math.abs(data.duration - expectedDuration);

      if (difference > tolerance) {
        warnings.push(
          `Duration (${Math.round(data.duration / 60)}m) differs significantly from Pomodoro standard (${Math.round(expectedDuration / 60)}m)`
        );
      }
    }

    // Validate session type for Pomodoro
    if (data.sessionType && !['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'].includes(data.sessionType)) {
      errors.push('Pomodoro sessions must be FOCUS, SHORT_BREAK, or LONG_BREAK');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate session export parameters
   */
  static validateExportParams(params: {
    format?: string;
    dateFrom?: Date;
    dateTo?: Date;
    projectId?: string;
    sessionType?: SessionType;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Format validation
    if (params.format && !['csv', 'json', 'pdf'].includes(params.format)) {
      errors.push('Export format must be csv, json, or pdf');
    }

    // Date range validation
    if (params.dateFrom && params.dateTo) {
      if (params.dateTo < params.dateFrom) {
        errors.push('End date must be after start date');
      }

      // Check for reasonable date range (max 2 years)
      const diffTime = params.dateTo.getTime() - params.dateFrom.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 730) { // 2 years
        errors.push('Export date range cannot exceed 2 years');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize session data for safe storage
   */
  static sanitizeSessionData(data: Partial<SessionFormData>): Partial<SessionFormData> {
    const sanitized = { ...data };

    // Trim and sanitize text fields
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim().slice(0, 1000);
    }

    // Sanitize and deduplicate tags
    if (sanitized.tags) {
      sanitized.tags = sanitized.tags
        .map(tag => tag.trim().toLowerCase())
        .filter((tag, index, arr) => tag && arr.indexOf(tag) === index)
        .slice(0, 10);
    }

    // Ensure session type is valid
    if (sanitized.sessionType && !Object.values(SessionType).includes(sanitized.sessionType)) {
      sanitized.sessionType = SessionType.FOCUS;
    }

    // Round duration to nearest second
    if (sanitized.duration) {
      sanitized.duration = Math.round(sanitized.duration);
    }

    return sanitized;
  }

  /**
   * Generate validation summary for UI display
   */
  static createValidationSummary(
    validation: { isValid: boolean; errors: string[] },
    warnings: string[] = []
  ): {
    status: 'valid' | 'warning' | 'error';
    message: string;
    details: string[];
  } {
    if (!validation.isValid) {
      return {
        status: 'error',
        message: `${validation.errors.length} error(s) found`,
        details: validation.errors,
      };
    }

    if (warnings.length > 0) {
      return {
        status: 'warning',
        message: `${warnings.length} warning(s)`,
        details: warnings,
      };
    }

    return {
      status: 'valid',
      message: 'All validations passed',
      details: [],
    };
  }
}

// Type exports
export type SessionValidationResult = ReturnType<typeof SessionValidator.validateSessionData>;
export type PomodoroValidationResult = ReturnType<typeof SessionValidator.validatePomodoroRules>;
export type ValidationSummary = ReturnType<typeof SessionValidator.createValidationSummary>;
