'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimerModeToggleProps {
  mode: 'regular' | 'pomodoro';
  onModeChange: (mode: 'regular' | 'pomodoro') => void;
  className?: string;
}

export function TimerModeToggle({ mode, onModeChange, className }: TimerModeToggleProps) {
  return (
    <Card className={cn('p-1 bg-muted/50', className)}>
      <div className="flex space-x-1">
        <motion.button
          onClick={() => onModeChange('regular')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            mode === 'regular' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Timer className="w-4 h-4" />
          Regular Timer
        </motion.button>
        
        <motion.button
          onClick={() => onModeChange('pomodoro')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            mode === 'pomodoro' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-4 h-4" />
          Pomodoro Mode
        </motion.button>
      </div>
    </Card>
  );
}
