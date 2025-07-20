'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerModeToggle } from './timer/timer-mode-toggle';
import { TimerDisplay } from './timer/timer-display';
import { TimerControls } from './timer/timer-controls';
import { PomodoroTimer } from './pomodoro/pomodoro-timer';
import { AudioControls } from './audio/audio-controls';
import { Card } from '@/components/ui/card';
import { usePomodoroStore } from '@/stores/pomodoro-store';

interface UnifiedTimerProps {
  className?: string;
  onModeChange?: (mode: 'regular' | 'pomodoro') => void;
}

export function UnifiedTimer({ className, onModeChange }: UnifiedTimerProps) {
  const [timerMode, setTimerMode] = useState<'regular' | 'pomodoro'>('pomodoro'); // Default to pomodoro to match screenshot

  const handleModeChange = (mode: 'regular' | 'pomodoro') => {
    setTimerMode(mode);
    onModeChange?.(mode);
  };

  return (
    <div className={className}>
      {/* Mode Toggle */}
      <div className="mb-6 flex justify-center">
        <TimerModeToggle 
          mode={timerMode} 
          onModeChange={handleModeChange}
          className="max-w-md"
        />
      </div>

      <AnimatePresence mode="wait">
        {timerMode === 'regular' ? (
          <motion.div
            key="regular-timer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Regular Timer Display */}
            <Card className="p-8 text-center bg-gradient-to-br from-card via-card to-muted/10 border-0 shadow-timer">
              <TimerDisplay 
                size="xl"
                showSessionType={true}
                showProgress={false}
                showOvertime={true}
              />
              
              <div className="mt-8">
                <TimerControls 
                  size="lg"
                  showAdvanced={true}
                  showSessionSelector={true}
                />
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="pomodoro-timer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Use the actual PomodoroTimer component */}
            <PomodoroTimer 
              showCycleProgress={true}
              autoStart={false}
              onSessionComplete={(session) => {
                console.log('Session completed:', session);
              }}
              onCycleComplete={(completedCycles) => {
                console.log('Cycle completed:', completedCycles);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Controls */}
      <div className="mt-6">
        <AudioControls compact className="flex justify-center" />
      </div>
    </div>
  );
}
