'use client';

import { useState, useTransition } from 'react';
import { useUserStore } from '@/stores/user-store';
import { 
  updateUserPreferences, 
  resetUserPreferences, 
  getUserPreferences 
} from '@/actions/user-preferences-actions';
import type { UserPreferencesUpdateData } from '@/types/user';

export function useUserPreferences() {
  const {
    preferences,
    unsavedChanges,
    updatePreferences,
    resetPreferences,
    markChangesSaved,
    setError,
    setLoading,
    error,
    isLoading,
  } = useUserStore();

  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Save preferences to the server
   */
  const savePreferences = async () => {
    if (!unsavedChanges) return { success: true };

    setSaveError(null);
    setLoading(true);

    try {
      const result = await updateUserPreferences(preferences);
      
      if (result.success) {
        markChangesSaved();
        return { success: true };
      } else {
        setSaveError(result.error || 'Failed to save preferences');
        setError(result.error || 'Failed to save preferences');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setSaveError(errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset preferences to defaults
   */
  const resetToDefaults = async () => {
    setSaveError(null);
    setLoading(true);

    try {
      const result = await resetUserPreferences();
      
      if (result.success && result.data) {
        resetPreferences();
        markChangesSaved();
        return { success: true };
      } else {
        setSaveError(result.error || 'Failed to reset preferences');
        setError(result.error || 'Failed to reset preferences');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setSaveError(errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh preferences from server
   */
  const refreshPreferences = async () => {
    setLoading(true);
    setSaveError(null);

    try {
      const result = await getUserPreferences();
      
      if (result.success && result.data) {
        // Update store with server data
        updatePreferences(result.data);
        markChangesSaved();
        return { success: true };
      } else {
        setError(result.error || 'Failed to refresh preferences');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh preferences';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a single preference with optimistic updates
   */
  const updatePreference = (key: keyof UserPreferencesUpdateData, value: any) => {
    updatePreferences({ [key]: value });
  };

  /**
   * Update multiple preferences at once
   */
  const updateMultiplePreferences = (updates: Partial<UserPreferencesUpdateData>) => {
    updatePreferences(updates);
  };

  /**
   * Save preferences with transition for better UX
   */
  const saveWithTransition = () => {
    startTransition(async () => {
      await savePreferences();
    });
  };

  /**
   * Reset preferences with transition
   */
  const resetWithTransition = () => {
    startTransition(async () => {
      await resetToDefaults();
    });
  };

  return {
    // State
    preferences,
    hasUnsavedChanges: unsavedChanges,
    isLoading: isLoading || isPending,
    error: saveError || error,
    
    // Actions
    updatePreference,
    updateMultiplePreferences,
    savePreferences,
    resetToDefaults,
    refreshPreferences,
    saveWithTransition,
    resetWithTransition,
    
    // Utilities
    discardChanges: resetPreferences,
    clearError: () => {
      setSaveError(null);
      setError(null);
    },
    
    // Helpers for common preferences
    setTheme: (theme: 'light' | 'dark' | 'system') => updatePreference('theme', theme),
    toggleSounds: () => updatePreference('soundEnabled', !preferences.soundEnabled),
    toggleNotifications: () => updatePreference('notificationsEnabled', !preferences.notificationsEnabled),
    toggleAutoStartBreaks: () => updatePreference('autoStartBreaks', !preferences.autoStartBreaks),
    toggleAutoStartPomodoros: () => updatePreference('autoStartPomodoros', !preferences.autoStartPomodoros),
  };
} 