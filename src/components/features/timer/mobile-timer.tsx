'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Settings } from 'lucide-react';
import { TimerModeToggle } from '../timer/timer-mode-toggle';
import { TimerDisplay } from '../timer/timer-display';
import { PomodoroTimer } from '../pomodoro/pomodoro-timer';
import { ConnectedPomodoroControls } from '../pomodoro/connected-pomodoro-controls';
import { CycleIndicator } from '../pomodoro/cycle-indicator';
import { AudioControls } from '../audio/audio-controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useTimer } from '@/hooks/use-timer';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface MobileTimerProps {
  className?: string;
  onModeChange?: (mode: 'regular' | 'pomodoro') => void;
}

export function MobileTimer({ className, onModeChange }: MobileTimerProps) {
  const [timerMode, setTimerMode] = useState<'regular' | 'pomodoro'>('regular');
  const [showAudioControls, setShowAudioControls] = useState(false);
  const { isMobile } = useMobileDetection();
  
  const { 
    status,
    start,
    pause,
    resume,
    stop,
    reset,
    canPause,
    canResume,
    canStart
  } = useTimer();
  
  const { 
    currentPhase, 
    currentCycle, 
    config 
  } = usePomodoroStore();

  const handleModeChange = (mode: 'regular' | 'pomodoro') => {
    setTimerMode(mode);
    onModeChange?.(mode);
  };

  const handlePrimaryAction = () => {
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start('work'); // Default to work session
    }
  };

  // Mobile-optimized timer controls
  const renderMobileControls = () => (
    <div className="flex items-center justify-center space-x-4">
      {/* Primary Action Button */}
      <Button
        onClick={handlePrimaryAction}
        size="lg"
        className={cn(
          'w-16 h-16 rounded-full shadow-lg',
          'active:scale-95 transition-transform duration-150',
          status === 'running'
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        )}
      >
        {status === 'running' ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </Button>

      {/* Secondary Actions */}
      <div className="flex flex-col space-y-2">
        <Button
          onClick={stop}
          variant="outline"
          size="sm"
          className="w-12 h-12 rounded-full"
          disabled={!canPause && !canResume}
        >
          <Square className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={reset}
          variant="outline"
          size="sm"
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Mode Toggle */}
      <div className="px-4 py-3 border-b">
        <TimerModeToggle 
          mode={timerMode} 
          onModeChange={handleModeChange}
          className="w-full"
        />
      </div>

      {/* Timer Content */}
      <div className="flex-1 flex flex-col p-4 space-y-6">
        <AnimatePresence mode="wait">
          {timerMode === 'regular' ? (
            <motion.div
              key="mobile-regular-timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center space-y-8"
            >
              {/* Timer Display */}
              <div className="text-center">
                <TimerDisplay 
                  size="lg"
                  showSessionType={false}
                  showProgress={true}
                  showOvertime={false}
                />
              </div>

              {/* Controls */}
              {renderMobileControls()}
            </motion.div>
          ) : (
            <motion.div
              key="mobile-pomodoro-timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center space-y-6"
            >
              {/* Pomodoro Timer Display */}
              <div className="text-center">
                <PomodoroTimer 
                  showCycleProgress={true}
                  autoStart={config.autoStartPomodoros}
                />
              </div>

              {/* Cycle Indicator */}
              <div className="flex justify-center">
                <CycleIndicator
                  currentCycle={currentCycle}
                  currentPhase={currentPhase}
                  nextPhase={currentPhase === 'work' ? 'short-break' : 'work'}
                  longBreakInterval={config.longBreakInterval}
                  showNext={false}
                  size="sm"
                />
              </div>

              {/* Pomodoro Controls */}
              <div className="px-4">
                <ConnectedPomodoroControls />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t space-y-3">
        {/* Audio Controls Toggle */}
        <Button
          onClick={() => setShowAudioControls(!showAudioControls)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          Audio Controls
        </Button>

        {/* Collapsible Audio Controls */}
        <AnimatePresence>
          {showAudioControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <AudioControls compact />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MobileTimer;
