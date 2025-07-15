// Specialized Pomodoro timer component

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePomodoroStore, usePomodoroState, usePomodoroProgress } from '@/stores/pomodoro-store';
import { useTimer } from '@/hooks/use-timer';
import { PomodoroTimerProps, CyclePhase } from '@/types/pomodoro';
import { TimerDisplay } from '@/components/features/timer/timer-display';
import { PomodoroControls } from './pomodoro-controls';
import { CycleIndicator } from './cycle-indicator';
import { cn } from '@/lib/utils';
import { Clock, Target, Play, Pause, Square, SkipForward } from 'lucide-react';

const phaseConfig = {
  work: {
    label: 'Work Session',
    shortLabel: 'Work',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    lightBg: 'bg-red-50',
    darkBg: 'bg-red-900/20',
    icon: Clock,
    description: 'Focus on your task',
    gradient: 'from-red-500 to-red-600',
  },
  'short-break': {
    label: 'Short Break',
    shortLabel: 'Break',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    lightBg: 'bg-green-50',
    darkBg: 'bg-green-900/20',
    icon: Target,
    description: 'Take a quick break',
    gradient: 'from-green-500 to-green-600',
  },
  'long-break': {
    label: 'Long Break',
    shortLabel: 'Long Break',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    lightBg: 'bg-blue-50',
    darkBg: 'bg-blue-900/20',
    icon: Target,
    description: 'Enjoy a longer break',
    gradient: 'from-blue-500 to-blue-600',
  },
} as const;

export function PomodoroTimer({
  projectId,
  description,
  showCycleProgress = true,
  autoStart = false,
  onSessionComplete,
  onCycleComplete,
}: PomodoroTimerProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<Date | null>(null);
  const [phaseElapsedTime, setPhaseElapsedTime] = useState(0);

  // Pomodoro store
  const {
    currentPhase,
    nextPhase,
    isActive,
    isPaused,
    startCycle,
    startBreak,
    pauseCycle,
    resumeCycle,
    completeCycle,
    skipCurrentPhase,
    resetCycle,
    getCurrentPhaseDuration,
    getNextPhaseDuration,
    config,
  } = usePomodoroStore();

  const pomodoroState = usePomodoroState();
  const progress = usePomodoroProgress();

  // Timer integration
  const timer = useTimer({
    onTick: (elapsed) => {
      setPhaseElapsedTime(elapsed);
    },
    onSessionComplete: () => {
      handlePhaseComplete();
    },
  });

  const currentConfig = phaseConfig[currentPhase as keyof typeof phaseConfig];
  const phaseDurationMinutes = getCurrentPhaseDuration();
  const phaseDurationSeconds = phaseDurationMinutes * 60;
  const remainingTime = Math.max(0, phaseDurationSeconds - phaseElapsedTime);
  const phaseProgress = phaseDurationSeconds > 0 ? (phaseElapsedTime / phaseDurationSeconds) * 100 : 0;

  // Handle phase completion
  const handlePhaseComplete = () => {
    completeCycle();
    
    if (onSessionComplete) {
      const session = {
        id: crypto.randomUUID(),
        date: new Date(),
        phase: currentPhase,
        duration: phaseDurationSeconds,
        completed: true,
        cycleNumber: pomodoroState.currentCycle,
        projectId,
        description,
      };
      onSessionComplete(session);
    }

    // Reset timer state for next phase
    setPhaseElapsedTime(0);
    setCurrentPhaseStartTime(null);
    setIsTimerRunning(false);

    // Auto-start next phase if configured
    if ((currentPhase === 'work' && config.autoStartBreaks) ||
        (currentPhase !== 'work' && config.autoStartPomodoros)) {
      setTimeout(() => {
        handleStart();
      }, 1000);
    }
  };

  // Control handlers
  const handleStart = () => {
    if (!isActive && currentPhase === 'work') {
      startCycle();
    } else if (!isActive && currentPhase !== 'work') {
      startBreak(currentPhase);
    }
    
    setCurrentPhaseStartTime(new Date());
    setIsTimerRunning(true);
    timer.start(currentPhase, projectId, description);
  };

  const handlePause = () => {
    pauseCycle();
    setIsTimerRunning(false);
    timer.pause();
  };

  const handleResume = () => {
    resumeCycle();
    setIsTimerRunning(true);
    timer.resume();
  };

  const handleStop = () => {
    resetCycle();
    setIsTimerRunning(false);
    setPhaseElapsedTime(0);
    setCurrentPhaseStartTime(null);
    timer.stop();
  };

  const handleSkip = () => {
    if (config.allowSkipBreaks || currentPhase === 'work') {
      skipCurrentPhase();
      setPhaseElapsedTime(0);
      setCurrentPhaseStartTime(null);
      setIsTimerRunning(false);
      timer.stop();
    }
  };

  const handleReset = () => {
    handleStop();
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isActive) {
      handleStart();
    }
  }, [autoStart]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phase Header */}
      <motion.div
        key={currentPhase}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl p-6 mb-6 text-center',
          'border border-gray-200 dark:border-gray-700',
          currentConfig.lightBg,
          'dark:' + currentConfig.darkBg
        )}
      >
        <div className="flex items-center justify-center space-x-3 mb-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={cn(
              'p-3 rounded-full',
              currentConfig.color,
              'text-white'
            )}
          >
            <currentConfig.icon className="w-6 h-6" />
          </motion.div>
          <div>
            <h2 className={cn(
              'text-2xl font-bold',
              currentConfig.textColor
            )}>
              {currentConfig.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {currentConfig.description}
            </p>
          </div>
        </div>

        {/* Cycle Progress */}
        {showCycleProgress && (
          <CycleIndicator
            currentCycle={pomodoroState.currentCycle}
            currentPhase={currentPhase}
            nextPhase={nextPhase}
            longBreakInterval={config.longBreakInterval}
            showNext={true}
          />
        )}
      </motion.div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <motion.div
          key={`${currentPhase}-${remainingTime}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {/* Main Time Display */}
          <div className={cn(
            'text-6xl md:text-8xl font-mono font-bold mb-4',
            currentConfig.textColor,
            isPaused && 'opacity-60'
          )}>
            {formatTime(remainingTime)}
          </div>

          {/* Progress Ring/Bar */}
          <div className="relative w-full max-w-md mx-auto mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  `bg-gradient-to-r ${currentConfig.gradient}`
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, phaseProgress)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {Math.round(phaseProgress)}% complete
            </div>
          </div>

          {/* Pulsing Animation */}
          <AnimatePresence>
            {isTimerRunning && !isPaused && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-3xl opacity-20',
                  currentConfig.color
                )}
                animate={{
                  scale: [1, 1.02, 1],
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
        </motion.div>

        {/* Status Indicators */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center space-x-2 mb-4"
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Paused
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <PomodoroControls
        currentPhase={currentPhase}
        isActive={isActive}
        isPaused={isPaused}
        isRunning={isTimerRunning}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onSkip={handleSkip}
        onReset={handleReset}
        allowSkipBreaks={config.allowSkipBreaks}
      />

      {/* Next Phase Preview */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Next: {phaseConfig[nextPhase as keyof typeof phaseConfig].label}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {getNextPhaseDuration()} min
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Today's Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {progress.completed} / {progress.goal} sessions
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress.percentage)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
          {progress.percentage}% of daily goal completed
        </div>
      </motion.div>
    </div>
  );
}
