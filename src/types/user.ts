import type { User as PrismaUser, UserPreferences as PrismaUserPreferences } from '@prisma/client';

/**
 * Represents the core User model with its preferences.
 * This extends the Prisma-generated type to ensure consistency.
 */
export interface UserWithPreferences extends PrismaUser {
  preferences: PrismaUserPreferences | null;
}

/**
 * Data structure for updating a user's profile information.
 */
export interface UserProfileUpdateData {
  name?: string;
  email?: string;
  imageUrl?: string;
}

/**
 * Data structure for updating a user's preferences.
 * All fields are optional to allow partial updates.
 */
export interface UserPreferencesUpdateData {
  theme?: 'light' | 'dark' | 'system';
  pomodoroWorkDuration?: number;
  pomodoroShortBreakDuration?: number;
  pomodoroLongBreakDuration?: number;
  pomodoroLongBreakInterval?: number;
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  defaultProjectId?: string | null;
}

/**
 * Data structure for the multi-step onboarding process.
 */
export interface OnboardingData {
  name: string;
  timeZone: string;
  workHours: {
    startTime: string; // e.g., "09:00"
    endTime: string;   // e.g., "17:00"
  };
  pomodoro: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
  };
  enableNotifications: boolean;
  enableSounds: boolean;
} 