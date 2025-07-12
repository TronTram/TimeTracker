'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { defaultUserPreferences, pomodoroPresets, availableTimezones } from '@/lib/default-preferences';
import type { UserPreferencesUpdateData } from '@/types/user';

interface UserPreferencesFormProps {
  onSave?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function UserPreferencesForm({ 
  onSave, 
  onCancel, 
  showActions = true 
}: UserPreferencesFormProps) {
  const { preferences, updateMultiplePreferences, savePreferences, isLoading } = useUserPreferences();
  const [formData, setFormData] = useState<UserPreferencesUpdateData>(
    preferences || defaultUserPreferences
  );
  const [isDirty, setIsDirty] = useState(false);

  const handleInputChange = (field: keyof UserPreferencesUpdateData, value: any) => {
    setFormData((prev: UserPreferencesUpdateData) => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handlePresetSelect = (presetKey: keyof typeof pomodoroPresets) => {
    const preset = pomodoroPresets[presetKey];
    setFormData((prev: UserPreferencesUpdateData) => ({
      ...prev,
      pomodoroWorkDuration: preset.work,
      pomodoroShortBreakDuration: preset.shortBreak,
      pomodoroLongBreakDuration: preset.longBreak,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      updateMultiplePreferences(formData);
      const result = await savePreferences();
      if (result.success) {
        setIsDirty(false);
        onSave?.();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleReset = () => {
    setFormData(preferences || defaultUserPreferences);
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            Theme Preference
          </label>
          <Dropdown
            trigger={
              <Button variant="outline" className="w-full justify-between">
                {formData.theme === 'light' ? 'Light' : 
                 formData.theme === 'dark' ? 'Dark' : 'System'}
              </Button>
            }
          >
            <DropdownItem onClick={() => handleInputChange('theme', 'light')}>
              Light
            </DropdownItem>
            <DropdownItem onClick={() => handleInputChange('theme', 'dark')}>
              Dark
            </DropdownItem>
            <DropdownItem onClick={() => handleInputChange('theme', 'system')}>
              System
            </DropdownItem>
          </Dropdown>
        </div>
      </Card>

      {/* Pomodoro Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pomodoro Settings</h3>
          <Dropdown
            trigger={
              <Button variant="outline" size="sm">
                Use Preset
              </Button>
            }
          >
            <DropdownItem onClick={() => handlePresetSelect('default')}>
              <div>
                <div className="font-medium">Default</div>
                <div className="text-xs text-muted-foreground">
                  25m / 5m / 15m
                </div>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => handlePresetSelect('longFocus')}>
              <div>
                <div className="font-medium">Long Focus</div>
                <div className="text-xs text-muted-foreground">
                  50m / 10m / 30m
                </div>
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => handlePresetSelect('90Minute')}>
              <div>
                <div className="font-medium">90 Minute</div>
                <div className="text-xs text-muted-foreground">
                  90m / 15m / 30m
                </div>
              </div>
            </DropdownItem>
          </Dropdown>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Work Duration (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="120"
              value={formData.pomodoroWorkDuration || 25}
              onChange={(e) => handleInputChange('pomodoroWorkDuration', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Short Break (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="30"
              value={formData.pomodoroShortBreakDuration || 5}
              onChange={(e) => handleInputChange('pomodoroShortBreakDuration', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Long Break (minutes)
            </label>
            <Input
              type="number"
              min="1"
              max="60"
              value={formData.pomodoroLongBreakDuration || 15}
              onChange={(e) => handleInputChange('pomodoroLongBreakDuration', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Long Break Interval
            </label>
            <Input
              type="number"
              min="2"
              max="10"
              value={formData.pomodoroLongBreakInterval || 4}
              onChange={(e) => handleInputChange('pomodoroLongBreakInterval', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoStartBreaks || false}
              onChange={(e) => handleInputChange('autoStartBreaks', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-start breaks</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoStartPomodoros || false}
              onChange={(e) => handleInputChange('autoStartPomodoros', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-start next pomodoro</span>
          </label>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.notificationsEnabled || false}
              onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Enable notifications</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.soundEnabled || false}
              onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Enable sounds</span>
          </label>
        </div>
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave} 
            disabled={!isDirty || isLoading}
            className="min-w-20"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!isDirty}
          >
            Reset
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 