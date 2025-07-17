import { MOTIVATIONAL_QUOTES } from '@/data/motivational-quotes';
import { MotivationalQuote } from '@/types/gamification';

export interface QuoteContext {
  streak?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  category?: string;
  recentAchievements?: boolean;
  userMood?: 'motivated' | 'struggling' | 'neutral';
}

export class MotivationService {
  /**
   * Get a personalized motivational quote
   */
  static getPersonalizedQuote(context: QuoteContext = {}): MotivationalQuote {
    let filteredQuotes = [...MOTIVATIONAL_QUOTES];

    // Filter by category if specified
    if (context.category) {
      filteredQuotes = filteredQuotes.filter(q => 
        q.category === context.category || q.category === 'general'
      );
    }

    // Filter by time of day
    if (context.timeOfDay) {
      filteredQuotes = filteredQuotes.filter(q => 
        !q.timeOfDay || q.timeOfDay === context.timeOfDay || q.timeOfDay === 'any'
      );
    }

    // Filter by streak range
    if (context.streak !== undefined) {
      filteredQuotes = filteredQuotes.filter(q => {
        if (!q.streakRange) return true;
        const { min, max } = q.streakRange;
        return context.streak! >= min && (!max || context.streak! <= max);
      });
    }

    // If no quotes match filters, use general quotes
    if (filteredQuotes.length === 0) {
      filteredQuotes = MOTIVATIONAL_QUOTES.filter((q: MotivationalQuote) => q.category === 'general');
    }

    // Select random quote from filtered results
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    return filteredQuotes[randomIndex] || MOTIVATIONAL_QUOTES[0]!;
  }

  /**
   * Get streak-specific motivational message
   */
  static getStreakMotivation(streak: number): {
    message: string;
    emoji: string;
    intensity: 'low' | 'medium' | 'high';
  } {
    if (streak === 0) {
      return {
        message: "Every expert was once a beginner. Start your journey today!",
        emoji: "🌱",
        intensity: 'medium',
      };
    }

    if (streak === 1) {
      return {
        message: "Great start! The first step is always the hardest.",
        emoji: "🎯",
        intensity: 'medium',
      };
    }

    if (streak < 7) {
      return {
        message: `${streak} days strong! You're building something amazing.`,
        emoji: "💪",
        intensity: 'medium',
      };
    }

    if (streak < 30) {
      return {
        message: `${streak} days of consistency! Your habits are forming.`,
        emoji: "🔥",
        intensity: 'high',
      };
    }

    if (streak < 100) {
      return {
        message: `${streak} days! You're showing incredible dedication.`,
        emoji: "⚡",
        intensity: 'high',
      };
    }

    return {
      message: `${streak} days! You're an inspiration to others!`,
      emoji: "👑",
      intensity: 'high',
    };
  }

  /**
   * Get time-based greeting and motivation
   */
  static getTimeBasedMotivation(timeOfDay: 'morning' | 'afternoon' | 'evening'): {
    greeting: string;
    motivation: string;
    suggestion: string;
  } {
    switch (timeOfDay) {
      case 'morning':
        return {
          greeting: "Good morning! ☀️",
          motivation: "The day is full of possibilities.",
          suggestion: "Start with a focused session to set the tone for your day.",
        };
      
      case 'afternoon':
        return {
          greeting: "Good afternoon! ⚡",
          motivation: "You're in the productive zone.",
          suggestion: "This is prime time for deep work and focused sessions.",
        };
      
      case 'evening':
        return {
          greeting: "Good evening! 🌙",
          motivation: "Finish strong and prepare for tomorrow.",
          suggestion: "A focused session now will help you wind down with accomplishment.",
        };
      
      default:
        return {
          greeting: "Hello! 👋",
          motivation: "Every moment is a chance to focus.",
          suggestion: "Take a moment to center yourself and begin.",
        };
    }
  }

