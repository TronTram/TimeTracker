'use server';

import { revalidatePath } from 'next/cache';
import { SessionService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { requireDatabaseUser } from '@/lib/auth-helpers';
import { 
  TimeSessionSchema, 
  ManualTimeEntrySchema, 
  SessionFilterSchema,
  BulkOperationSchema 
} from '@/lib/validations';
import type { ActionResult, PaginatedResponse } from '@/types/actions';
import type { SessionWithProject, SessionFormData, ManualEntryFormData } from '@/types/session';
import { TimeSession, SessionType } from '@prisma/client';
import { AppError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

// =============================================================================
// Session CRUD Actions
// =============================================================================

/**
 * Create a new session (manual entry or timer session)
 */
export async function createSession(data: SessionFormData): Promise<ActionResult<SessionWithProject>> {
  try {
    const user = await requireDatabaseUser();
    
    // Calculate duration if not provided but have start/end times
    let duration = data.duration;
    if (!duration && data.startTime && data.endTime) {
      duration = Math.floor((data.endTime.getTime() - data.startTime.getTime()) / 1000);
    }
    
    // Validate the data
    const validatedData = TimeSessionSchema.parse({
      ...data,
      duration: duration || 0,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    
    // Create session
    const session = await SessionService.createSession({
      ...validatedData,
      userId: user.id,
      description: data.description,
    });

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: session as SessionWithProject,
    };
  } catch (error) {
    console.error('Create session error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        errors: error.errors.reduce((acc, e) => {
          const field = e.path.join('.');
          if (!acc[field]) acc[field] = [];
          acc[field].push(e.message);
          return acc;
        }, {} as Record<string, string[]>),
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}

/**
 * Create a manual time entry
 */
export async function createManualEntry(data: ManualEntryFormData): Promise<ActionResult<SessionWithProject>> {
  try {
    const user = await requireDatabaseUser();
    
    // Parse time strings and combine with date
    const startDateTime = new Date(data.date);
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHour || 0, startMinute || 0, 0, 0);
    
    const endDateTime = new Date(data.date);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHour || 0, endMinute || 0, 0, 0);
    
    // Handle case where end time is next day
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
    
    // Validate the manual entry
    const validatedData = ManualTimeEntrySchema.parse({
      projectId: data.projectId,
      date: data.date,
      duration,
      description: data.description,
      tags: data.tags || [],
    });
    
    // Create session
    const session = await SessionService.createSession({
      userId: user.id,
      projectId: validatedData.projectId,
      startTime: startDateTime,
      endTime: endDateTime,
      duration: validatedData.duration,
      sessionType: 'FOCUS',
      isPomodoro: false,
      description: validatedData.description,
    });

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: session as SessionWithProject,
    };
  } catch (error) {
    console.error('Create manual entry error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        errors: error.errors.reduce((acc, e) => {
          const field = e.path.join('.');
          if (!acc[field]) acc[field] = [];
          acc[field].push(e.message);
          return acc;
        }, {} as Record<string, string[]>),
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create manual entry',
    };
  }
}

/**
 * Update an existing session
 */
export async function updateSession(
  sessionId: string, 
  data: Partial<SessionFormData>
): Promise<ActionResult<SessionWithProject>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get existing session to validate ownership
    const existingSession = await SessionService.getSessionById(sessionId, user.id);
    if (!existingSession) {
      return {
        success: false,
        error: 'Session not found',
      };
    }
    
    // Calculate duration if times changed
    let updateData = { ...data };
    if ((data.startTime || data.endTime) && !data.duration) {
      const startTime = data.startTime || existingSession.startTime;
      const endTime = data.endTime || existingSession.endTime;
      
      if (startTime && endTime) {
        updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      }
    }
    
    // Update session
    const session = await SessionService.updateSession(sessionId, user.id, {
      projectId: updateData.projectId,
      startTime: updateData.startTime,
      endTime: updateData.endTime,
      duration: updateData.duration,
      sessionType: updateData.sessionType,
      isPomodoro: updateData.isPomodoro,
      description: updateData.description,
    });

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId, sessionId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: session as SessionWithProject,
    };
  } catch (error) {
    console.error('Update session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update session',
    };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<ActionResult<boolean>> {
  try {
    const user = await requireDatabaseUser();
    
    // Verify session exists and belongs to user
    const session = await SessionService.getSessionById(sessionId, user.id);
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }
    
    // Delete session
    await SessionService.deleteSession(sessionId, user.id);

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId, sessionId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Delete session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session',
    };
  }
}

