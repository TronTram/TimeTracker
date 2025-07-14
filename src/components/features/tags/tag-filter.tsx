// Filter component for sessions by tags
'use client';

import React, { useState, useCallback } from 'react';
import { 
  Filter, 
  X, 
  Hash, 
  ChevronDown, 
  Check,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTags } from '@/hooks/use-tags';
import { TagService } from '@/services/tag-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import type { TagWithStats } from '@/types/tag';
import type { SessionFilters } from '@/types/session';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onFiltersChange?: (filters: Partial<SessionFilters>) => void;
  className?: string;
  maxSelectedTags?: number;
  showSearch?: boolean;
  showQuickFilters?: boolean;
  compact?: boolean;
}

export function TagFilter({
  selectedTags,
  onTagsChange,
  onFiltersChange,
  className,
  maxSelectedTags = 10,
  showSearch = true,
  showQuickFilters = true,
  compact = false,
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tags
  const { tags, mostUsedTags, recentlyUsedTags } = useTags();

  // Filter tags based on search
  const filteredTags = React.useMemo(() => {
    let filtered = tags;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(term)
      );
    }

    // Remove already selected tags
    filtered = filtered.filter(tag => !selectedTags.includes(tag.name));

    return filtered.slice(0, 20); // Limit to 20 results
  }, [tags, searchTerm, selectedTags]);

  // Handle tag selection
  const handleTagSelect = useCallback((tagName: string) => {
    if (selectedTags.includes(tagName)) return;
    
    if (selectedTags.length >= maxSelectedTags) return;

    const newTags = [...selectedTags, tagName];
    onTagsChange(newTags);
    
    // Update session filters if handler provided
    if (onFiltersChange) {
      onFiltersChange({ tags: newTags });
    }
    
    setSearchTerm('');
  }, [selectedTags, onTagsChange, onFiltersChange, maxSelectedTags]);

  // Handle tag removal
  const handleTagRemove = useCallback((tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName);
    onTagsChange(newTags);
    
    // Update session filters if handler provided
    if (onFiltersChange) {
      onFiltersChange({ tags: newTags });
    }
  }, [selectedTags, onTagsChange, onFiltersChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onTagsChange([]);
    if (onFiltersChange) {
      onFiltersChange({ tags: [] });
    }
  }, [onTagsChange, onFiltersChange]);

  // Quick filter options
  const quickFilters = React.useMemo(() => [
    {
      label: 'Most Used',
      tags: mostUsedTags.slice(0, 5).map(tag => tag.name),
    },
    {
      label: 'Recent',
      tags: recentlyUsedTags.slice(0, 5).map(tag => tag.name),
    },
  ], [mostUsedTags, recentlyUsedTags]);

  // Apply quick filter
  const handleQuickFilter = useCallback((tags: string[]) => {
    const newTags = Array.from(new Set([...selectedTags, ...tags])).slice(0, maxSelectedTags);
    onTagsChange(newTags);
    
    if (onFiltersChange) {
      onFiltersChange({ tags: newTags });
    }
  }, [selectedTags, onTagsChange, onFiltersChange, maxSelectedTags]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Filter by tags:
          </span>
          {selectedTags.map((tagName) => (
            <SelectedTagChip
              key={tagName}
              tagName={tagName}
              onRemove={() => handleTagRemove(tagName)}
              color={TagService.getTagColor(tagName, tags)}
            />
          ))}
          {selectedTags.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Tag selector dropdown */}
        <div className="relative flex-1">
          <Dropdown
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={selectedTags.length >= maxSelectedTags}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>
                    {selectedTags.length === 0 
                      ? 'Filter by tags...' 
                      : `${selectedTags.length} tag(s) selected`
                    }
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            }
          >
            <div className="w-80 p-2">
              {/* Search input */}
              {showSearch && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Quick filters */}
              {showQuickFilters && !searchTerm && (
                <div className="mb-3 space-y-2">
                  {quickFilters.map((filter) => (
                    <div key={filter.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {filter.label}
                        </span>
                        {filter.tags.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickFilter(filter.tags)}
                            className="h-5 px-2 text-xs"
                          >
                            Add all
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filter.tags.map((tagName) => (
                          <button
                            key={tagName}
                            onClick={() => handleTagSelect(tagName)}
                            disabled={selectedTags.includes(tagName)}
                            className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            #{TagService.formatTagName(tagName)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {quickFilters.some(f => f.tags.length > 0) && (
                    <hr className="my-2" />
                  )}
                </div>
              )}

              {/* Tag list */}
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {searchTerm ? 'No matching tags found' : 'No tags available'}
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <TagOption
                      key={tag.id}
                      tag={tag}
                      onClick={() => handleTagSelect(tag.name)}
                      disabled={selectedTags.includes(tag.name)}
                    />
                  ))
                )}
              </div>

              {/* Max tags warning */}
              {selectedTags.length >= maxSelectedTags && (
                <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                  Maximum {maxSelectedTags} tags can be selected
                </div>
              )}
            </div>
          </Dropdown>
        </div>

        {/* Additional filter controls can be added here */}
      </div>
    </div>
  );
}

// Selected tag chip component
interface SelectedTagChipProps {
  tagName: string;
  onRemove: () => void;
  color?: string;
}

function SelectedTagChip({ tagName, onRemove, color }: SelectedTagChipProps) {
  const displayName = TagService.formatTagName(tagName);

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1 pr-1"
      style={color ? { backgroundColor: `${color}20`, color: color } : undefined}
    >
      <Hash className="h-3 w-3" />
      <span>{displayName}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// Tag option component
interface TagOptionProps {
  tag: TagWithStats;
  onClick: () => void;
  disabled: boolean;
}

function TagOption({ tag, onClick, disabled }: TagOptionProps) {
  const displayName = TagService.formatTagName(tag.name);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {tag.color && (
          <div
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: tag.color }}
          />
        )}
        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {tag.usageCount! > 0 && (
          <span className="text-xs text-muted-foreground">
            {tag.usageCount}
          </span>
        )}
        {disabled && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    </button>
  );
}

export default TagFilter;
