// Business logic for tag management and suggestions
import type { 
  TagWithStats, 
  TagSuggestion, 
  TagStats, 
  TagFilterOptions,
  TagUsagePattern,
  TagRelationship 
} from '@/types/tag';
import { 
  getTags, 
  getTagSuggestions, 
  getPopularTags, 
  getTagStats 
} from '@/actions/tag-actions';
import { 
  normalizeTagName, 
  validateTags, 
  suggestTagsFromContext,
  findSimilarTags,
  generateTagColor 
} from '@/lib/tag-utils';

export class TagService {
  /**
   * Get filtered and sorted tags
   */
  static async getFilteredTags(filters?: TagFilterOptions): Promise<TagWithStats[]> {
    return await getTags(filters);
  }

  /**
   * Get autocomplete suggestions for tag input
   */
  static async getAutocompleteSuggestions(
    query: string, 
    options: {
      limit?: number;
      includePopular?: boolean;
      includeContextual?: boolean;
      projectName?: string;
      description?: string;
    } = {}
  ): Promise<TagSuggestion[]> {
    const { 
      limit = 10, 
      includePopular = true, 
      includeContextual = true,
      projectName,
      description 
    } = options;

    const suggestions: TagSuggestion[] = [];

    // Get matching existing tags
    if (query.trim()) {
      const existingSuggestions = await getTagSuggestions(query, Math.floor(limit * 0.7));
      const mappedSuggestions = existingSuggestions.map(s => ({
        ...s,
        color: s.color || undefined,
      }));
      suggestions.push(...mappedSuggestions);
    }

    // Add popular tags if space allows and no query
    if (includePopular && (!query.trim() || suggestions.length < limit)) {
      const popularTags = await getPopularTags(limit - suggestions.length);
      const filteredPopular = popularTags.filter(
        popular => !suggestions.some(existing => existing.name === popular.name)
      ).map(tag => ({
        ...tag,
        color: tag.color || undefined,
      }));
      suggestions.push(...filteredPopular);
    }

    // Add contextual suggestions
    if (includeContextual && description && suggestions.length < limit) {
      const contextualTags = suggestTagsFromContext(
        description, 
        projectName, 
        suggestions.map(s => s.name)
      );
      
      for (const tagName of contextualTags) {
        if (suggestions.length >= limit) break;
        
        suggestions.push({
          id: `contextual-${tagName}`,
          name: tagName,
          color: generateTagColor(tagName),
          usageCount: 0,
          category: 'contextual',
          isNew: true,
        });
      }
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Validate and clean tag array
   */
  static validateAndCleanTags(tags: string[]): {
    valid: string[];
    invalid: Array<{ tag: string; errors: string[] }>;
    errors: string[];
  } {
    const validation = validateTags(tags);
    
    return {
      valid: validation.validTags,
      invalid: validation.invalidTags,
      errors: validation.errors,
    };
  }

  /**
   * Get tag usage analytics
   */
  static async getTagAnalytics(): Promise<TagStats> {
    const stats = await getTagStats();
    const recentlyUsedTags = await this.getRecentlyUsedTags(10);
    
    return {
      totalTags: stats.totalTags,
      activeTags: stats.activeTags,
      unusedTags: stats.unusedTags,
      averageUsagePerTag: stats.averageUsagePerTag,
      mostUsedTag: undefined, // Will be implemented with proper TagWithStats structure
      recentlyUsedTags,
      tagsByTimeOfDay: [],
      tagsByProject: [],
    };
  }

  /**
   * Get recently used tags
   */
  static async getRecentlyUsedTags(limit: number = 10): Promise<TagWithStats[]> {
    const allTags = await getTags({
      sortBy: 'recent',
      sortOrder: 'desc',
      limit,
      includeUnused: false,
    });

    return allTags.filter(tag => tag.usageCount! > 0);
  }

  /**
   * Find similar tags for duplicate detection
   */
  static async findSimilarTagNames(
    tagName: string, 
    threshold: number = 0.7
  ): Promise<Array<{ tag: string; similarity: number }>> {
    const allTags = await getTags();
    const tagNames = allTags.map(tag => tag.name);
    
    return findSimilarTags(tagName, tagNames, threshold);
  }

  /**
   * Get tag relationships and co-occurrence patterns
   */
  static async getTagRelationships(tagName: string): Promise<TagRelationship | null> {
    try {
      // This would require additional database queries to analyze tag co-occurrence
      // For now, return a simplified version
      const allTags = await getTags();
      const relatedTags = allTags
        .filter(tag => tag.name !== tagName)
        .slice(0, 5)
        .map(tag => ({
          name: tag.name,
          strength: Math.random() * 0.8 + 0.2, // Placeholder
          cooccurrenceCount: tag.usageCount || 0,
        }));

      return {
        sourceTag: tagName,
        relatedTags,
        suggestedCombinations: [],
      };
    } catch (error) {
      console.error('Failed to get tag relationships:', error);
      return null;
    }
  }

  /**
   * Get tag usage patterns by time
   */
  static async getTagUsagePatterns(tagName: string): Promise<TagUsagePattern | null> {
    try {
      // This would require analyzing session timestamps and tag usage
      // For now, return a simplified version
      return {
        tagName,
        patterns: [],
        recommendations: [
          `Use "${tagName}" during focused work sessions`,
          `Consider combining with project-specific tags`,
          `Most effective during morning hours`,
        ],
      };
    } catch (error) {
      console.error('Failed to get tag usage patterns:', error);
      return null;
    }
  }

  /**
   * Suggest tags based on session context
   */
  static suggestTagsForSession(context: {
    projectName?: string;
    description?: string;
    sessionType?: string;
    timeOfDay?: number;
    existingTags?: string[];
  }): string[] {
    const { projectName, description = '', sessionType, timeOfDay, existingTags = [] } = context;
    
    const suggestions = suggestTagsFromContext(description, projectName, existingTags);
    
    // Add time-based suggestions
    if (timeOfDay !== undefined) {
      if (timeOfDay >= 6 && timeOfDay < 12) {
        suggestions.push('morning');
      } else if (timeOfDay >= 12 && timeOfDay < 18) {
        suggestions.push('afternoon');
      } else if (timeOfDay >= 18 && timeOfDay < 22) {
        suggestions.push('evening');
      } else {
        suggestions.push('late-night');
      }
    }

    // Add session type suggestions
    if (sessionType) {
      switch (sessionType.toLowerCase()) {
        case 'focus':
        case 'work':
          suggestions.push('deep-work', 'focused');
          break;
        case 'short_break':
          suggestions.push('break', 'rest');
          break;
        case 'long_break':
          suggestions.push('long-break', 'recharge');
          break;
      }
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Normalize tag input for consistency
   */
  static normalizeTagInput(tags: string[]): string[] {
    return tags
      .map(tag => normalizeTagName(tag))
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  }

  /**
   * Get tag color or generate one
   */
  static getTagColor(tagName: string, existingTags: TagWithStats[] = []): string {
    const existingTag = existingTags.find(tag => tag.name === tagName);
    return existingTag?.color || generateTagColor(tagName);
  }

  /**
   * Format tag display name
   */
  static formatTagName(tagName: string): string {
    return tagName
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get tag usage frequency
   */
  static calculateTagFrequency(tags: TagWithStats[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    for (const tag of tags) {
      frequency[tag.name] = tag.usageCount || 0;
    }
    
    return frequency;
  }

  /**
   * Group tags by category or pattern
   */
  static groupTags(tags: TagWithStats[], groupBy: 'color' | 'usage' | 'alphabetical' = 'alphabetical'): Record<string, TagWithStats[]> {
    const groups: Record<string, TagWithStats[]> = {};
    
    for (const tag of tags) {
      let key: string;
      
      switch (groupBy) {
        case 'color':
          key = tag.color || 'No Color';
          break;
        case 'usage':
          const usage = tag.usageCount || 0;
          if (usage === 0) key = 'Unused';
          else if (usage < 5) key = 'Rarely Used';
          else if (usage < 20) key = 'Sometimes Used';
          else key = 'Frequently Used';
          break;
        case 'alphabetical':
        default:
          key = tag.name.charAt(0).toUpperCase();
          break;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key]!.push(tag);
    }
    
    return groups;
  }

  /**
   * Export tags for backup or migration
   */
  static async exportTags(): Promise<{
    tags: TagWithStats[];
    metadata: {
      exportedAt: Date;
      totalTags: number;
      version: string;
    };
  }> {
    const tags = await getTags();
    
    return {
      tags,
      metadata: {
        exportedAt: new Date(),
        totalTags: tags.length,
        version: '1.0',
      },
    };
  }

  /**
   * Get trending tags (recently gaining popularity)
   */
  static async getTrendingTags(days: number = 7, limit: number = 10): Promise<TagWithStats[]> {
    // This would require time-series analysis of tag usage
    // For now, return recently used tags as a placeholder
    return await this.getRecentlyUsedTags(limit);
  }

  /**
   * Get tag recommendations based on user behavior
   */
  static async getPersonalizedRecommendations(
    context?: {
      recentProjects?: string[];
      timeOfDay?: number;
      sessionType?: string;
    }
  ): Promise<TagSuggestion[]> {
    const popularTags = await getPopularTags(5);
    const recentTags = await this.getRecentlyUsedTags(5);
    
    // Combine and deduplicate
    const recommendations: TagSuggestion[] = [];
    const seen = new Set<string>();
    
    for (const tag of [...recentTags, ...popularTags]) {
      if (!seen.has(tag.name) && recommendations.length < 10) {
        recommendations.push({
          id: tag.id || tag.name,
          name: tag.name,
          color: tag.color || undefined,
          usageCount: tag.usageCount || 0,
          category: 'recommended',
          isNew: false,
        });
        seen.add(tag.name);
      }
    }
    
    return recommendations;
  }
}
