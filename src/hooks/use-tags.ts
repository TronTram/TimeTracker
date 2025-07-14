// Hook for tag operations and autocomplete suggestions
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TagService } from '@/services/tag-service';
import { 
  createTag, 
  updateTag, 
  deleteTag, 
  mergeTags, 
  bulkDeleteTags 
} from '@/actions/tag-actions';
import type { 
  TagWithStats, 
  TagSuggestion, 
  TagFormData, 
  TagFilterOptions 
} from '@/types/tag';

interface UseTagsOptions {
  autoFetch?: boolean;
  filters?: TagFilterOptions;
}

interface TagOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export function useTags(options: UseTagsOptions = {}) {
  const { autoFetch = true, filters } = options;
  const { toast } = useToast();

  // State
  const [tags, setTags] = useState<TagWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags
  const fetchTags = useCallback(async (fetchFilters?: TagFilterOptions) => {
    try {
      setLoading(true);
      setError(null);
      const result = await TagService.getFilteredTags(fetchFilters || filters);
      setTags(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTags();
    }
  }, [autoFetch, fetchTags]);

  // Create tag
  const handleCreateTag = useCallback(async (data: TagFormData): Promise<TagOperationResult> => {
    try {
      const result = await createTag(data);
      
      if (result.success) {
        await fetchTags();
        toast({
          title: 'Success',
          description: 'Tag created successfully',
        });
        return { success: true, data: result.data };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [fetchTags, toast]);

  // Update tag
  const handleUpdateTag = useCallback(async (id: string, data: Partial<TagFormData>): Promise<TagOperationResult> => {
    try {
      const result = await updateTag(id, data);
      
      if (result.success) {
        await fetchTags();
        toast({
          title: 'Success',
          description: 'Tag updated successfully',
        });
        return { success: true, data: result.data };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [fetchTags, toast]);

  // Delete tag
  const handleDeleteTag = useCallback(async (id: string): Promise<TagOperationResult> => {
    try {
      const result = await deleteTag(id);
      
      if (result.success) {
        await fetchTags();
        toast({
          title: 'Success',
          description: 'Tag deleted successfully',
        });
        return { success: true };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [fetchTags, toast]);

  // Merge tags
  const handleMergeTags = useCallback(async (sourceId: string, targetId: string): Promise<TagOperationResult> => {
    try {
      const result = await mergeTags(sourceId, targetId);
      
      if (result.success) {
        await fetchTags();
        toast({
          title: 'Success',
          description: 'Tags merged successfully',
        });
        return { success: true };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to merge tags';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [fetchTags, toast]);

  // Bulk delete tags
  const handleBulkDeleteTags = useCallback(async (tagIds: string[]): Promise<TagOperationResult> => {
    try {
      const result = await bulkDeleteTags(tagIds);
      
      if (result.success) {
        await fetchTags();
        toast({
          title: 'Success',
          description: `${result.deletedCount} tags deleted successfully`,
        });
        return { success: true, data: { deletedCount: result.deletedCount } };
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tags';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [fetchTags, toast]);

  // Get tag by name
  const getTagByName = useCallback((name: string): TagWithStats | undefined => {
    return tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }, [tags]);

  // Get tag by ID
  const getTagById = useCallback((id: string): TagWithStats | undefined => {
    return tags.find(tag => tag.id === id);
  }, [tags]);

  // Filter tags
  const filterTags = useCallback((searchTerm: string): TagWithStats[] => {
    if (!searchTerm.trim()) return tags;
    
    const term = searchTerm.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(term)
    );
  }, [tags]);

  // Group tags by usage
  const tagsByUsage = useMemo(() => {
    return TagService.groupTags(tags, 'usage');
  }, [tags]);

  // Group tags alphabetically
  const tagsByAlphabet = useMemo(() => {
    return TagService.groupTags(tags, 'alphabetical');
  }, [tags]);

  // Most used tags
  const mostUsedTags = useMemo(() => {
    return [...tags]
      .filter(tag => tag.usageCount! > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);
  }, [tags]);

  // Recently used tags
  const recentlyUsedTags = useMemo(() => {
    return [...tags]
      .filter(tag => tag.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, 10);
  }, [tags]);

  // Unused tags
  const unusedTags = useMemo(() => {
    return tags.filter(tag => !tag.usageCount || tag.usageCount === 0);
  }, [tags]);

  // Tag statistics
  const tagStats = useMemo(() => {
    const totalTags = tags.length;
    const activeTags = tags.filter(tag => tag.usageCount! > 0).length;
    const totalUsage = tags.reduce((sum, tag) => sum + (tag.usageCount || 0), 0);
    const averageUsage = activeTags > 0 ? totalUsage / activeTags : 0;

    return {
      totalTags,
      activeTags,
      unusedTags: totalTags - activeTags,
      totalUsage,
      averageUsage,
    };
  }, [tags]);

  return {
    // Data
    tags,
    loading,
    error,
    
    // Grouped data
    tagsByUsage,
    tagsByAlphabet,
    mostUsedTags,
    recentlyUsedTags,
    unusedTags,
    tagStats,

    // Operations
    refetch: fetchTags,
    createTag: handleCreateTag,
    updateTag: handleUpdateTag,
    deleteTag: handleDeleteTag,
    mergeTags: handleMergeTags,
    bulkDeleteTags: handleBulkDeleteTags,

    // Utilities
    getTagByName,
    getTagById,
    filterTags,
  };
}

// Hook for tag autocomplete functionality
interface UseTagAutocompleteOptions {
  maxSuggestions?: number;
  includePopular?: boolean;
  includeContextual?: boolean;
  debounceMs?: number;
}

export function useTagAutocomplete(options: UseTagAutocompleteOptions = {}) {
  const { 
    maxSuggestions = 10, 
    includePopular = true, 
    includeContextual = true,
    debounceMs = 300 
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced query effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!query.trim()) {
        // Show popular tags when no query
        if (includePopular) {
          try {
            setLoading(true);
            const popularSuggestions = await TagService.getAutocompleteSuggestions('', {
              limit: maxSuggestions,
              includePopular: true,
              includeContextual: false,
            });
            setSuggestions(popularSuggestions);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get suggestions');
          } finally {
            setLoading(false);
          }
        } else {
          setSuggestions([]);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const results = await TagService.getAutocompleteSuggestions(query, {
          limit: maxSuggestions,
          includePopular,
          includeContextual,
        });
        
        setSuggestions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, maxSuggestions, includePopular, includeContextual, debounceMs]);

  // Update query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setQuery('');
  }, []);

  // Get contextual suggestions
  const getContextualSuggestions = useCallback(async (context: {
    projectName?: string;
    description?: string;
    sessionType?: string;
    timeOfDay?: number;
    existingTags?: string[];
  }): Promise<TagSuggestion[]> => {
    try {
      const contextualTags = TagService.suggestTagsForSession(context);
      
      return contextualTags.map(tagName => ({
        id: `contextual-${tagName}`,
        name: tagName,
        color: TagService.getTagColor(tagName),
        usageCount: 0,
        category: 'contextual',
        isNew: true,
      }));
    } catch (err) {
      console.error('Failed to get contextual suggestions:', err);
      return [];
    }
  }, []);

  return {
    // State
    query,
    suggestions,
    loading,
    error,

    // Actions
    updateQuery,
    clearSuggestions,
    getContextualSuggestions,
  };
}
