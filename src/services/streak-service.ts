import { prisma } from '@/lib/prisma';
import { DatabaseError } from '@/lib/errors';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  daysToNextMilestone: number;
  nextMilestone: number;
  streakPercentage: number;
  isActiveToday: boolean;
}

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  emoji: string;
  reward?: string;
}

export class StreakService {
  // Streak milestones for achievements and motivation
  private static readonly MILESTONES: StreakMilestone[] = [
    { days: 3, title: 'First Steps', description: 'Building consistency', emoji: '🌱', reward: 'Consistency Builder achievement' },
    { days: 7, title: 'Week Warrior', description: 'One week strong', emoji: '💪', reward: 'Weekly Streak achievement' },
    { days: 14, title: 'Two Week Champion', description: 'Habit forming', emoji: '🏃‍♂️', reward: 'Habit Formation achievement' },
    { days: 30, title: 'Monthly Master', description: 'Serious commitment', emoji: '🏆', reward: 'Monthly Streak achievement' },
    { days: 50, title: 'Consistency Pro', description: 'Exceptional dedication', emoji: '⚡', reward: 'Consistency Pro achievement' },
    { days: 100, title: 'Century Club', description: 'Legendary persistence', emoji: '🔥', reward: 'Century Streak achievement' },
    { days: 365, title: 'Year Master', description: 'Ultimate dedication', emoji: '👑', reward: 'Annual Streak achievement' },
  ];

