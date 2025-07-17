'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Lock, 
  Clock, 
  Target, 
  Flame,
  FolderPlus,
  Star,
  Calendar,
  Crown,
  Folders,
  Award,
  Moon,
  Sun,
  Timer,
  Brain,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AchievementWithProgress } from '@/types/achievement';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onMarkAsSeen?: (achievementId: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

// Icon mapping for achievement icons
const iconMap = {
  Trophy,
  Timer: Clock,
  Clock,
  Brain,
  Zap,
  Target,
  Star,
  Flame,
  Calendar,
  Crown,
  FolderPlus,
  Folders,
  Award,
  Moon,
  Sun,
  TimerIcon: Timer,
};

function getAchievementIcon(iconName: string) {
  const Icon = iconMap[iconName as keyof typeof iconMap] || Trophy;
  return Icon;
}

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case 'time':
      return 'bg-blue-500 text-blue-50';
    case 'streak':
      return 'bg-orange-500 text-orange-50';
    case 'project':
      return 'bg-green-500 text-green-50';
    case 'focus':
      return 'bg-purple-500 text-purple-50';
    case 'special':
      return 'bg-pink-500 text-pink-50';
    default:
      return 'bg-gray-500 text-gray-50';
  }
}

export function AchievementCard({ 
  achievement, 
  onMarkAsSeen, 
  showDetails = true,
  compact = false 
}: AchievementCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const Icon = getAchievementIcon(achievement.achievement.iconName);
  const categoryColor = getCategoryColor(achievement.achievement.category);

  const handleMarkAsSeen = () => {
    if (onMarkAsSeen) {
      onMarkAsSeen(achievement.achievement.id);
    }
  };

  if (compact) {
    return (
      <Card className={cn(
        'relative overflow-hidden transition-all duration-200',
        achievement.isUnlocked 
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800' 
          : 'hover:shadow-md'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              achievement.isUnlocked ? categoryColor : 'bg-gray-200 text-gray-500'
            )}>
              {achievement.isUnlocked ? (
                <Icon className="h-5 w-5" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-semibold text-sm',
                achievement.isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
              )}>
                {achievement.achievement.title}
              </h4>
              {!achievement.isUnlocked && (
                <div className="mt-1">
                  <Progress 
                    value={achievement.progressPercentage} 
                    className="h-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(achievement.progressPercentage)}% complete
                  </p>
                </div>
              )}
            </div>

            {achievement.isUnlocked && achievement.isRecentlyUnlocked && (
              <Badge variant="secondary" className="text-xs">
                New!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
      achievement.isUnlocked 
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800' 
        : 'hover:scale-105'
    )}>
      {/* Recently unlocked indicator */}
      {achievement.isUnlocked && achievement.isRecentlyUnlocked && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-xs animate-pulse">
            New!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
            achievement.isUnlocked 
              ? categoryColor 
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          )}>
            {achievement.isUnlocked ? (
              <Icon className="h-6 w-6" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>

          <div className="flex gap-1">
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                achievement.isUnlocked ? 'border-yellow-300 text-yellow-700' : ''
              )}
            >
              {achievement.achievement.category}
            </Badge>
            
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescription(!showDescription)}
                className="h-6 w-6 p-0"
              >
                {showDescription ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div>
          <CardTitle className={cn(
            'text-lg leading-tight',
            achievement.isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
          )}>
            {achievement.achievement.title}
          </CardTitle>
          
          {(showDescription || !showDetails) && (
            <CardDescription className="mt-1 text-sm">
              {achievement.achievement.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!achievement.isUnlocked && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">
                {achievement.progress} / {achievement.achievement.maxProgress}
              </span>
            </div>
            <Progress 
              value={achievement.progressPercentage} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 text-center">
              {Math.round(achievement.progressPercentage)}% complete
            </p>
          </div>
        )}

        {achievement.isUnlocked && achievement.unlockedAt && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            </div>
            
            {achievement.isRecentlyUnlocked && onMarkAsSeen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsSeen}
                className="w-full text-xs"
              >
                Mark as Seen
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Unlocked overlay effect */}
      {achievement.isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 pointer-events-none" />
      )}
    </Card>
  );
}
