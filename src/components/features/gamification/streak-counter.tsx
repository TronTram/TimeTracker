'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Calendar, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  daysToNextMilestone: number;
  nextMilestone: number;
  streakPercentage: number;
  lastActiveDate: Date | null;
  className?: string;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  daysToNextMilestone,
  nextMilestone,
  streakPercentage,
  lastActiveDate,
  className,
}: StreakCounterProps) {
  const isNewRecord = currentStreak > 0 && currentStreak === longestStreak;
  const today = new Date();
  const isToday = lastActiveDate?.toDateString() === today.toDateString();

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '🔥';
    if (streak >= 50) return '⚡';
    if (streak >= 30) return '🌟';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🎯';
    if (streak >= 3) return '🌱';
    return '🌿';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your first streak today!';
    if (streak >= 100) return 'Legendary dedication!';
    if (streak >= 50) return 'Incredible consistency!';
    if (streak >= 30) return 'Outstanding commitment!';
    if (streak >= 14) return 'Building strong habits!';
    if (streak >= 7) return 'Great momentum!';
    if (streak >= 3) return 'Good start!';
    return 'Keep going!';
  };

  const formatDateRelative = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient for active streaks */}
      {currentStreak > 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-yellow-500/5" />
      )}
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn(
              'h-6 w-6',
              currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            )} />
            <span>Daily Streak</span>
            {isNewRecord && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                New Record!
              </Badge>
            )}
          </div>
          <span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Main streak display */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-orange-500">
            {currentStreak}
            <span className="text-lg text-muted-foreground ml-1">
              {currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        {/* Progress to next milestone */}
        {nextMilestone > currentStreak && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextMilestone} days</span>
              <span className="font-medium">{Math.round(streakPercentage)}%</span>
            </div>
            <Progress value={streakPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {daysToNextMilestone} more {daysToNextMilestone === 1 ? 'day' : 'days'} to go!
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">
              {longestStreak === 1 ? 'day' : 'days'}
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Last Active</span>
            </div>
            <div className="text-sm font-medium text-green-500">
              {formatDateRelative(lastActiveDate)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isToday ? '✅ Active today' : '⏰ Keep it up!'}
            </div>
          </div>
        </div>

        {/* Streak status indicator */}
        <div className={cn(
          'flex items-center justify-center gap-2 p-3 rounded-lg border',
          currentStreak > 0 
            ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800' 
            : 'bg-muted/50 border-border'
        )}>
          <Target className={cn(
            'h-4 w-4',
            currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-sm font-medium',
            currentStreak > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-muted-foreground'
          )}>
            {currentStreak > 0 
              ? `${currentStreak} consecutive active ${currentStreak === 1 ? 'day' : 'days'}`
              : 'Complete a focus session to start your streak'
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default StreakCounter;
