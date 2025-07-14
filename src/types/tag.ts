// Tag-related TypeScript interfaces
import { Tag } from '@prisma/client';

// Extended tag type with usage statistics
export interface TagWithStats extends Tag {
  usageCount?: number;
  lastUsed?: Date;
  isActive?: boolean;
}

// Tag form data
export interface TagFormData {
  name: string;
  color?: string;
}

// Tag input and autocomplete
export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  suggestions?: TagSuggestion[];
  disabled?: boolean;
  error?: string;
  className?: string;
}

// Tag suggestions for autocomplete
export interface TagSuggestion {
  id: string;
  name: string;
  color?: string;
  usageCount: number;
  category?: string;
  isNew?: boolean;
}

// Tag filter options
export interface TagFilterOptions {
  search?: string;
  category?: string;
  sortBy?: 'name' | 'usage' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeUnused?: boolean;
}

// Tag management operations
export interface TagOperations {
  create: (data: TagFormData) => Promise<Tag>;
  update: (id: string, data: Partial<TagFormData>) => Promise<Tag>;
  delete: (id: string) => Promise<boolean>;
  merge: (sourceId: string, targetId: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<number>;
  bulkUpdate: (ids: string[], data: Partial<TagFormData>) => Promise<number>;
}

// Tag statistics and analytics
export interface TagStats {
  totalTags: number;
  activeTags: number;
  unusedTags: number;
  averageUsagePerTag: number;
  mostUsedTag?: TagWithStats;
  recentlyUsedTags: TagWithStats[];
  tagsByTimeOfDay: Array<{
    hour: number;
    tags: string[];
    count: number;
  }>;
  tagsByProject: Array<{
    projectId: string;
    projectName: string;
    tags: string[];
    count: number;
  }>;
}

// Tag validation rules
export interface TagValidationRules {
  maxNameLength: number;
  minNameLength: number;
  maxTagsPerSession: number;
  allowedCharacters: RegExp;
  reservedNames: string[];
  caseSensitive: boolean;
  allowDuplicates: boolean;
}

// Tag search and filter results
export interface TagSearchResult {
  tags: TagWithStats[];
  suggestions: TagSuggestion[];
  totalCount: number;
  hasMore: boolean;
  filters: TagFilterOptions;
}

// Tag categories for organization
export interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  tags: string[];
  isDefault: boolean;
  order: number;
}

// Tag usage patterns
export interface TagUsagePattern {
  tagName: string;
  patterns: Array<{
    timeOfDay: number; // hour 0-23
    dayOfWeek: number; // 0-6
    frequency: number;
    projects: string[];
    sessionTypes: string[];
  }>;
  recommendations: string[];
}

// Tag auto-completion settings
export interface TagAutoCompleteSettings {
  enabled: boolean;
  maxSuggestions: number;
  showUsageCount: boolean;
  showRecentTags: boolean;
  includeProjectTags: boolean;
  fuzzyMatch: boolean;
  minCharacters: number;
  suggestFromHistory: boolean;
}

// Tag import/export
export interface TagExportData {
  tags: Tag[];
  categories: TagCategory[];
  metadata: {
    exportedAt: Date;
    totalTags: number;
    userId: string;
    version: string;
  };
}

export interface TagImportOptions {
  mergeStrategy: 'replace' | 'append' | 'skip';
  preserveColors: boolean;
  createCategories: boolean;
  validateNames: boolean;
}

// Tag relationship mappings
export interface TagRelationship {
  sourceTag: string;
  relatedTags: Array<{
    name: string;
    strength: number; // 0-1
    cooccurrenceCount: number;
  }>;
  suggestedCombinations: string[][];
}

// Tag performance metrics
export interface TagPerformanceMetrics {
  tagName: string;
  totalSessions: number;
  totalTime: number; // in seconds
  averageSessionDuration: number;
  productivityScore: number; // 0-100
  focusRating: number; // 1-5
  completionRate: number; // percentage
  bestTimeOfDay: number; // hour
  preferredProjects: string[];
}

// Tag workflow and automation
export interface TagWorkflow {
  id: string;
  name: string;
  description?: string;
  triggers: Array<{
    type: 'project_selected' | 'time_of_day' | 'session_type' | 'keyword';
    value: string;
    condition: 'equals' | 'contains' | 'starts_with' | 'regex';
  }>;
  actions: Array<{
    type: 'add_tag' | 'suggest_tag' | 'remove_tag';
    tagName: string;
    priority: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tag history and tracking
export interface TagHistory {
  tagName: string;
  sessions: Array<{
    sessionId: string;
    date: Date;
    duration: number;
    projectName?: string;
    description?: string;
  }>;
  evolution: Array<{
    date: Date;
    action: 'created' | 'used' | 'renamed' | 'merged' | 'deleted';
    details: string;
  }>;
  trends: {
    usageOverTime: Array<{
      date: string;
      count: number;
    }>;
    seasonality: Array<{
      month: number;
      usage: number;
    }>;
  };
}

// Tag collaboration features
export interface TagCollaboration {
  sharedTags: string[];
  teamSuggestions: TagSuggestion[];
  popularTags: Array<{
    name: string;
    globalUsage: number;
    category: string;
  }>;
  recommendations: Array<{
    tag: string;
    reason: string;
    confidence: number;
  }>;
}