/**
 * Duplicate a session
 */
export async function duplicateSession(sessionId: string): Promise<ActionResult<SessionWithProject>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get existing session
    const existingSession = await SessionService.getSessionById(sessionId, user.id);
    if (!existingSession) {
      return {
        success: false,
        error: 'Session not found',
      };
    }
    
    // Create duplicate with current time
    const now = new Date();
    const duplicateSession = await SessionService.createSession({
      userId: user.id,
      projectId: existingSession.projectId || undefined,
      startTime: now,
      endTime: undefined, // Will be set when session completes
      duration: 0, // Will be calculated when session completes
      sessionType: existingSession.sessionType,
      isPomodoro: existingSession.isPomodoro,
      description: existingSession.description || undefined,
    });

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');

    return {
      success: true,
      data: duplicateSession as SessionWithProject,
    };
  } catch (error) {
    console.error('Duplicate session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate session',
    };
  }
}

// =============================================================================
// Session List and Filtering
// =============================================================================

/**
 * Get user sessions with filtering and pagination
 */
export async function getUserSessions(params: {
  projectId?: string;
  sessionType?: SessionType;
  dateFrom?: string;
  dateTo?: string;
  isPomodoro?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<ActionResult<PaginatedResponse<SessionWithProject>>> {
  try {
    const user = await requireDatabaseUser();
    
    const {
      projectId,
      sessionType,
      dateFrom,
      dateTo,
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
      return {
        success: true,
        data: sessions as PaginatedResponse<SessionWithProject>,
      };
    }

    // Build filters
    const filters: any = {};
    if (projectId) filters.projectId = projectId;
    if (sessionType) filters.sessionType = sessionType;
    if (isPomodoro !== undefined) filters.isPomodoro = isPomodoro;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    // Get from database
    sessions = await SessionService.getUserSessions(user.id, {
      ...filters,
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
    });
    
    // Cache the result
    CacheService.setSessions(user.clerkId, sessions, cacheKey);

    return {
      success: true,
      data: sessions as PaginatedResponse<SessionWithProject>,
    };
  } catch (error) {
    console.error('Get sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sessions',
    };
  }
}

/**
 * Get a single session by ID
 */
export async function getSession(sessionId: string): Promise<ActionResult<SessionWithProject | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Try cache first
    let session = CacheService.getSession(sessionId);
    if (session) {
      return {
        success: true,
        data: session as SessionWithProject,
      };
    }

    // Get from database
    session = await SessionService.getSessionById(sessionId, user.id);
    
    if (session) {
      // Cache the result
      CacheService.setSession(sessionId, session);
    }

    return {
      success: true,
      data: session as SessionWithProject | null,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session',
    };
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
    
    // Validate input
    const validatedData = BulkOperationSchema.parse({
      action: 'delete',
      ids: sessionIds,
    });
    
    // Delete sessions
    const result = await SessionService.bulkDeleteSessions(validatedData.ids, user.id);

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: result.count,
    };
  } catch (error) {
    console.error('Bulk delete sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sessions',
    };
  }
}

/**
 * Bulk update sessions
 */
export async function bulkUpdateSessions(
  sessionIds: string[], 
  updates: Partial<SessionFormData>
): Promise<ActionResult<number>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = BulkOperationSchema.parse({
      action: 'archive', // We'll use this for validation, actual action varies
      ids: sessionIds,
    });
    
    // Update each session individually to maintain data integrity
    let updateCount = 0;
    for (const sessionId of validatedData.ids) {
      try {
        await SessionService.updateSession(sessionId, user.id, updates);
        updateCount++;
      } catch (error) {
        console.error(`Failed to update session ${sessionId}:`, error);
        // Continue with other sessions
      }
    }

    // Clear relevant caches
    CacheService.invalidateSessionData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: updateCount,
    };
  } catch (error) {
    console.error('Bulk update sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sessions',
    };
  }
}

// =============================================================================
// Session Statistics
// =============================================================================

/**
 * Get session statistics for a date range
 */
