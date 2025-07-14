'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { useProjectStore } from '@/stores/project-store';
import type { ProjectFilters } from '@/types/project';
import { 
  Search, 
  Filter, 
  X, 
  SortAsc, 
  SortDesc,
  Archive,
  Palette,
  Calendar,
  Clock,
  ChevronDown
} from 'lucide-react';

interface ProjectSearchProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  resultCount?: number;
  className?: string;
}

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name', icon: SortAsc },
  { value: 'createdAt', label: 'Created Date', icon: Calendar },
  { value: 'updatedAt', label: 'Updated Date', icon: Calendar },
  { value: 'totalTime', label: 'Total Time', icon: Clock },
];

export function ProjectSearch({
  filters,
  onFiltersChange,
  resultCount,
  className,
}: ProjectSearchProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { clearProjectFilters } = useProjectStore();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchValue || undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchValue('');
    searchInputRef.current?.focus();
  };

  // Handle sort change
  const handleSortChange = (sortBy: string) => {
    const newSortOrder = 
      filters.sortBy === sortBy && filters.sortOrder === 'asc' 
        ? 'desc' 
        : 'asc';
    
    onFiltersChange({
      ...filters,
      sortBy: sortBy as any,
      sortOrder: newSortOrder,
    });
  };

  // Handle archive filter toggle
  const handleArchiveFilter = () => {
    onFiltersChange({
      ...filters,
      isArchived: filters.isArchived === undefined ? false : 
                  filters.isArchived === false ? true : undefined,
    });
  };

  // Handle color filter toggle
  const handleColorFilter = (color: string) => {
    const currentColors = filters.colorFilter || [];
    const isSelected = currentColors.includes(color);
    
    const newColorFilter = isSelected
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    
    onFiltersChange({
      ...filters,
      colorFilter: newColorFilter.length > 0 ? newColorFilter : undefined,
    });
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchValue('');
    clearProjectFilters();
    onFiltersChange({});
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.isArchived !== undefined) count++;
    if (filters.colorFilter?.length) count++;
    if (filters.sortBy && filters.sortBy !== 'name') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  // Get archive filter label
  const getArchiveFilterLabel = () => {
    if (filters.isArchived === true) return 'Archived Only';
    if (filters.isArchived === false) return 'Active Only';
    return 'All Projects';
  };

  // Get sort option info
  const currentSortOption = SORT_OPTIONS.find(option => option.value === filters.sortBy);
  const SortIcon = filters.sortOrder === 'desc' ? SortDesc : SortAsc;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search projects..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Dropdown */}
        <Dropdown
          trigger={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-2',
                hasActiveFilters && 'border-blue-500 bg-blue-50'
              )}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          }
          align="start"
        >
          {/* Archive Filter */}
          <DropdownItem onClick={handleArchiveFilter}>
            <Archive className="w-4 h-4 mr-2" />
            {getArchiveFilterLabel()}
          </DropdownItem>

          <DropdownSeparator />

          {/* Color Filters */}
          <div className="px-2 py-1">
            <span className="text-sm font-medium text-gray-700 mb-2 block">Colors</span>
            <div className="grid grid-cols-5 gap-1">
              {PROJECT_COLORS.map((color) => {
                const isSelected = filters.colorFilter?.includes(color);
                return (
                  <button
                    key={color}
                    onClick={() => handleColorFilter(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                      isSelected 
                        ? 'border-gray-900 ring-2 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    style={{ backgroundColor: color }}
                    title={`Filter by ${color}`}
                  />
                );
              })}
            </div>
          </div>
        </Dropdown>

        {/* Sort Dropdown */}
        <Dropdown
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <SortIcon className="w-4 h-4" />
              {currentSortOption?.label || 'Sort'}
              <ChevronDown className="w-3 h-3" />
            </Button>
          }
          align="start"
        >
          {SORT_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isActive = filters.sortBy === option.value;
            
            return (
              <DropdownItem
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={cn(isActive && 'bg-blue-50')}
              >
                <OptionIcon className="w-4 h-4 mr-2" />
                {option.label}
                {isActive && (
                  <SortIcon className="w-3 h-3 ml-auto" />
                )}
              </DropdownItem>
            );
          })}
        </Dropdown>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Result Count */}
        {typeof resultCount === 'number' && (
          <span className="text-sm text-gray-500 ml-auto">
            {resultCount} {resultCount === 1 ? 'project' : 'projects'}
          </span>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {/* Search Tag */}
          {filters.search && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1"
            >
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="p-0 h-auto ml-1 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Archive Tag */}
          {filters.isArchived !== undefined && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1"
            >
              <Archive className="w-3 h-3" />
              {getArchiveFilterLabel()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, isArchived: undefined })}
                className="p-0 h-auto ml-1 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {/* Color Tags */}
          {filters.colorFilter?.map((color) => (
            <Badge
              key={color}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
              Color
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleColorFilter(color)}
                className="p-0 h-auto ml-1 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
