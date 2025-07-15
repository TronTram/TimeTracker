/**
 * Browser notification service with permission handling
 */

import { BrowserNotification, NotificationService, NotificationType } from '@/types/audio';
import { STORAGE_KEYS } from '@/lib/constants';

class NotificationServiceImpl implements NotificationService {
  private notifications: Map<string, Notification> = new Map();

  /**
   * Request notification permission from the browser
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.savePermissionPreference(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if we have notification permission
   */
  hasPermission(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Show a notification
   */
  async show(notification: BrowserNotification): Promise<void> {
    if (!this.hasPermission()) {
      console.warn('No notification permission');
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        tag: notification.tag || notification.id,
        silent: notification.silent || false,
        data: notification.data,
        badge: '/favicon.ico',
        requireInteraction: this.shouldRequireInteraction(notification.type),
      });

      // Store reference for cleanup
      this.notifications.set(notification.id, browserNotification);

      // Set up event handlers
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        this.handleNotificationClick(notification);
      };

      browserNotification.onclose = () => {
        this.notifications.delete(notification.id);
      };

      browserNotification.onerror = (error) => {
        console.error('Notification error:', error);
        this.notifications.delete(notification.id);
      };

      // Auto-close after delay (except for important notifications)
      if (!this.shouldRequireInteraction(notification.type)) {
        setTimeout(() => {
          browserNotification.close();
        }, this.getNotificationDuration(notification.type));
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show a simple notification with minimal setup
   */
  async showSimple(
    title: string, 
    body: string, 
    type: NotificationType = 'reminder'
  ): Promise<void> {
    const notification: BrowserNotification = {
      id: `simple-${Date.now()}`,
      type,
      title,
      body,
      icon: this.getNotificationIcon(type),
    };

    await this.show(notification);
  }

  /**
   * Clean up all notifications
   */
  cleanup(): void {
    this.notifications.forEach((notification) => {
      notification.close();
    });
    this.notifications.clear();
  }

  /**
   * Get the appropriate icon for notification type
   */
  private getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      'session-start': '/icons/timer-start.png',
      'session-complete': '/icons/timer-complete.png',
      'break-start': '/icons/break-start.png',
      'break-complete': '/icons/break-complete.png',
      'pomodoro-complete': '/icons/pomodoro-complete.png',
      'achievement-unlocked': '/icons/achievement.png',
      'reminder': '/icons/reminder.png',
    };

    return iconMap[type] || '/favicon.ico';
  }

  /**
   * Determine if notification should require user interaction
   */
  private shouldRequireInteraction(type: NotificationType): boolean {
    // Important notifications that should stay visible
    const importantTypes: NotificationType[] = [
      'achievement-unlocked',
      'pomodoro-complete',
    ];
    
    return importantTypes.includes(type);
  }

  /**
   * Get notification display duration in milliseconds
   */
  private getNotificationDuration(type: NotificationType): number {
    const durationMap: Record<NotificationType, number> = {
      'session-start': 3000,
      'session-complete': 5000,
      'break-start': 4000,
      'break-complete': 4000,
      'pomodoro-complete': 8000,
      'achievement-unlocked': 10000,
      'reminder': 5000,
    };

    return durationMap[type] || 5000;
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(notification: BrowserNotification): void {
    // Emit custom events for the application to handle
    window.dispatchEvent(new CustomEvent('notification-click', {
      detail: { notification }
    }));

    // Type-specific actions
    switch (notification.type) {
      case 'session-complete':
      case 'break-complete':
        // Could navigate to analytics or session summary
        break;
      case 'achievement-unlocked':
        // Could navigate to achievements page
        break;
      case 'pomodoro-complete':
        // Could show cycle summary
        break;
      default:
        // Default action: just focus the window
        break;
    }
  }

  /**
   * Save permission preference to local storage
   */
  private savePermissionPreference(permission: NotificationPermission): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PERMISSIONS, 
        JSON.stringify({
          permission,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving notification permission:', error);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationServiceImpl();

// Preset notification functions for common use cases
export const presetNotifications = {
  /**
   * Notify when a work session is complete
   */
  sessionComplete: (duration: number) => {
    const minutes = Math.round(duration / 60);
    return notificationService.showSimple(
      'Work Session Complete! 🎉',
      `Great job! You focused for ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      'session-complete'
    );
  },

  /**
   * Notify when a break starts
   */
  breakStart: (breakType: string, duration: number) => {
    const minutes = Math.round(duration / 60);
    return notificationService.showSimple(
      `${breakType} Break Time! ☕`,
      `Take a ${minutes}-minute break. You've earned it!`,
      'break-start'
    );
  },

  /**
   * Notify when a break is complete
   */
  breakComplete: (duration: number) => {
    const minutes = Math.round(duration / 60);
    return notificationService.showSimple(
      'Break Complete! 💪',
      `${minutes}-minute break is over. Ready to get back to work?`,
      'break-complete'
    );
  },

  /**
   * Notify when a full Pomodoro cycle is complete
   */
  pomodoroComplete: (cyclesCompleted: number) => {
    return notificationService.showSimple(
      'Pomodoro Cycle Complete! 🍅',
      `Awesome! You've completed ${cyclesCompleted} Pomodoro cycle${cyclesCompleted === 1 ? '' : 's'} today.`,
      'pomodoro-complete'
    );
  },

  /**
   * Notify about achievements
   */
  achievementUnlocked: (achievementName: string) => {
    return notificationService.showSimple(
      'Achievement Unlocked! 🏆',
      `Congratulations! You earned: ${achievementName}`,
      'achievement-unlocked'
    );
  },

  /**
   * Session start reminder
   */
  sessionStart: (sessionType: string) => {
    return notificationService.showSimple(
      `${sessionType} Session Started! ⏰`,
      'Time to focus. You\'ve got this!',
      'session-start'
    );
  },
};

// Export the service
export default notificationService;