export async function getSessionStats(dateFrom?: string, dateTo?: string): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const toDate = dateTo ? new Date(dateTo) : new Date(); // Today
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'session-stats', {
      dateFrom: fromDate.toISOString(),
      dateTo: toDate.toISOString(),
    });
    
    // Try cache first
    let stats = CacheService.getAnalytics(cacheKey);
    if (stats) {
      return {
        success: true,
        data: stats,
      };
    }

    // Get sessions for the date range
    const sessions = await SessionService.getUserSessions(user.id, {
      dateFrom: fromDate,
      dateTo: toDate,
      page: 1,
      pageSize: 10000, // Large number to get all sessions
    });

    // Calculate statistics
    const allSessions = sessions.data as TimeSession[];
    const totalSessions = allSessions.length;
    const totalTime = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const focusTime = allSessions.filter(s => s.sessionType === 'FOCUS').reduce((sum, s) => sum + s.duration, 0);
    const breakTime = totalTime - focusTime;
    const pomodoroSessions = allSessions.filter(s => s.isPomodoro).length;
    const completedSessions = allSessions.filter(s => s.endTime !== null).length;
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = allSessions.filter(s => s.startTime >= today);
    
    stats = {
      totalSessions,
      totalTime,
      focusTime,
      breakTime,
      pomodoroSessions,
      averageSessionLength: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      todayStats: {
        sessions: todaySessions.length,
        time: todaySessions.reduce((sum, s) => sum + s.duration, 0),
        pomodoros: todaySessions.filter(s => s.isPomodoro).length,
      },
    };
    
    // Cache for 5 minutes
    CacheService.setAnalytics(cacheKey, stats, 5 * 60 * 1000);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Get session stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session statistics',
    };
  }
}

/**
 * Get recent sessions (last 10)
 */
export async function getRecentSessions(): Promise<ActionResult<SessionWithProject[]>> {
  try {
    const user = await requireDatabaseUser();
    
    const result = await SessionService.getUserSessions(user.id, {
      page: 1,
      pageSize: 10,
      sortBy: 'startTime',
      sortOrder: 'desc',
    });

    return {
      success: true,
      data: result.data as SessionWithProject[],
    };
  } catch (error) {
    console.error('Get recent sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent sessions',
    };
  }
}

/**
 * Search sessions by description/notes
 */
export async function searchSessions(query: string, limit = 20): Promise<ActionResult<SessionWithProject[]>> {
  try {
    const user = await requireDatabaseUser();
    
    // This would be implemented with full-text search in a real database
    // For now, we'll use a simple filter approach
    const sessions = await SessionService.getUserSessions(user.id, {
      page: 1,
      pageSize: limit,
      sortBy: 'startTime',
      sortOrder: 'desc',
    });

    // Filter by query in description/notes (simple implementation)
    const filteredSessions = sessions.data.filter((session: any) => 
      session.description?.toLowerCase().includes(query.toLowerCase()) ||
      session.project?.name?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filteredSessions as SessionWithProject[],
    };
  } catch (error) {
    console.error('Search sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search sessions',
    };
  }
}

// =============================================================================
// Session Export
// =============================================================================

/**
 * Export sessions data
 */
export async function exportSessionsData(params: {
  format?: 'csv' | 'json';
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
} = {}): Promise<ActionResult<any[]>> {
  try {
    const user = await requireDatabaseUser();
    
    const {
      format = 'csv',
      dateFrom,
      dateTo,
      projectId,
    } = params;
    
    // Get all sessions matching criteria
    const sessions = await SessionService.getUserSessions(user.id, {
      projectId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: 1,
      pageSize: 10000, // Large number to get all
    });

    // Transform data for export
    const exportData = sessions.data.map((session: any) => {
      const baseData = {
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString() || '',
        duration: session.duration,
        sessionType: session.sessionType,
        isPomodoro: session.isPomodoro,
        isCompleted: session.isCompleted,
        projectName: session.project?.name || '',
        projectColor: session.project?.color || '',
        notes: session.notes || '',
        tags: session.tags?.join(', ') || '',
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      };

      if (format === 'csv') {
        // For CSV, flatten the structure
        return {
          ...baseData,
          durationMinutes: Math.round(session.duration / 60),
          durationHours: Math.round(session.duration / 3600 * 100) / 100,
        };
      }

      return baseData;
    });

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error('Export sessions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export sessions',
    };
  }
}
