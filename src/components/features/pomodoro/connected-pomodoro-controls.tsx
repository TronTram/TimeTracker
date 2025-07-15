'use client';

import React from 'react';
import { PomodoroControls } from './pomodoro-controls';
import { usePomodoroStore } from '@/stores/pomodoro-store';

interface ConnectedPomodoroControlsProps {
  disabled?: boolean;
}

export function ConnectedPomodoroControls({ 
  disabled = false 
}: ConnectedPomodoroControlsProps) {
  const pomodoroStore = usePomodoroStore();

  return (
    <PomodoroControls
      currentPhase={pomodoroStore.currentPhase}
      isActive={pomodoroStore.isActive}
      isPaused={pomodoroStore.isPaused}
      isRunning={pomodoroStore.isActive && !pomodoroStore.isPaused}
      onStart={pomodoroStore.startCycle}
      onPause={pomodoroStore.pauseCycle}
      onResume={pomodoroStore.resumeCycle}
      onStop={pomodoroStore.resetCycle}
      onSkip={pomodoroStore.skipCurrentPhase}
      onReset={pomodoroStore.resetCycle}
      allowSkipBreaks={pomodoroStore.config.allowSkipBreaks}
      disabled={disabled}
    />
  );
}
