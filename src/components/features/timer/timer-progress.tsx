// Circular or linear progress indicator

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTimerProgress } from '@/stores/timer-store';
import { SessionType } from '@/types/timer';
import { cn } from '@/lib/utils';

interface TimerProgressProps {
  className?: string;
  variant?: 'circular' | 'linear' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPercentage?: boolean;
  showTime?: boolean;
  animated?: boolean;
  sessionType?: SessionType;
}

const progressColors = {
  work: {
    bg: 'bg-timer-work/20',
    fill: 'stroke-timer-work',
    text: 'text-timer-work',
  },
  'short-break': {
    bg: 'bg-timer-short-break/20',
    fill: 'stroke-timer-short-break',
    text: 'text-timer-short-break',
  },
  'long-break': {
    bg: 'bg-timer-long-break/20',
    fill: 'stroke-timer-long-break',
    text: 'text-timer-long-break',
  },
  focus: {
    bg: 'bg-timer-focus/20',
    fill: 'stroke-timer-focus',
    text: 'text-timer-focus',
  },
};

const sizeConfig = {
  sm: { 
    circular: 60, 
    stroke: 4, 
    text: 'text-xs',
    linear: 'h-1',
  },
  md: { 
    circular: 100, 
    stroke: 6, 
    text: 'text-sm',
    linear: 'h-2',
  },
  lg: { 
    circular: 150, 
    stroke: 8, 
    text: 'text-base',
    linear: 'h-3',
  },
  xl: { 
    circular: 200, 
    stroke: 10, 
    text: 'text-lg',
    linear: 'h-4',
  },
};

export function TimerProgress({
  className,
  variant = 'circular',
  size = 'md',
  showPercentage = true,
  showTime = false,
  animated = true,
  sessionType = 'work',
}: TimerProgressProps) {
  const { progress, elapsedTime, remainingTime } = useTimerProgress();
  
  const colors = progressColors[sessionType];
  const config = sizeConfig[size];
  
  if (variant === 'circular') {
    return (
      <CircularProgress
        className={className}
        progress={progress}
        colors={colors}
        config={config}
        showPercentage={showPercentage}
        showTime={showTime}
        animated={animated}
        elapsedTime={elapsedTime}
        remainingTime={remainingTime}
      />
    );
  }
  
  if (variant === 'linear') {
    return (
      <LinearProgress
        className={className}
        progress={progress}
        colors={colors}
        config={config}
        showPercentage={showPercentage}
        animated={animated}
      />
    );
  }
  
  return (
    <MinimalProgress
      className={className}
      progress={progress}
      colors={colors}
      animated={animated}
    />
  );
}

interface ProgressComponentProps {
  className?: string;
  progress: number;
  colors: typeof progressColors.work;
  config?: typeof sizeConfig.md;
  showPercentage?: boolean;
  showTime?: boolean;
  animated?: boolean;
  elapsedTime?: number;
  remainingTime?: number;
}

function CircularProgress({
  className,
  progress,
  colors,
  config,
  showPercentage,
  showTime,
  animated,
  elapsedTime,
  remainingTime,
}: ProgressComponentProps) {
  const size = config?.circular || 100;
  const strokeWidth = config?.stroke || 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colors.fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: animated ? offset : circumference - (progress / 100) * circumference 
          }}
          transition={{ 
            duration: animated ? 0.5 : 0,
            ease: 'easeInOut' 
          }}
        />
        
        {/* Glow effect */}
        {animated && progress > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={colors.fill}
            strokeWidth={strokeWidth / 2}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            opacity={0.3}
            filter="blur(2px)"
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span
            key={Math.round(progress)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'font-bold tabular-nums',
              config?.text,
              colors.text
            )}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
        
        {showTime && elapsedTime !== undefined && (
          <span className={cn(
            'font-mono text-xs opacity-70',
            colors.text
          )}>
            {formatTime(elapsedTime)}
          </span>
        )}
      </div>
    </div>
  );
}

function LinearProgress({
  className,
  progress,
  colors,
  config,
  showPercentage,
  animated,
}: ProgressComponentProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className={cn(
        'relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        config?.linear
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            colors.fill.replace('stroke-', 'bg-')
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: animated ? 0.5 : 0,
            ease: 'easeInOut' 
          }}
        />
        
        {/* Shimmer effect */}
        {animated && progress > 0 && progress < 100 && (
          <motion.div
            className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-32, '100%'] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>
      
      {showPercentage && (
        <div className="flex justify-between items-center text-xs">
          <span className={colors.text}>
            {Math.round(progress)}% complete
          </span>
          <span className="text-gray-500">
            {100 - Math.round(progress)}% remaining
          </span>
        </div>
      )}
    </div>
  );
}

function MinimalProgress({
  className,
  progress,
  colors,
  animated,
}: ProgressComponentProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            colors.fill.replace('stroke-', 'bg-')
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: animated ? 0.3 : 0 
          }}
        />
      </div>
      <span className={cn('text-xs font-medium', colors.text)}>
        {Math.round(progress)}%
      </span>
    </div>
  );
}

// Hook-based progress ring component
export function useProgressRing(radius: number, strokeWidth: number, progress: number) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return {
    strokeDasharray: circumference,
    strokeDashoffset: offset,
    radius,
    strokeWidth,
  };
}

// Animated progress number component
export function AnimatedProgressNumber({ 
  value, 
  className,
  format = (n) => `${Math.round(n)}%`
}: { 
  value: number; 
  className?: string;
  format?: (n: number) => string;
}) {
  return (
    <motion.span
      key={Math.round(value)}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {format(value)}
    </motion.span>
  );
}
