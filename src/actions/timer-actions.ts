'use server';

import { revalidatePath } from 'next/cache';
import { SessionService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { requireDatabaseUser } from '@/lib/auth-helpers';
import { TimeSessionSchema } from '@/lib/validations';
import { triggerAchievementCheck } from '@/actions/achievement-actions';
import type { ActionResult, PaginatedResponse } from '@/types/actions';
import { TimeSession, SessionType } from '@prisma/client';
import { AppError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

// Create basic validation schemas since TimeSessionSchema might be complex
const SessionCreateSchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().min(0),
  description: z.string().optional(),
  isPomodoro: z.boolean().optional(),
  sessionType: z.nativeEnum(SessionType).optional(),
  projectId: z.string().optional(),
});

const SessionUpdateSchema = SessionCreateSchema.partial();

// Type definitions for action parameters
type SessionCreateParams = {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  isPomodoro?: boolean;
  sessionType?: SessionType;
  projectId?: string;
};

type SessionUpdateParams = {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  isPomodoro?: boolean;
  sessionType?: SessionType;
  projectId?: string;
};

type SessionListParams = {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  sessionType?: SessionType;
  isPomodoro?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// Helper function to handle action errors
function handleError(error: unknown, fallbackMessage: string): ActionResult<never> {
  console.error('Action error:', error);
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      errors: error.errors,
    };
  }

  return {
    success: false,
    error: fallbackMessage,
  };
}

// Helper function to create success responses
function createSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

// =============================================================================
// Timer Session CRUD Actions
// =============================================================================

/**
 * Start a new timer session
 */
export async function startTimerSession(params: SessionCreateParams): Promise<ActionResult<TimeSession>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = SessionCreateSchema.parse({
      ...params,
      startTime: params.startTime || new Date(),
      duration: 0, // Starting session has 0 duration
    });
    
    // Create session in database
    const session = await SessionService.createSession({
      ...validatedData,
      userId: user.id,
    });

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(session);
  } catch (error) {
    return handleError(error, 'Failed to start timer session');
  }
}

/**
 * Stop/complete a timer session
 */
export async function stopTimerSession(sessionId: string, endTime?: Date): Promise<ActionResult<TimeSession>> {
  try {
    const user = await requireDatabaseUser();
    
    const session = await SessionService.getSessionById(sessionId, user.id);
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    const actualEndTime = endTime || new Date();
    const duration = Math.floor((actualEndTime.getTime() - session.startTime.getTime()) / 1000);
    
    // Update session with end time and duration
    const updatedSession = await SessionService.updateSession(sessionId, user.id, {
      endTime: actualEndTime,
      duration,
    });

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId, sessionId);
    
    // Check for achievements after session completion
    try {
      await triggerAchievementCheck();
    } catch (error) {
      // Don't fail the session completion if achievement checking fails
      console.error('Achievement check failed:', error);
    }
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(updatedSession);
  } catch (error) {
    return handleError(error, 'Failed to stop timer session');
  }
}

/**
 * Create a manual time entry
 */
export async function createManualSession(params: SessionCreateParams): Promise<ActionResult<TimeSession>> {
  try {
    const user = await requireDatabaseUser();
    
    // Calculate duration if not provided
    let duration = params.duration;
    if (!duration && params.startTime && params.endTime) {
      duration = Math.floor((params.endTime.getTime() - params.startTime.getTime()) / 1000);
    }
    
    // Validate input
    const validatedData = SessionCreateSchema.parse({
      ...params,
      duration,
    });
    
    // Create session in database
    const session = await SessionService.createSession({
      ...validatedData,
      userId: user.id,
    });

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Check for achievements after manual session creation
    try {
      await triggerAchievementCheck();
    } catch (error) {
      // Don't fail the session creation if achievement checking fails
      console.error('Achievement check failed:', error);
    }
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(session);
  } catch (error) {
    return handleError(error, 'Failed to create manual session');
  }
}

/**
 * Get user sessions with optional filtering and pagination
 */
export async function getUserSessions(params: SessionListParams = {}): Promise<ActionResult<PaginatedResponse<TimeSession>>> {
  try {
    const user = await requireDatabaseUser();
    
    const {
      projectId,
      startDate,
      endDate,
      sessionType,
      isPomodoro,
      search,
      page = 1,
      limit = 20,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = params;

    // Generate cache key
    const cacheKey = CacheService.generateSessionsKey(user.clerkId, params);
    
    // Try cache first
    let sessions = CacheService.getSessions(user.clerkId, cacheKey);
    if (sessions) {
      return createSuccess(sessions);
    }

    // Get from database
    sessions = await SessionService.getUserSessions(user.id, {
      projectId,
      sessionType,
      dateFrom: startDate ? new Date(startDate) : undefined,
      dateTo: endDate ? new Date(endDate) : undefined,
      isPomodoro,
      page,
      pageSize: limit,
      sortBy,
      sortOrder
    });
    
    // Cache the result
    CacheService.setSessions(user.clerkId, sessions, cacheKey);

    return createSuccess(sessions);
  } catch (error) {
    return handleError(error, 'Failed to get sessions');
  }
}

/**
 * Get single session by ID
 */
export async function getSession(sessionId: string): Promise<ActionResult<TimeSession | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Try cache first
    let session = CacheService.getSession(sessionId);
    if (session) {
      return createSuccess(session);
    }

    // Get from database
    session = await SessionService.getSessionById(sessionId, user.id);
    
    if (session) {
      // Cache the result
      CacheService.setSession(sessionId, session);
    }

    return createSuccess(session);
  } catch (error) {
    return handleError(error, 'Failed to get session');
  }
}

