'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserWithPreferences, UserPreferencesUpdateData } from '@/types/user';
import { defaultUserPreferences, DEFAULT_THEME } from '@/lib/default-preferences';

interface UserState {
  // User data
  user: UserWithPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Preferences state
  preferences: UserPreferencesUpdateData;
  unsavedChanges: boolean;
  
  // Actions
  setUser: (user: UserWithPreferences | null) => void;
  updatePreferences: (preferences: Partial<UserPreferencesUpdateData>) => void;
  resetPreferences: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markChangesSaved: () => void;
  
  // Theme helpers
  getTheme: () => string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      preferences: {
        theme: DEFAULT_THEME as 'light' | 'dark' | 'system',
        ...defaultUserPreferences,
      },
      unsavedChanges: false,

      // Actions
      setUser: (user) => {
        set((state) => {
          // If user has preferences, update local preferences state
          const newPreferences = user?.preferences
            ? {
                theme: user.preferences.theme as 'light' | 'dark' | 'system',
                pomodoroWorkDuration: user.preferences.pomodoroWorkDuration,
                pomodoroShortBreakDuration: user.preferences.pomodoroShortBreakDuration,
                pomodoroLongBreakDuration: user.preferences.pomodoroLongBreakDuration,
                pomodoroLongBreakInterval: user.preferences.pomodoroLongBreakInterval,
                autoStartBreaks: user.preferences.autoStartBreaks,
                autoStartPomodoros: user.preferences.autoStartPomodoros,
                soundEnabled: user.preferences.soundEnabled,
                notificationsEnabled: user.preferences.notificationsEnabled,
                defaultProjectId: user.preferences.defaultProjectId,
              }
            : state.preferences;

          return {
            user,
            preferences: newPreferences,
            error: null,
            unsavedChanges: false,
          };
        });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
          unsavedChanges: true,
        }));
      },

      resetPreferences: () => {
        set((state) => ({
          preferences: state.user?.preferences
            ? {
                theme: state.user.preferences.theme as 'light' | 'dark' | 'system',
                pomodoroWorkDuration: state.user.preferences.pomodoroWorkDuration,
                pomodoroShortBreakDuration: state.user.preferences.pomodoroShortBreakDuration,
                pomodoroLongBreakDuration: state.user.preferences.pomodoroLongBreakDuration,
                pomodoroLongBreakInterval: state.user.preferences.pomodoroLongBreakInterval,
                autoStartBreaks: state.user.preferences.autoStartBreaks,
                autoStartPomodoros: state.user.preferences.autoStartPomodoros,
                soundEnabled: state.user.preferences.soundEnabled,
                notificationsEnabled: state.user.preferences.notificationsEnabled,
                defaultProjectId: state.user.preferences.defaultProjectId,
              }
            : {
                theme: DEFAULT_THEME as 'light' | 'dark' | 'system',
                ...defaultUserPreferences,
              },
          unsavedChanges: false,
        }));
      },

      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      markChangesSaved: () => set({ unsavedChanges: false }),

      // Theme helpers
      getTheme: () => get().preferences.theme || DEFAULT_THEME,
      
      setTheme: (theme) => {
        get().updatePreferences({ theme });
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        preferences: state.preferences,
        // Don't persist user data or loading states
      }),
    }
  )
); 