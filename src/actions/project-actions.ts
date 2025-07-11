'use server';

import { revalidatePath } from 'next/cache';
import { ProjectService } from '@/services/database-service';
import { CacheService } from '@/services/cache-service';
import { requireDatabaseUser } from '@/lib/auth-helpers';
import { ProjectSchema } from '@/lib/validations';
import type { ActionResult, PaginatedResponse } from '@/types/actions';
import { Project } from '@prisma/client';
import { AppError, ValidationError } from '@/lib/errors';

// Create derived schemas for project operations
const ProjectCreateSchema = ProjectSchema.pick({ 
  name: true, 
  description: true, 
  color: true, 
  isArchived: true 
});
const ProjectUpdateSchema = ProjectCreateSchema.partial();

// Type definitions for action parameters
type ProjectCreateParams = {
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
};

type ProjectUpdateParams = {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
};

type ProjectListParams = {
  search?: string;
  isArchived?: boolean;
  includeStats?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

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
function createSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

// =============================================================================
// Project CRUD Actions
// =============================================================================

/**
 * Create a new project
 */
export async function createProject(params: ProjectCreateParams): Promise<ActionResult<Project>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = ProjectCreateSchema.parse(params);
    
    // Create project in database
    const project = await ProjectService.createProject({
      ...validatedData,
      userId: user.id,
    });

    // Clear caches
    CacheService.invalidateProjects(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/projects');
    revalidatePath('/dashboard');

    return createSuccess(project);
  } catch (error) {
    return handleError(error, 'Failed to create project');
  }
}

/**
 * Get user projects with optional filtering and pagination
 */
export async function getUserProjects(params: ProjectListParams = {}): Promise<ActionResult<PaginatedResponse<Project>>> {
  try {
    const user = await requireDatabaseUser();
    
    const {
      search,
      isArchived = false,
      includeStats = false,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Generate cache key
    const cacheKey = CacheService.generateProjectsKey(user.clerkId, params);
    
    // Try cache first
    let projects = CacheService.getProjects(user.clerkId, cacheKey);
    if (projects) {
      return createSuccess(projects);
    }

    // Get from database
    projects = await ProjectService.getUserProjects(user.id, {
      search,
      isArchived,
      includeStats,
      page,
      pageSize: limit,
      sortBy,
      sortOrder
    });
    
    // Cache the result
    CacheService.setProjects(user.clerkId, projects, cacheKey);

    return createSuccess(projects);
  } catch (error) {
    return handleError(error, 'Failed to get projects');
  }
}

/**
 * Get single project by ID
 */
export async function getProject(projectId: string): Promise<ActionResult<Project | null>> {
  try {
    const user = await requireDatabaseUser();
    
    // Try cache first
    let project = CacheService.getProject(projectId);
    if (project) {
      return createSuccess(project);
    }

    // Get from database
    project = await ProjectService.getProjectById(projectId, user.id);
    
    if (project) {
      // Cache the result
      CacheService.setProject(projectId, project);
    }

    return createSuccess(project);
  } catch (error) {
    return handleError(error, 'Failed to get project');
  }
}

/**
 * Update project
 */
export async function updateProject(projectId: string, params: ProjectUpdateParams): Promise<ActionResult<Project>> {
  try {
    const user = await requireDatabaseUser();
    
    // Validate input
    const validatedData = ProjectUpdateSchema.parse(params);
    
    // Update project
    const project = await ProjectService.updateProject(projectId, user.id, validatedData);

    // Clear caches
    CacheService.invalidateProjectData(user.clerkId, projectId);
    
    // Revalidate pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return createSuccess(project);
  } catch (error) {
    return handleError(error, 'Failed to update project');
  }
}

/**
 * Delete project (soft delete)
 */
export async function deleteProject(projectId: string): Promise<ActionResult<boolean>> {
  try {
    const user = await requireDatabaseUser();
    
    // Soft delete project
    await ProjectService.deleteProject(projectId, user.id);

    // Clear caches
    CacheService.invalidateProjectData(user.clerkId, projectId);
    
    // Revalidate pages
    revalidatePath('/projects');

    return createSuccess(true);
  } catch (error) {
    return handleError(error, 'Failed to delete project');
  }
}

/**
 * Archive/unarchive project
 */
export async function toggleProjectArchive(projectId: string): Promise<ActionResult<Project>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get current project state
    const project = await ProjectService.getProjectById(projectId, user.id);
    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }
    
    // Toggle archive status
    const updatedProject = await ProjectService.updateProject(projectId, user.id, {
      isArchived: !project.isArchived
    });

    // Clear caches
    CacheService.invalidateProjectData(user.clerkId, projectId);
    
    // Revalidate pages
    revalidatePath('/projects');

    return createSuccess(updatedProject);
  } catch (error) {
    return handleError(error, 'Failed to toggle project archive status');
  }
}

