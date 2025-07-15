// Settings for work/break durations

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePomodoroStore, usePomodoroConfig } from '@/stores/pomodoro-store';
import { PomodoroSettingsData } from '@/types/pomodoro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Coffee, 
  Target, 
  Settings, 
  Save, 
  RotateCcw,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';

interface PomodoroSettingsProps {
  onSave?: (settings: PomodoroSettingsData) => void;
  onClose?: () => void;
  className?: string;
}

export function PomodoroSettings({
  onSave,
  onClose,
  className,
}: PomodoroSettingsProps) {
  const { config, updateConfig, setDailyGoal } = usePomodoroStore();
  const currentConfig = usePomodoroConfig();

  const [settings, setSettings] = useState<PomodoroSettingsData>({
    workDuration: config.workDuration,
    shortBreakDuration: config.shortBreakDuration,
    longBreakDuration: config.longBreakDuration,
    longBreakInterval: config.longBreakInterval,
    autoStartBreaks: config.autoStartBreaks,
    autoStartPomodoros: config.autoStartPomodoros,
    dailyGoal: 8, // This should come from the store
    strictMode: config.strictMode,
    allowSkipBreaks: config.allowSkipBreaks,
    soundEnabled: config.soundEnabled,
    notificationsEnabled: config.notificationsEnabled,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: keyof PomodoroSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Update Pomodoro config
    updateConfig({
      workDuration: settings.workDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      longBreakInterval: settings.longBreakInterval,
      autoStartBreaks: settings.autoStartBreaks,
      autoStartPomodoros: settings.autoStartPomodoros,
      strictMode: settings.strictMode,
      allowSkipBreaks: settings.allowSkipBreaks,
      soundEnabled: settings.soundEnabled,
      notificationsEnabled: settings.notificationsEnabled,
    });

    setDailyGoal(settings.dailyGoal);
    
    if (onSave) {
      onSave(settings);
    }
    
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultSettings: PomodoroSettingsData = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      dailyGoal: 8,
      strictMode: true,
      allowSkipBreaks: false,
      soundEnabled: true,
      notificationsEnabled: true,
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const validateDuration = (value: number, min: number = 1, max: number = 180) => {
    return Math.max(min, Math.min(max, value));
  };

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold">Pomodoro Settings</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Duration Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Timer Durations</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Work Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Work Session</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.workDuration}
                  onChange={(e) => handleInputChange('workDuration', validateDuration(parseInt(e.target.value) || 1))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  min
                </span>
              </div>
            </div>

            {/* Short Break Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Short Break</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.shortBreakDuration}
                  onChange={(e) => handleInputChange('shortBreakDuration', validateDuration(parseInt(e.target.value) || 1, 1, 60))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  min
                </span>
              </div>
            </div>

            {/* Long Break Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Long Break</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.longBreakDuration}
                  onChange={(e) => handleInputChange('longBreakDuration', validateDuration(parseInt(e.target.value) || 1, 1, 120))}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Long Break Interval */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Long break after every
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="2"
                max="10"
                value={settings.longBreakInterval}
                onChange={(e) => handleInputChange('longBreakInterval', validateDuration(parseInt(e.target.value) || 2, 2, 10))}
                className="w-20"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">work sessions</span>
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Automation</span>
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => handleInputChange('autoStartBreaks', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-start breaks
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartPomodoros}
                onChange={(e) => handleInputChange('autoStartPomodoros', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-start work sessions
              </span>
            </label>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Behavior</span>
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.strictMode}
                onChange={(e) => handleInputChange('strictMode', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Strict mode
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enforce exact Pomodoro technique rules
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowSkipBreaks}
                onChange={(e) => handleInputChange('allowSkipBreaks', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow skipping breaks
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable skip button during break periods
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Daily Goal</span>
          </h4>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Target work sessions per day
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.dailyGoal}
                onChange={(e) => handleInputChange('dailyGoal', validateDuration(parseInt(e.target.value) || 1, 1, 20))}
                className="w-20"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">sessions</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>Sound notifications</span>
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Browser notifications
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </Button>

        <div className="flex space-x-2">
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
      >
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview
        </h5>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>Work: {settings.workDuration} min → Break: {settings.shortBreakDuration} min</div>
          <div>Long break: {settings.longBreakDuration} min (every {settings.longBreakInterval} sessions)</div>
          <div>Daily goal: {settings.dailyGoal} work sessions</div>
        </div>
      </motion.div>
    </Card>
  );
}