/**
 * Update session
 */
export async function updateSession(sessionId: string, params: SessionUpdateParams): Promise<ActionResult<TimeSession>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = SessionUpdateSchema.parse(params);
    
    // Recalculate duration if start/end times changed
    if ((validatedData.startTime || validatedData.endTime) && !validatedData.duration) {
      const session = await SessionService.getSessionById(sessionId, user.id);
      if (session) {
        const startTime = validatedData.startTime || session.startTime;
        const endTime = validatedData.endTime || session.endTime;
        if (startTime && endTime) {
          validatedData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }
      }
    }
    
    // Update session
    const session = await SessionService.updateSession(sessionId, user.id, validatedData);

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId, sessionId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(session);
  } catch (error) {
    return handleError(error, 'Failed to update session');
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<ActionResult<boolean>> {
  try {
    const user = await requireDatabaseUser();
    
    // Delete session
    await SessionService.deleteSession(sessionId, user.id);

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId, sessionId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(true);
  } catch (error) {
    return handleError(error, 'Failed to delete session');
  }
}

// =============================================================================
// Active Session Management
// =============================================================================

/**
 * Get current active session (if any)
 */
export async function getActiveSession(): Promise<ActionResult<TimeSession | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get active session from database
    const activeSession = await SessionService.getActiveSession(user.id);

    return createSuccess(activeSession);
  } catch (error) {
    return handleError(error, 'Failed to get active session');
  }
}

/**
 * Pause current active session
 */
export async function pauseActiveSession(): Promise<ActionResult<TimeSession | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get active session
    const activeSession = await SessionService.getActiveSession(user.id);
    if (!activeSession) {
      return createSuccess(null);
    }

    // Calculate current duration and pause
    const now = new Date();
    const duration = Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000);
    
    const pausedSession = await SessionService.updateSession(activeSession.id, user.id, {
      endTime: now,
      duration,
    });

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId, activeSession.id);
    
    // Revalidate pages
    revalidatePath('/dashboard');

    return createSuccess(pausedSession);
  } catch (error) {
    return handleError(error, 'Failed to pause active session');
  }
}

// =============================================================================
// Session Statistics Actions
// =============================================================================

/**
 * Get daily session summary
 */
export async function getDailySessionSummary(date?: string): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    const targetDate = date ? new Date(date) : new Date();
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'daily-summary', { 
      date: targetDate.toISOString().split('T')[0] 
    });
    
    // Try cache first
    let summary = CacheService.getAnalytics(cacheKey);
    if (summary) {
      return createSuccess(summary);
    }

    // TODO: Implement daily summary calculation
    summary = {
      date: targetDate.toISOString().split('T')[0],
      totalSessions: 0,
      totalTime: 0,
      pomodoroSessions: 0,
      focusTime: 0,
      breakTime: 0,
      projects: [],
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, summary, 5 * 60 * 1000); // 5 minutes

    return createSuccess(summary);
  } catch (error) {
    return handleError(error, 'Failed to get daily session summary');
  }
}

/**
 * Get weekly session trends
 */
export async function getWeeklySessionTrends(): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'weekly-trends', {});
    
    // Try cache first
    let trends = CacheService.getAnalytics(cacheKey);
    if (trends) {
      return createSuccess(trends);
    }

    // TODO: Implement weekly trends calculation
    trends = {
      week: [],
      totalTime: 0,
      averageDaily: 0,
      streak: 0,
      improvement: 0,
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, trends, 30 * 60 * 1000); // 30 minutes

    return createSuccess(trends);
  } catch (error) {
    return handleError(error, 'Failed to get weekly session trends');
  }
}

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Bulk delete sessions
 */
export async function bulkDeleteSessions(sessionIds: string[]): Promise<ActionResult<number>> {
  try {
    const user = await requireDatabaseUser();
    
    // Delete sessions
    const result = await SessionService.bulkDeleteSessions(sessionIds, user.id);

    // Clear caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return createSuccess(result.count);
  } catch (error) {
    return handleError(error, 'Failed to delete sessions');
  }
}

/**
 * Export sessions data
 */
export async function exportSessions(params: SessionListParams = {}): Promise<ActionResult<any[]>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get all sessions matching criteria (no pagination for export)
    const sessions = await SessionService.getUserSessions(user.id, {
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all
    });

    // Transform data for export
    const exportData = sessions.data.map((session: any) => ({
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration,
      description: session.description,
      sessionType: session.sessionType,
      isPomodoro: session.isPomodoro,
      projectName: session.project?.name,
      tags: session.tags?.join(', ') || '',
    }));

    return createSuccess(exportData);
  } catch (error) {
    return handleError(error, 'Failed to export sessions');
  }
}
