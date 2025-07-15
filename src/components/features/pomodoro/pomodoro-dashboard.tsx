'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { PomodoroSession } from '@/types/pomodoro';
import { cn } from '@/lib/utils';

interface PomodoroDashboardProps {
  className?: string;
}

export function PomodoroDashboard({ className }: PomodoroDashboardProps) {
  const {
    currentCycle,
    completedCycles,
    dailyGoal,
    sessionsToday,
    statistics,
    config,
    getTodayProgress,
  } = usePomodoroStore();

  const todayProgress = getTodayProgress();
  const workSessionsToday = sessionsToday.filter((s: PomodoroSession) => s.phase === 'work' && s.completed).length;
  const completionRate = statistics.completionRate || 0;
  const currentStreak = statistics.currentStreak || 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Today's Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold">Today's Goal</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            {workSessionsToday} / {dailyGoal} sessions
          </div>
        </div>
        
        <div className="space-y-3">
          <Progress value={todayProgress.percentage} className="h-3" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(todayProgress.percentage)}%</span>
          </div>
          
          {workSessionsToday >= dailyGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center"
            >
              <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Daily goal completed! 🎉
              </p>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Current Cycle Info */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <h3 className="text-lg font-semibold">Current Cycle</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{currentCycle}</div>
            <div className="text-sm text-muted-foreground">Current</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedCycles}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>
        
        {/* Cycle Dots Indicator */}
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: config.longBreakInterval }, (_, i) => {
              const cycleNum = i + 1;
              const isCompleted = cycleNum <= completedCycles;
              const isCurrent = cycleNum === currentCycle;
              
              return (
                <motion.div
                  key={cycleNum}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    isCompleted && 'bg-green-500',
                    isCurrent && !isCompleted && 'bg-red-500',
                    !isCompleted && !isCurrent && 'bg-gray-300 dark:bg-gray-600'
                  )}
                  animate={isCurrent ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={isCurrent ? { duration: 2, repeat: Infinity } : undefined}
                />
              );
            })}
            {completedCycles >= config.longBreakInterval && (
              <motion.div
                className="w-3 h-3 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
          <div className="text-xs text-muted-foreground">Last 30 days</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
          <div className="text-xs text-muted-foreground">
            {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            View Statistics
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Adjust Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
