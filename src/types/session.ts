// Session-related TypeScript interfaces
import { TimeSession, SessionType, Project } from '@prisma/client';

// Extended session type with relationships
export interface SessionWithProject extends TimeSession {
  project?: Pick<Project, 'id' | 'name' | 'color'> | null;
}

// Session form data types
export interface SessionFormData {
  projectId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  sessionType: SessionType;
  isPomodoro: boolean;
  tags: string[];
}

// Manual entry form data
export interface ManualEntryFormData {
  projectId?: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  description: string;
  tags: string[];
}

// Session list filters
export interface SessionFilters {
  projectId?: string;
  sessionType?: SessionType;
  dateFrom?: Date;
  dateTo?: Date;
  isPomodoro?: boolean;
  tags?: string[];
  search?: string;
  isCompleted?: boolean;
}

// Session statistics
export interface SessionStats {
  totalSessions: number;
  totalTime: number; // in seconds
  focusTime: number; // in seconds
  breakTime: number; // in seconds
  pomodoroSessions: number;
  averageSessionLength: number; // in seconds
  completionRate: number; // percentage
  mostUsedProject?: {
    projectId: string;
    projectName: string;
    time: number;
  };
  todayStats: {
    sessions: number;
    time: number;
    pomodoros: number;
  };
}

// Session editing context
export interface SessionEditData {
  session: SessionWithProject;
  isEditing: boolean;
  originalData: Partial<SessionFormData>;
  hasChanges: boolean;
}

// Session list display options
export interface SessionListOptions {
  groupBy?: 'date' | 'project' | 'type' | 'none';
  showCompleted?: boolean;
  showInProgress?: boolean;
  compactView?: boolean;
  showDuration?: boolean;
  showProject?: boolean;
  showTags?: boolean;
}

// Session operations
export interface SessionOperations {
  create: (data: SessionFormData) => Promise<SessionWithProject>;
  update: (id: string, data: Partial<SessionFormData>) => Promise<SessionWithProject>;
  delete: (id: string) => Promise<boolean>;
  duplicate: (id: string) => Promise<SessionWithProject>;
  bulkDelete: (ids: string[]) => Promise<number>;
  bulkUpdate: (ids: string[], data: Partial<SessionFormData>) => Promise<number>;
}

// Session validation rules
export interface SessionValidationRules {
  maxDuration: number; // in seconds
  minDuration: number; // in seconds
  maxTagsPerSession: number;
  maxDescriptionLength: number;
  allowOverlapping: boolean;
  allowFutureSessions: boolean;
  requireProject: boolean;
  requireDescription: boolean;
}

// Session search and filter results
export interface SessionSearchResult {
  sessions: SessionWithProject[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  filters: SessionFilters;
}

// Session time tracking
export interface SessionTimeInfo {
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  elapsedTime: number; // in seconds (current if active)
  remainingTime?: number; // in seconds (if target duration set)
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

// Session templates for quick creation
export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  sessionType: SessionType;
  defaultDuration?: number; // in seconds
  tags: string[];
  isPomodoro: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Session import/export
export interface SessionExportData {
  sessions: SessionWithProject[];
  metadata: {
    exportedAt: Date;
    totalSessions: number;
    dateRange: {
      from: Date;
      to: Date;
    };
    userId: string;
  };
}

export interface SessionImportOptions {
  mergeStrategy: 'replace' | 'append' | 'skip';
  validateDuplicates: boolean;
  preserveIds: boolean;
  mapProjects: boolean;
}

// Session analytics data
export interface SessionAnalytics {
  dailyBreakdown: Array<{
    date: string;
    totalTime: number;
    sessions: number;
    pomodoros: number;
    focusTime: number;
    breakTime: number;
  }>;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    projectColor: string;
    totalTime: number;
    sessions: number;
    percentage: number;
  }>;
  timePatterns: {
    mostProductiveHour: number;
    averageSessionsPerDay: number;
    longestStreak: number;
    currentStreak: number;
  };
  trends: {
    weekOverWeek: number; // percentage change
    monthOverMonth: number; // percentage change
    improvementAreas: string[];
  };
}

// Session notifications and reminders
export interface SessionNotification {
  id: string;
  type: 'session_start' | 'session_complete' | 'break_reminder' | 'goal_achieved';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  sessionId?: string;
  actionRequired?: boolean;
}

// Session quality metrics
export interface SessionQuality {
  focusScore: number; // 0-100
  productivityRating: number; // 1-5
  distractionLevel: number; // 0-100
  energyLevel: number; // 1-5
  moodBefore: number; // 1-5
  moodAfter: number; // 1-5
  notes?: string;
}

// Session goals and targets
export interface SessionGoals {
  dailyTarget: number; // in sessions
  weeklyTarget: number; // in sessions
  monthlyTarget: number; // in sessions
  focusTimeTarget: number; // in seconds per day
  currentProgress: {
    today: number;
    week: number;
    month: number;
    focusTime: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastActiveDate: Date;
  };
}
