import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Project } from '@prisma/client';
import type { 
  ProjectFilters, 
  ProjectWithStats, 
  ProjectSelectOption 
} from '@/types/project';

interface ProjectStore {
  // State
  selectedProject: Project | null;
  recentProjects: Project[];
  projectFilters: ProjectFilters;
  viewMode: 'grid' | 'list';
  selectedProjects: string[]; // For bulk operations
  
  // Cache
  projectsCache: Map<string, ProjectWithStats>;
  optionsCache: ProjectSelectOption[];
  lastCacheUpdate: number | null;
  
  // Actions
  setSelectedProject: (project: Project | null) => void;
  addRecentProject: (project: Project) => void;
  setProjectFilters: (filters: ProjectFilters) => void;
  clearProjectFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedProjects: (projectIds: string[]) => void;
  toggleProjectSelection: (projectId: string) => void;
  clearSelection: () => void;
  
  // Cache management
  setCachedProjects: (projects: ProjectWithStats[]) => void;
  getCachedProject: (projectId: string) => ProjectWithStats | undefined;
  setCachedOptions: (options: ProjectSelectOption[]) => void;
  invalidateCache: () => void;
  
  // Utilities
  reset: () => void;
}

const INITIAL_STATE = {
  selectedProject: null,
  recentProjects: [],
  projectFilters: {
    search: '',
    isArchived: false,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
  },
  viewMode: 'grid' as const,
  selectedProjects: [],
  projectsCache: new Map(),
  optionsCache: [],
  lastCacheUpdate: null,
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Set selected project and add to recent projects
      setSelectedProject: (project) =>
        set((state) => {
          const newState = { selectedProject: project };
          
          if (project) {
            // Add to recent projects (max 5)
            const recentProjects = [
              project,
              ...state.recentProjects.filter(p => p.id !== project.id)
            ].slice(0, 5);
            
            return { ...newState, recentProjects };
          }
          
          return newState;
        }),

      // Add project to recent projects list
      addRecentProject: (project) =>
        set((state) => ({
          recentProjects: [
            project,
            ...state.recentProjects.filter(p => p.id !== project.id)
          ].slice(0, 5),
        })),

      // Update project filters
      setProjectFilters: (filters) =>
        set({ projectFilters: filters }),

      // Clear project filters
      clearProjectFilters: () =>
        set({ 
          projectFilters: {
            search: '',
            isArchived: false,
            sortBy: 'createdAt' as const,
            sortOrder: 'desc' as const,
          }
        }),

      // Set view mode (grid or list)
      setViewMode: (mode) =>
        set({ viewMode: mode }),

      // Set selected projects for bulk operations
      setSelectedProjects: (projectIds) =>
        set({ selectedProjects: projectIds }),

      // Toggle project selection
      toggleProjectSelection: (projectId) =>
        set((state) => {
          const isSelected = state.selectedProjects.includes(projectId);
          const selectedProjects = isSelected
            ? state.selectedProjects.filter(id => id !== projectId)
            : [...state.selectedProjects, projectId];
          
          return { selectedProjects };
        }),

      // Clear all selections
      clearSelection: () =>
        set({ selectedProjects: [] }),

      // Cache projects for performance
      setCachedProjects: (projects) =>
        set((state) => {
          const projectsCache = new Map(state.projectsCache);
          
          projects.forEach(project => {
            projectsCache.set(project.id, project);
          });
          
          return {
            projectsCache,
            lastCacheUpdate: Date.now(),
          };
        }),

      // Get cached project
      getCachedProject: (projectId) => {
        const state = get();
        return state.projectsCache.get(projectId);
      },

      // Cache project options
      setCachedOptions: (options) =>
        set({
          optionsCache: options,
          lastCacheUpdate: Date.now(),
        }),

      // Invalidate cache
      invalidateCache: () =>
        set({
          projectsCache: new Map(),
          optionsCache: [],
          lastCacheUpdate: null,
        }),

      // Reset store to initial state
      reset: () =>
        set(INITIAL_STATE),
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => localStorage),
      
      // Only persist specific fields
      partialize: (state) => ({
        selectedProject: state.selectedProject,
        recentProjects: state.recentProjects,
        projectFilters: state.projectFilters,
        viewMode: state.viewMode,
      }),
      
      // Custom serializer for Map objects
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          projectsCache: undefined, // Don't persist cache
          optionsCache: [], // Don't persist cache
          lastCacheUpdate: null,
        });
      },
      
      // Version for migration handling
      version: 1,
      
      // Handle migrations if needed
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            projectFilters: {
              ...INITIAL_STATE.projectFilters,
              ...persistedState.projectFilters,
            },
          };
        }
        return persistedState;
      },
    }
  )
);

// Selectors for computed values
export const selectActiveFilters = (state: ProjectStore) => {
  const { projectFilters } = state;
  const activeCount = Object.entries(projectFilters).filter(([key, value]) => {
    if (key === 'search') return value && value.trim().length > 0;
    if (key === 'isArchived') return value === true;
    if (key === 'colorFilter') return Array.isArray(value) && value.length > 0;
    return false;
  }).length;
  
  return { activeCount, hasActiveFilters: activeCount > 0 };
};

export const selectRecentProjectsForDropdown = (state: ProjectStore): ProjectSelectOption[] =>
  state.recentProjects.map(project => ({
    value: project.id,
    label: project.name,
    color: project.color,
    isArchived: project.isArchived,
  }));

export const selectIsProjectSelected = (projectId: string) => (state: ProjectStore) =>
  state.selectedProjects.includes(projectId);

export const selectHasSelection = (state: ProjectStore) =>
  state.selectedProjects.length > 0;

export const selectSelectionCount = (state: ProjectStore) =>
  state.selectedProjects.length;

// Helper hooks for common operations
export const useSelectedProject = () => 
  useProjectStore(state => state.selectedProject);

export const useProjectFilters = () => 
  useProjectStore(state => state.projectFilters);

export const useProjectViewMode = () => 
  useProjectStore(state => state.viewMode);

export const useProjectSelection = () => 
  useProjectStore(state => ({
    selectedProjects: state.selectedProjects,
    toggleSelection: state.toggleProjectSelection,
    clearSelection: state.clearSelection,
    setSelection: state.setSelectedProjects,
  }));

export const useRecentProjects = () => 
  useProjectStore(state => state.recentProjects);

// Action creators for dispatching multiple actions
export const projectActions = {
  selectAndAddToRecent: (project: Project) => {
    const store = useProjectStore.getState();
    store.setSelectedProject(project);
    store.addRecentProject(project);
  },
  
  resetFiltersAndSelection: () => {
    const store = useProjectStore.getState();
    store.setProjectFilters(INITIAL_STATE.projectFilters);
    store.clearSelection();
  },
  
  toggleViewMode: () => {
    const store = useProjectStore.getState();
    const newMode = store.viewMode === 'grid' ? 'list' : 'grid';
    store.setViewMode(newMode);
  },
};
