'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TreePine, 
  Sprout, 
  Target, 
  TrendingUp, 
  Star,
  Crown,
  Zap,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressVisualizationProps {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalFocusTime: number; // in minutes
  weeklyGoal: number; // in minutes
  weeklyProgress: number; // in minutes
  recentAchievements: Array<{
    id: string;
    title: string;
    unlockedAt: Date;
  }>;
  className?: string;
}

export function ProgressVisualization({
  currentStreak,
  longestStreak,
  totalSessions,
  totalFocusTime,
  weeklyGoal,
  weeklyProgress,
  recentAchievements,
  className,
}: ProgressVisualizationProps) {
  // Calculate growth stage based on streak
  const getGrowthStage = (streak: number) => {
    if (streak >= 100) return { stage: 'legendary', icon: Crown, color: 'text-yellow-500', name: 'Legendary Tree' };
    if (streak >= 50) return { stage: 'mighty', icon: TreePine, color: 'text-green-600', name: 'Mighty Oak' };
    if (streak >= 30) return { stage: 'strong', icon: TreePine, color: 'text-green-500', name: 'Strong Tree' };
    if (streak >= 14) return { stage: 'growing', icon: TreePine, color: 'text-green-400', name: 'Growing Tree' };
    if (streak >= 7) return { stage: 'young', icon: Sprout, color: 'text-green-300', name: 'Young Sapling' };
    if (streak >= 3) return { stage: 'seedling', icon: Sprout, color: 'text-green-200', name: 'Strong Seedling' };
    if (streak >= 1) return { stage: 'sprout', icon: Sprout, color: 'text-green-100', name: 'New Sprout' };
    return { stage: 'seed', icon: Sprout, color: 'text-gray-400', name: 'Dormant Seed' };
  };

  const growth = getGrowthStage(currentStreak);
  const GrowthIcon = growth.icon;

  // Calculate weekly progress percentage
  const weeklyProgressPercentage = weeklyGoal > 0 ? Math.min((weeklyProgress / weeklyGoal) * 100, 100) : 0;

  // Calculate level based on total sessions
  const level = Math.floor(totalSessions / 10) + 1;
  const sessionsToNextLevel = ((level * 10) - totalSessions) || 10;
  const levelProgress = ((totalSessions % 10) / 10) * 100;

  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Growth Tree Visualization */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-blue-50/50 to-purple-50/50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-purple-950/20" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-500" />
            Growth Journey
          </CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Tree visualization */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className={cn(
                'p-6 rounded-full border-4 transition-all duration-500',
                currentStreak > 0 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
              )}>
                <GrowthIcon className={cn('h-12 w-12', growth.color)} />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{growth.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStreak} day{currentStreak === 1 ? '' : 's'} of growth
              </p>
            </div>
          </div>

          {/* Growth stages progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Growth Progress</span>
              <span>{currentStreak} / {longestStreak > currentStreak ? longestStreak : (currentStreak + 10)} days</span>
            </div>
            <Progress 
              value={longestStreak > currentStreak 
                ? (currentStreak / longestStreak) * 100 
                : currentStreak === 0 ? 0 : 90
              } 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Level and Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-500" />
            Level & Experience
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Level {level}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {sessionsToNextLevel} sessions to next level
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalSessions} sessions completed
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level Progress</span>
              <span>{Math.round(levelProgress)}%</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Weekly Goal
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-500">
                {formatTime(weeklyProgress)}
              </div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-500">
                {formatTime(weeklyGoal)}
              </div>
              <div className="text-xs text-muted-foreground">Goal</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Progress</span>
              <span>{Math.round(weeklyProgressPercentage)}%</span>
            </div>
            <Progress value={weeklyProgressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {weeklyProgressPercentage >= 100 
                ? '🎉 Goal achieved! Amazing work!'
                : `${formatTime(Math.max(0, weeklyGoal - weeklyProgress))} remaining`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {recentAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <Award className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    New!
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Focus Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Total Focus Time
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-orange-500">
              {formatTime(totalFocusTime)}
            </div>
            <p className="text-sm text-muted-foreground">
              Invested in your growth
            </p>
            
            {/* Milestone indicators */}
            <div className="pt-4 space-y-2">
              {[
                { hours: 10, label: 'Getting Started', icon: '🌱' },
                { hours: 50, label: 'Building Momentum', icon: '🚀' },
                { hours: 100, label: 'Serious Dedication', icon: '💪' },
                { hours: 500, label: 'Expert Level', icon: '🏆' },
                { hours: 1000, label: 'Master Status', icon: '👑' },
              ].map((milestone) => {
                const hoursCompleted = Math.floor(totalFocusTime / 60);
                const isReached = hoursCompleted >= milestone.hours;
                const isNext = !isReached && hoursCompleted < milestone.hours;
                
                if (isReached || isNext) {
                  return (
                    <div 
                      key={milestone.hours}
                      className={cn(
                        'flex items-center justify-between p-2 rounded',
                        isReached 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-muted/50'
                      )}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <span>{milestone.icon}</span>
                        {milestone.label}
                      </span>
                      <span className="text-sm font-medium">
                        {isReached ? '✓' : `${milestone.hours}h`}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressVisualization;
