// Hook for managing session data and operations
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createSession, 
  createManualEntry, 
  updateSession, 
  deleteSession, 
  getUserSessions, 
  getSession,
  bulkDeleteSessions,
  getSessionStats,
  getRecentSessions,
  searchSessions
} from '@/actions/session-actions';
import type { 
  SessionWithProject, 
  SessionFormData, 
  ManualEntryFormData, 
  SessionFilters,
  SessionStats
} from '@/types/session';
import type { PaginatedResponse } from '@/types/actions';
import { SessionType } from '@prisma/client';

interface UseSessionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: SessionFilters;
  pageSize?: number;
}

interface SessionsState {
  sessions: SessionWithProject[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentPage: number;
  filters: SessionFilters;
}

interface SessionOperations {
  // CRUD operations
  createSession: (data: SessionFormData) => Promise<SessionWithProject | null>;
  createManualEntry: (data: ManualEntryFormData) => Promise<SessionWithProject | null>;
  updateSession: (id: string, data: Partial<SessionFormData>) => Promise<SessionWithProject | null>;
  deleteSession: (id: string) => Promise<boolean>;
  duplicateSession: (id: string) => Promise<SessionWithProject | null>;
  
  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<number>;
  bulkUpdate: (ids: string[], updates: Partial<SessionFormData>) => Promise<number>;
  
  // List operations
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<SessionFilters>) => void;
  clearFilters: () => void;
  
  // Search
  search: (query: string) => Promise<SessionWithProject[]>;
  
  // Selection management
  selectedSessions: string[];
  selectSession: (id: string) => void;
  unselectSession: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
}

