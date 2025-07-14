// Tag validation and normalization utilities
import type { TagValidationRules, TagFormData } from '@/types/tag';

// Default validation rules
export const DEFAULT_TAG_RULES: TagValidationRules = {
  maxNameLength: 30,
  minNameLength: 1,
  maxTagsPerSession: 10,
  allowedCharacters: /^[a-zA-Z0-9\s\-_#@&]+$/,
  reservedNames: ['all', 'none', 'null', 'undefined', 'admin', 'system'],
  caseSensitive: false,
  allowDuplicates: false,
};

/**
 * Normalize tag name for consistency
 */
export function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-_#@&]/g, '') // Remove invalid characters
    .substring(0, DEFAULT_TAG_RULES.maxNameLength);
}

/**
 * Validate a single tag name
 */
export function validateTagName(name: string, rules: TagValidationRules = DEFAULT_TAG_RULES): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmedName = name.trim();

  // Check length
  if (trimmedName.length < rules.minNameLength) {
    errors.push(`Tag name must be at least ${rules.minNameLength} character(s)`);
  }
  
  if (trimmedName.length > rules.maxNameLength) {
    errors.push(`Tag name must be no more than ${rules.maxNameLength} characters`);
  }

  // Check characters
  if (!rules.allowedCharacters.test(trimmedName)) {
    errors.push('Tag name contains invalid characters');
  }

  // Check reserved names
  const normalizedName = rules.caseSensitive ? trimmedName : trimmedName.toLowerCase();
  if (rules.reservedNames.includes(normalizedName)) {
    errors.push('This tag name is reserved and cannot be used');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an array of tag names
 */
export function validateTags(tags: string[], rules: TagValidationRules = DEFAULT_TAG_RULES): {
  isValid: boolean;
  errors: string[];
  validTags: string[];
  invalidTags: Array<{ tag: string; errors: string[] }>;
} {
  const errors: string[] = [];
  const validTags: string[] = [];
  const invalidTags: Array<{ tag: string; errors: string[] }> = [];

  // Check max tags limit
  if (tags.length > rules.maxTagsPerSession) {
    errors.push(`Cannot have more than ${rules.maxTagsPerSession} tags per session`);
  }

  // Validate each tag
  const normalizedTags = new Set<string>();
  
  for (const tag of tags) {
    const validation = validateTagName(tag, rules);
    const normalizedTag = rules.caseSensitive ? tag.trim() : normalizeTagName(tag);

    if (!validation.isValid) {
      invalidTags.push({ tag, errors: validation.errors });
    } else {
      // Check for duplicates if not allowed
      if (!rules.allowDuplicates && normalizedTags.has(normalizedTag)) {
        invalidTags.push({ tag, errors: ['Duplicate tag'] });
      } else {
        validTags.push(tag.trim());
        normalizedTags.add(normalizedTag);
      }
    }
  }

  return {
    isValid: errors.length === 0 && invalidTags.length === 0,
    errors,
    validTags,
    invalidTags,
  };
}

/**
 * Clean and deduplicate tag array
 */
export function cleanTags(tags: string[], rules: TagValidationRules = DEFAULT_TAG_RULES): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;

    const normalized = rules.caseSensitive ? trimmed : normalizeTagName(trimmed);
    const validation = validateTagName(trimmed, rules);

    if (validation.isValid && !seen.has(normalized)) {
      cleaned.push(trimmed);
      seen.add(normalized);
    }
  }

  return cleaned;
}

/**
 * Extract potential tags from text
 */
export function extractTagsFromText(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const mentions = /@(\w+)/g;
  const tags: string[] = [];

  // Extract hashtags
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    if (match[1]) {
      tags.push(match[1]);
    }
  }

  // Extract mentions
  while ((match = mentions.exec(text)) !== null) {
    if (match[1]) {
      tags.push(match[1]);
    }
  }

  return cleanTags(tags);
}

/**
 * Generate tag color based on name
 */
export function generateTagColor(name: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#84cc16', // lime
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? colors[0] ?? '#3b82f6';
}

/**
 * Sort tags by various criteria
 */
export function sortTags(
  tags: string[],
  sortBy: 'alphabetical' | 'length' | 'frequency' = 'alphabetical',
  tagFrequency?: Record<string, number>
): string[] {
  return [...tags].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.toLowerCase().localeCompare(b.toLowerCase());
      
      case 'length':
        return a.length - b.length;
      
      case 'frequency':
        if (!tagFrequency) return 0;
        return (tagFrequency[b] || 0) - (tagFrequency[a] || 0);
      
      default:
        return 0;
    }
  });
}

/**
 * Find similar tags using fuzzy matching
 */
export function findSimilarTags(
  query: string,
  tags: string[],
  threshold: number = 0.6
): Array<{ tag: string; similarity: number }> {
  const queryLower = query.toLowerCase();
  const results: Array<{ tag: string; similarity: number }> = [];

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    const similarity = calculateSimilarity(queryLower, tagLower);
    
    if (similarity >= threshold) {
      results.push({ tag, similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0]![j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,     // deletion
        matrix[i]![j - 1]! + 1,     // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1]![len2]!) / maxLen;
}

/**
 * Suggest tags based on context
 */
export function suggestTagsFromContext(
  description: string,
  projectName?: string,
  existingTags: string[] = []
): string[] {
  const suggestions: string[] = [];
  const text = `${description} ${projectName || ''}`.toLowerCase();

  // Common work-related keywords and their suggested tags
  const contextMappings: Record<string, string[]> = {
    'meeting': ['meeting', 'discussion', 'collaboration'],
    'email': ['email', 'communication', 'admin'],
    'code': ['coding', 'development', 'programming'],
    'bug': ['debugging', 'bug-fix', 'troubleshooting'],
    'design': ['design', 'ui', 'creative'],
    'research': ['research', 'learning', 'analysis'],
    'planning': ['planning', 'strategy', 'organization'],
    'review': ['review', 'feedback', 'quality-assurance'],
    'test': ['testing', 'qa', 'validation'],
    'documentation': ['docs', 'writing', 'documentation'],
    'deploy': ['deployment', 'release', 'production'],
    'fix': ['fix', 'maintenance', 'support'],
  };

  // Check for keyword matches
  for (const [keyword, tags] of Object.entries(contextMappings)) {
    if (text.includes(keyword)) {
      suggestions.push(...tags);
    }
  }

  // Remove duplicates and already existing tags
  const uniqueSuggestions = [...new Set(suggestions)].filter(
    tag => !existingTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  );

  return uniqueSuggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Check if tag name conflicts with existing tags
 */
export function checkTagConflicts(
  newTag: string,
  existingTags: string[],
  caseSensitive: boolean = false
): { hasConflict: boolean; conflictingTag?: string; suggestions: string[] } {
  const normalizedNew = caseSensitive ? newTag : newTag.toLowerCase();
  const normalizedExisting = existingTags.map(tag => 
    caseSensitive ? tag : tag.toLowerCase()
  );

  const conflictIndex = normalizedExisting.indexOf(normalizedNew);
  
  if (conflictIndex !== -1) {
    return {
      hasConflict: true,
      conflictingTag: existingTags[conflictIndex],
      suggestions: [],
    };
  }

  // Find similar tags as suggestions
  const similarTags = findSimilarTags(newTag, existingTags, 0.7);
  
  return {
    hasConflict: false,
    suggestions: similarTags.map(item => item.tag).slice(0, 3),
  };
}
