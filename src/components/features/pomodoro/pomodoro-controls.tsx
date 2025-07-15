// Pomodoro-specific controls (skip break, etc.)

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CyclePhase } from '@/types/pomodoro';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  RotateCcw,
  Coffee,
  Clock
} from 'lucide-react';

interface PomodoroControlsProps {
  currentPhase: CyclePhase;
  isActive: boolean;
  isPaused: boolean;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
  onReset: () => void;
  allowSkipBreaks?: boolean;
  disabled?: boolean;
}

export function PomodoroControls({
  currentPhase,
  isActive,
  isPaused,
  isRunning,
  onStart,
  onPause,
  onResume,
  onStop,
  onSkip,
  onReset,
  allowSkipBreaks = false,
  disabled = false,
}: PomodoroControlsProps) {
  const canSkip = currentPhase === 'work' || allowSkipBreaks;
  const isWorkPhase = currentPhase === 'work';
  const isBreakPhase = currentPhase === 'short-break' || currentPhase === 'long-break';

  const getPhaseIcon = () => {
    if (isWorkPhase) return Clock;
    return Coffee;
  };

  const PhaseIcon = getPhaseIcon();

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Primary Action Button */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {!isActive ? (
          <Button
            size="lg"
            onClick={onStart}
            disabled={disabled}
            className={cn(
              'w-20 h-20 rounded-full text-white font-semibold shadow-lg',
              'transition-all duration-200',
              isWorkPhase 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex flex-col items-center">
              <Play className="w-6 h-6 mb-1" />
              <span className="text-xs">
                {isWorkPhase ? 'Start' : 'Break'}
              </span>
            </div>
          </Button>
        ) : isPaused ? (
          <Button
            size="lg"
            onClick={onResume}
            disabled={disabled}
            className={cn(
              'w-20 h-20 rounded-full text-white font-semibold shadow-lg',
              'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex flex-col items-center">
              <Play className="w-6 h-6 mb-1" />
              <span className="text-xs">Resume</span>
            </div>
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onPause}
            disabled={disabled}
            className={cn(
              'w-20 h-20 rounded-full text-white font-semibold shadow-lg',
              'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex flex-col items-center">
              <Pause className="w-6 h-6 mb-1" />
              <span className="text-xs">Pause</span>
            </div>
          </Button>
        )}
      </motion.div>

      {/* Secondary Controls */}
      <div className="flex items-center space-x-3">
        {/* Stop Button */}
        <motion.div whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={disabled || !isActive}
            className="h-10 px-4"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </motion.div>

        {/* Skip Button */}
        {canSkip && (
          <motion.div whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onSkip}
              disabled={disabled || !isActive}
              className={cn(
                'h-10 px-4',
                isBreakPhase && !allowSkipBreaks && 'opacity-50 cursor-not-allowed'
              )}
              title={
                isBreakPhase && !allowSkipBreaks 
                  ? 'Skipping breaks is disabled'
                  : `Skip ${currentPhase}`
              }
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </motion.div>
        )}

        {/* Reset Button */}
        <motion.div whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={disabled}
            className="h-10 px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Phase Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
      >
        <PhaseIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentPhase === 'work' && 'Work Session'}
          {currentPhase === 'short-break' && 'Short Break'}
          {currentPhase === 'long-break' && 'Long Break'}
        </span>
        <div className={cn(
          'w-2 h-2 rounded-full',
          isActive && !isPaused && 'animate-pulse',
          isWorkPhase ? 'bg-red-500' : 'bg-green-500',
          !isActive && 'bg-gray-400',
          isPaused && 'bg-yellow-500'
        )} />
      </motion.div>

      {/* Control Hints */}
      <div className="text-center space-y-1">
        {!isActive && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click start to begin {isWorkPhase ? 'working' : 'your break'}
          </p>
        )}
        {isPaused && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Timer is paused - click resume to continue
          </p>
        )}
        {isActive && !isPaused && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Focus on your {isWorkPhase ? 'task' : 'break'}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactPomodoroControls({
  currentPhase,
  isActive,
  isPaused,
  isRunning,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: Omit<PomodoroControlsProps, 'onSkip' | 'onReset' | 'allowSkipBreaks'>) {
  return (
    <div className="flex items-center space-x-2">
      {!isActive ? (
        <Button
          size="sm"
          onClick={onStart}
          disabled={disabled}
          className="h-8 px-3"
        >
          <Play className="w-3 h-3 mr-1" />
          Start
        </Button>
      ) : isPaused ? (
        <Button
          size="sm"
          onClick={onResume}
          disabled={disabled}
          className="h-8 px-3"
        >
          <Play className="w-3 h-3 mr-1" />
          Resume
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={onPause}
          disabled={disabled}
          className="h-8 px-3"
        >
          <Pause className="w-3 h-3 mr-1" />
          Pause
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onStop}
        disabled={disabled || !isActive}
        className="h-8 px-3"
      >
        <Square className="w-3 h-3 mr-1" />
        Stop
      </Button>
      
      <div className={cn(
        'w-2 h-2 rounded-full ml-2',
        isActive && !isPaused && 'animate-pulse',
        currentPhase === 'work' ? 'bg-red-500' : 'bg-green-500',
        !isActive && 'bg-gray-400',
        isPaused && 'bg-yellow-500'
      )} />
    </div>
  );
}
