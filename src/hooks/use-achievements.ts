'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getAchievements,
  getAchievementAnalytics,
  getRecentlyUnlockedAchievements,
  getFilteredAchievements,
  markAchievementAsSeen,
  triggerAchievementCheck,
} from '@/actions/achievement-actions';
import type { 
  AchievementWithProgress,
  AchievementAnalytics,
  AchievementFilter,
  AchievementSort,
  AchievementUnlockResult,
} from '@/types/achievement';
import { useToast } from '@/hooks/use-toast';

interface UseAchievementsOptions {
  autoCheck?: boolean;
  filter?: AchievementFilter;
  sort?: AchievementSort;
}

export function useAchievements(options: UseAchievementsOptions = {}) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [analytics, setAnalytics] = useState<AchievementAnalytics | null>(null);
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { autoCheck = false, filter = 'all', sort = 'category' } = options;

  // Load achievements data
  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [achievementsData, analyticsData, recentData] = await Promise.all([
        getFilteredAchievements(filter, sort),
        getAchievementAnalytics(),
        getRecentlyUnlockedAchievements(),
      ]);

      setAchievements(achievementsData);
      setAnalytics(analyticsData);
      setRecentUnlocks(recentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(errorMessage);
      console.error('Achievement loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, sort]);

  // Check for new achievements
  const checkAchievements = useCallback(async (): Promise<AchievementUnlockResult> => {
    try {
      const result = await triggerAchievementCheck();
      
      // Show notifications for newly unlocked achievements
      if (result.newlyUnlocked.length > 0) {
        result.newlyUnlocked.forEach(achievement => {
          toast({
            title: 'Achievement Unlocked! 🏆',
            description: achievement.achievement.title,
            duration: 5000,
          });
        });

        // Reload achievements to show updated data
        await loadAchievements();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check achievements';
      setError(errorMessage);
      console.error('Achievement check error:', err);
      return { newlyUnlocked: [], updated: [] };
    }
  }, [loadAchievements, toast]);

  // Mark achievement as seen
  const markAsSeen = useCallback(async (achievementId: string) => {
    try {
      await markAchievementAsSeen(achievementId);
      // Update local state to remove from recent unlocks
      setRecentUnlocks(prev => prev.filter(a => a.achievement.id !== achievementId));
    } catch (err) {
      console.error('Mark achievement as seen error:', err);
    }
  }, []);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: string) => {
    return achievements.filter(a => 
      a.achievement.category.toLowerCase() === category.toLowerCase()
    );
  }, [achievements]);

  // Get unlocked achievements count
  const getUnlockedCount = useCallback(() => {
    return achievements.filter(a => a.isUnlocked).length;
  }, [achievements]);

  // Get total progress percentage
  const getTotalProgress = useCallback(() => {
    if (achievements.length === 0) return 0;
    const unlockedCount = getUnlockedCount();
    return (unlockedCount / achievements.length) * 100;
  }, [achievements, getUnlockedCount]);

  // Get next achievement to unlock
  const getNextAchievement = useCallback(() => {
    return achievements
      .filter(a => !a.isUnlocked)
      .sort((a, b) => b.progressPercentage - a.progressPercentage)[0] || null;
  }, [achievements]);

  // Auto-load achievements on mount
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Auto-check achievements if enabled
  useEffect(() => {
    if (autoCheck && !isLoading) {
      const interval = setInterval(() => {
        checkAchievements();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [autoCheck, isLoading, checkAchievements]);

  return {
    // Data
    achievements,
    analytics,
    recentUnlocks,
    
    // State
    isLoading,
    error,
    
    // Actions
    loadAchievements,
    checkAchievements,
    markAsSeen,
    
    // Helpers
    getAchievementsByCategory,
    getUnlockedCount,
    getTotalProgress,
    getNextAchievement,
    
    // Computed values
    totalAchievements: achievements.length,
    unlockedAchievements: getUnlockedCount(),
    progressPercentage: getTotalProgress(),
    nextAchievement: getNextAchievement(),
    hasRecentUnlocks: recentUnlocks.length > 0,
  };
}

// Separate hook for triggering achievement checks from other components
export function useAchievementTrigger() {
  const { toast } = useToast();

  const triggerCheck = useCallback(async () => {
    try {
      const result = await triggerAchievementCheck();
      
      if (result.newlyUnlocked.length > 0) {
        result.newlyUnlocked.forEach(achievement => {
          toast({
            title: 'Achievement Unlocked! 🏆',
            description: achievement.achievement.title,
            duration: 5000,
          });
        });
      }

      return result;
    } catch (err) {
      console.error('Achievement trigger error:', err);
      return { newlyUnlocked: [], updated: [] };
    }
  }, [toast]);

  return { triggerCheck };
}
