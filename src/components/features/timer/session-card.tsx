// Individual session display with edit/delete actions
'use client';

import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { SessionWithProject } from '@/types/session';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  Tag, 
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Square,
  CheckCircle
} from 'lucide-react';

interface SessionCardProps {
  session: SessionWithProject;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  compact?: boolean;
  showSelection?: boolean;
  showActions?: boolean;
}

export function SessionCard({
  session,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  compact = false,
  showSelection = false,
  showActions = true,
}: SessionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get session type display
  const getSessionTypeDisplay = (type: string) => {
    switch (type) {
      case 'FOCUS':
        return { label: 'Focus', icon: Play, variant: 'default' as const };
      case 'SHORT_BREAK':
        return { label: 'Short Break', icon: Pause, variant: 'secondary' as const };
      case 'LONG_BREAK':
        return { label: 'Long Break', icon: Square, variant: 'outline' as const };
      default:
        return { label: type, icon: Clock, variant: 'default' as const };
    }
  };

  const sessionTypeInfo = getSessionTypeDisplay(session.sessionType);
  const SessionTypeIcon = sessionTypeInfo.icon;

  return (
    <Card className={`transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'hover:shadow-md'}`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {showSelection && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onSelect}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
              
              <Badge variant={sessionTypeInfo.variant} className="flex items-center gap-1">
                <SessionTypeIcon className="h-3 w-3" />
                {sessionTypeInfo.label}
              </Badge>
              
              {session.endTime && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>

            {/* Description */}
            <h3 className={`font-medium text-gray-900 dark:text-gray-100 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {session.description || 'Untitled Session'}
            </h3>

            {/* Project */}
            {session.project && (
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: session.project.color || '#6B7280' }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {session.project.name}
                </span>
              </div>
            )}

            {/* Time info */}
            <div className={`flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : ''}`}>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.duration)}
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(session.startTime, 'MMM d, h:mm a')}
              </div>
              
              {session.endTime && (
                <span>
                  - {format(session.endTime, 'h:mm a')}
                </span>
              )}
            </div>

            {/* Tags */}
            {session.tags && session.tags.length > 0 && !compact && (
              <div className="flex items-center gap-1 mt-2">
                <Tag className="h-3 w-3 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {session.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {session.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{session.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  <div className="py-1">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Session
                      </button>
                    )}
                    
                    {onDuplicate && (
                      <button
                        onClick={() => {
                          onDuplicate();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