// =============================================================================
// Project Statistics Actions
// =============================================================================

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string, timeframe?: string): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'project-stats', { 
      projectId, 
      timeframe 
    });
    
    // Try cache first
    let stats = CacheService.getAnalytics(cacheKey);
    if (stats) {
      return createSuccess(stats);
    }

    // TODO: Implement project statistics calculation
    stats = {
      totalSessions: 0,
      totalTime: 0,
      averageSessionLength: 0,
      lastSession: null,
      weeklyTrend: [],
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, stats, 15 * 60 * 1000); // 15 minutes

    return createSuccess(stats);
  } catch (error) {
    return handleError(error, 'Failed to get project statistics');
  }
}

/**
 * Get project time breakdown
 */
export async function getProjectTimeBreakdown(projectId: string): Promise<ActionResult<any>> {
  try {
    const user = await requireDatabaseUser();
    
    // Generate cache key
    const cacheKey = CacheService.generateAnalyticsKey(user.clerkId, 'project-breakdown', { 
      projectId 
    });
    
    // Try cache first
    let breakdown = CacheService.getAnalytics(cacheKey);
    if (breakdown) {
      return createSuccess(breakdown);
    }

    // TODO: Implement project time breakdown calculation
    breakdown = {
      daily: [],
      weekly: [],
      monthly: [],
      tagBreakdown: [],
    };
    
    // Cache the result
    CacheService.setAnalytics(cacheKey, breakdown, 30 * 60 * 1000); // 30 minutes

    return createSuccess(breakdown);
  } catch (error) {
    return handleError(error, 'Failed to get project time breakdown');
  }
}

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Bulk archive projects
 */
export async function bulkArchiveProjects(projectIds: string[]): Promise<ActionResult<number>> {
  try {
    const user = await requireDatabaseUser();
    
    // Archive projects
    const result = await ProjectService.bulkUpdateProjects(projectIds, user.id, {
      isArchived: true
    });

    // Clear caches
    CacheService.invalidateProjects(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/projects');

    return createSuccess(result.count);
  } catch (error) {
    return handleError(error, 'Failed to archive projects');
  }
}

/**
 * Bulk delete projects
 */
export async function bulkDeleteProjects(projectIds: string[]): Promise<ActionResult<number>> {
  try {
    const user = await requireDatabaseUser();
    
    // Delete projects
    const result = await ProjectService.bulkDeleteProjects(projectIds, user.id);

    // Clear caches
    CacheService.invalidateProjects(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/projects');

    return createSuccess(result.count);
  } catch (error) {
    return handleError(error, 'Failed to delete projects');
  }
}

/**
 * Duplicate project
 */
export async function duplicateProject(projectId: string, newName?: string): Promise<ActionResult<Project>> {
  try {
    const user = await requireDatabaseUser();
    
    // Get original project
    const originalProject = await ProjectService.getProjectById(projectId, user.id);
    if (!originalProject) {
      return {
        success: false,
        error: 'Project not found',
      };
    }
    
    // Create duplicate
    const duplicateData = {
      name: newName || `${originalProject.name} (Copy)`,
      description: originalProject.description || undefined,
      color: originalProject.color,
    };
    
    const newProject = await ProjectService.createProject({
      ...duplicateData,
      userId: user.id,
    });

    // Clear caches
    CacheService.invalidateProjects(user.clerkId);
    
    // Revalidate pages
    revalidatePath('/projects');

    return createSuccess(newProject);
  } catch (error) {
    return handleError(error, 'Failed to duplicate project');
  }
}
