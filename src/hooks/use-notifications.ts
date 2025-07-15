/**
 * Hook for notification permission and display
 */

import { useState, useEffect, useCallback } from 'react';
import { UseNotificationsReturn, NotificationType, BrowserNotification } from '@/types/audio';
import { notificationService, presetNotifications } from '@/services/notification-service';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { preferences } = useUserPreferences();

  // Initialize permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('denied');
    }
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await notificationService.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  /**
   * Show a notification
   */
  const showNotification = useCallback(async (notification: BrowserNotification): Promise<void> => {
    if (!preferences.notificationsEnabled) {
      return;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await notificationService.show(notification);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission, preferences.notificationsEnabled]);

  /**
   * Show simple notification
   */
  const showSimple = useCallback(async (
    title: string, 
    body: string, 
    type: NotificationType = 'reminder'
  ): Promise<void> => {
    if (!preferences.notificationsEnabled) {
      return;
    }

    try {
      await notificationService.showSimple(title, body, type);
    } catch (error) {
      console.error('Error showing simple notification:', error);
    }
  }, [preferences.notificationsEnabled]);

  /**
   * Notify when session is complete
   */
  const notifySessionComplete = useCallback(async (
    sessionType: string, 
    duration: number
  ): Promise<void> => {
    if (!preferences.notificationsEnabled) {
      return;
    }

    try {
      await presetNotifications.sessionComplete(duration);
    } catch (error) {
      console.error('Error showing session complete notification:', error);
    }
  }, [preferences.notificationsEnabled]);

  /**
   * Notify when break starts
   */
  const notifyBreakStart = useCallback(async (
    breakType: string, 
    duration: number
  ): Promise<void> => {
    if (!preferences.notificationsEnabled) {
      return;
    }

    try {
      await presetNotifications.breakStart(breakType, duration);
    } catch (error) {
      console.error('Error showing break start notification:', error);
    }
  }, [preferences.notificationsEnabled]);

  /**
   * Notify when Pomodoro cycle is complete
   */
  const notifyPomodoroComplete = useCallback(async (
    cyclesCompleted: number
  ): Promise<void> => {
    if (!preferences.notificationsEnabled) {
      return;
    }

    try {
      await presetNotifications.pomodoroComplete(cyclesCompleted);
    } catch (error) {
      console.error('Error showing Pomodoro complete notification:', error);
    }
  }, [preferences.notificationsEnabled]);

  // Computed values
  const hasPermission = permission === 'granted';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return {
    permission,
    hasPermission,
    requestPermission,
    showNotification,
    showSimple,
    notifySessionComplete,
    notifyBreakStart,
    notifyPomodoroComplete,
  };
}

/**
 * Hook for managing notification settings and preferences
 */
export function useNotificationSettings() {
  const { preferences, updatePreference } = useUserPreferences();
  const { permission, requestPermission } = useNotifications();

  const toggleNotifications = useCallback(async () => {
    if (!preferences.notificationsEnabled && permission !== 'granted') {
      // Request permission first
      const granted = await requestPermission();
      if (granted) {
        updatePreference('notificationsEnabled', true);
      }
    } else {
      updatePreference('notificationsEnabled', !preferences.notificationsEnabled);
    }
  }, [preferences.notificationsEnabled, permission, requestPermission, updatePreference]);

  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const needsPermission = permission === 'default' && preferences.notificationsEnabled;
  const isBlocked = permission === 'denied';

  return {
    isEnabled: preferences.notificationsEnabled,
    permission,
    isSupported: isNotificationSupported,
    needsPermission,
    isBlocked,
    toggleNotifications,
    requestPermission,
  };
}
