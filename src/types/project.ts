import { Project } from '@prisma/client';

// Base project types
export interface ProjectData extends Project {}

// Project with additional computed fields
export interface ProjectWithStats extends Project {
  _count: {
    timeSessions: number;
  };
  stats?: {
    totalTime: number;
    averageSessionLength: number;
    lastSessionDate?: Date;
    weeklyTrend: number[];
  };
}

// Project creation data
export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

// Project update data
export interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

// Project filter options
export interface ProjectFilters {
  search?: string;
  isArchived?: boolean;
  colorFilter?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalTime';
  sortOrder?: 'asc' | 'desc';
}

// Project view options
export interface ProjectViewOptions {
  includeStats?: boolean;
  includeTimeSessions?: boolean;
  view?: 'grid' | 'list';
}

// Project statistics
export interface ProjectStats {
  totalSessions: number;
  totalTime: number;
  averageSessionLength: number;
  lastSession?: {
    date: Date;
    duration: number;
  };
  weeklyTrend: Array<{
    date: Date;
    totalTime: number;
    sessionCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    totalTime: number;
    sessionCount: number;
  }>;
  tagBreakdown: Array<{
    tag: string;
    totalTime: number;
    sessionCount: number;
  }>;
}

// Color options for projects
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
  '#14b8a6', // teal
  '#a855f7', // violet
] as const;

export type ProjectColor = typeof PROJECT_COLORS[number];

// Project selector option for dropdowns
export interface ProjectSelectOption {
  value: string;
  label: string;
  color: string;
  isArchived?: boolean;
}

// Bulk operation types
export interface BulkProjectOperation {
  action: 'archive' | 'unarchive' | 'delete' | 'color';
  projectIds: string[];
  data?: {
    color?: string;
  };
}

// Project form validation schemas
export interface ProjectFormData {
  name: string;
  description: string;
  color: string;
}

// Project search results
export interface ProjectSearchResult {
  projects: ProjectWithStats[];
  totalCount: number;
  hasMore: boolean;
}

// Project analytics data
export interface ProjectAnalytics {
  timeDistribution: Array<{
    projectId: string;
    projectName: string;
    color: string;
    totalTime: number;
    percentage: number;
  }>;
  topProjects: Array<{
    project: Project;
    totalTime: number;
    sessionCount: number;
    averageSessionLength: number;
  }>;
  projectTrends: Array<{
    date: Date;
    projects: Array<{
      projectId: string;
      projectName: string;
      totalTime: number;
    }>;
  }>;
}

// Export/import types
export interface ProjectExportData {
  project: Project;
  sessions: Array<{
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    description?: string;
    tags: string[];
  }>;
  stats: ProjectStats;
}

export interface ProjectImportData {
  name: string;
  description?: string;
  color?: string;
  sessions?: Array<{
    startTime: Date;
    endTime?: Date;
    duration: number;
    description?: string;
    tags?: string[];
  }>;
}
