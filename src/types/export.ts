/**
 * Export Types
 * Type definitions for data export functionality
 */

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateFrom: Date;
  dateTo: Date;
  includeProjects: boolean;
  includeSessions: boolean;
  includeAchievements: boolean;
  includeAnalytics: boolean;
  filename?: string;
}

export interface ExportRequest {
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  projectId?: string;
  includeProjects?: boolean;
  includeSessions?: boolean;
  includeAnalytics?: boolean;
  filename?: string;
}

export interface ExportData {
  metadata: {
    exportDate: string;
    dateRange: {
      from: string;
      to: string;
    };
    totalRecords: number;
    format: ExportFormat;
    userId: string;
  };
  sessions?: SessionExportData[];
  projects?: ProjectExportData[];
  analytics?: AnalyticsExportData;
}

export interface SessionExportData {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  durationMinutes: number;
  durationHours: number;
  sessionType: string;
  isPomodoro: boolean;
  isCompleted: boolean;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  description?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectExportData {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  totalTime: number; // seconds
  totalTimeMinutes: number;
  totalTimeHours: number;
  sessionsCount: number;
  averageSessionLength: number; // seconds
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsExportData {
  summary: {
    totalTime: number;
    totalSessions: number;
    totalProjects: number;
    averageSessionLength: number;
    mostProductiveDay: string;
    mostProductiveHour: number;
  };
  dailyStats: Array<{
    date: string;
    totalTime: number;
    sessionsCount: number;
    pomodoroCount: number;
  }>;
  projectBreakdown: Array<{
    projectName: string;
    totalTime: number;
    percentage: number;
    sessionsCount: number;
  }>;
  productivity: {
    focusRatio: number;
    streakData: {
      currentStreak: number;
      longestStreak: number;
    };
  };
}

export interface ExportProgress {
  phase: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  percentage: number;
  message: string;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  downloadUrl?: string;
  error?: string;
}

// CSV specific types
export interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export interface CSVExportOptions {
  columns: CSVColumn[];
  includeHeaders: boolean;
  delimiter: string;
  encoding: 'utf-8' | 'utf-16';
}

// PDF specific types
export interface PDFExportOptions {
  pageSize: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeHeader: boolean;
  includeFooter: boolean;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFSection {
  title: string;
  content: string | HTMLElement;
  type: 'text' | 'table' | 'chart' | 'summary';
}

// Export configuration presets
export interface ExportPreset {
  name: string;
  description: string;
  format: ExportFormat;
  includeProjects: boolean;
  includeSessions: boolean;
  includeAnalytics: boolean;
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    name: 'Weekly Summary',
    description: 'Sessions and analytics for the past week',
    format: 'pdf',
    includeProjects: true,
    includeSessions: true,
    includeAnalytics: true,
    dateRange: 'week',
  },
  {
    name: 'Monthly Report',
    description: 'Comprehensive monthly productivity report',
    format: 'pdf',
    includeProjects: true,
    includeSessions: true,
    includeAnalytics: true,
    dateRange: 'month',
  },
  {
    name: 'Session Data',
    description: 'Raw session data in CSV format',
    format: 'csv',
    includeProjects: false,
    includeSessions: true,
    includeAnalytics: false,
    dateRange: 'month',
  },
  {
    name: 'Project Backup',
    description: 'Complete data backup in JSON format',
    format: 'json',
    includeProjects: true,
    includeSessions: true,
    includeAnalytics: true,
    dateRange: 'year',
  },
];

// File size limits (in bytes)
export const EXPORT_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_RECORDS: 10000,
  MAX_DATE_RANGE_DAYS: 365,
} as const;

// MIME types for downloads
export const EXPORT_MIME_TYPES = {
  csv: 'text/csv',
  json: 'application/json',
  pdf: 'application/pdf',
} as const;
