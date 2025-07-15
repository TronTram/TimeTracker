// Application constants and configuration values

// Timer default values (in minutes)
export const TIMER_DEFAULTS = {
  WORK_DURATION: 25,
  SHORT_BREAK_DURATION: 5,
  LONG_BREAK_DURATION: 15,
  LONG_BREAK_INTERVAL: 4, // every 4 pomodoros
  FOCUS_DURATION: 60,
} as const;

// Timer limits (in minutes)
export const TIMER_LIMITS = {
  MIN_DURATION: 1,
  MAX_DURATION: 180, // 3 hours
  MIN_BREAK: 1,
  MAX_BREAK: 60,
} as const;

// Color schemes for projects
export const PROJECT_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
] as const;

// Theme configuration
export const THEME_CONFIG = {
  DEFAULT_THEME: 'system' as const,
  STORAGE_KEY: 'theme',
} as const;

// Session types
export const SESSION_TYPES = {
  WORK: 'work',
  SHORT_BREAK: 'short-break',
  LONG_BREAK: 'long-break',
  FOCUS: 'focus',
} as const;

// Timer states
export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  SESSION_COMPLETE: 'session-complete',
  BREAK_COMPLETE: 'break-complete',
  REMINDER: 'reminder',
  ACHIEVEMENT: 'achievement',
} as const;

// Audio files
export const AUDIO_FILES = {
  NOTIFICATION: '/audio/notification.mp3',
  SUCCESS: '/audio/success.mp3',
  AMBIENT: {
    RAIN: '/audio/ambient/rain.mp3',
    FOREST: '/audio/ambient/forest.mp3',
    OCEAN: '/audio/ambient/ocean.mp3',
    WHITE_NOISE: '/audio/ambient/white-noise.mp3',
    CAFE: '/audio/ambient/cafe.mp3',
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TIMER_STATE: 'timer-state',
  POMODORO_STATE: 'pomodoro-state',
  USER_PREFERENCES: 'user-preferences',
  CURRENT_SESSION: 'current-session',
  DRAFT_SESSION: 'draft-session',
  LAST_PROJECT: 'last-project',
  AUDIO_SETTINGS: 'audio-settings',
  NOTIFICATION_PERMISSIONS: 'notification-permissions',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  SESSIONS: '/api/sessions',
  ANALYTICS: '/api/analytics',
  ACHIEVEMENTS: '/api/achievements',
  PREFERENCES: '/api/preferences',
  EXPORT: '/api/export',
  WEBHOOKS: {
    CLERK: '/api/webhooks/clerk',
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Analytics date ranges
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this-week',
  LAST_WEEK: 'last-week',
  THIS_MONTH: 'this-month',
  LAST_MONTH: 'last-month',
  THIS_YEAR: 'this-year',
  CUSTOM: 'custom',
} as const;

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  TIME: 'time',
  STREAK: 'streak',
  PROJECT: 'project',
  FOCUS: 'focus',
  SPECIAL: 'special',
} as const;

// Achievement thresholds
export const ACHIEVEMENT_THRESHOLDS = {
  FIRST_HOUR: 60 * 60, // 1 hour in seconds
  FIRST_DAY: 8 * 60 * 60, // 8 hours in seconds
  MARATHON_SESSION: 2 * 60 * 60, // 2 hours in seconds
  CONSISTENCY_DAYS: 7, // 7 consecutive days
  PROJECT_SESSIONS: 50, // 50 sessions in one project
  FOCUS_STREAK: 10, // 10 consecutive focus sessions
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  AUTHENTICATION: 'Authentication failed. Please sign in again.',
  AUTHORIZATION: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_DELETED: 'Project deleted successfully!',
  SESSION_SAVED: 'Session saved successfully!',
  SESSION_UPDATED: 'Session updated successfully!',
  SESSION_DELETED: 'Session deleted successfully!',
  PREFERENCES_UPDATED: 'Preferences updated successfully!',
  EXPORT_STARTED: 'Export started. You\'ll receive a download link shortly.',
} as const;

// Feature flags
export const FEATURES = {
  ANALYTICS: true,
  ACHIEVEMENTS: true,
  EXPORT: true,
  AUDIO: true,
  NOTIFICATIONS: true,
  DARK_MODE: true,
  POMODORO: true,
  PROJECTS: true,
  TAGS: true,
} as const;

// Development flags
export const DEV_FLAGS = {
  DEBUG_TIMER: false, // Set to true for development debugging
  SKIP_AUTH: false,
  MOCK_DATA: false,
} as const;

// App metadata
export const APP_CONFIG = {
  NAME: 'Cursor Time Tracker',
  DESCRIPTION: 'A focused time tracking application with Pomodoro technique support',
  VERSION: '1.0.0',
  AUTHOR: 'Cursor Time Tracker Team',
  REPOSITORY: 'https://github.com/your-org/cursor-time-tracker',
  SUPPORT_EMAIL: 'support@example.com',
} as const;