  /**
   * Get current streak data for a user
   */
  static async getStreakData(userId: string): Promise<StreakData> {
    try {
      const streak = await prisma.streak.findUnique({
        where: { userId },
      });

      if (!streak) {
        // Create initial streak record
        const newStreak = await prisma.streak.create({
          data: {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
          },
        });

        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          daysToNextMilestone: 3, // First milestone
          nextMilestone: 3,
          streakPercentage: 0,
          isActiveToday: false,
        };
      }

      const { nextMilestone, daysToNext, progressPercentage } = this.calculateMilestoneProgress(streak.currentStreak);
      const isActiveToday = this.isActiveToday(streak.lastActiveDate);

      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        daysToNextMilestone: daysToNext,
        nextMilestone,
        streakPercentage: progressPercentage,
        isActiveToday,
      };
    } catch (error) {
      console.error('Get streak data error:', error);
      throw new DatabaseError('Failed to get streak data');
    }
  }

  /**
   * Update streak when user completes a focus session
   */
  static async updateStreak(userId: string): Promise<StreakData> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get current streak record
      let streak = await prisma.streak.findUnique({
        where: { userId },
      });

      if (!streak) {
        // Create new streak record
        streak = await prisma.streak.create({
          data: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: new Date(),
          },
        });
      } else {
        const lastActiveDate = streak.lastActiveDate;
        
        if (!lastActiveDate) {
          // First ever session
          streak = await prisma.streak.update({
            where: { userId },
            data: {
              currentStreak: 1,
              longestStreak: Math.max(1, streak.longestStreak),
              lastActiveDate: new Date(),
            },
          });
        } else {
          const lastActiveDay = new Date(lastActiveDate);
          lastActiveDay.setHours(0, 0, 0, 0);
          
          if (lastActiveDay.getTime() === today.getTime()) {
            // Already active today, no change needed
            return this.getStreakData(userId);
          } else if (lastActiveDay.getTime() === yesterday.getTime()) {
            // Continue streak from yesterday
            const newCurrentStreak = streak.currentStreak + 1;
            streak = await prisma.streak.update({
              where: { userId },
              data: {
                currentStreak: newCurrentStreak,
                longestStreak: Math.max(newCurrentStreak, streak.longestStreak),
                lastActiveDate: new Date(),
              },
            });
          } else {
            // Streak broken, start new streak
            streak = await prisma.streak.update({
              where: { userId },
              data: {
                currentStreak: 1,
                lastActiveDate: new Date(),
              },
            });
          }
        }
      }

      return this.getStreakData(userId);
    } catch (error) {
      console.error('Update streak error:', error);
      throw new DatabaseError('Failed to update streak');
    }
  }

  /**
   * Get streak milestones
   */
  static getStreakMilestones(): StreakMilestone[] {
    return [...this.MILESTONES];
  }

  /**
   * Get next milestone for current streak
   */
  static getNextMilestone(currentStreak: number): StreakMilestone | null {
    return this.MILESTONES.find(milestone => milestone.days > currentStreak) || null;
  }

  /**
   * Calculate milestone progress
   */
  private static calculateMilestoneProgress(currentStreak: number): {
    nextMilestone: number;
    daysToNext: number;
    progressPercentage: number;
  } {
    const nextMilestone = this.MILESTONES.find(m => m.days > currentStreak);
    
    if (!nextMilestone) {
      // Beyond all milestones
      const lastMilestone = this.MILESTONES[this.MILESTONES.length - 1];
      return {
        nextMilestone: lastMilestone?.days || 365,
        daysToNext: 0,
        progressPercentage: 100,
      };
    }

    const previousMilestone = this.MILESTONES
      .slice()
      .reverse()
      .find(m => m.days <= currentStreak);

    const previousDays = previousMilestone?.days || 0;
    const progress = currentStreak - previousDays;
    const total = nextMilestone.days - previousDays;
    const percentage = total > 0 ? (progress / total) * 100 : 0;

    return {
      nextMilestone: nextMilestone.days,
      daysToNext: nextMilestone.days - currentStreak,
      progressPercentage: Math.min(percentage, 100),
    };
  }

  /**
   * Check if user is active today
   */
  private static isActiveToday(lastActiveDate: Date | null): boolean {
    if (!lastActiveDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActive = new Date(lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    
    return today.getTime() === lastActive.getTime();
  }

  /**
   * Calculate streak freeze days (grace periods for maintaining streaks)
   */
  static calculateStreakFreeze(currentStreak: number): number {
    // Allow grace days based on streak length
    if (currentStreak >= 100) return 3; // 3 grace days for 100+ day streaks
    if (currentStreak >= 30) return 2;  // 2 grace days for 30+ day streaks
    if (currentStreak >= 7) return 1;   // 1 grace day for 7+ day streaks
    return 0; // No grace days for short streaks
  }

  /**
   * Get streak statistics for analytics
   */
  static async getStreakStatistics(userId: string): Promise<{
    totalStreaks: number;
    averageStreakLength: number;
    longestStreakEver: number;
    currentActiveStreak: number;
    milestonesReached: number;
    nextMilestoneTarget: StreakMilestone | null;
  }> {
    try {
      const streak = await prisma.streak.findUnique({
        where: { userId },
      });

      if (!streak) {
        return {
          totalStreaks: 0,
          averageStreakLength: 0,
          longestStreakEver: 0,
          currentActiveStreak: 0,
          milestonesReached: 0,
          nextMilestoneTarget: this.MILESTONES[0] || null,
        };
      }

      const milestonesReached = this.MILESTONES.filter(m => m.days <= streak.longestStreak).length;
      const nextMilestone = this.getNextMilestone(streak.currentStreak);

      return {
        totalStreaks: 1, // For now, tracking single streak
        averageStreakLength: streak.longestStreak,
        longestStreakEver: streak.longestStreak,
        currentActiveStreak: streak.currentStreak,
        milestonesReached,
        nextMilestoneTarget: nextMilestone,
      };
    } catch (error) {
      console.error('Get streak statistics error:', error);
      throw new DatabaseError('Failed to get streak statistics');
    }
  }

  /**
   * Reset streak (admin function or user request)
   */
  static async resetStreak(userId: string): Promise<void> {
    try {
      await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 0,
          lastActiveDate: null,
        },
      });
    } catch (error) {
      console.error('Reset streak error:', error);
      throw new DatabaseError('Failed to reset streak');
    }
  }

  /**
   * Check if streak needs maintenance (called daily)
   */
  static async maintainStreaks(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2); // Two days ago
      yesterday.setHours(0, 0, 0, 0);

      // Find streaks that haven't been active for more than 1 day (with grace period)
      const staleStreaks = await prisma.streak.findMany({
        where: {
          currentStreak: { gt: 0 },
          lastActiveDate: { lt: yesterday },
        },
      });

      // Reset stale streaks
      for (const streak of staleStreaks) {
        const graceEndDate = new Date(streak.lastActiveDate || new Date());
        graceEndDate.setDate(graceEndDate.getDate() + this.calculateStreakFreeze(streak.currentStreak) + 1);
        
        if (new Date() > graceEndDate) {
          await prisma.streak.update({
            where: { id: streak.id },
            data: { currentStreak: 0 },
          });
        }
      }
    } catch (error) {
      console.error('Maintain streaks error:', error);
      // Don't throw error for maintenance tasks
    }
  }
}

export default StreakService;
