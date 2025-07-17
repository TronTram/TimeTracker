'use client';

import { useState } from 'react';
import { AchievementCard } from './achievement-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Trophy, Lock, Unlock } from 'lucide-react';
import type { 
  AchievementWithProgress,
  AchievementFilter,
  AchievementSort,
  AchievementCategory 
} from '@/types/achievement';

interface AchievementGridProps {
  achievements: AchievementWithProgress[];
  isLoading?: boolean;
  onMarkAsSeen?: (achievementId: string) => void;
}

export function AchievementGrid({ 
  achievements, 
  isLoading = false,
  onMarkAsSeen 
}: AchievementGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<AchievementFilter>('all');
  const [sortBy, setSortBy] = useState<AchievementSort>('category');
  const [showFilters, setShowFilters] = useState(false);

  // Filter achievements based on search and filters
  const filteredAchievements = achievements.filter(achievement => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      achievement.achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.achievement.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Category/status filter
    let matchesFilter = true;
    if (filterBy === 'unlocked') {
      matchesFilter = achievement.isUnlocked;
    } else if (filterBy === 'locked') {
      matchesFilter = !achievement.isUnlocked;
    } else if (filterBy !== 'all') {
      matchesFilter = achievement.achievement.category.toLowerCase() === filterBy.toLowerCase();
    }

    return matchesSearch && matchesFilter;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.achievement.title.localeCompare(b.achievement.title);
      case 'progress':
        return b.progressPercentage - a.progressPercentage;
      case 'unlocked-date':
        if (!a.unlockedAt && !b.unlockedAt) return 0;
        if (!a.unlockedAt) return 1;
        if (!b.unlockedAt) return -1;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      case 'category':
      default:
        const categoryCompare = a.achievement.category.localeCompare(b.achievement.category);
        if (categoryCompare !== 0) return categoryCompare;
        return a.achievement.title.localeCompare(b.achievement.title);
    }
  });

  // Group achievements by category for category view
  const groupedAchievements = sortedAchievements.reduce((groups, achievement) => {
    const category = achievement.achievement.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {} as Record<string, AchievementWithProgress[]>);

  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const progressPercentage = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Achievements
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {unlockedCount} of {totalAchievements} unlocked ({progressPercentage.toFixed(0)}%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Unlock className="h-3 w-3" />
            {unlockedCount} Unlocked
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {totalAchievements - unlockedCount} Locked
          </Badge>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by:</label>
              <Select value={filterBy} onValueChange={(value: string) => setFilterBy(value as AchievementFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unlocked">Unlocked</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="TIME">Time</SelectItem>
                  <SelectItem value="STREAK">Streak</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="FOCUS">Focus</SelectItem>
                  <SelectItem value="SPECIAL">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as AchievementSort)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="unlocked-date">Unlock Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Achievement grid */}
      {sortBy === 'category' ? (
        // Grouped by category
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold capitalize">{category.toLowerCase()}</h3>
                <Badge variant="secondary">
                  {categoryAchievements.filter(a => a.isUnlocked).length} / {categoryAchievements.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.achievement.id}
                    achievement={achievement}
                    onMarkAsSeen={onMarkAsSeen}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Simple grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.achievement.id}
              achievement={achievement}
              onMarkAsSeen={onMarkAsSeen}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {sortedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No achievements found
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start using the timer to unlock achievements!'
            }
          </p>
        </div>
      )}
    </div>
  );
}
