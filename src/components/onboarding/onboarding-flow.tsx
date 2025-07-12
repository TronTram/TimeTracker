'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Progress } from '@/components/ui/progress';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { pomodoroPresets, availableTimezones } from '@/lib/default-preferences';
import type { UserPreferencesUpdateData } from '@/types/user';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

interface OnboardingData {
  displayName: string;
  theme: 'light' | 'dark' | 'system';
  pomodoroWorkDuration: number;
  pomodoroShortBreakDuration: number;
  pomodoroLongBreakDuration: number;
  pomodoroLongBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Welcome to Time Tracker' },
  { id: 'profile', title: 'Profile', description: 'Set up your profile' },
  { id: 'theme', title: 'Theme', description: 'Choose your preferred theme' },
  { id: 'pomodoro', title: 'Pomodoro', description: 'Configure your work sessions' },
  { id: 'notifications', title: 'Notifications', description: 'Set up notifications' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const { updateMultiplePreferences, savePreferences } = useUserPreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    theme: 'system',
    pomodoroWorkDuration: 25,
    pomodoroShortBreakDuration: 5,
    pomodoroLongBreakDuration: 15,
    pomodoroLongBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notificationsEnabled: true,
    soundEnabled: true,
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetSelect = (presetKey: keyof typeof pomodoroPresets) => {
    const preset = pomodoroPresets[presetKey];
    setData(prev => ({
      ...prev,
      pomodoroWorkDuration: preset.work,
      pomodoroShortBreakDuration: preset.shortBreak,
      pomodoroLongBreakDuration: preset.longBreak,
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save preferences
      const preferences: Partial<UserPreferencesUpdateData> = {
        theme: data.theme,
        pomodoroWorkDuration: data.pomodoroWorkDuration,
        pomodoroShortBreakDuration: data.pomodoroShortBreakDuration,
        pomodoroLongBreakDuration: data.pomodoroLongBreakDuration,
        pomodoroLongBreakInterval: data.pomodoroLongBreakInterval,
        autoStartBreaks: data.autoStartBreaks,
        autoStartPomodoros: data.autoStartPomodoros,
        notificationsEnabled: data.notificationsEnabled,
        soundEnabled: data.soundEnabled,
      };

      updateMultiplePreferences(preferences);
      await savePreferences();
      onComplete?.();
    } catch (error) {
      console.error('Failed to save onboarding preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-6">⏰</div>
            <h2 className="text-2xl font-bold mb-4">Welcome to Time Tracker!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Let's get you set up with the perfect productivity environment. 
              This will only take a few minutes.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleNext} size="lg">
                Get Started
              </Button>
              <Button variant="outline" onClick={handleSkip} size="lg">
                Skip Setup
              </Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-2">Set Up Your Profile</h2>
            <p className="text-muted-foreground mb-6">
              Let's personalize your experience
            </p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <Input
                  value={data.displayName}
                  onChange={(e) => updateData('displayName', e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-2">Choose Your Theme</h2>
            <p className="text-muted-foreground mb-6">
              Select a theme that's easy on your eyes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <Card
                  key={theme}
                  className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                    data.theme === theme ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => updateData('theme', theme)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">
                      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
                    </div>
                    <h3 className="font-semibold capitalize">{theme}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {theme === 'light' && 'Bright and clean'}
                      {theme === 'dark' && 'Easy on the eyes'}
                      {theme === 'system' && 'Follows your system'}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'pomodoro':
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-2">Configure Pomodoro Timer</h2>
            <p className="text-muted-foreground mb-6">
              Set up your work and break intervals
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Choose a preset or customize:
              </label>
              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(pomodoroPresets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetSelect(key as keyof typeof pomodoroPresets)}
                  >
                    {key === 'default' ? 'Default' : 
                     key === 'longFocus' ? 'Long Focus' : '90 Minute'}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {preset.work}m/{preset.shortBreak}m/{preset.longBreak}m
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Work (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={data.pomodoroWorkDuration}
                  onChange={(e) => updateData('pomodoroWorkDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Short Break</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={data.pomodoroShortBreakDuration}
                  onChange={(e) => updateData('pomodoroShortBreakDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Long Break</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={data.pomodoroLongBreakDuration}
                  onChange={(e) => updateData('pomodoroLongBreakDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Interval</label>
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={data.pomodoroLongBreakInterval}
                  onChange={(e) => updateData('pomodoroLongBreakInterval', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.autoStartBreaks}
                  onChange={(e) => updateData('autoStartBreaks', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-start breaks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.autoStartPomodoros}
                  onChange={(e) => updateData('autoStartPomodoros', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-start next pomodoro</span>
              </label>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-2">Notification Preferences</h2>
            <p className="text-muted-foreground mb-6">
              Choose how you'd like to be notified
            </p>
            <div className="space-y-4 max-w-md">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.notificationsEnabled}
                  onChange={(e) => updateData('notificationsEnabled', e.target.checked)}
                  className="rounded scale-110"
                />
                <div>
                  <span className="text-sm font-medium">Enable notifications</span>
                  <p className="text-xs text-muted-foreground">
                    Get notified when work sessions and breaks start/end
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.soundEnabled}
                  onChange={(e) => updateData('soundEnabled', e.target.checked)}
                  className="rounded scale-110"
                />
                <div>
                  <span className="text-sm font-medium">Enable sounds</span>
                  <p className="text-xs text-muted-foreground">
                    Play sound alerts for notifications
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Your Time Tracker is now configured and ready to help you stay productive.
            </p>
            <Button onClick={handleComplete} size="lg" disabled={isLoading}>
              {isLoading ? 'Setting Up...' : 'Start Using Time Tracker'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        {/* Progress Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold">
                Step {currentStep + 1} of {STEPS.length}
              </h1>
                             <p className="text-sm text-muted-foreground">
                 {STEPS[currentStep]?.description || ''}
               </p>
            </div>
            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Setup
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        {currentStep > 0 && currentStep < STEPS.length - 1 && (
          <div className="p-6 border-t flex justify-between">
            <Button variant="outline" onClick={handlePrev}>
              Previous
            </Button>
            <Button onClick={handleNext}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
} 