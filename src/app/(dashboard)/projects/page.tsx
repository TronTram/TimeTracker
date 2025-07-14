'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ProjectCard } from '@/components/features/projects/project-card';
import { ProjectForm } from '@/components/features/projects/project-form';
import { ProjectSearch } from '@/components/features/projects/project-search';
import { useProjects } from '@/hooks/use-projects';
import { useProjectStore, useProjectSelection } from '@/stores/project-store';
import type { ProjectFilters, ProjectWithStats, CreateProjectData, UpdateProjectData } from '@/types/project';
import { 
  Plus, 
  Grid3X3, 
  List, 
  Archive, 
  Trash2, 
  Edit,
  Copy,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';

export default function ProjectsPage() {
  // State
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [selectedProjectForAction, setSelectedProjectForAction] = useState<ProjectWithStats | null>(null);
  
  // Store
  const { viewMode, setViewMode } = useProjectStore();
  const { 
    selectedProjects, 
    clearSelection, 
    toggleSelection,
    setSelection
  } = useProjectSelection();
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);
  
  // Hooks
  const { 
    projects, 
    loading, 
    error,
    createProject, 
    updateProject, 
    deleteProject, 
    duplicateProject,
    toggleArchive,
    bulkArchive,
    bulkDelete
  } = useProjects({ filters: memoizedFilters });
  
  const { toast } = useToast();

  // Get selected projects data
  const selectedProjectsData = projects?.filter(p => selectedProjects.includes(p.id)) || [];
  
  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  // Filter projects based on current filters
  const filteredProjects = projects?.filter(project => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!project.name.toLowerCase().includes(searchLower) &&
          !project.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.isArchived !== undefined) {
      if (project.isArchived !== filters.isArchived) {
        return false;
      }
    }
    
    if (filters.colorFilter?.length) {
      if (!filters.colorFilter.includes(project.color)) {
        return false;
      }
    }
    
    return true;
  }) || [];

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'totalTime':
        aValue = a.stats?.totalTime || 0;
        bValue = b.stats?.totalTime || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Get selected projects data
  const handleDeleteProject = async (project: ProjectWithStats) => {
    try {
      await deleteProject(project.id);
      toast({
        title: 'Project deleted',
        description: `${project.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete project',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle duplicate project
  const handleDuplicateProject = async (project: ProjectWithStats) => {
    try {
      await duplicateProject(project.id);
      toast({
        title: 'Project duplicated',
        description: `Copy of ${project.name} has been created.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to duplicate project',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle toggle archive
  const handleToggleArchive = async (project: ProjectWithStats) => {
    try {
      await toggleArchive(project.id);
      const action = project.isArchived ? 'unarchived' : 'archived';
      toast({
        title: `Project ${action}`,
        description: `${project.name} has been ${action}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update project',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk actions
  const handleBulkArchive = async () => {
    try {
      await bulkArchive(selectedProjects);
      const action = selectedProjectsData[0]?.isArchived ? 'unarchived' : 'archived';
      toast({
        title: `Projects ${action}`,
        description: `${selectedProjects.length} projects have been ${action}.`,
      });
      clearSelection();
    } catch (error) {
      toast({
        title: 'Failed to update projects',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete(selectedProjects);
      toast({
        title: 'Projects deleted',
        description: `${selectedProjects.length} projects have been deleted.`,
      });
      clearSelection();
    } catch (error) {
      toast({
        title: 'Failed to delete projects',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (loading && !projects) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load projects
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading your projects. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Organize your work with projects and track time efficiently.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isSelectionMode && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <ProjectSearch
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={sortedProjects.length}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Selection Mode Toggle */}
          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleSelectionMode}
            className="gap-2"
          >
            {isSelectionMode ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select
          </Button>

          {/* Bulk Actions */}
          {isSelectionMode && selectedProjects.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-500">
                {selectedProjects.length} selected
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                className="gap-1"
              >
                <Archive className="w-4 h-4" />
                Archive
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-1"
          >
            <Grid3X3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {sortedProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.isArchived !== undefined || filters.colorFilter?.length
                ? "No projects match your current filters."
                : "Get started by creating your first project."}
            </p>
            {(!filters.search && filters.isArchived === undefined && !filters.colorFilter?.length) && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
          )}
        >
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              showSelection={isSelectionMode}
              onEdit={setEditingProject}
              onDelete={handleDeleteProject}
              onDuplicate={handleDuplicateProject}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(project) => {
          setIsCreateModalOpen(false);
          toast({
            title: 'Project created',
            description: `${project.name} has been created successfully.`,
          });
        }}
      />

      {/* Edit Project Modal */}
      <ProjectForm
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSuccess={(project) => {
          setEditingProject(null);
          toast({
            title: 'Project updated',
            description: `${project.name} has been updated successfully.`,
          });
        }}
      />
    </div>
  );
}
