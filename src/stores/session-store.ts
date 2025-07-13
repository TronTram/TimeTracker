// Zustand store for session state management
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessionWithProject, SessionFilters, SessionFormData } from '@/types/session';

interface SessionStore {
  // Current session being edited
  currentSession: SessionWithProject | null;
  editingSession: SessionWithProject | null;
  isEditing: boolean;

  // Session list state
  sessions: SessionWithProject[];
  filteredSessions: SessionWithProject[];
  filters: SessionFilters;
  searchQuery: string;
  selectedSessionIds: string[];

  // UI state
  showCompletedSessions: boolean;
  showInProgressSessions: boolean;
  groupBy: 'date' | 'project' | 'type' | 'none';
  sortBy: 'startTime' | 'duration' | 'project' | 'type';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid' | 'timeline';

  // Form state
  sessionForm: Partial<SessionFormData>;
  formErrors: Record<string, string[]>;
  isSubmitting: boolean;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;

  // Actions
  setCurrentSession: (session: SessionWithProject | null) => void;
  setEditingSession: (session: SessionWithProject | null) => void;
  setIsEditing: (editing: boolean) => void;

  setSessions: (sessions: SessionWithProject[]) => void;
  addSession: (session: SessionWithProject) => void;
  updateSessionInList: (sessionId: string, updates: Partial<SessionWithProject>) => void;
  removeSessionFromList: (sessionId: string) => void;

  setFilters: (filters: Partial<SessionFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;

  selectSession: (sessionId: string) => void;
  unselectSession: (sessionId: string) => void;
  toggleSessionSelection: (sessionId: string) => void;
  selectAllSessions: () => void;
  clearSelection: () => void;

  setUIState: (state: {
    showCompletedSessions?: boolean;
    showInProgressSessions?: boolean;
    groupBy?: 'date' | 'project' | 'type' | 'none';
    sortBy?: 'startTime' | 'duration' | 'project' | 'type';
    sortOrder?: 'asc' | 'desc';
    viewMode?: 'list' | 'grid' | 'timeline';
  }) => void;

  setSessionForm: (form: Partial<SessionFormData>) => void;
  updateSessionForm: (updates: Partial<SessionFormData>) => void;
  clearSessionForm: () => void;
  setFormErrors: (errors: Record<string, string[]>) => void;
  setIsSubmitting: (submitting: boolean) => void;

  setPagination: (page: number, pageSize?: number) => void;
  setHasMore: (hasMore: boolean) => void;

  // Computed getters
  getSessionById: (sessionId: string) => SessionWithProject | undefined;
  getSelectedSessions: () => SessionWithProject[];
  getSessionsByProject: () => Record<string, SessionWithProject[]>;
  getSessionsByDate: () => Record<string, SessionWithProject[]>;
  getSessionStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    totalTime: number;
    averageDuration: number;
  };
}

const defaultFilters: SessionFilters = {};

