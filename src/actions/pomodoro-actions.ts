// Server actions for Pomodoro session logging

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { CyclePhase, PomodoroConfig } from '@/types/pomodoro';
import { SessionType } from '@prisma/client';

// Validation schemas
const pomodoroSessionSchema = z.object({
  phase: z.enum(['work', 'short-break', 'long-break']),
  duration: z.number().min(0),
  completed: z.boolean(),
  cycleNumber: z.number().min(1),
  projectId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const pomodoroConfigSchema = z.object({
  workDuration: z.number().min(1).max(180),
  shortBreakDuration: z.number().min(1).max(60),
  longBreakDuration: z.number().min(1).max(120),
  longBreakInterval: z.number().min(2).max(10),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  strictMode: z.boolean(),
  allowSkipBreaks: z.boolean(),
  soundEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
});

const dailyGoalSchema = z.object({
  goal: z.number().min(1).max(20),
});

// Action types
export type PomodoroSessionInput = z.infer<typeof pomodoroSessionSchema>;
export type PomodoroConfigInput = z.infer<typeof pomodoroConfigSchema>;
export type DailyGoalInput = z.infer<typeof dailyGoalSchema>;

/**
 * Create a new Pomodoro session
 */
export async function createPomodoroSession(input: PomodoroSessionInput) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = pomodoroSessionSchema.parse(input);

    // Map phase to SessionType
    const sessionTypeMap: Record<CyclePhase, SessionType> = {
      work: 'WORK',
      'short-break': 'SHORT_BREAK',
      'long-break': 'LONG_BREAK',
    };

    const session = await prisma.timeSession.create({
      data: {
        userId,
        startTime: new Date(),
        endTime: validatedData.completed ? new Date() : null,
        duration: validatedData.duration,
        sessionType: sessionTypeMap[validatedData.phase],
        isPomodoro: true,
        projectId: validatedData.projectId,
        description: validatedData.description,
        tags: validatedData.tags || [],
      },
      include: {
        project: true,
      },
    });

    revalidatePath('/analytics');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    console.error('Error creating Pomodoro session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}

/**
 * Get Pomodoro sessions for a user
 */
export async function getPomodoroSessions(
  startDate?: Date,
  endDate?: Date,
  limit?: number
) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const where: any = {
      userId,
      isPomodoro: true,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const sessions = await prisma.timeSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        project: true,
      },
    });

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    console.error('Error fetching Pomodoro sessions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sessions',
    };
  }
}

/**
 * Get today's Pomodoro sessions
 */
export async function getTodayPomodoroSessions() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return getPomodoroSessions(startOfDay, endOfDay);
}

/**
 * Update Pomodoro configuration in user preferences
 */
export async function updatePomodoroConfig(input: Partial<PomodoroConfig>) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Map config to individual preference fields
    const updateData: any = {};
    if (input.workDuration !== undefined) updateData.pomodoroWorkDuration = input.workDuration;
    if (input.shortBreakDuration !== undefined) updateData.pomodoroShortBreakDuration = input.shortBreakDuration;
    if (input.longBreakDuration !== undefined) updateData.pomodoroLongBreakDuration = input.longBreakDuration;
    if (input.longBreakInterval !== undefined) updateData.pomodoroLongBreakInterval = input.longBreakInterval;
    if (input.autoStartBreaks !== undefined) updateData.autoStartBreaks = input.autoStartBreaks;
    if (input.autoStartPomodoros !== undefined) updateData.autoStartPomodoros = input.autoStartPomodoros;
    if (input.soundEnabled !== undefined) updateData.soundEnabled = input.soundEnabled;
    if (input.notificationsEnabled !== undefined) updateData.notificationsEnabled = input.notificationsEnabled;

    // Get existing preferences or create new
    const existingPrefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (existingPrefs) {
      await prisma.userPreferences.update({
        where: { userId },
        data: updateData,
      });
    } else {
      await prisma.userPreferences.create({
        data: {
          userId,
          ...updateData,
        },
      });
    }

    // Return the updated configuration
    const updatedPrefs = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { 
        pomodoroWorkDuration: true,
        pomodoroShortBreakDuration: true,
        pomodoroLongBreakDuration: true,
        pomodoroLongBreakInterval: true,
        autoStartBreaks: true,
        autoStartPomodoros: true,
        soundEnabled: true,
        notificationsEnabled: true,
      },
    });

    const resultConfig = {
      workDuration: updatedPrefs?.pomodoroWorkDuration || 25,
      shortBreakDuration: updatedPrefs?.pomodoroShortBreakDuration || 5,
      longBreakDuration: updatedPrefs?.pomodoroLongBreakDuration || 15,
      longBreakInterval: updatedPrefs?.pomodoroLongBreakInterval || 4,
      autoStartBreaks: updatedPrefs?.autoStartBreaks || false,
      autoStartPomodoros: updatedPrefs?.autoStartPomodoros || false,
      soundEnabled: updatedPrefs?.soundEnabled || true,
      notificationsEnabled: updatedPrefs?.notificationsEnabled || true,
      strictMode: true,
      allowSkipBreaks: false,
    };

    revalidatePath('/settings');

    return {
      success: true,
      data: resultConfig,
    };
  } catch (error) {
    console.error('Error updating Pomodoro config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration',
      data: null,
    };
  }
}

/**
 * Get Pomodoro configuration from user preferences
 */
