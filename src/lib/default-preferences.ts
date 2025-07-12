import { UserPreferencesUpdateData } from '@/types/user';

/**
 * Default user preferences for new accounts.
 * These values are used during user creation and onboarding.
 */
export const defaultUserPreferences: Omit<UserPreferencesUpdateData, 'defaultProjectId' | 'theme'> = {
  pomodoroWorkDuration: 25,
  pomodoroShortBreakDuration: 5,
  pomodoroLongBreakDuration: 15,
  pomodoroLongBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

/**
 * Default theme setting for new users.
 */
export const DEFAULT_THEME = 'system';

/**
 * Pre-defined Pomodoro configuration presets for user convenience.
 */
export const pomodoroPresets = {
  default: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  },
  longFocus: {
    work: 50,
    shortBreak: 10,
    longBreak: 30,
  },
  '90Minute': {
    work: 90,
    shortBreak: 15,
    longBreak: 30,
  },
};

/**
 * Available timezones for user selection.
 * This is a partial list for demonstration purposes.
 */
export const availableTimezones = [
  'Etc/GMT+12',
  'Etc/GMT+11',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Etc/GMT+2',
  'Europe/London',
  'Europe/Paris',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]; 