const defaultSessionForm: Partial<SessionFormData> = {
  sessionType: 'FOCUS',
  isPomodoro: false,
  tags: [],
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      editingSession: null,
      isEditing: false,

      sessions: [],
      filteredSessions: [],
      filters: defaultFilters,
      searchQuery: '',
      selectedSessionIds: [],

      showCompletedSessions: true,
      showInProgressSessions: true,
      groupBy: 'date',
      sortBy: 'startTime',
      sortOrder: 'desc',
      viewMode: 'list',

      sessionForm: defaultSessionForm,
      formErrors: {},
      isSubmitting: false,

      currentPage: 1,
      pageSize: 20,
      totalPages: 1,
      hasMore: false,

      // Actions
      setCurrentSession: (session) => set({ currentSession: session }),
      
      setEditingSession: (session) => set({ 
        editingSession: session,
        isEditing: !!session,
        sessionForm: session ? {
          projectId: session.projectId || undefined,
          startTime: session.startTime,
          endTime: session.endTime || undefined,
          duration: session.duration,
          description: session.description || undefined,
          sessionType: session.sessionType,
          isPomodoro: session.isPomodoro,
          tags: session.tags || [],
        } : defaultSessionForm,
      }),

      setIsEditing: (editing) => set({ isEditing: editing }),

      setSessions: (sessions) => {
        set({ sessions });
        get().applyFilters();
      },

      addSession: (session) => {
        const sessions = [session, ...get().sessions];
        set({ sessions });
        get().applyFilters();
      },

      updateSessionInList: (sessionId, updates) => {
        const sessions = get().sessions.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        );
        set({ sessions });
        get().applyFilters();
      },

      removeSessionFromList: (sessionId) => {
        const sessions = get().sessions.filter(session => session.id !== sessionId);
        const selectedSessionIds = get().selectedSessionIds.filter(id => id !== sessionId);
        set({ sessions, selectedSessionIds });
        get().applyFilters();
      },

      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
        get().applyFilters();
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
        get().applyFilters();
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().applyFilters();
      },

      applyFilters: () => {
        const { sessions, filters, searchQuery, showCompletedSessions, showInProgressSessions, sortBy, sortOrder } = get();
        
        let filtered = [...sessions];

        // Apply search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(session =>
            session.description?.toLowerCase().includes(query) ||
            session.project?.name?.toLowerCase().includes(query) ||
            session.tags?.some(tag => tag.toLowerCase().includes(query))
          );
        }

        // Apply filters
        if (filters.projectId) {
          filtered = filtered.filter(session => session.projectId === filters.projectId);
        }

        if (filters.sessionType) {
          filtered = filtered.filter(session => session.sessionType === filters.sessionType);
        }

        if (filters.isPomodoro !== undefined) {
          filtered = filtered.filter(session => session.isPomodoro === filters.isPomodoro);
        }

        if (filters.dateFrom) {
          filtered = filtered.filter(session => session.startTime >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          filtered = filtered.filter(session => session.startTime <= filters.dateTo!);
        }

        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter(session =>
            filters.tags!.some(tag => session.tags?.includes(tag))
          );
        }

        // Apply completion status filters
        if (!showCompletedSessions) {
          filtered = filtered.filter(session => !session.endTime);
        }

        if (!showInProgressSessions) {
          filtered = filtered.filter(session => !!session.endTime);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortBy) {
            case 'startTime':
              aValue = a.startTime.getTime();
              bValue = b.startTime.getTime();
              break;
            case 'duration':
              aValue = a.duration;
              bValue = b.duration;
              break;
            case 'project':
              aValue = a.project?.name || '';
              bValue = b.project?.name || '';
              break;
            case 'type':
              aValue = a.sessionType;
              bValue = b.sessionType;
              break;
            default:
              aValue = a.startTime.getTime();
              bValue = b.startTime.getTime();
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        set({ filteredSessions: filtered });
      },

      selectSession: (sessionId) => {
        const selectedSessionIds = get().selectedSessionIds;
        if (!selectedSessionIds.includes(sessionId)) {
          set({ selectedSessionIds: [...selectedSessionIds, sessionId] });
        }
      },

      unselectSession: (sessionId) => {
        const selectedSessionIds = get().selectedSessionIds.filter(id => id !== sessionId);
        set({ selectedSessionIds });
      },

      toggleSessionSelection: (sessionId) => {
        const selectedSessionIds = get().selectedSessionIds;
        if (selectedSessionIds.includes(sessionId)) {
          get().unselectSession(sessionId);
        } else {
          get().selectSession(sessionId);
        }
      },

      selectAllSessions: () => {
        const sessionIds = get().filteredSessions.map(session => session.id);
        set({ selectedSessionIds: sessionIds });
      },

      clearSelection: () => {
        set({ selectedSessionIds: [] });
      },

      setUIState: (state) => {
        set(state);
        get().applyFilters();
      },

      setSessionForm: (form) => set({ sessionForm: form }),

      updateSessionForm: (updates) => {
        const sessionForm = { ...get().sessionForm, ...updates };
        set({ sessionForm });
      },

      clearSessionForm: () => set({ 
        sessionForm: defaultSessionForm,
        formErrors: {},
        isSubmitting: false,
      }),

      setFormErrors: (errors) => set({ formErrors: errors }),

      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

      setPagination: (page, pageSize) => {
        const currentPageSize = pageSize || get().pageSize;
        set({ 
          currentPage: page,
          pageSize: currentPageSize,
        });
      },

      setHasMore: (hasMore) => set({ hasMore }),

      // Computed getters
      getSessionById: (sessionId) => {
        return get().sessions.find(session => session.id === sessionId);
      },

      getSelectedSessions: () => {
        const { sessions, selectedSessionIds } = get();
        return sessions.filter(session => selectedSessionIds.includes(session.id));
      },

      getSessionsByProject: () => {
        const sessions = get().filteredSessions;
        const grouped: Record<string, SessionWithProject[]> = {};
        
        sessions.forEach(session => {
          const projectKey = session.project?.name || 'No Project';
          if (!grouped[projectKey]) {
            grouped[projectKey] = [];
          }
          grouped[projectKey].push(session);
        });

        return grouped;
      },

      getSessionsByDate: () => {
        const sessions = get().filteredSessions;
        const grouped: Record<string, SessionWithProject[]> = {};
        
        sessions.forEach(session => {
          const dateKey = session.startTime.toISOString().split('T')[0];
          if (dateKey) {
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push(session);
          }
        });

        return grouped;
      },

      getSessionStats: () => {
        const sessions = get().filteredSessions;
        const total = sessions.length;
        const completed = sessions.filter(s => s.endTime).length;
        const inProgress = sessions.filter(s => !s.endTime).length;
        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        const averageDuration = total > 0 ? totalTime / total : 0;

        return {
          total,
          completed,
          inProgress,
          totalTime,
          averageDuration,
        };
      },
    }),
    {
      name: 'session-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist UI preferences, not session data
        showCompletedSessions: state.showCompletedSessions,
        showInProgressSessions: state.showInProgressSessions,
        groupBy: state.groupBy,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        pageSize: state.pageSize,
      }),
    }
  )
);

// Selector hooks for better performance
export const useSessionFilters = () => useSessionStore(state => state.filters);
export const useFilteredSessions = () => useSessionStore(state => state.filteredSessions);
export const useSelectedSessions = () => useSessionStore(state => state.getSelectedSessions());
export const useSessionStats = () => useSessionStore(state => state.getSessionStats());
export const useSessionForm = () => useSessionStore(state => ({
  form: state.sessionForm,
  errors: state.formErrors,
  isSubmitting: state.isSubmitting,
  updateForm: state.updateSessionForm,
  setErrors: state.setFormErrors,
  setSubmitting: state.setIsSubmitting,
  clearForm: state.clearSessionForm,
}));
