// Main timer display with large time format

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimerDisplay } from '@/hooks/use-timer';
import { SessionType } from '@/types/timer';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRemaining?: boolean;
  showProgress?: boolean;
  showSessionType?: boolean;
  showOvertime?: boolean;
}

const sizeClasses = {
  sm: 'text-2xl md:text-3xl',
  md: 'text-4xl md:text-5xl',
  lg: 'text-6xl md:text-7xl',
  xl: 'text-7xl md:text-8xl',
};

const sessionTypeColors: Record<SessionType, string> = {
  work: 'text-timer-work',
  'short-break': 'text-timer-short-break',
  'long-break': 'text-timer-long-break',
  focus: 'text-timer-focus',
};

const sessionTypeLabels: Record<SessionType, string> = {
  work: 'Work Session',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
  focus: 'Focus Session',
};

export function TimerDisplay({
  className,
  size = 'lg',
  showRemaining = false,
  showProgress = true,
  showSessionType = true,
  showOvertime = true,
}: TimerDisplayProps) {
  const {
    time,
    remaining,
    progress,
    status,
    sessionType,
    isOvertime,
    overtimeFormatted,
  } = useTimerDisplay();

  const displayTime = showRemaining && status === 'running' ? remaining : time;
  const isActive = status === 'running' || status === 'paused';

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Session Type Label */}
      <AnimatePresence>
        {showSessionType && isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <span className={cn(
              'text-sm font-medium tracking-wide uppercase',
              sessionTypeColors[sessionType],
              'opacity-80'
            )}>
              {sessionTypeLabels[sessionType]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Time Display */}
      <div className="relative">
        <motion.div
          key={displayTime}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            sizeClasses[size],
            sessionTypeColors[sessionType],
            status === 'paused' && 'opacity-60',
            isOvertime && 'text-red-500'
          )}
        >
          {displayTime}
        </motion.div>

        {/* Pulsing effect for running timer */}
        <AnimatePresence>
          {status === 'running' && (
            <motion.div
              className={cn(
                'absolute inset-0 rounded-lg',
                sessionTypeColors[sessionType],
                'opacity-20'
              )}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Overtime Display */}
      <AnimatePresence>
        {showOvertime && isOvertime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Overtime: +{overtimeFormatted}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <AnimatePresence>
        {showProgress && isActive && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: 0 }}
            className="w-full max-w-md"
          >
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full transition-colors duration-300',
                  sessionType === 'work' && 'bg-timer-work',
                  sessionType === 'short-break' && 'bg-timer-short-break',
                  sessionType === 'long-break' && 'bg-timer-long-break',
                  sessionType === 'focus' && 'bg-timer-focus',
                  isOvertime && 'bg-red-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Glowing effect */}
              <motion.div
                className={cn(
                  'absolute top-0 h-full rounded-full opacity-50 blur-sm',
                  sessionType === 'work' && 'bg-timer-work',
                  sessionType === 'short-break' && 'bg-timer-short-break',
                  sessionType === 'long-break' && 'bg-timer-long-break',
                  sessionType === 'focus' && 'bg-timer-focus',
                  isOvertime && 'bg-red-500'
                )}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Progress percentage */}
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% complete
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Indicators */}
      <AnimatePresence>
        {status === 'paused' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Paused
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Session Complete!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactTimerDisplay({ className }: { className?: string }) {
  return (
    <TimerDisplay
      className={className}
      size="sm"
      showProgress={false}
      showSessionType={false}
      showOvertime={false}
    />
  );
}

// Minimal version showing only time
export function MinimalTimerDisplay({ className }: { className?: string }) {
  const { time, status, sessionType } = useTimerDisplay();
  
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'running' && sessionTypeColors[sessionType],
        status === 'paused' && 'bg-yellow-500',
        status === 'idle' && 'bg-gray-400',
        status === 'completed' && 'bg-green-500'
      )} />
      <span className="font-mono text-sm">{time}</span>
    </div>
  );
}
