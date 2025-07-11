'use server';

import { revalidatePath } from 'next/cache';
import { UserService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { requireAuth, requireDatabaseUser } from '@/lib/auth-helpers';
import { UserSchema, UserPreferencesSchema } from '@/lib/validations';
import type { ActionResult, PaginatedResponse } from '@/types/actions';
import { User, UserPreferences } from '@prisma/client';
import { AppError, ValidationError } from '@/lib/errors';

// Create derived schemas for user operations
const UserCreateSchema = UserSchema.pick({ name: true, email: true, imageUrl: true });
const UserUpdateSchema = UserSchema.pick({ name: true, imageUrl: true }).partial();

// Type definitions for action parameters
type UserCreateParams = {
  name: string;
  email: string;
  imageUrl?: string;
};

type UserUpdateParams = {
  name?: string;
  imageUrl?: string;
};

type UserPreferencesParams = Partial<{
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodoroSessionsUntilLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  timerAutoStart: boolean;
  breakAutoStart: boolean;
  dailyGoal: number;
  weeklyGoal: number;
}>;

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
function createSuccess<T>(data: T, message?: string): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

// =============================================================================
// User Profile Actions
// =============================================================================

/**
 * Create a new user profile (typically called during onboarding)
 */
export async function createUser(params: UserCreateParams): Promise<ActionResult<User>> {
  try {
    const userId = await requireAuth();
    
    // Validate input
    const validatedData = UserCreateSchema.parse(params);
    
    // Create user in database
    const user = await UserService.createUser({
      ...validatedData,
      clerkId: userId,
    });

    // Clear caches
    CacheService.invalidateUser(userId);
    
    // Revalidate pages
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return createSuccess(user);
  } catch (error) {
    return handleError(error, 'Failed to create user profile');
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<ActionResult<User | null>> {
  try {
    const userId = await requireAuth();
    
    // Try cache first
    let user = CacheService.getUser(userId);
    if (user) {
      return createSuccess(user);
    }

    // Get from database
    user = await UserService.getUserByClerkId(userId);
    
    if (user) {
      // Cache the result
      CacheService.setUser(userId, user);
    }

    return createSuccess(user);
  } catch (error) {
    return handleError(error, 'Failed to get user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUser(params: UserUpdateParams): Promise<ActionResult<User>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = UserUpdateSchema.parse(params);
    
    // Update user
    const updatedUser = await UserService.updateUser(user.id, validatedData);

    // Clear caches
    CacheService.invalidateUser(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/settings');

    return createSuccess(updatedUser);
  } catch (error) {
    return handleError(error, 'Failed to update profile');
  }
}

/**
 * Delete user account (soft delete)
 */
export async function deleteUser(): Promise<ActionResult<boolean>> {
  try {
    const user = await requireDatabaseUser();
    
    // Soft delete user
    await UserService.deleteUser(user.id);

    // Clear all user-related caches
    CacheService.invalidateUserData(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/');

    return createSuccess(true);
  } catch (error) {
    return handleError(error, 'Failed to delete account');
  }
}

// =============================================================================
// User Preferences Actions
// =============================================================================

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<ActionResult<UserPreferences | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Try cache first
    let preferences = CacheService.getUserPreferences(user.clerkId);
    if (preferences) {
      return createSuccess(preferences);
    }

    // Get from database
    preferences = await UserService.getUserPreferences(user.id);
    
    if (preferences) {
      // Cache the result
      CacheService.setUserPreferences(user.clerkId, preferences);
    }

    return createSuccess(preferences);
  } catch (error) {
    return handleError(error, 'Failed to get user preferences');
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(params: UserPreferencesParams): Promise<ActionResult<UserPreferences>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = UserPreferencesSchema.partial().parse(params);
    
    // Update preferences
    const preferences = await UserService.updateUserPreferences(user.id, validatedData);

    // Clear caches
    CacheService.invalidateUser(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/settings');

    return createSuccess(preferences);
  } catch (error) {
    return handleError(error, 'Failed to update preferences');
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(): Promise<ActionResult<UserPreferences>> {
  try {
    const user = await requireDatabaseUser();
    
    // Reset to defaults
    const defaultPreferences = {
      theme: 'system' as const,
      pomodoroWorkDuration: 25,
      pomodoroShortBreakDuration: 5,
      pomodoroLongBreakDuration: 15,
      pomodoroLongBreakInterval: 4,
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreaks: false,
      autoStartPomodoros: false,
    };
    
    const preferences = await UserService.updateUserPreferences(user.id, defaultPreferences);

    // Clear caches
    CacheService.invalidateUser(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/settings');

    return createSuccess(preferences);
  } catch (error) {
    return handleError(error, 'Failed to reset preferences');
  }
}

// =============================================================================
// User Statistics Actions (Placeholder - implement when analytics are needed)
// =============================================================================

/**
 * Get user statistics
 */
export async function getUserStats(timeframe?: string): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'user-stats', { timeframe });
    
    // Try cache first
    let stats = CacheService.getAnalytics(cacheKey);
    if (stats) {
      return createSuccess(stats);
    }

    // TODO: Implement user statistics calculation
    stats = {
      totalSessions: 0,
      totalTime: 0,
      streak: 0,
      completedToday: 0,
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, stats, 10 * 60 * 1000); // 10 minutes

    return createSuccess(stats);
  } catch (error) {
    return handleError(error, 'Failed to get user statistics');
  }
}
