'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { StreakService, type StreakData, type StreakMilestone } from '@/services/streak-service';
import { useToast } from '@/hooks/use-toast';

interface UseStreaksReturn {
  streakData: StreakData | null;
  milestones: StreakMilestone[];
  isLoading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
  updateStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  getNextMilestone: () => StreakMilestone | null;
  isNewRecord: boolean;
}

export function useStreaks(): UseStreaksReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [milestones] = useState<StreakMilestone[]>(StreakService.getStreakMilestones());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  /**
   * Load streak data
   */
  const loadStreakData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await StreakService.getStreakData(user.id);
      
      // Check if this is a new record
      const wasNewRecord = data.currentStreak > 0 && 
                          data.currentStreak === data.longestStreak &&
                          (!streakData || data.currentStreak > streakData.currentStreak);
      
      setStreakData(data);
      setIsNewRecord(wasNewRecord);
      
      // Show celebration for new records
      if (wasNewRecord && data.currentStreak > 1) {
        toast({
          title: '🎉 New Record!',
          description: `${data.currentStreak} day streak - your longest yet!`,
          duration: 5000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load streak data';
      setError(errorMessage);
      console.error('Load streak data error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, streakData]);

  /**
   * Update streak when user completes a session
   */
  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      
      const previousStreak = streakData?.currentStreak || 0;
      const updatedData = await StreakService.updateStreak(user.id);
      
      setStreakData(updatedData);
      
      // Check for milestone achievements
      const newStreak = updatedData.currentStreak;
      const milestone = milestones.find(m => m.days === newStreak);
      
      if (milestone && newStreak > previousStreak) {
        toast({
          title: `${milestone.emoji} ${milestone.title}!`,
          description: milestone.description,
          duration: 5000,
        });
      }
      
      // Check for new record
      if (newStreak > 0 && newStreak === updatedData.longestStreak && newStreak > previousStreak) {
        setIsNewRecord(true);
        if (newStreak > 1) {
          toast({
            title: '🎉 New Personal Record!',
            description: `${newStreak} days - your longest streak yet!`,
            duration: 5000,
          });
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update streak';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [user?.id, streakData, milestones]);

  /**
   * Reset streak (with confirmation)
   */
  const resetStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      await StreakService.resetStreak(user.id);
      
      setStreakData(prev => prev ? {
        ...prev,
        currentStreak: 0,
        lastActiveDate: null,
        daysToNextMilestone: 3,
        nextMilestone: 3,
        streakPercentage: 0,
        isActiveToday: false,
      } : null);
      
      setIsNewRecord(false);
      
      toast({
        title: 'Streak Reset',
        description: 'Your streak has been reset. Ready for a fresh start!',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset streak';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [user?.id]);

  /**
   * Refresh streak data
   */
  const refreshStreak = useCallback(async () => {
    await loadStreakData();
  }, [loadStreakData]);

  /**
   * Get next milestone
   */
  const getNextMilestone = useCallback((): StreakMilestone | null => {
    if (!streakData) return milestones[0] || null;
    return StreakService.getNextMilestone(streakData.currentStreak);
  }, [streakData, milestones]);

  // Load data on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadStreakData();
    }
  }, [user?.id, loadStreakData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      loadStreakData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.id, loadStreakData]);

  return {
    streakData,
    milestones,
    isLoading,
    error,
    refreshStreak,
    updateStreak,
    resetStreak,
    getNextMilestone,
    isNewRecord,
  };
}

export default useStreaks;