export function useSessions(options: UseSessionsOptions = {}): SessionsState & SessionOperations {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    initialFilters = {},
    pageSize = 20,
  } = options;

  const { toast } = useToast();

  // State management
  const [state, setState] = useState<SessionsState>({
    sessions: [],
    loading: false,
    error: null,
    hasMore: true,
    total: 0,
    currentPage: 1,
    filters: initialFilters,
  });

  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Load sessions data
  const loadSessions = useCallback(async (
    page = 1, 
    filters = state.filters,
    append = false
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getUserSessions({
        projectId: filters.projectId,
        sessionType: filters.sessionType,
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString(),
        isPomodoro: filters.isPomodoro,
        search: filters.search,
        page,
        limit: pageSize,
        sortBy: 'startTime',
        sortOrder: 'desc',
      });

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          sessions: append ? [...prev.sessions, ...result.data!.data] : result.data!.data,
          hasMore: result.data!.pagination.hasNext,
          total: result.data!.pagination.total,
          currentPage: page,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to load sessions',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  }, [state.filters, pageSize]);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSessions(state.currentPage, state.filters);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSessions, state.currentPage, state.filters]);

  // Operations
  const operations: SessionOperations = {
    // Create new session
    createSession: async (data: SessionFormData) => {
      try {
        const result = await createSession(data);
        
        if (result.success && result.data) {
          // Refresh sessions list
          await loadSessions(1, state.filters);
          
          toast({
            title: 'Session created',
            description: 'Your session has been created successfully.',
          });
          
          return result.data;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create session',
            variant: 'destructive',
          });
          return null;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create session',
          variant: 'destructive',
        });
        return null;
      }
    },

    // Create manual entry
    createManualEntry: async (data: ManualEntryFormData) => {
      try {
        const result = await createManualEntry(data);
        
        if (result.success && result.data) {
          // Refresh sessions list
          await loadSessions(1, state.filters);
          
          toast({
            title: 'Manual entry created',
            description: 'Your time entry has been added successfully.',
          });
          
          return result.data;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create manual entry',
            variant: 'destructive',
          });
          return null;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create manual entry',
          variant: 'destructive',
        });
        return null;
      }
    },

    // Update session
    updateSession: async (id: string, data: Partial<SessionFormData>) => {
      try {
        const result = await updateSession(id, data);
        
        if (result.success && result.data) {
          // Update session in current list
          setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(session =>
              session.id === id ? result.data! : session
            ),
          }));
          
          toast({
            title: 'Session updated',
            description: 'Your session has been updated successfully.',
          });
          
          return result.data;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update session',
            variant: 'destructive',
          });
          return null;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update session',
          variant: 'destructive',
        });
        return null;
      }
    },

    // Delete session
    deleteSession: async (id: string) => {
      try {
        const result = await deleteSession(id);
        
        if (result.success) {
          // Remove session from current list
          setState(prev => ({
            ...prev,
            sessions: prev.sessions.filter(session => session.id !== id),
            total: prev.total - 1,
          }));
          
          // Remove from selection if selected
          setSelectedSessions(prev => prev.filter(sessionId => sessionId !== id));
          
          toast({
            title: 'Session deleted',
            description: 'Your session has been deleted successfully.',
          });
          
          return true;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to delete session',
            variant: 'destructive',
          });
          return false;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete session',
          variant: 'destructive',
        });
        return false;
      }
    },

    // Duplicate session
    duplicateSession: async (id: string) => {
      const session = state.sessions.find(s => s.id === id);
      if (!session) {
        toast({
          title: 'Error',
          description: 'Session not found',
          variant: 'destructive',
        });
        return null;
      }

      // Create new session with same data but current time
      const newSessionData: SessionFormData = {
        projectId: session.projectId || undefined,
        startTime: new Date(),
        sessionType: session.sessionType,
        isPomodoro: session.isPomodoro,
        description: session.description || undefined,
        tags: session.tags || [],
      };

      return await operations.createSession(newSessionData);
    },

    // Bulk delete
    bulkDelete: async (ids: string[]) => {
      try {
        const result = await bulkDeleteSessions(ids);
        
        if (result.success) {
          // Remove sessions from current list
          setState(prev => ({
            ...prev,
            sessions: prev.sessions.filter(session => !ids.includes(session.id)),
            total: prev.total - (result.data || 0),
          }));
          
          // Clear selection
          setSelectedSessions([]);
          
          toast({
            title: 'Sessions deleted',
            description: `${result.data} session(s) have been deleted successfully.`,
          });
          
          return result.data || 0;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to delete sessions',
            variant: 'destructive',
          });
          return 0;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete sessions',
          variant: 'destructive',
        });
        return 0;
      }
    },

    // Bulk update (placeholder - would need backend implementation)
    bulkUpdate: async (ids: string[], updates: Partial<SessionFormData>) => {
      toast({
        title: 'Coming soon',
        description: 'Bulk update functionality will be available soon.',
      });
      return 0;
    },

    // Refresh sessions
    refresh: async () => {
      await loadSessions(1, state.filters);
    },

    // Load more sessions
    loadMore: async () => {
      if (state.hasMore && !state.loading) {
        await loadSessions(state.currentPage + 1, state.filters, true);
      }
    },

    // Set filters
    setFilters: (newFilters: Partial<SessionFilters>) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      setState(prev => ({ ...prev, filters: updatedFilters }));
      loadSessions(1, updatedFilters);
    },

    // Clear filters
    clearFilters: () => {
      setState(prev => ({ ...prev, filters: {} }));
      loadSessions(1, {});
    },

    // Search sessions
    search: async (query: string) => {
      try {
        const result = await searchSessions(query);
        return result.success ? result.data || [] : [];
      } catch (error) {
        return [];
      }
    },

    // Selection management
    selectedSessions,
    
    selectSession: (id: string) => {
      setSelectedSessions(prev => 
        prev.includes(id) ? prev : [...prev, id]
      );
    },

    unselectSession: (id: string) => {
      setSelectedSessions(prev => prev.filter(sessionId => sessionId !== id));
    },

    selectAll: () => {
      setSelectedSessions(state.sessions.map(session => session.id));
    },

    clearSelection: () => {
      setSelectedSessions([]);
    },

    toggleSelection: (id: string) => {
      setSelectedSessions(prev =>
        prev.includes(id)
          ? prev.filter(sessionId => sessionId !== id)
          : [...prev, id]
      );
    },
  };

  return {
    ...state,
    ...operations,
  };
}

// Hook for single session management
export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<SessionWithProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Load session data
  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getSession(sessionId);
      
      if (result.success) {
        setSession(result.data || null);
      } else {
        setError(result.error || 'Failed to load session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    session,
    loading,
    error,
    refresh: loadSession,
  };
}

// Hook for session statistics
export function useSessionStats(dateFrom?: string, dateTo?: string) {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSessionStats(dateFrom, dateTo);
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to load statistics');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}

// Hook for recent sessions
export function useRecentSessions(limit = 10) {
  const [sessions, setSessions] = useState<SessionWithProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRecentSessions();
      
      if (result.success) {
        setSessions(result.data?.slice(0, limit) || []);
      } else {
        setError(result.error || 'Failed to load recent sessions');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadRecentSessions();
  }, [loadRecentSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: loadRecentSessions,
  };
}
