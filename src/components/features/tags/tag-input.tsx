// Tag input component with autocomplete and creation
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTagAutocomplete } from '@/hooks/use-tags';
import { TagService } from '@/services/tag-service';
import type { TagInputProps, TagSuggestion } from '@/types/tag';

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  allowCreate = true,
  suggestions: externalSuggestions,
  disabled = false,
  error,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use autocomplete hook
  const {
    suggestions: autoSuggestions,
    loading: suggestionsLoading,
    updateQuery,
  } = useTagAutocomplete({
    maxSuggestions: 8,
    includePopular: true,
    includeContextual: false,
  });

  // Use external suggestions if provided, otherwise use autocomplete
  const suggestions = externalSuggestions || autoSuggestions;

  // Filter out already selected tags
  const filteredSuggestions = suggestions.filter(
    suggestion => !value.includes(suggestion.name)
  );

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    updateQuery(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  }, [updateQuery]);

  // Handle tag addition
  const addTag = useCallback((tagName: string) => {
    if (!tagName.trim() || value.includes(tagName) || value.length >= maxTags) {
      return;
    }

    const normalizedTag = TagService.normalizeTagInput([tagName])[0];
    if (normalizedTag) {
      const validation = TagService.validateAndCleanTags([normalizedTag]);
      if (validation.valid.length > 0 && validation.valid[0]) {
        onChange([...value, validation.valid[0]]);
        setInputValue('');
        updateQuery('');
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
  }, [value, onChange, maxTags, updateQuery]);

  // Handle tag removal
  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
          addTag(filteredSuggestions[focusedIndex].name);
        } else if (inputValue.trim() && allowCreate) {
          addTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;

      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          const lastTag = value[value.length - 1];
          if (lastTag) {
            removeTag(lastTag);
          }
        }
        break;

      case 'Tab':
        if (isOpen && focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
          e.preventDefault();
          addTag(filteredSuggestions[focusedIndex].name);
        }
        break;

      case ',':
      case ';':
        e.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;
    }
  }, [
    disabled,
    focusedIndex,
    filteredSuggestions,
    inputValue,
    allowCreate,
    addTag,
    isOpen,
    value,
    removeTag,
  ]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: TagSuggestion) => {
    addTag(suggestion.name);
  }, [addTag]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get tag color
  const getTagColor = useCallback((tagName: string) => {
    return TagService.getTagColor(tagName);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Main input container */}
      <div
        className={cn(
          'flex min-h-[2.5rem] w-full flex-wrap gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive focus-within:ring-destructive'
        )}
      >
        {/* Existing tags */}
        {value.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            color={getTagColor(tag)}
            onRemove={() => removeTag(tag)}
            disabled={disabled}
          />
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || value.length >= maxTags}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />

        {/* Tag count indicator */}
        {maxTags > 0 && (
          <span className="text-xs text-muted-foreground self-center">
            {value.length}/{maxTags}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && !disabled && (inputValue || filteredSuggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
          {suggestionsLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading suggestions...
            </div>
          )}

          {!suggestionsLoading && filteredSuggestions.length === 0 && inputValue && allowCreate && (
            <button
              onClick={() => addTag(inputValue)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create "{inputValue}"
            </button>
          )}

          {!suggestionsLoading && filteredSuggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              isActive={index === focusedIndex}
              onClick={() => handleSuggestionClick(suggestion)}
            />
          ))}

          {!suggestionsLoading && filteredSuggestions.length === 0 && !inputValue && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tag chip component
interface TagChipProps {
  tag: string;
  color?: string;
  onRemove: () => void;
  disabled?: boolean;
}

function TagChip({ tag, color, onRemove, disabled }: TagChipProps) {
  const displayName = TagService.formatTagName(tag);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
      style={color ? { backgroundColor: `${color}20`, color: color } : undefined}
    >
      <Hash className="h-3 w-3" />
      {displayName}
      {!disabled && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// Suggestion item component
interface SuggestionItemProps {
  suggestion: TagSuggestion;
  isActive: boolean;
  onClick: () => void;
}

function SuggestionItem({ suggestion, isActive, onClick }: SuggestionItemProps) {
  const displayName = TagService.formatTagName(suggestion.name);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-accent',
        isActive && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{displayName}</span>
        {suggestion.isNew && (
          <span className="text-xs text-muted-foreground bg-muted px-1 rounded">new</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {suggestion.usageCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {suggestion.usageCount}
          </span>
        )}
        {suggestion.color && (
          <div
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: suggestion.color }}
          />
        )}
      </div>
    </button>
  );
}

export default TagInput;
