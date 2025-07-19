'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerModeToggleProps {
  mode: 'regular' | 'pomodoro';
  onModeChange: (mode: 'regular' | 'pomodoro') => void;
  className?: string;
}

export function TimerModeToggle({ mode, onModeChange, className }: TimerModeToggleProps) {
  return (
    <div className={cn('inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      <motion.button
        onClick={() => onModeChange('regular')}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
          mode === 'regular' 
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        )}
        whileHover={{ scale: mode === 'regular' ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Timer className="w-4 h-4" />
        Regular Timer
      </motion.button>
      
      <motion.button
        onClick={() => onModeChange('pomodoro')}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
          mode === 'pomodoro' 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        )}
        whileHover={{ scale: mode === 'pomodoro' ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Zap className="w-4 h-4" />
        Pomodoro Mode
      </motion.button>
    </div>
  );
}