export async function getPomodoroConfig() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { 
        pomodoroWorkDuration: true,
        pomodoroShortBreakDuration: true,
        pomodoroLongBreakDuration: true,
        pomodoroLongBreakInterval: true,
        autoStartBreaks: true,
        autoStartPomodoros: true,
        soundEnabled: true,
        notificationsEnabled: true,
      },
    });

    // Return default config if none exists
    const defaultConfig = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      strictMode: true,
      allowSkipBreaks: false,
      soundEnabled: true,
      notificationsEnabled: true,
    };

    const config = preferences ? {
      workDuration: preferences.pomodoroWorkDuration,
      shortBreakDuration: preferences.pomodoroShortBreakDuration,
      longBreakDuration: preferences.pomodoroLongBreakDuration,
      longBreakInterval: preferences.pomodoroLongBreakInterval,
      autoStartBreaks: preferences.autoStartBreaks,
      autoStartPomodoros: preferences.autoStartPomodoros,
      soundEnabled: preferences.soundEnabled,
      notificationsEnabled: preferences.notificationsEnabled,
      strictMode: true,
      allowSkipBreaks: false,
    } : defaultConfig;

    return {
      success: true,
      data: config,
    };
  } catch (error) {
    console.error('Error fetching Pomodoro config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch configuration',
      data: null,
    };
  }
}

/**
 * Get Pomodoro statistics
 */
export async function getPomodoroStatistics(days: number = 30) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await prisma.timeSession.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
        isPomodoro: true,
      },
      orderBy: { startTime: 'desc' },
    });

    // Calculate statistics based on sessionType
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.endTime !== null).length;
    const workSessions = sessions.filter(s => s.sessionType === 'WORK');
    const shortBreakSessions = sessions.filter(s => s.sessionType === 'SHORT_BREAK');
    const longBreakSessions = sessions.filter(s => s.sessionType === 'LONG_BREAK');

    const totalWorkTime = workSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalBreakTime = [...shortBreakSessions, ...longBreakSessions].reduce((sum, s) => sum + s.duration, 0);

    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    const averageSessionLength = completedSessions > 0
      ? Math.round((totalWorkTime + totalBreakTime) / completedSessions)
      : 0;

    // Calculate daily averages
    const dailyWorkTime = Math.round(totalWorkTime / days);
    const dailySessionCount = Math.round(totalSessions / days);

    // Calculate streak (consecutive days with at least one completed Pomodoro)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (currentStreak < 100) { // Prevent infinite loop
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayCompletedSessions = sessions.filter(s => 
        s.endTime !== null &&
        s.startTime >= dayStart && 
        s.startTime <= dayEnd &&
        s.sessionType === 'WORK'
      ).length;
      
      if (dayCompletedSessions > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      success: true,
      data: {
        totalSessions,
        completedSessions,
        completionRate,
        totalWorkTime,
        totalBreakTime,
        averageSessionLength,
        dailyWorkTime,
        dailySessionCount,
        currentStreak,
        workSessions: workSessions.length,
        shortBreakSessions: shortBreakSessions.length,
        longBreakSessions: longBreakSessions.length,
      },
    };
  } catch (error) {
    console.error('Error fetching Pomodoro statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      data: null,
    };
  }
}

/**
 * Get recent Pomodoro sessions
 */
export async function getRecentPomodoros(limit: number = 10) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const sessions = await prisma.timeSession.findMany({
      where: {
        userId,
        isPomodoro: true,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      completed: session.endTime !== null,
      phase: session.sessionType.toLowerCase().replace('_', '') as 'work' | 'shortbreak' | 'longbreak',
      description: session.description,
      project: session.project ? {
        id: session.project.id,
        name: session.project.name,
        color: session.project.color,
      } : null,
      tags: session.tags,
    }));

    return {
      success: true,
      data: formattedSessions,
    };
  } catch (error) {
    console.error('Error fetching recent Pomodoros:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent sessions',
      data: null,
    };
  }
}

/**
 * Save a completed Pomodoro session
 */
export async function savePomodoroSession(session: {
  duration: number;
  phase: CyclePhase;
  completed: boolean;
  projectId?: string;
  description?: string;
  tags?: string[];
}) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Map phase to SessionType
    const sessionTypeMap: Record<CyclePhase, SessionType> = {
      work: 'WORK',
      'short-break': 'SHORT_BREAK',
      'long-break': 'LONG_BREAK',
    };

    const savedSession = await prisma.timeSession.create({
      data: {
        userId,
        duration: session.duration,
        projectId: session.projectId || null,
        description: session.description || null,
        tags: session.tags || [],
        isPomodoro: true,
        sessionType: sessionTypeMap[session.phase],
        startTime: new Date(Date.now() - session.duration * 1000),
        endTime: session.completed ? new Date() : null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/analytics');

    return {
      success: true,
      data: {
        id: savedSession.id,
        duration: savedSession.duration,
        phase: session.phase,
        completed: session.completed,
        startTime: savedSession.startTime,
        endTime: savedSession.endTime,
      },
    };
  } catch (error) {
    console.error('Error saving Pomodoro session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save session',
      data: null,
    };
  }
}

/**
 * Delete a Pomodoro session
 */
export async function deletePomodoroSession(sessionId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const session = await prisma.timeSession.findFirst({
      where: {
        id: sessionId,
        userId,
        isPomodoro: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    await prisma.timeSession.delete({
      where: { id: sessionId },
    });

    revalidatePath('/analytics');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Session deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting Pomodoro session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session',
    };
  }
}
