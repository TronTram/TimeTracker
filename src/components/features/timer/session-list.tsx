// List component for displaying session history
'use client';

import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { SessionWithProject } from '@/types/session';
import { SessionCard } from './session-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface SessionListProps {
  sessions: SessionWithProject[];
  loading?: boolean;
  error?: string | null;
  selectedSessions?: string[];
  onSessionSelect?: (sessionId: string) => void;
  onSessionUnselect?: (sessionId: string) => void;
  onSessionEdit?: (session: SessionWithProject) => void;
  onSessionDelete?: (sessionId: string) => void;
  onSessionDuplicate?: (sessionId: string) => void;
  onBulkDelete?: (sessionIds: string[]) => void;
  showBulkActions?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  groupBy?: 'date' | 'project' | 'type' | 'none';
  compactView?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface GroupedSessions {
  [key: string]: SessionWithProject[];
}

export function SessionList({
  sessions,
  loading = false,
  error = null,
  selectedSessions = [],
  onSessionSelect,
  onSessionUnselect,
  onSessionEdit,
  onSessionDelete,
  onSessionDuplicate,
  onBulkDelete,
  showBulkActions = false,
  showSearch = true,
  showFilters = true,
  groupBy = 'date',
  compactView = false,
  onLoadMore,
  hasMore = false,
}: SessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter and group sessions
  const { filteredSessions, groupedSessions } = useMemo(() => {
    // Apply search filter
    let filtered = sessions;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sessions.filter(session =>
        session.description?.toLowerCase().includes(query) ||
        session.project?.name?.toLowerCase().includes(query) ||
        session.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Group sessions
    const grouped: GroupedSessions = {};
    
    if (groupBy === 'none') {
      grouped['All Sessions'] = filtered;
    } else {
      filtered.forEach(session => {
        let groupKey: string;
        
        switch (groupBy) {
          case 'date':
            const date = session.startTime;
            if (isToday(date)) {
              groupKey = 'Today';
            } else if (isYesterday(date)) {
              groupKey = 'Yesterday';
            } else {
              groupKey = format(date, 'EEEE, MMMM d, yyyy');
            }
            break;
          case 'project':
            groupKey = session.project?.name || 'No Project';
            break;
          case 'type':
            groupKey = session.sessionType.replace('_', ' ').toLowerCase();
            groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
            break;
          default:
            groupKey = 'All Sessions';
        }

        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey]!.push(session);
      });
    }

    return { filteredSessions: filtered, groupedSessions: grouped };
  }, [sessions, searchQuery, groupBy]);

  // Handle group expansion
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle session selection
  const handleSessionToggle = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      onSessionUnselect?.(sessionId);
    } else {
      onSessionSelect?.(sessionId);
    }
  };

  // Handle select all in group
  const handleSelectGroupSessions = (sessions: SessionWithProject[], checked: boolean) => {
    sessions.forEach(session => {
      if (checked && !selectedSessions.includes(session.id)) {
        onSessionSelect?.(session.id);
      } else if (!checked && selectedSessions.includes(session.id)) {
        onSessionUnselect?.(session.id);
      }
    });
  };

  // Calculate group stats
  const getGroupStats = (sessions: SessionWithProject[]) => {
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const completedSessions = sessions.filter(s => s.endTime).length;
    
    return {
      count: sessions.length,
      totalTime,
      completedSessions,
      avgDuration: sessions.length > 0 ? totalTime / sessions.length : 0,
    };
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      {(showSearch || showFilters || showBulkActions) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              {showSearch && (
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {showFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                )}

                {showBulkActions && selectedSessions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDelete?.(selectedSessions)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedSessions.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Results summary */}
            {searchQuery && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Found {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions grouped */}
      <div className="space-y-4">
        {loading && sessions.length === 0 ? (
          // Loading skeletons
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedSessions).length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No sessions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms.' : 'Start tracking your time to see sessions here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          // Sessions list
          Object.entries(groupedSessions).map(([groupKey, groupSessions]) => {
            const stats = getGroupStats(groupSessions);
            const isExpanded = expandedGroups.has(groupKey) || groupBy === 'none';
            const allSelected = groupSessions.every(s => selectedSessions.includes(s.id));
            const someSelected = groupSessions.some(s => selectedSessions.includes(s.id));

            return (
              <Card key={groupKey}>
                {groupBy !== 'none' && (
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {showBulkActions && (
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => 
                              handleSelectGroupSessions(groupSessions, e.target.checked)
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroup(groupKey)}
                          className="p-0 h-auto"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 mr-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-2" />
                          )}
                          <CardTitle className="text-left">{groupKey}</CardTitle>
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Badge variant="secondary">
                          {stats.count} session{stats.count !== 1 ? 's' : ''}
                        </Badge>
                        <span>{formatDuration(stats.totalTime)}</span>
                      </div>
                    </div>
                  </CardHeader>
                )}

                {isExpanded && (
                  <CardContent className={groupBy !== 'none' ? 'pt-0' : 'p-4'}>
                    <div className={`space-y-${compactView ? '2' : '3'}`}>
                      {groupSessions.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          selected={selectedSessions.includes(session.id)}
                          onSelect={() => handleSessionToggle(session.id)}
                          onEdit={() => onSessionEdit?.(session)}
                          onDelete={() => onSessionDelete?.(session.id)}
                          onDuplicate={() => onSessionDuplicate?.(session.id)}
                          compact={compactView}
                          showSelection={showBulkActions}
                        />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
