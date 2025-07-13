// Start, pause, stop controls with animations

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipForward,
  Plus,
  Minus,
  Settings
} from 'lucide-react';
import { useTimer } from '@/hooks/use-timer';
import { SessionType } from '@/types/timer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showAdvanced?: boolean;
  showSessionSelector?: boolean;
  onSessionTypeSelect?: (type: SessionType) => void;
  defaultSessionType?: SessionType;
}

const sessionTypeOptions = [
  { value: 'work', label: 'Work Session', color: 'bg-timer-work' },
  { value: 'short-break', label: 'Short Break', color: 'bg-timer-short-break' },
  { value: 'long-break', label: 'Long Break', color: 'bg-timer-long-break' },
  { value: 'focus', label: 'Focus Session', color: 'bg-timer-focus' },
] as const;

export function TimerControls({
  className,
  size = 'md',
  showAdvanced = true,
  showSessionSelector = true,
  onSessionTypeSelect,
  defaultSessionType = 'work',
}: TimerControlsProps) {
  const {
    status,
    start,
    pause,
    resume,
    stop,
    reset,
    complete,
    skip,
    addTime,
    canStart,
    canPause,
    canResume,
    canStop,
    canReset,
    nextSessionType,
    isBreakTime,
  } = useTimer();

  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(defaultSessionType);
  const [showTimeAdjuster, setShowTimeAdjuster] = useState(false);

  const buttonSizes = {
    sm: { primary: 'icon-sm' as const, secondary: 'icon-sm' as const },
    md: { primary: 'icon' as const, secondary: 'icon-sm' as const },
    lg: { primary: 'icon-lg' as const, secondary: 'icon' as const },
  };

  const handleSessionTypeChange = (type: SessionType) => {
    setSelectedSessionType(type);
    onSessionTypeSelect?.(type);
  };

  const handleStart = () => {
    try {
      start(selectedSessionType);
    } catch (error) {
      console.error('Failed to start timer:', error);
      // Could show a toast notification here
    }
  };

  const handlePause = () => {
    try {
      pause();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleResume = () => {
    try {
      resume();
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const handleStop = () => {
    try {
      stop();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const handleReset = () => {
    try {
      reset();
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  const handleSkip = () => {
    try {
      skip();
    } catch (error) {
      console.error('Failed to skip session:', error);
    }
  };

  const handleAddTime = (minutes: number) => {
    try {
      addTime(minutes);
      setShowTimeAdjuster(false);
    } catch (error) {
      console.error('Failed to add time:', error);
    }
  };

  const currentSessionOption = sessionTypeOptions.find(opt => opt.value === selectedSessionType);

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Session Type Selector */}
      {showSessionSelector && canStart && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs"
        >
          <select
            value={selectedSessionType}
            onChange={(e) => handleSessionTypeChange(e.target.value as SessionType)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sessionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Main Controls */}
      <div className="flex items-center space-x-3">
        {/* Primary Action Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {canStart && (
            <Button
              onClick={handleStart}
              size={buttonSizes[size].primary}
              variant="timer"
              className={cn(
                'relative overflow-hidden',
                currentSessionOption?.color && `hover:${currentSessionOption.color}/90`
              )}
            >
              <Play className="w-5 h-5" />
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </Button>
          )}

          {canPause && (
            <Button
              onClick={handlePause}
              size={buttonSizes[size].primary}
              variant="secondary"
            >
              <Pause className="w-5 h-5" />
            </Button>
          )}

          {canResume && (
            <Button
              onClick={handleResume}
              size={buttonSizes[size].primary}
              variant="timer"
            >
              <Play className="w-5 h-5" />
            </Button>
          )}
        </motion.div>

        {/* Stop Button */}
        {canStop && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleStop}
              size={buttonSizes[size].secondary}
              variant="destructive"
            >
              <Square className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Reset Button */}
        {canReset && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleReset}
              size={buttonSizes[size].secondary}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (status === 'running' || status === 'paused') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center space-x-2"
        >
          {/* Skip Session */}
          <Button
            onClick={handleSkip}
            size="sm"
            variant="ghost"
            className="text-xs"
          >
            <SkipForward className="w-3 h-3 mr-1" />
            Skip
          </Button>

          {/* Complete Session */}
          <Button
            onClick={complete}
            size="sm"
            variant="ghost"
            className="text-xs"
          >
            Complete
          </Button>

          {/* Time Adjuster Toggle */}
          <Button
            onClick={() => setShowTimeAdjuster(!showTimeAdjuster)}
            size="sm"
            variant="ghost"
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Adjust
          </Button>
        </motion.div>
      )}

      {/* Time Adjuster */}
      {showTimeAdjuster && (status === 'running' || status === 'paused') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <span className="text-sm font-medium">Adjust Time:</span>
          
          <Button
            onClick={() => handleAddTime(-5)}
            size="sm"
            variant="outline"
          >
            <Minus className="w-3 h-3 mr-1" />
            5m
          </Button>
          
          <Button
            onClick={() => handleAddTime(-1)}
            size="sm"
            variant="outline"
          >
            <Minus className="w-3 h-3 mr-1" />
            1m
          </Button>
          
          <Button
            onClick={() => handleAddTime(1)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3 h-3 mr-1" />
            1m
          </Button>
          
          <Button
            onClick={() => handleAddTime(5)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3 h-3 mr-1" />
            5m
          </Button>
        </motion.div>
      )}

      {/* Next Session Indicator */}
      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
        >
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Session Complete!
          </p>
          {isBreakTime ? (
            <p className="text-xs text-green-500 mt-1">
              Ready for work session
            </p>
          ) : (
            <p className="text-xs text-green-500 mt-1">
              Next: {sessionTypeOptions.find(opt => opt.value === nextSessionType)?.label}
            </p>
          )}
          
          <Button
            onClick={() => {
              setSelectedSessionType(nextSessionType);
              start(nextSessionType);
            }}
            size="sm"
            variant="timer"
            className="mt-2"
          >
            <Play className="w-3 h-3 mr-1" />
            Start Next
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactTimerControls({ className }: { className?: string }) {
  const { status, start, pause, resume, stop, canStart, canPause, canResume, canStop } = useTimer();

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {canStart && (
        <Button onClick={() => start('work')} size="sm" variant="timer">
          <Play className="w-3 h-3" />
        </Button>
      )}
      
      {canPause && (
        <Button onClick={pause} size="sm" variant="secondary">
          <Pause className="w-3 h-3" />
        </Button>
      )}
      
      {canResume && (
        <Button onClick={resume} size="sm" variant="timer">
          <Play className="w-3 h-3" />
        </Button>
      )}
      
      {canStop && (
        <Button onClick={stop} size="sm" variant="destructive">
          <Square className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
