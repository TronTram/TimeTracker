'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import type { ActionResult } from '@/types/actions';
import type { UserPreferencesUpdateData } from '@/types/user';

// Helper functions for action responses
function createSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

function createError(error: string): ActionResult<never> {
  return { success: false, error };
}

function handleError(err: unknown, fallbackMessage: string): ActionResult<never> {
  if (err instanceof Error) {
    return createError(err.message);
  }
  return createError(fallbackMessage);
}

// Validation schema for user preferences
const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  pomodoroWorkDuration: z.number().min(1).max(120).optional(),
  pomodoroShortBreakDuration: z.number().min(1).max(30).optional(),
  pomodoroLongBreakDuration: z.number().min(1).max(60).optional(),
  pomodoroLongBreakInterval: z.number().min(1).max(10).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  defaultProjectId: z.string().nullable().optional(),
});

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  data: UserPreferencesUpdateData
): Promise<ActionResult<UserPreferencesUpdateData>> {
  try {
    const userId = await requireAuth();

    // Validate input data
    const validatedData = userPreferencesSchema.parse(data);

    // Update user preferences in database
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
        // Fill in required fields with defaults if not provided
        theme: validatedData.theme || 'system',
        pomodoroWorkDuration: validatedData.pomodoroWorkDuration || 25,
        pomodoroShortBreakDuration: validatedData.pomodoroShortBreakDuration || 5,
        pomodoroLongBreakDuration: validatedData.pomodoroLongBreakDuration || 15,
        pomodoroLongBreakInterval: validatedData.pomodoroLongBreakInterval || 4,
        autoStartBreaks: validatedData.autoStartBreaks || false,
        autoStartPomodoros: validatedData.autoStartPomodoros || false,
        soundEnabled: validatedData.soundEnabled !== undefined ? validatedData.soundEnabled : true,
        notificationsEnabled: validatedData.notificationsEnabled !== undefined ? validatedData.notificationsEnabled : true,
      },
    });

    // Revalidate relevant paths
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return createSuccess({
      theme: updatedPreferences.theme as 'light' | 'dark' | 'system',
      pomodoroWorkDuration: updatedPreferences.pomodoroWorkDuration,
      pomodoroShortBreakDuration: updatedPreferences.pomodoroShortBreakDuration,
      pomodoroLongBreakDuration: updatedPreferences.pomodoroLongBreakDuration,
      pomodoroLongBreakInterval: updatedPreferences.pomodoroLongBreakInterval,
      autoStartBreaks: updatedPreferences.autoStartBreaks,
      autoStartPomodoros: updatedPreferences.autoStartPomodoros,
      soundEnabled: updatedPreferences.soundEnabled,
      notificationsEnabled: updatedPreferences.notificationsEnabled,
      defaultProjectId: updatedPreferences.defaultProjectId,
    });
  } catch (error) {
    return handleError(error, 'Failed to update user preferences');
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<ActionResult<UserPreferencesUpdateData | null>> {
  try {
    const userId = await requireAuth();

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return createSuccess(null);
    }

    return createSuccess({
      theme: preferences.theme as 'light' | 'dark' | 'system',
      pomodoroWorkDuration: preferences.pomodoroWorkDuration,
      pomodoroShortBreakDuration: preferences.pomodoroShortBreakDuration,
      pomodoroLongBreakDuration: preferences.pomodoroLongBreakDuration,
      pomodoroLongBreakInterval: preferences.pomodoroLongBreakInterval,
      autoStartBreaks: preferences.autoStartBreaks,
      autoStartPomodoros: preferences.autoStartPomodoros,
      soundEnabled: preferences.soundEnabled,
      notificationsEnabled: preferences.notificationsEnabled,
      defaultProjectId: preferences.defaultProjectId,
    });
  } catch (error) {
    return handleError(error, 'Failed to get user preferences');
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(): Promise<ActionResult<UserPreferencesUpdateData>> {
  try {
    const userId = await requireAuth();

    const defaultPreferences = {
      theme: 'system',
      pomodoroWorkDuration: 25,
      pomodoroShortBreakDuration: 5,
      pomodoroLongBreakDuration: 15,
      pomodoroLongBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      notificationsEnabled: true,
      defaultProjectId: null,
    };

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: defaultPreferences,
      create: {
        userId,
        ...defaultPreferences,
      },
    });

    // Revalidate relevant paths
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return createSuccess({
      theme: updatedPreferences.theme as 'light' | 'dark' | 'system',
      pomodoroWorkDuration: updatedPreferences.pomodoroWorkDuration,
      pomodoroShortBreakDuration: updatedPreferences.pomodoroShortBreakDuration,
      pomodoroLongBreakDuration: updatedPreferences.pomodoroLongBreakDuration,
      pomodoroLongBreakInterval: updatedPreferences.pomodoroLongBreakInterval,
      autoStartBreaks: updatedPreferences.autoStartBreaks,
      autoStartPomodoros: updatedPreferences.autoStartPomodoros,
      soundEnabled: updatedPreferences.soundEnabled,
      notificationsEnabled: updatedPreferences.notificationsEnabled,
      defaultProjectId: updatedPreferences.defaultProjectId,
    });
  } catch (error) {
    return handleError(error, 'Failed to reset user preferences');
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(data: {
  name?: string;
  email?: string;
}): Promise<ActionResult<{ name: string; email: string }>> {
  try {
    const userId = await requireAuth();

    // Validate input
    const profileSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
    });

    const validatedData = profileSchema.parse(data);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: validatedData,
      select: {
        name: true,
        email: true,
      },
    });

    // Revalidate relevant paths
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return createSuccess({
      name: updatedUser.name || '',
      email: updatedUser.email,
    });
  } catch (error) {
    return handleError(error, 'Failed to update user profile');
  }
} 