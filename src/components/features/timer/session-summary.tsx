// Summary component shown after session completion

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Coffee,
  Play,
  X
} from 'lucide-react';
import { useCurrentSession, useTimerProgress } from '@/stores/timer-store';
import { SessionType } from '@/types/timer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';

interface SessionSummaryProps {
  className?: string;
  onClose?: () => void;
  onStartNext?: (sessionType: SessionType) => void;
  onSaveSession?: () => void;
  showActions?: boolean;
  showRecommendations?: boolean;
}

const sessionTypeLabels: Record<SessionType, string> = {
  work: 'Work Session',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
  focus: 'Focus Session',
};

const sessionTypeColors: Record<SessionType, string> = {
  work: 'bg-timer-work text-white',
  'short-break': 'bg-timer-short-break text-white',
  'long-break': 'bg-timer-long-break text-white',
  focus: 'bg-timer-focus text-white',
};

const sessionTypeIcons: Record<SessionType, React.ReactNode> = {
  work: <Target className="w-4 h-4" />,
  'short-break': <Coffee className="w-4 h-4" />,
  'long-break': <Coffee className="w-4 h-4" />,
  focus: <TrendingUp className="w-4 h-4" />,
};

export function SessionSummary({
  className,
  onClose,
  onStartNext,
  onSaveSession,
  showActions = true,
  showRecommendations = true,
}: SessionSummaryProps) {
  const currentSession = useCurrentSession();
  const { elapsedTime, progress } = useTimerProgress();

  if (!currentSession) {
    return null;
  }

  const isCompleted = currentSession.isCompleted;
  const targetDuration = currentSession.targetDuration;
  const sessionType = currentSession.sessionType;
  const isOvertime = elapsedTime > targetDuration;
  const overtimeSeconds = isOvertime ? elapsedTime - targetDuration : 0;
  
  // Calculate productivity metrics
  const completionRate = Math.min(100, (elapsedTime / targetDuration) * 100);
  const efficiency = isCompleted ? 
    (isOvertime ? Math.max(70, 100 - (overtimeSeconds / targetDuration) * 50) : 100) : 
    Math.max(0, completionRate - 20);
  
  // Determine next recommended action
  const nextSessionType: SessionType = sessionType === 'work' ? 'short-break' : 'work';
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    sessionType, 
    completionRate, 
    isOvertime, 
    overtimeSeconds
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('w-full max-w-md mx-auto', className)}
      >
        <Card className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold">Session Complete!</h3>
                <Badge 
                  className={cn('mt-1', sessionTypeColors[sessionType])}
                  variant="secondary"
                >
                  {sessionTypeIcons[sessionType]}
                  <span className="ml-1">{sessionTypeLabels[sessionType]}</span>
                </Badge>
              </div>
            </div>
            
            {onClose && (
              <Button
                onClick={onClose}
                size="icon-sm"
                variant="ghost"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
              <div className="text-xl font-bold font-mono">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-500">Time Worked</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Target className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
              <div className="text-xl font-bold">
                {Math.round(completionRate)}%
              </div>
              <div className="text-xs text-gray-500">Target Reached</div>
            </motion.div>
          </div>

          {/* Overtime Warning */}
          {isOvertime && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Overtime: +{formatTime(overtimeSeconds)}
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Consider taking a break to maintain productivity
              </p>
            </motion.div>
          )}

          {/* Productivity Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Productivity Score
            </div>
            <div className="relative">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(efficiency)}
              </div>
              <div className="text-sm text-gray-500">/ 100</div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${efficiency}%` }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              />
            </div>
          </motion.div>

          {/* Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recommendations
              </h4>
              <div className="space-y-1">
                {recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-1"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col space-y-3"
            >
              <Button
                onClick={() => onStartNext?.(nextSessionType)}
                size="lg"
                variant="timer"
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Start {sessionTypeLabels[nextSessionType]}
              </Button>
              
              <div className="flex space-x-2">
                {onSaveSession && (
                  <Button
                    onClick={onSaveSession}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Save Session
                  </Button>
                )}
                
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

function generateRecommendations(
  sessionType: SessionType,
  completionRate: number,
  isOvertime: boolean,
  overtimeSeconds: number
): string[] {
  const recommendations: string[] = [];

  if (sessionType === 'work') {
    if (completionRate >= 95) {
      recommendations.push('Excellent focus! Consider taking a well-deserved break.');
    } else if (completionRate >= 80) {
      recommendations.push('Good session! Try to maintain this consistency.');
    } else if (completionRate < 50) {
      recommendations.push('Session ended early. Consider reviewing your goals or reducing distractions.');
    }

    if (isOvertime && overtimeSeconds > 300) { // 5 minutes
      recommendations.push('Long overtime detected. Take breaks to prevent burnout.');
    }

    recommendations.push('Take a 5-10 minute break before your next work session.');
  } else {
    if (completionRate >= 95) {
      recommendations.push('Great break! You should feel refreshed for your next work session.');
    } else if (completionRate < 80) {
      recommendations.push('Consider taking full breaks to maintain productivity.');
    }

    recommendations.push('Ready to tackle your next work session with renewed focus.');
  }

  return recommendations;
}

// Compact version for smaller spaces
export function CompactSessionSummary({
  onStartNext,
  className,
}: {
  onStartNext?: (sessionType: SessionType) => void;
  className?: string;
}) {
  const currentSession = useCurrentSession();
  const { elapsedTime } = useTimerProgress();

  if (!currentSession?.isCompleted) return null;

  const nextSessionType: SessionType = currentSession.sessionType === 'work' ? 'short-break' : 'work';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg', className)}
    >
      <CheckCircle className="w-5 h-5 text-green-500" />
      <div className="flex-1">
        <div className="text-sm font-medium">Session Complete</div>
        <div className="text-xs text-gray-500">{formatTime(elapsedTime)}</div>
      </div>
      <Button
        onClick={() => onStartNext?.(nextSessionType)}
        size="sm"
        variant="timer"
      >
        <Play className="w-3 h-3 mr-1" />
        Next
      </Button>
    </motion.div>
  );
}
