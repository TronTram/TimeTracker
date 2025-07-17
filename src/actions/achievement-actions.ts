'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { AchievementService } from '@/services/achievement-service';
import type { 
  AchievementWithProgress,
  AchievementUnlockResult,
  AchievementAnalytics,
  AchievementFilter,
  AchievementSort 
} from '@/types/achievement';

/**
 * Get all achievements for the current user
 */
export async function getAchievements(): Promise<AchievementWithProgress[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await AchievementService.getUserAchievements(userId);
}

/**
 * Check and unlock achievements for the current user
 */
export async function checkAndUnlockAchievements(): Promise<AchievementUnlockResult> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const result = await AchievementService.checkAndUnlockAchievements(userId);
  
  // Revalidate pages that show achievement data
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  revalidatePath('/achievements');
  
  return result;
}

/**
 * Get achievement analytics for the current user
 */
export async function getAchievementAnalytics(): Promise<AchievementAnalytics> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await AchievementService.getAchievementAnalytics(userId);
}

/**
 * Get recently unlocked achievements
 */
export async function getRecentlyUnlockedAchievements(): Promise<AchievementWithProgress[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await AchievementService.getRecentlyUnlockedAchievements(userId);
}

/**
 * Mark achievement as seen (dismiss notification)
 */
export async function markAchievementAsSeen(achievementId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  await AchievementService.markAchievementAsSeen(userId, achievementId);
  revalidatePath('/dashboard');
}

/**
 * Filter and sort achievements
 */
export async function getFilteredAchievements(
  filter: AchievementFilter = 'all',
  sort: AchievementSort = 'category'
): Promise<AchievementWithProgress[]> {
  const achievements = await getAchievements();

  // Apply filter
  let filtered = achievements;
  if (filter === 'unlocked') {
    filtered = achievements.filter(a => a.isUnlocked);
  } else if (filter === 'locked') {
    filtered = achievements.filter(a => !a.isUnlocked);
  } else if (filter !== 'all') {
    // Filter by category
    filtered = achievements.filter(a => 
      a.achievement.category.toLowerCase() === filter.toLowerCase()
    );
  }

  // Apply sort
  switch (sort) {
    case 'name':
      filtered.sort((a, b) => a.achievement.title.localeCompare(b.achievement.title));
      break;
    case 'progress':
      filtered.sort((a, b) => b.progressPercentage - a.progressPercentage);
      break;
    case 'unlocked-date':
      filtered.sort((a, b) => {
        if (!a.unlockedAt && !b.unlockedAt) return 0;
        if (!a.unlockedAt) return 1;
        if (!b.unlockedAt) return -1;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      });
      break;
    case 'category':
    default:
      filtered.sort((a, b) => {
        const categoryCompare = a.achievement.category.localeCompare(b.achievement.category);
        if (categoryCompare !== 0) return categoryCompare;
        return a.achievement.title.localeCompare(b.achievement.title);
      });
      break;
  }

  return filtered;
}

/**
 * Trigger achievement check after a session is completed
 * This should be called from timer completion actions
 */
export async function triggerAchievementCheck(): Promise<AchievementUnlockResult> {
  return await checkAndUnlockAchievements();
}

/**
 * Get achievement progress for a specific achievement type
 */
export async function getAchievementProgress(achievementType: string): Promise<AchievementWithProgress | null> {
  const achievements = await getAchievements();
  return achievements.find(a => a.achievement.type === achievementType) || null;
}
