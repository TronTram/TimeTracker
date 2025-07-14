import { 
  ProjectWithStats, 
  ProjectStats, 
  ProjectAnalytics, 
  CreateProjectData, 
  UpdateProjectData,
  ProjectFilters,
  ProjectSelectOption 
} from '@/types/project';
import { ProjectService as DatabaseProjectService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { AppError } from '@/lib/errors';
import { Project } from '@prisma/client';

/**
 * Project Service - Business logic for project operations and analytics
 */
export class ProjectService {
  /**
   * Validate project color format
   */
  static validateColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Generate unique project name if duplicate exists
   */
  static async generateUniqueProjectName(userId: string, baseName: string): Promise<string> {
    let counter = 1;
    let name = baseName;
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Check if project with this name exists by searching
      const result = await DatabaseProjectService.getUserProjects(userId, {
        search: name,
        page: 1,
        pageSize: 1,
      });
      
      const exactMatch = result.data.find((p: any) => p.name === name);
      if (!exactMatch) {
        return name;
      }
      counter++;
      name = `${baseName} (${counter})`;
    }
  }

  /**
   * Calculate project statistics
   */
  static async calculateProjectStats(project: Project): Promise<ProjectStats> {
    try {
      // TODO: Implement actual statistics calculation from time sessions
      // This is a placeholder implementation
      const stats: ProjectStats = {
        totalSessions: 0,
        totalTime: 0,
        averageSessionLength: 0,
        weeklyTrend: [],
        monthlyTrend: [],
        tagBreakdown: [],
      };

      // Cache the stats
      const cacheKey = `project-stats:${project.id}`;
      CacheService.set(cacheKey, stats, 15 * 60 * 1000); // 15 minutes

      return stats;
    } catch (error) {
      console.error('Error calculating project stats:', error);
      throw new AppError('Failed to calculate project statistics');
    }
  }

  /**
   * Get project options for selectors
   */
  static async getProjectOptions(userId: string, includeArchived = false): Promise<ProjectSelectOption[]> {
    try {
      const cacheKey = `project-options:${userId}:${includeArchived}`;
      const cached = CacheService.get(cacheKey);
      if (cached) {
        return cached as ProjectSelectOption[];
      }

      const result = await DatabaseProjectService.getUserProjects(userId, {
        isArchived: undefined, // Get all projects
        page: 1,
        pageSize: 1000, // Get all projects for selector
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const options: ProjectSelectOption[] = (result.data as Project[])
        .filter(project => includeArchived || !project.isArchived)
        .map(project => ({
          value: project.id,
          label: project.name,
          color: project.color,
          isArchived: project.isArchived,
        }));

      CacheService.set(cacheKey, options, 5 * 60 * 1000); // 5 minutes
      return options;
    } catch (error) {
      console.error('Error getting project options:', error);
      throw new AppError('Failed to get project options');
    }
  }

  /**
   * Search projects with advanced filtering
   */
  static async searchProjects(
    userId: string, 
    filters: ProjectFilters,
    page = 1,
    pageSize = 20
  ) {
    try {
      const cacheKey = `project-search:${userId}:${JSON.stringify(filters)}:${page}:${pageSize}`;
      const cached = CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await DatabaseProjectService.getUserProjects(userId, {
        search: filters.search,
        isArchived: filters.isArchived,
        includeStats: true,
        page,
        pageSize,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      });

      // Apply color filters if specified
      if (filters.colorFilter && filters.colorFilter.length > 0) {
        result.data = (result.data as Project[]).filter(project => 
          filters.colorFilter!.includes(project.color)
        );
        result.pagination.total = result.data.length;
      }

      CacheService.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
      return result;
    } catch (error) {
      console.error('Error searching projects:', error);
      throw new AppError('Failed to search projects');
    }
  }

  /**
   * Validate project creation data
   */
  static validateProjectData(data: CreateProjectData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new AppError('Project name is required');
    }

    if (data.name.trim().length > 100) {
      throw new AppError('Project name must be less than 100 characters');
    }

    if (data.description && data.description.length > 500) {
      throw new AppError('Project description must be less than 500 characters');
    }

    if (data.color && !this.validateColor(data.color)) {
      throw new AppError('Invalid color format. Use hex format like #3b82f6');
    }
  }

  /**
   * Validate project update data
   */
  static validateProjectUpdateData(data: UpdateProjectData): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new AppError('Project name is required');
      }

      if (data.name.trim().length > 100) {
        throw new AppError('Project name must be less than 100 characters');
      }
    }

    if (data.description !== undefined && data.description && data.description.length > 500) {
      throw new AppError('Project description must be less than 500 characters');
    }

    if (data.color && !this.validateColor(data.color)) {
      throw new AppError('Invalid color format. Use hex format like #3b82f6');
    }
  }

  /**
   * Get project analytics for dashboard
   */
  static async getProjectAnalytics(userId: string, timeframe?: string): Promise<ProjectAnalytics> {
    try {
      const cacheKey = `project-analytics:${userId}:${timeframe || 'all'}`;
      const cached = CacheService.get(cacheKey);
      if (cached) {
        return cached as ProjectAnalytics;
      }

      // TODO: Implement actual analytics calculation
      // This is a placeholder implementation
      const analytics: ProjectAnalytics = {
        timeDistribution: [],
        topProjects: [],
        projectTrends: [],
      };

      CacheService.set(cacheKey, analytics, 30 * 60 * 1000); // 30 minutes
      return analytics;
    } catch (error) {
      console.error('Error getting project analytics:', error);
      throw new AppError('Failed to get project analytics');
    }
  }

  /**
   * Check if user has reached project limit
   */
  static async checkProjectLimit(userId: string): Promise<boolean> {
    try {
      const result = await DatabaseProjectService.getUserProjects(userId, {
        isArchived: false,
        page: 1,
        pageSize: 1,
      });

      // For now, allow unlimited projects
      // In the future, implement tiered limits
      const limit = 1000;
      
      return result.pagination.total < limit;
    } catch (error) {
      console.error('Error checking project limit:', error);
      return true; // Allow creation if check fails
    }
  }

  /**
   * Get default project color based on existing projects
   */
  static async getNextProjectColor(userId: string): Promise<string> {
    try {
      const result = await DatabaseProjectService.getUserProjects(userId, {
        isArchived: false,
        page: 1,
        pageSize: 100,
      });

      const usedColors = (result.data as Project[]).map(project => project.color);
      
      // Default colors to cycle through
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
        '#8b5cf6', '#f97316', '#06b6d4', '#84cc16',
        '#ec4899', '#6b7280', '#14b8a6', '#a855f7'
      ];

      // Find the first unused color
      for (const color of colors) {
        if (!usedColors.includes(color)) {
          return color;
        }
      }

      // If all colors are used, return a random one
      return colors[Math.floor(Math.random() * colors.length)] || '#3b82f6';
    } catch (error) {
      console.error('Error getting next project color:', error);
      return '#3b82f6'; // Default blue
    }
  }

  /**
   * Archive old projects automatically
   */
  static async archiveOldProjects(userId: string, daysInactive = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // TODO: Implement logic to find projects with no sessions after cutoff date
      // For now, return 0
      return 0;
    } catch (error) {
      console.error('Error archiving old projects:', error);
      return 0;
    }
  }

  /**
   * Merge projects (combine sessions from multiple projects)
   */
  static async mergeProjects(
    userId: string, 
    sourceProjectIds: string[], 
    targetProjectId: string
  ): Promise<void> {
    try {
      // TODO: Implement project merging logic
      // This would involve:
      // 1. Moving all time sessions from source projects to target project
      // 2. Archiving source projects
      // 3. Updating any references
      
      throw new AppError('Project merging not yet implemented');
    } catch (error) {
      console.error('Error merging projects:', error);
      throw new AppError('Failed to merge projects');
    }
  }

  /**
   * Estimate project completion based on time tracking patterns
   */
  static async estimateProjectCompletion(projectId: string): Promise<{
    estimatedCompletion?: Date;
    confidence: number;
    totalTimeNeeded?: number;
    timeSpent: number;
  }> {
    try {
      // TODO: Implement AI-powered project completion estimation
      // This would analyze:
      // - Historical session patterns
      // - Project complexity indicators
      // - User's typical working patterns
      // - Similar projects completion time
      
      return {
        confidence: 0,
        timeSpent: 0,
      };
    } catch (error) {
      console.error('Error estimating project completion:', error);
      return {
        confidence: 0,
        timeSpent: 0,
      };
    }
  }
}
