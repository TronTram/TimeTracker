import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AchievementWithProgress,
  AchievementAnalytics,
  AchievementUnlockResult,
  CelebrationAnimationType 
} from '@/types/achievement';

interface AchievementNotification {
  id: string;
  achievement: AchievementWithProgress;
  timestamp: Date;
  isShown: boolean;
}

interface CelebrationState {
  isVisible: boolean;
  achievement: AchievementWithProgress | null;
  animationType: CelebrationAnimationType;
  message: string;
}

interface AchievementState {
  // Achievement data
  achievements: AchievementWithProgress[];
  analytics: AchievementAnalytics | null;
  
  // Notification state
  notifications: AchievementNotification[];
  unreadCount: number;
  
  // Celebration state
  celebration: CelebrationState;
  
  // UI state
  showNotifications: boolean;
  autoCheckEnabled: boolean;
  soundEnabled: boolean;
  
  // Actions
  setAchievements: (achievements: AchievementWithProgress[]) => void;
  setAnalytics: (analytics: AchievementAnalytics) => void;
  addNotification: (achievement: AchievementWithProgress) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  showCelebration: (achievement: AchievementWithProgress, animationType?: CelebrationAnimationType, message?: string) => void;
  hideCelebration: () => void;
  updateFromUnlockResult: (result: AchievementUnlockResult) => void;
  toggleNotifications: () => void;
  toggleAutoCheck: () => void;
  toggleSound: () => void;
  
  // Computed getters
  getUnlockedCount: () => number;
  getTotalProgress: () => number;
  getRecentUnlocks: () => AchievementWithProgress[];
  getAchievementsByCategory: (category: string) => AchievementWithProgress[];
  getNextAchievement: () => AchievementWithProgress | null;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      // Initial state
      achievements: [],
      analytics: null,
      notifications: [],
      unreadCount: 0,
      celebration: {
        isVisible: false,
        achievement: null,
        animationType: 'confetti',
        message: '',
      },
      showNotifications: true,
      autoCheckEnabled: true,
      soundEnabled: true,

      // Actions
      setAchievements: (achievements) => {
        set({ achievements });
      },

      setAnalytics: (analytics) => {
        set({ analytics });
      },

      addNotification: (achievement) => {
        const notification: AchievementNotification = {
          id: `${achievement.achievement.id}_${Date.now()}`,
          achievement,
          timestamp: new Date(),
          isShown: false,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, isShown: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      showCelebration: (achievement, animationType = 'confetti', message = '') => {
        set({
          celebration: {
            isVisible: true,
            achievement,
            animationType,
            message: message || `Congratulations! You've unlocked "${achievement.achievement.title}"!`,
          },
        });

        // Auto-hide celebration after 5 seconds
        setTimeout(() => {
          get().hideCelebration();
        }, 5000);
      },

      hideCelebration: () => {
        set((state) => ({
          celebration: {
            ...state.celebration,
            isVisible: false,
          },
        }));
      },

      updateFromUnlockResult: (result) => {
        const state = get();

        // Add notifications for newly unlocked achievements
        result.newlyUnlocked.forEach(achievement => {
          state.addNotification(achievement);
        });

        // Show celebration for major achievements
        if (result.celebrationData) {
          state.showCelebration(
            result.newlyUnlocked.find(a => a.achievement.id === result.celebrationData?.achievement.id)!,
            result.celebrationData.type,
            result.celebrationData.message
          );
        }
      },

      toggleNotifications: () => {
        set((state) => ({
          showNotifications: !state.showNotifications,
        }));
      },

      toggleAutoCheck: () => {
        set((state) => ({
          autoCheckEnabled: !state.autoCheckEnabled,
        }));
      },

      toggleSound: () => {
        set((state) => ({
          soundEnabled: !state.soundEnabled,
        }));
      },

      // Computed getters
      getUnlockedCount: () => {
        const { achievements } = get();
        return achievements.filter(a => a.isUnlocked).length;
      },

      getTotalProgress: () => {
        const { achievements } = get();
        if (achievements.length === 0) return 0;
        const unlockedCount = achievements.filter(a => a.isUnlocked).length;
        return (unlockedCount / achievements.length) * 100;
      },

      getRecentUnlocks: () => {
        const { achievements } = get();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return achievements.filter(a => 
          a.isUnlocked && 
          a.unlockedAt && 
          new Date(a.unlockedAt) > yesterday
        );
      },

      getAchievementsByCategory: (category) => {
        const { achievements } = get();
        return achievements.filter(a => 
          a.achievement.category.toLowerCase() === category.toLowerCase()
        );
      },

      getNextAchievement: () => {
        const { achievements } = get();
        const locked = achievements.filter(a => !a.isUnlocked);
        if (locked.length === 0) return null;
        
        const sorted = locked.sort((a, b) => b.progressPercentage - a.progressPercentage);
        return sorted[0] || null;
      },
    }),
    {
      name: 'achievement-store',
      partialize: (state) => ({
        showNotifications: state.showNotifications,
        autoCheckEnabled: state.autoCheckEnabled,
        soundEnabled: state.soundEnabled,
        // Don't persist dynamic data like achievements, notifications, etc.
      }),
    }
  )
);

// Selector hooks for better performance
export const useAchievements = () => useAchievementStore(state => state.achievements);
export const useAchievementAnalytics = () => useAchievementStore(state => state.analytics);
export const useAchievementNotifications = () => useAchievementStore(state => state.notifications);
export const useAchievementCelebration = () => useAchievementStore(state => state.celebration);
export const useAchievementSettings = () => useAchievementStore(state => ({
  showNotifications: state.showNotifications,
  autoCheckEnabled: state.autoCheckEnabled,
  soundEnabled: state.soundEnabled,
}));
