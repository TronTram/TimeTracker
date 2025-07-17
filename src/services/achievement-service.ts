import { prisma } from '@/lib/prisma';
import { DatabaseError } from '@/lib/errors';
import type { 
  AchievementWithProgress,
  AchievementEvaluationData,
  AchievementUnlockResult,
  AchievementAnalytics,
  AchievementType
} from '@/types/achievement';
import { achievementRules, calculateAchievementProgress, shouldCelebrate } from '@/lib/achievement-rules';

export class AchievementService {
  /**
   * Get all achievements for a user with progress tracking
   */
  static async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    try {
      // Get user's unlocked achievements
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      });

      // Get all available achievements
      const allAchievements = await prisma.achievement.findMany({
        orderBy: [
          { category: 'asc' },
          { createdAt: 'asc' }
        ],
      });

      // Get evaluation data for progress calculation
      const evaluationData = await this.getEvaluationData(userId);

      // Combine and calculate progress
      const achievements: AchievementWithProgress[] = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(
          ua => ua.achievementId === achievement.id
        );

        // Calculate current progress
        const progressData = calculateAchievementProgress(achievement.type, evaluationData);

        return {
          achievement,
          isUnlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt || null,
          progress: userAchievement ? achievement.maxProgress : progressData.progress,
          progressPercentage: userAchievement ? 100 : progressData.progressPercentage,
          isRecentlyUnlocked: userAchievement ? 
            (Date.now() - new Date(userAchievement.unlockedAt || 0).getTime()) < 24 * 60 * 60 * 1000 : 
            false,
        };
      });

      return achievements;
    } catch (error) {
      console.error('Get achievements error:', error);
      throw new DatabaseError('Failed to fetch achievements');
    }
  }

  /**
   * Check and unlock achievements for a user
   */
  static async checkAndUnlockAchievements(userId: string): Promise<AchievementUnlockResult> {
    try {
      const evaluationData = await this.getEvaluationData(userId);
      const allAchievements = await prisma.achievement.findMany();
      const existingUserAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      });

      const newlyUnlocked: AchievementWithProgress[] = [];
      const updated: AchievementWithProgress[] = [];

      for (const achievement of allAchievements) {
        const progressData = calculateAchievementProgress(achievement.type, evaluationData);
        const existingUserAchievement = existingUserAchievements.find(
          ua => ua.achievementId === achievement.id
        );

        if (progressData.isUnlocked && !existingUserAchievement) {
          // New achievement unlocked
          const userAchievement = await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: achievement.maxProgress,
              unlockedAt: new Date(),
            },
            include: { achievement: true },
          });

          newlyUnlocked.push({
            achievement,
            isUnlocked: true,
            unlockedAt: userAchievement.unlockedAt,
            progress: achievement.maxProgress,
            progressPercentage: 100,
            isRecentlyUnlocked: true,
          });
        } else if (existingUserAchievement && existingUserAchievement.progress !== progressData.progress) {
          // Update existing progress
          await prisma.userAchievement.update({
            where: { id: existingUserAchievement.id },
            data: { progress: progressData.progress },
          });

          updated.push({
            achievement,
            isUnlocked: existingUserAchievement.unlockedAt !== null,
            unlockedAt: existingUserAchievement.unlockedAt,
            progress: progressData.progress,
            progressPercentage: progressData.progressPercentage,
          });
        }
      }

      // Prepare celebration data for major achievements
      let celebrationData;
      if (newlyUnlocked.length > 0) {
        const majorUnlock = newlyUnlocked.find(achievement => 
          shouldCelebrate(achievement.achievement.type)
        );

        if (majorUnlock) {
          celebrationData = {
            type: 'confetti' as const,
            achievement: majorUnlock.achievement,
            message: `Congratulations! You've unlocked "${majorUnlock.achievement.title}"!`,
          };
        }
      }

      return {
        newlyUnlocked,
        updated,
        celebrationData,
      };
    } catch (error) {
      console.error('Check achievements error:', error);
      throw new DatabaseError('Failed to check achievements');
    }
  }

  /**
   * Get achievement analytics for a user
   */
  static async getAchievementAnalytics(userId: string): Promise<AchievementAnalytics> {
    try {
      const achievements = await this.getUserAchievements(userId);
      const unlockedAchievements = achievements.filter(a => a.isUnlocked);
      const recentUnlocks = unlockedAchievements
        .filter(a => a.isRecentlyUnlocked)
        .map(a => a.achievement)
        .slice(0, 5);

      // Calculate category progress
      const categoryProgress = achievements.reduce((acc, achievement) => {
        const category = achievement.achievement.category;
        if (!acc[category]) {
          acc[category] = { total: 0, unlocked: 0, percentage: 0 };
        }
        acc[category].total++;
        if (achievement.isUnlocked) {
          acc[category].unlocked++;
        }
        return acc;
      }, {} as AchievementAnalytics['categoryProgress']);

      // Calculate percentages
      Object.keys(categoryProgress).forEach(category => {
        const cat = categoryProgress[category as keyof typeof categoryProgress];
        cat.percentage = cat.total > 0 ? (cat.unlocked / cat.total) * 100 : 0;
      });

      // Get streak data
      const streak = await prisma.streak.findFirst({
        where: { userId },
      });

      return {
        totalAchievements: achievements.length,
        unlockedAchievements: unlockedAchievements.length,
        completionPercentage: achievements.length > 0 ? 
          (unlockedAchievements.length / achievements.length) * 100 : 0,
        recentUnlocks,
        categoryProgress,
        streakData: {
          current: streak?.currentStreak || 0,
          longest: streak?.longestStreak || 0,
          daysToNextAchievement: this.calculateDaysToNextStreakAchievement(streak?.currentStreak || 0),
        },
      };
    } catch (error) {
      console.error('Get achievement analytics error:', error);
      throw new DatabaseError('Failed to fetch achievement analytics');
    }
  }

  /**
   * Get evaluation data for achievement progress calculation
   */
  private static async getEvaluationData(userId: string): Promise<AchievementEvaluationData> {
    try {
      // Get user's time sessions
      const sessions = await prisma.timeSession.findMany({
        where: { userId },
        include: { project: true },
      });

      // Get user's projects
      const projects = await prisma.project.findMany({
        where: { userId },
      });

      // Get user's streak data
      const streak = await prisma.streak.findFirst({
        where: { userId },
      });

      // Calculate totals
      const totalFocusTime = sessions
        .filter(s => s.sessionType === 'FOCUS' || s.sessionType === 'WORK')
        .reduce((sum, session) => sum + session.duration, 0);

      const totalSessions = sessions.filter(s => s.sessionType === 'FOCUS' || s.sessionType === 'WORK').length;

      // Calculate project time data
      const projectTimeData = projects.map(project => ({
        projectId: project.id,
        totalTime: sessions
          .filter(s => s.projectId === project.id)
          .reduce((sum, session) => sum + session.duration, 0),
      }));

      // Calculate daily/weekly/monthly session counts
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todaySessionCount = sessions.filter(s => 
        new Date(s.startTime) >= today
      ).length;

      const weekSessionCount = sessions.filter(s => 
        new Date(s.startTime) >= weekAgo
      ).length;

      const monthSessionCount = sessions.filter(s => 
        new Date(s.startTime) >= monthAgo
      ).length;

      return {
        userId,
        totalFocusTime,
        totalSessions,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        projectCount: projects.length,
        lastSessionTime: sessions.length > 0 ? 
          new Date(Math.max(...sessions.map(s => new Date(s.startTime).getTime()))) : 
          undefined,
        projectTimeData,
        todaySessionCount,
        weekSessionCount,
        monthSessionCount,
      };
    } catch (error) {
      console.error('Get evaluation data error:', error);
      throw new DatabaseError('Failed to get evaluation data');
    }
  }

  /**
   * Calculate days to next streak achievement
   */
  private static calculateDaysToNextStreakAchievement(currentStreak: number): number {
    const streakMilestones = [3, 7, 14, 30, 50, 100];
    const nextMilestone = streakMilestones.find(milestone => milestone > currentStreak);
    return nextMilestone ? nextMilestone - currentStreak : 0;
  }

  /**
   * Mark achievement as seen (dismiss notification)
   */
  static async markAchievementAsSeen(userId: string, achievementId: string): Promise<void> {
    try {
      await prisma.userAchievement.updateMany({
        where: {
          userId,
          achievementId,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Mark achievement as seen error:', error);
      throw new DatabaseError('Failed to mark achievement as seen');
    }
  }

  /**
   * Get recently unlocked achievements (last 24 hours)
   */
  static async getRecentlyUnlockedAchievements(userId: string): Promise<AchievementWithProgress[]> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentUnlocks = await prisma.userAchievement.findMany({
        where: {
          userId,
          unlockedAt: {
            gte: yesterday,
          },
        },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      });

      return recentUnlocks.map(userAchievement => ({
        achievement: userAchievement.achievement,
        isUnlocked: true,
        unlockedAt: userAchievement.unlockedAt,
        progress: userAchievement.achievement.maxProgress,
        progressPercentage: 100,
        isRecentlyUnlocked: true,
      }));
    } catch (error) {
      console.error('Get recently unlocked achievements error:', error);
      throw new DatabaseError('Failed to fetch recently unlocked achievements');
    }
  }
}
