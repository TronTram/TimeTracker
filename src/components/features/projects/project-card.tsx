'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { getContrastingTextColor, createColorVariations } from '@/lib/color-utils';
import { useProjectStore, useProjectSelection } from '@/stores/project-store';
import type { ProjectWithStats } from '@/types/project';
import { 
  MoreHorizontal, 
  Edit, 
  Archive, 
  Trash2, 
  Copy, 
  Timer, 
  Calendar,
  ArchiveRestore,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: ProjectWithStats;
  onEdit?: (project: ProjectWithStats) => void;
  onDelete?: (project: ProjectWithStats) => void;
  onDuplicate?: (project: ProjectWithStats) => void;
  onToggleArchive?: (project: ProjectWithStats) => void;
  onSelect?: (project: ProjectWithStats) => void;
  showSelection?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleArchive,
  onSelect,
  showSelection = false,
  className,
  variant = 'default',
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setSelectedProject } = useProjectStore();
  const { selectedProjects, toggleSelection } = useProjectSelection();
  
  const isSelected = selectedProjects.includes(project.id);
  const colorVariations = createColorVariations(project.color);
  const textColor = getContrastingTextColor(project.color);

  // Calculate statistics
  const totalSessions = project._count?.timeSessions || 0;
  const totalTime = project.stats?.totalTime || 0;
  const lastSessionDate = project.stats?.lastSessionDate;

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Handle card click
  const handleCardClick = () => {
    if (showSelection) {
      toggleSelection(project.id);
    } else {
      onSelect?.(project);
      setSelectedProject(project);
    }
  };

  // Handle selection checkbox
  const handleSelectionChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(project.id);
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 border rounded-lg transition-all',
          'hover:border-gray-300 hover:shadow-sm cursor-pointer',
          isSelected && 'border-blue-500 bg-blue-50',
          project.isArchived && 'opacity-60',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleSelectionChange}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isSelected ? (
                <Check className="w-4 h-4 text-blue-600" />
              ) : (
                <div className="w-4 h-4 border border-gray-300 rounded" />
              )}
            </button>
          </div>
        )}

        {/* Project Color */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
          style={{ backgroundColor: project.color }}
        />

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">
              {project.name}
            </h3>
            {project.isArchived && (
              <Badge variant="secondary" size="sm">
                Archived
              </Badge>
            )}
          </div>
          
          {project.description && (
            <p className="text-sm text-gray-500 truncate">
              {project.description}
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{totalSessions}</span>
            <span>sessions</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            }
            align="end"
          >
            <DropdownItem onClick={() => onEdit?.(project)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownItem>
            <DropdownItem onClick={() => onDuplicate?.(project)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => onToggleArchive?.(project)}>
              {project.isArchived ? (
                <ArchiveRestore className="w-4 h-4 mr-2" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              {project.isArchived ? 'Unarchive' : 'Archive'}
            </DropdownItem>
            <DropdownItem 
              onClick={() => onDelete?.(project)}
              destructive
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all cursor-pointer',
        'hover:shadow-md hover:border-gray-300',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        project.isArchived && 'opacity-60',
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            onClick={handleSelectionChange}
            className={cn(
              'p-1 rounded transition-opacity',
              isSelected || isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            {isSelected ? (
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white" />
            )}
          </button>
        </div>
      )}

      {/* Project Header */}
      <div
        className="h-20 relative"
        style={{
          background: `linear-gradient(135deg, ${project.color} 0%, ${colorVariations.dark} 100%)`
        }}
      >
        {/* Header Actions */}
        <div className="absolute top-3 right-3">
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'p-1 h-auto transition-opacity text-white hover:bg-white/20',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
                style={{ color: textColor }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            }
            align="end"
          >
            <DropdownItem onClick={() => onEdit?.(project)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownItem>
            <DropdownItem onClick={() => onDuplicate?.(project)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => onToggleArchive?.(project)}>
              {project.isArchived ? (
                <ArchiveRestore className="w-4 h-4 mr-2" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              {project.isArchived ? 'Unarchive' : 'Archive'}
            </DropdownItem>
            <DropdownItem 
              onClick={() => onDelete?.(project)}
              destructive
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownItem>
          </Dropdown>
        </div>

        {/* Archived Badge */}
        {project.isArchived && (
          <div className="absolute bottom-3 left-3">
            <Badge 
              variant="secondary" 
              className="bg-white/90 text-gray-700"
            >
              Archived
            </Badge>
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-4">
        {/* Project Name & Description */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-2">
          {/* Time & Sessions */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Timer className="w-4 h-4" />
              <span>Total Time</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatTime(totalTime)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Sessions</span>
            </div>
            <span className="font-medium text-gray-900">
              {totalSessions}
            </span>
          </div>

          {/* Last Session */}
          {lastSessionDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Session</span>
              <span className="text-gray-500">
                {formatDistanceToNow(lastSessionDate, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (if applicable) */}
        {totalTime > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ 
                  backgroundColor: project.color,
                  width: `${Math.min(100, (totalTime / 3600) * 10)}%` // Example calculation
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