  /**
   * Get motivational content based on recent activity
   */
  static getActivityMotivation(data: {
    sessionsToday: number;
    weeklyGoal: number;
    weeklyProgress: number;
    recentAchievements: number;
  }): {
    primary: string;
    secondary: string;
    actionPrompt: string;
  } {
    const { sessionsToday, weeklyGoal, weeklyProgress, recentAchievements } = data;
    const weeklyProgressPercent = weeklyGoal > 0 ? (weeklyProgress / weeklyGoal) * 100 : 0;

    // Recent achievements
    if (recentAchievements > 0) {
      return {
        primary: `🏆 Amazing! You've unlocked ${recentAchievements} new achievement${recentAchievements > 1 ? 's' : ''}!`,
        secondary: "Your dedication is paying off in measurable ways.",
        actionPrompt: "Keep this momentum going with another focused session.",
      };
    }

    // High weekly progress
    if (weeklyProgressPercent >= 80) {
      return {
        primary: "🎯 You're crushing your weekly goal!",
        secondary: `${Math.round(weeklyProgressPercent)}% progress - exceptional consistency.`,
        actionPrompt: "You're so close to completing your weekly goal!",
      };
    }

    // Multiple sessions today
    if (sessionsToday >= 3) {
      return {
        primary: `💪 ${sessionsToday} sessions today! You're on fire!`,
        secondary: "Your focus and dedication are truly impressive.",
        actionPrompt: "Consider taking a well-deserved break or push for one more.",
      };
    }

    // First session of the day
    if (sessionsToday === 1) {
      return {
        primary: "🌟 Great start to the day!",
        secondary: "First session completed - the hardest part is behind you.",
        actionPrompt: "The momentum is building. Ready for another session?",
      };
    }

    // No sessions yet
    return {
      primary: "🚀 Ready to make today productive?",
      secondary: "Every great achievement starts with a single focused session.",
      actionPrompt: "Start your first session and build momentum for the day.",
    };
  }

  /**
   * Get encouragement for struggling users
   */
  static getEncouragement(context: {
    daysInactive?: number;
    streakBroken?: boolean;
    lowProgress?: boolean;
  }): {
    message: string;
    tip: string;
    actionStep: string;
  } {
    const { daysInactive = 0, streakBroken = false, lowProgress = false } = context;

    if (streakBroken) {
      return {
        message: "Streaks can be rebuilt, and progress isn't lost! 💪",
        tip: "Every expert has had setbacks. What matters is getting back up.",
        actionStep: "Start with just one small session to rebuild momentum.",
      };
    }

    if (daysInactive > 7) {
      return {
        message: "Welcome back! Your focus journey continues. 🌱",
        tip: "Long breaks are normal. The important thing is returning.",
        actionStep: "Start with a short 10-15 minute session to ease back in.",
      };
    }

    if (lowProgress) {
      return {
        message: "Progress isn't always linear, and that's perfectly okay. 📈",
        tip: "Small, consistent steps always beat sporadic bursts.",
        actionStep: "Set a smaller, achievable goal for today and build from there.",
      };
    }

    return {
      message: "You've got this! Every moment is a fresh opportunity. ✨",
      tip: "Remember your why - the reason you started this journey.",
      actionStep: "Take a deep breath and begin with whatever feels manageable.",
    };
  }

  /**
   * Get celebration message for achievements
   */
  static getCelebrationMessage(achievement: {
    type: string;
    milestone?: number;
    category?: string;
  }): {
    title: string;
    message: string;
    encouragement: string;
  } {
    const { type, milestone, category } = achievement;

    if (type.includes('STREAK')) {
      return {
        title: `🔥 ${milestone} Day Streak!`,
        message: "Your consistency is building powerful habits!",
        encouragement: "Each day of focus brings you closer to your goals.",
      };
    }

    if (type.includes('SESSIONS')) {
      return {
        title: `⚡ ${milestone} Sessions Complete!`,
        message: "Your dedication to focused work is impressive!",
        encouragement: "You're proving that consistent effort creates lasting results.",
      };
    }

    if (type.includes('TIME')) {
      return {
        title: `⏰ ${milestone} Hours of Focus!`,
        message: "You've invested serious time in your growth!",
        encouragement: "This focused time is shaping your future success.",
      };
    }

    return {
      title: "🏆 Achievement Unlocked!",
      message: "Your hard work and dedication are paying off!",
      encouragement: "Keep pushing forward - you're making amazing progress.",
    };
  }

  /**
   * Get random quote from specific category
   */
  static getRandomQuoteByCategory(category: MotivationalQuote['category']): MotivationalQuote {
    const categoryQuotes = MOTIVATIONAL_QUOTES.filter((q: MotivationalQuote) => q.category === category);
    if (categoryQuotes.length === 0) {
      return MOTIVATIONAL_QUOTES[0]!; // Fallback
    }
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
    return categoryQuotes[randomIndex]!;
  }

  /**
   * Get daily affirmation
   */
  static getDailyAffirmation(): MotivationalQuote {
    const affirmations = MOTIVATIONAL_QUOTES.filter((q: MotivationalQuote) => 
      q.tags?.includes('affirmation') || q.category === 'motivation'
    );
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    return affirmations[randomIndex] || MOTIVATIONAL_QUOTES[0]!;
  }
}

// Export convenience function
export function getMotivationalQuote(context: QuoteContext = {}): MotivationalQuote {
  return MotivationService.getPersonalizedQuote(context);
}

export default MotivationService;
