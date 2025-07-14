'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  createProject, 
  updateProject, 
  deleteProject, 
  getUserProjects, 
  getProject,
  toggleProjectArchive,
  bulkArchiveProjects,
  bulkDeleteProjects,
  duplicateProject
} from '@/actions/project-actions';
import { ProjectService } from '@/services/project-service';
import { useToast } from '@/components/ui/toast';
import { Project } from '@prisma/client';
import type { 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters,
  ProjectWithStats,
  ProjectSelectOption
} from '@/types/project';

interface UseProjectsOptions {
  filters?: ProjectFilters;
  initialPage?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface UseProjectsReturn {
  projects: ProjectWithStats[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  
  // Actions
  createProject: (data: CreateProjectData) => Promise<boolean>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  duplicateProject: (id: string, newName?: string) => Promise<boolean>;
  toggleArchive: (id: string) => Promise<boolean>;
  bulkArchive: (ids: string[]) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;
  
  // Utilities
  refetch: () => void;
  setPage: (page: number) => void;
  setFilters: (filters: ProjectFilters) => void;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const {
    filters = {},
    initialPage = 1,
    pageSize = 20,
    enabled = true
  } = options;

  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [currentFilters, setCurrentFilters] = useState<ProjectFilters>(filters);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const { success, error: showError } = useToast();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await getUserProjects({
        ...currentFilters,
        page,
        limit: pageSize,
        includeStats: true,
      });

      if (result.success && result.data) {
        setProjects(result.data.data as ProjectWithStats[]);
        setPagination({
          page: result.data.pagination.page,
          pageSize: result.data.pagination.pageSize,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages,
          hasMore: result.data.pagination.hasNext,
        });
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [enabled, currentFilters, page, pageSize]);

  // Effect to fetch projects when dependencies change
  useEffect(() => {
    fetchProjects();
  }, [enabled, currentFilters, page, pageSize]);

  // Create project action
  const handleCreateProject = useCallback(async (data: CreateProjectData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Validate data
      ProjectService.validateProjectData(data);
      
      const result = await createProject(data);
      
      if (result.success) {
        success('Success', 'Project created successfully');
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to create project');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Update project action
  const handleUpdateProject = useCallback(async (id: string, data: UpdateProjectData): Promise<boolean> => {
    try {
      setLoading(true);
      
      ProjectService.validateProjectUpdateData(data);
      
      const result = await updateProject(id, data);
      
      if (result.success) {
        success('Success', 'Project updated successfully');
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to update project');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Delete project action
  const handleDeleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await deleteProject(id);
      
      if (result.success) {
        success('Success', 'Project deleted successfully');
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to delete project');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Duplicate project action
  const handleDuplicateProject = useCallback(async (id: string, newName?: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await duplicateProject(id, newName);
      
      if (result.success) {
        success('Success', 'Project duplicated successfully');
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to duplicate project');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Toggle archive action
  const handleToggleArchive = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await toggleProjectArchive(id);
      
      if (result.success) {
        const action = result.data?.isArchived ? 'archived' : 'unarchived';
        success('Success', `Project ${action} successfully`);
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to update project');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Bulk archive action
  const handleBulkArchive = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await bulkArchiveProjects(ids);
      
      if (result.success) {
        success('Success', `${result.data} projects archived successfully`);
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to archive projects');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Bulk delete action
  const handleBulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await bulkDeleteProjects(ids);
      
      if (result.success) {
        success('Success', `${result.data} projects deleted successfully`);
        fetchProjects();
        return true;
      } else {
        setError(result.error || 'Failed to delete projects');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  // Handle page change
  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle filter change
  const handleSetFilters = useCallback((newFilters: ProjectFilters) => {
    setCurrentFilters(newFilters);
    setPage(1);
  }, []);

  return {
    projects,
    loading,
    error,
    pagination,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    duplicateProject: handleDuplicateProject,
    toggleArchive: handleToggleArchive,
    bulkArchive: handleBulkArchive,
    bulkDelete: handleBulkDelete,
    refetch: fetchProjects,
    setPage: handleSetPage,
    setFilters: handleSetFilters,
  };
}

// Hook for project selector options
interface UseProjectOptionsReturn {
  options: ProjectSelectOption[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProjectOptions(includeArchived = false): UseProjectOptionsReturn {
  const [options, setOptions] = useState<ProjectSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserProjects({
        isArchived: includeArchived ? undefined : false,
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      if (result.success && result.data) {
        const projectOptions: ProjectSelectOption[] = (result.data.data as Project[])
          .map(project => ({
            value: project.id,
            label: project.name,
            color: project.color,
            isArchived: project.isArchived,
          }));
        
        setOptions(projectOptions);
      } else {
        setError(result.error || 'Failed to fetch project options');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refresh: fetchOptions,
  };
}

// Hook for single project
interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProject(projectId: string | null): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getProject(projectId);
      
      if (result.success) {
        setProject(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch project');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}
