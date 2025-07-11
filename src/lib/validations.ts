// Zod validation schemas for all data models and forms
import { z } from 'zod';

// =============================================================================
// User Validations
// =============================================================================

export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  clerkId: z.string().min(1, 'Clerk ID is required'),
});

export const UserPreferencesSchema = z.object({
  focusDuration: z
    .number()
    .min(1, 'Focus duration must be at least 1 minute')
    .max(180, 'Focus duration cannot exceed 3 hours'),
  shortBreakDuration: z
    .number()
    .min(1, 'Short break must be at least 1 minute')
    .max(60, 'Short break cannot exceed 1 hour'),
  longBreakDuration: z
    .number()
    .min(1, 'Long break must be at least 1 minute')
    .max(120, 'Long break cannot exceed 2 hours'),
  pomodoroSessionsUntilLongBreak: z
    .number()
    .min(2, 'Must have at least 2 sessions before long break')
    .max(10, 'Cannot exceed 10 sessions before long break'),
  soundEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  timerAutoStart: z.boolean(),
  breakAutoStart: z.boolean(),
  dailyGoal: z
    .number()
    .min(1, 'Daily goal must be at least 1 session')
    .max(50, 'Daily goal cannot exceed 50 sessions'),
  weeklyGoal: z
    .number()
    .min(1, 'Weekly goal must be at least 1 session')
    .max(350, 'Weekly goal cannot exceed 350 sessions'),
});

// =============================================================================
// Project Validations
// =============================================================================

export const ProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)'),
  isPomodoro: z.boolean().default(false),
  targetHours: z
    .number()
    .min(0, 'Target hours cannot be negative')
    .max(10000, 'Target hours too large')
    .optional(),
  isArchived: z.boolean().default(false),
});

export const ProjectUpdateSchema = ProjectSchema.partial();

export const ProjectFilterSchema = z.object({
  search: z.string().optional(),
  isArchived: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'totalTime']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// =============================================================================
// Time Session Validations
// =============================================================================

export const TimeSessionSchema = z.object({
  projectId: z.string().cuid('Invalid project ID').optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 second')
    .max(86400, 'Duration cannot exceed 24 hours'), // 24 hours in seconds
  sessionType: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']),
  isCompleted: z.boolean().default(false),
  isPomodoro: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Too many tags').default([]),
  notes: z.string().max(1000, 'Notes too long').optional(),
}).refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const ManualTimeEntrySchema = z.object({
  projectId: z.string().cuid('Invalid project ID').optional(),
  date: z.date(),
  duration: z
    .number()
    .min(60, 'Minimum duration is 1 minute') // 60 seconds
    .max(28800, 'Maximum duration is 8 hours'), // 8 hours in seconds
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Too many tags').default([]),
});

export const SessionFilterSchema = z.object({
  projectId: z.string().cuid().optional(),
  sessionType: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isPomodoro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
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
);

// =============================================================================
// Tag Validations
// =============================================================================

export const TagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag name contains invalid characters'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)'),
});

// =============================================================================
// Achievement Validations
// =============================================================================

export const AchievementSchema = z.object({
  name: z.string().min(1, 'Achievement name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  type: z.enum(['TIME_BASED', 'SESSION_BASED', 'STREAK_BASED', 'PROJECT_BASED']),
  category: z.enum(['PRODUCTIVITY', 'CONSISTENCY', 'MILESTONE', 'SPECIAL']),
  criteria: z.record(z.any()), // Flexible criteria object
  points: z.number().min(1, 'Points must be positive').max(1000, 'Points too high'),
  iconName: z.string().min(1, 'Icon name is required'),
  isActive: z.boolean().default(true),
});

// =============================================================================
// Analytics Validations
// =============================================================================

export const AnalyticsFilterSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  projectIds: z.array(z.string().cuid()).optional(),
  sessionTypes: z.array(z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'])).optional(),
  includeArchived: z.boolean().default(false),
}).refine(
  (data) => data.dateTo >= data.dateFrom,
  {
    message: 'End date must be after or equal to start date',
    path: ['dateTo'],
  }
).refine(
  (data) => {
    const daysDiff = Math.ceil((data.dateTo.getTime() - data.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 365; // Max 1 year range
  },
  {
    message: 'Date range cannot exceed 1 year',
    path: ['dateTo'],
  }
);

export const ExportOptionsSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf']),
  dateFrom: z.date(),
  dateTo: z.date(),
  includeProjects: z.boolean().default(true),
  includeSessions: z.boolean().default(true),
  includeAchievements: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
}).refine(
  (data) => data.dateTo >= data.dateFrom,
  {
    message: 'End date must be after or equal to start date',
    path: ['dateTo'],
  }
);

// =============================================================================
// Pagination and Sorting
// =============================================================================

export const PaginationSchema = z.object({
  page: z.number().min(1, 'Page must be positive').default(1),
  pageSize: z
    .number()
    .min(1, 'Page size must be positive')
    .max(100, 'Page size too large')
    .default(20),
});

export const SortSchema = z.object({
  sortBy: z.string().min(1, 'Sort field is required'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Common Field Validations
// =============================================================================

export const IdSchema = z.string().cuid('Invalid ID format');

export const EmailSchema = z.string().email('Invalid email address');

export const DateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine(
  (data) => data.to >= data.from,
  {
    message: 'End date must be after or equal to start date',
    path: ['to'],
  }
);

export const ColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)');

// =============================================================================
// Form-specific Validations (for UI components)
// =============================================================================

export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegistrationFormSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

export const TimerStartSchema = z.object({
  projectId: z.string().cuid().optional(),
  sessionType: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']).default('FOCUS'),
  duration: z.number().min(60).max(10800).optional(), // 1 min to 3 hours
  isPomodoro: z.boolean().default(false),
});

export const BulkOperationSchema = z.object({
  action: z.enum(['delete', 'archive', 'restore']),
  ids: z.array(z.string().cuid()).min(1, 'At least one item must be selected'),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type UserInput = z.infer<typeof UserSchema>;
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;
export type TimeSessionInput = z.infer<typeof TimeSessionSchema>;
export type ManualTimeEntryInput = z.infer<typeof ManualTimeEntrySchema>;
export type SessionFilter = z.infer<typeof SessionFilterSchema>;
export type TagInput = z.infer<typeof TagSchema>;
export type AchievementInput = z.infer<typeof AchievementSchema>;
export type AnalyticsFilter = z.infer<typeof AnalyticsFilterSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SortInput = z.infer<typeof SortSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
export type LoginFormInput = z.infer<typeof LoginFormSchema>;
export type RegistrationFormInput = z.infer<typeof RegistrationFormSchema>;
export type TimerStartInput = z.infer<typeof TimerStartSchema>;
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
