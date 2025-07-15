// Visual indicator of current cycle and progress

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CycleIndicatorProps, CyclePhase } from '@/types/pomodoro';
import { cn } from '@/lib/utils';
import { Clock, Coffee, Target } from 'lucide-react';

const phaseIcons: Record<CyclePhase, React.ComponentType<{ className?: string }>> = {
  work: Clock,
  'short-break': Coffee,
  'long-break': Target,
};

const phaseColors: Record<CyclePhase, string> = {
  work: 'bg-red-500',
  'short-break': 'bg-green-500',
  'long-break': 'bg-blue-500',
};

const phaseTextColors: Record<CyclePhase, string> = {
  work: 'text-red-600',
  'short-break': 'text-green-600',
  'long-break': 'text-blue-600',
};

export function CycleIndicator({
  currentCycle,
  currentPhase,
  nextPhase,
  longBreakInterval,
  showNext = true,
  size = 'md',
}: CycleIndicatorProps) {
  const isLongBreakComing = currentCycle % longBreakInterval === 0 && currentCycle > 0;
  
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      dot: 'w-2 h-2',
      icon: 'w-3 h-3',
      spacing: 'space-x-1',
    },
    md: {
      container: 'text-sm',
      dot: 'w-3 h-3',
      icon: 'w-4 h-4',
      spacing: 'space-x-2',
    },
    lg: {
      container: 'text-base',
      dot: 'w-4 h-4',
      icon: 'w-5 h-5',
      spacing: 'space-x-3',
    },
  };

  const classes = sizeClasses[size];
  const CurrentIcon = phaseIcons[currentPhase];
  const NextIcon = phaseIcons[nextPhase];

  // Generate cycle dots
  const generateCycleDots = () => {
    const dots = [];
    const totalDots = longBreakInterval;
    
    for (let i = 1; i <= totalDots; i++) {
      const isCompleted = i < (currentCycle % longBreakInterval || longBreakInterval);
      const isCurrent = i === (currentCycle % longBreakInterval || longBreakInterval);
      const isLongBreak = i === totalDots;
      
      dots.push(
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            classes.dot,
            'rounded-full border-2 transition-all duration-200',
            isCompleted && 'bg-red-500 border-red-500',
            isCurrent && currentPhase === 'work' && 'bg-red-500 border-red-500 animate-pulse',
            !isCompleted && !isCurrent && 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
            isLongBreak && isCompleted && 'bg-blue-500 border-blue-500',
            isLongBreak && isCurrent && 'bg-blue-500 border-blue-500'
          )}
        />
      );
    }
    
    return dots;
  };

  return (
    <div className={cn('flex flex-col items-center space-y-3', classes.container)}>
      {/* Current Phase */}
      <div className="flex items-center space-x-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={cn(
            'p-2 rounded-full',
            phaseColors[currentPhase],
            'text-white shadow-lg'
          )}
        >
          <CurrentIcon className={classes.icon} />
        </motion.div>
        
        <div className="text-center">
          <div className={cn('font-semibold', phaseTextColors[currentPhase])}>
            Cycle {currentCycle}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            {currentPhase === 'work' && 'Work Session'}
            {currentPhase === 'short-break' && 'Short Break'}
            {currentPhase === 'long-break' && 'Long Break'}
          </div>
        </div>
      </div>

      {/* Cycle Progress Dots */}
      <div className={cn('flex items-center', classes.spacing)}>
        {generateCycleDots()}
      </div>

      {/* Progress Text */}
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {currentCycle % longBreakInterval || longBreakInterval} of {longBreakInterval} sessions
        </div>
        {isLongBreakComing && currentPhase === 'work' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1"
          >
            Long break coming up!
          </motion.div>
        )}
      </div>

      {/* Next Phase Preview */}
      {showNext && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <span className="text-xs text-gray-600 dark:text-gray-400">Next:</span>
          <div className="flex items-center space-x-1">
            <NextIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {nextPhase === 'work' && 'Work'}
              {nextPhase === 'short-break' && 'Short Break'}
              {nextPhase === 'long-break' && 'Long Break'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactCycleIndicator({
  currentCycle,
  currentPhase,
  longBreakInterval,
}: Pick<CycleIndicatorProps, 'currentCycle' | 'currentPhase' | 'longBreakInterval'>) {
  const progress = (currentCycle % longBreakInterval) || longBreakInterval;
  const progressPercentage = (progress / longBreakInterval) * 100;

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
        phaseColors[currentPhase]
      )}>
        {currentCycle}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Cycle Progress</span>
          <span>{progress}/{longBreakInterval}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <motion.div
            className="bg-red-500 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

// Circular progress version
export function CircularCycleIndicator({
  currentCycle,
  currentPhase,
  longBreakInterval,
  size = 'md',
}: Pick<CycleIndicatorProps, 'currentCycle' | 'currentPhase' | 'longBreakInterval' | 'size'>) {
  const progress = (currentCycle % longBreakInterval) || longBreakInterval;
  const progressPercentage = (progress / longBreakInterval) * 100;
  
  const sizeMap = {
    sm: { container: 'w-12 h-12', text: 'text-xs' },
    md: { container: 'w-16 h-16', text: 'text-sm' },
    lg: { container: 'w-20 h-20', text: 'text-base' },
  };
  
  const sizeClass = sizeMap[size];
  const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className={cn('relative', sizeClass.container)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={phaseTextColors[currentPhase]}
          style={{
            strokeDasharray,
            strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn('text-center font-bold', sizeClass.text)}>
          <div className={phaseTextColors[currentPhase]}>{progress}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">/{longBreakInterval}</div>
        </div>
      </div>
    </div>
  );
}
