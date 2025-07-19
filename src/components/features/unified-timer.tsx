'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerModeToggle } from './timer/timer-mode-toggle';
import { TimerDisplay } from './timer/timer-display';
import { TimerControls } from './timer/timer-controls';
import { PomodoroTimer } from './pomodoro/pomodoro-timer';
import { ConnectedPomodoroControls } from './pomodoro/connected-pomodoro-controls';
import { CycleIndicator } from './pomodoro/cycle-indicator';
import { AudioControls } from './audio/audio-controls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePomodoroStore } from '@/stores/pomodoro-store';

interface UnifiedTimerProps {
  className?: string;
  onModeChange?: (mode: 'regular' | 'pomodoro') => void;
}

export function UnifiedTimer({ className, onModeChange }: UnifiedTimerProps) {
  const [timerMode, setTimerMode] = useState<'regular' | 'pomodoro'>('pomodoro'); // Default to pomodoro to match screenshot
  const { currentPhase, currentCycle, completedCycles, config } = usePomodoroStore();

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
            {/* Pomodoro Timer Display */}
            <Card className="p-8 text-center bg-gradient-to-br from-red-50 via-card to-red-50/30 dark:from-red-950/20 dark:via-card dark:to-red-950/10 border-0 shadow-timer">
              {/* Session Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Work Session
                  </span>
                </div>
                <p className="text-muted-foreground">Focus on your task</p>
              </div>

              {/* Cycle Info */}
              <div className="mb-6 text-sm text-muted-foreground">
                <span>Cycle {currentCycle} • </span>
                <span>Next: Short Break</span>
              </div>
              
              {/* Simple Timer Display */}
              <div className="mb-8">
                <div className="text-6xl md:text-7xl font-mono font-bold text-foreground mb-4">
                  25:00
                </div>
                <div className="text-sm text-muted-foreground">
                  0% complete
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="lg" className="h-10 px-6 min-w-[100px]">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Stop
                </Button>
                
                <Button size="lg" className="h-10 px-6 min-w-[100px] bg-red-500 hover:bg-red-600 text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  Start
                </Button>
                
                <Button variant="outline" size="lg" className="h-10 px-6 min-w-[100px]">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Skip
                </Button>
                
                <Button variant="ghost" size="lg" className="h-10 px-6 min-w-[100px]">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </Button>
              </div>
            </Card>
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
