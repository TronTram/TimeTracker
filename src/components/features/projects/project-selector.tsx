'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useProjectOptions } from '@/hooks/use-projects';
import { useProjectStore, useSelectedProject, useRecentProjects } from '@/stores/project-store';
import { getContrastingTextColor } from '@/lib/color-utils';
import { ChevronDown, Check, Plus, Search, Clock, Archive } from 'lucide-react';
import type { ProjectSelectOption } from '@/types/project';
import { Project } from '@prisma/client';

interface ProjectSelectorProps {
  value?: string | null;
  onChange: (projectId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  includeArchived?: boolean;
  showRecentProjects?: boolean;
  onCreateNew?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProjectSelector({
  value,
  onChange,
  placeholder = 'Select a project',
  disabled = false,
  allowClear = true,
  includeArchived = false,
  showRecentProjects = true,
  onCreateNew,
  className,
  size = 'md',
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { options, loading, error } = useProjectOptions(includeArchived);
  const selectedProject = useSelectedProject();
  const recentProjects = useRecentProjects();
  const { setSelectedProject } = useProjectStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.isArchived && searchTerm.toLowerCase().includes('archived'))
  );

  // Get recent project options (not archived, limit 3)
  const recentProjectOptions = showRecentProjects
    ? recentProjects
        .filter(project => !project.isArchived)
        .slice(0, 3)
        .map(project => ({
          value: project.id,
          label: project.name,
          color: project.color,
          isArchived: project.isArchived,
        }))
    : [];

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Handle option selection
  const handleSelect = (option: ProjectSelectOption) => {
    onChange(option.value);
    
    // Update store if this is a project selection
    const project = options.find(o => o.value === option.value);
    if (project) {
      // Convert option back to Project type (simplified)
      const projectData: Project = {
        id: project.value,
        name: project.label,
        color: project.color,
        isArchived: project.isArchived || false,
        description: null,
        userId: 'current-user', // This would come from auth
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSelectedProject(projectData);
    }
    
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSelectedProject(null);
  };

  // Handle create new project
  const handleCreateNew = () => {
    setIsOpen(false);
    setSearchTerm('');
    onCreateNew?.();
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'relative w-full border border-gray-300 rounded-md bg-white text-left cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'hover:border-gray-400 transition-colors',
          sizeClasses[size]
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption ? (
              <>
                {/* Project Color Dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                  style={{ backgroundColor: selectedOption.color }}
                />
                
                {/* Project Name */}
                <span className="truncate text-gray-900">
                  {selectedOption.label}
                </span>
                
                {/* Archived Badge */}
                {selectedOption.isArchived && (
                  <Archive className="w-3 h-3 text-gray-400 flex-shrink-0" />
                )}
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Clear Button */}
            {allowClear && selectedOption && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
            
            {/* Dropdown Arrow */}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading projects...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-red-600">
              {error}
            </div>
          )}

          {/* Recent Projects */}
          {!loading && !error && recentProjectOptions.length > 0 && !searchTerm && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent Projects
              </div>
              {recentProjectOptions.map((option) => (
                <ProjectOption
                  key={`recent-${option.value}`}
                  option={option}
                  isSelected={option.value === value}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* All Projects */}
          {!loading && !error && (
            <div>
              {recentProjectOptions.length > 0 && !searchTerm && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                  All Projects
                </div>
              )}
              
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <ProjectOption
                    key={option.value}
                    option={option}
                    isSelected={option.value === value}
                    onSelect={handleSelect}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No projects found' : 'No projects available'}
                </div>
              )}
            </div>
          )}

          {/* Create New Project */}
          {onCreateNew && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create new project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Project Option Component
interface ProjectOptionProps {
  option: ProjectSelectOption;
  isSelected: boolean;
  onSelect: (option: ProjectSelectOption) => void;
}

function ProjectOption({ option, isSelected, onSelect }: ProjectOptionProps) {
  const textColor = getContrastingTextColor(option.color);
  
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={cn(
        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
        'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
        isSelected && 'bg-blue-50'
      )}
    >
      {/* Project Color */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
        style={{ backgroundColor: option.color }}
      />
      
      {/* Project Name */}
      <span className={cn('flex-1 truncate', isSelected && 'font-medium')}>
        {option.label}
      </span>
      
      {/* Archived Badge */}
      {option.isArchived && (
        <Archive className="w-3 h-3 text-gray-400 flex-shrink-0" />
      )}
      
      {/* Selected Check */}
      {isSelected && (
        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
      )}
    </button>
  );
}
