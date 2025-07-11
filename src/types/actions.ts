// TypeScript interfaces for server action parameters and responses
import type { 
  SessionType,
  AchievementType,
  AchievementCategory,
} from './database';

// =============================================================================
// Common Response Types
// =============================================================================

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>; // Field-specific validation errors
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// User Action Types
// =============================================================================

export interface CreateUserParams {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export interface UpdateUserParams {
  name?: string;
  imageUrl?: string;
  email?: string;
}

export interface UserPreferencesParams {
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

export interface UserWithPreferences {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  clerkId: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    id: string;
    theme: string;
    pomodoroWorkDuration: number;
    pomodoroShortBreakDuration: number;
    pomodoroLongBreakDuration: number;
    pomodoroLongBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    defaultProjectId: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

// =============================================================================
// Project Action Types
// =============================================================================

export interface CreateProjectParams {
  name: string;
  description?: string;
  color: string;
  isPomodoro?: boolean;
  targetHours?: number;
}

export interface UpdateProjectParams {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  isPomodoro?: boolean;
  targetHours?: number;
  isArchived?: boolean;
}

export interface ProjectFilters {
  search?: string;
  isArchived?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalTime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ProjectWithStats {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isPomodoro: boolean;
  targetHours: number | null;
  isArchived: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    timeSessions: number;
  };
  totalTime: number; // calculated field in seconds
  lastSessionAt: Date | null;
}

export interface BulkProjectAction {
  action: 'delete' | 'archive' | 'restore';
  projectIds: string[];
}

// =============================================================================
// Time Session Action Types
// =============================================================================

export interface CreateSessionParams {
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  sessionType: SessionType;
  isCompleted?: boolean;
  isPomodoro?: boolean;
  tags?: string[];
  notes?: string;
}

export interface UpdateSessionParams {
  id: string;
  projectId?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  sessionType?: SessionType;
  isCompleted?: boolean;
  tags?: string[];
  notes?: string;
}

export interface ManualSessionParams {
  projectId?: string;
  date: Date;
  duration: number;
  description: string;
  tags?: string[];
}

export interface SessionFilters {
  projectId?: string;
  sessionType?: SessionType;
  dateFrom?: Date;
  dateTo?: Date;
  isPomodoro?: boolean;
  tags?: string[];
  isCompleted?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SessionWithProject {
  id: string;
  userId: string;
  projectId: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  sessionType: SessionType;
  isCompleted: boolean;
  isPomodoro: boolean;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface TimerSession {
  id?: string; // undefined for new sessions
  projectId?: string;
  startTime: Date;
  sessionType: SessionType;
  plannedDuration: number;
  isPomodoro: boolean;
  tags: string[];
}

export interface BulkSessionAction {
  action: 'delete' | 'complete' | 'update';
  sessionIds: string[];
  updateData?: Partial<UpdateSessionParams>;
}

// =============================================================================
// Tag Action Types
// =============================================================================

export interface CreateTagParams {
  name: string;
  color: string;
}

export interface UpdateTagParams {
  id: string;
  name?: string;
  color?: string;
}

export interface TagWithUsage {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    usage: number; // number of sessions using this tag
  };
}

export interface TagSuggestion {
  name: string;
  color: string;
  usageCount: number;
}

// =============================================================================
// Achievement Action Types
// =============================================================================

export interface CreateAchievementParams {
  name: string;
  description: string;
  type: AchievementType;
  category: AchievementCategory;
  criteria: Record<string, any>;
  points: number;
  iconName: string;
  isActive?: boolean;
}

export interface UpdateAchievementParams {
  id: string;
  name?: string;
  description?: string;
  criteria?: Record<string, any>;
  points?: number;
  iconName?: string;
  isActive?: boolean;
}

export interface UserAchievementProgress {
  achievement: {
    id: string;
    name: string;
    description: string;
    type: AchievementType;
    category: AchievementCategory;
    criteria: Record<string, any>;
    points: number;
    iconName: string;
  };
  isUnlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
  target: number;
  progressPercentage: number;
}

export interface AchievementUnlock {
  achievementId: string;
  userId: string;
  unlockedAt: Date;
}

// =============================================================================
// Analytics Action Types
// =============================================================================

export interface AnalyticsFilters {
  dateFrom: Date;
  dateTo: Date;
  projectIds?: string[];
  sessionTypes?: SessionType[];
  includeArchived?: boolean;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  totalTime: number; // seconds
  sessionsCount: number;
  focusTime: number; // seconds
  breakTime: number; // seconds
  pomodoroSessions: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    projectColor: string;
    time: number;
  }>;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
  dailyBreakdown: DailyStats[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  totalTime: number;
  sessionsCount: number;
  averageDailyTime: number;
  weeklyBreakdown: WeeklyStats[];
}

export interface ProjectTimeBreakdown {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalTime: number;
  sessionsCount: number;
  percentage: number;
  averageSessionLength: number;
}

export interface ProductivityInsights {
  mostProductiveHour: number; // 0-23
  mostProductiveDay: number; // 0-6 (Sunday-Saturday)
  averageSessionLength: number; // seconds
  totalFocusTime: number; // seconds
  totalBreakTime: number; // seconds
  streakData: {
    current: number;
    longest: number;
    lastActiveDate: Date | null;
  };
  achievementProgress: UserAchievementProgress[];
  topProjects: ProjectTimeBreakdown[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateFrom: Date;
  dateTo: Date;
  includeProjects: boolean;
  includeSessions: boolean;
  includeAchievements: boolean;
  includeAnalytics: boolean;
}

export interface ExportResult {
  filename: string;
  downloadUrl?: string;
  data?: any; // For direct data return
  size: number; // File size in bytes
}

// =============================================================================
// Real-time Action Types
// =============================================================================

export interface LiveSession {
  id: string;
  userId: string;
  projectId: string | null;
  sessionType: SessionType;
  startTime: Date;
  plannedDuration: number;
  elapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;
  isPomodoro: boolean;
  tags: string[];
}

export interface SessionUpdate {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'complete';
  sessionId: string;
  timestamp: Date;
  elapsedTime?: number;
  notes?: string;
}

// =============================================================================
// Validation Error Types
// =============================================================================

export interface ValidationErrors {
  [field: string]: string[];
}

export interface FormErrors {
  general?: string;
  fields?: ValidationErrors;
}

// =============================================================================
// Pagination and Sorting Types
// =============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// =============================================================================
// Cache-related Types
// =============================================================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: boolean; // Force revalidation
}

export interface CacheKey {
  prefix: string;
  userId?: string;
  params?: Record<string, any>;
}
