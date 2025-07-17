import { MotivationalQuote } from '@/types/gamification';

/**
 * Database of motivational quotes for the focus timer application
 * Categorized by theme, time of day, and streak ranges for personalization
 */
export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  // Focus-related quotes
  {
    id: 'focus-1',
    text: 'The successful warrior is the average person with laser-like focus.',
    author: 'Bruce Lee',
    category: 'focus',
    timeOfDay: 'any',
    tags: ['focus', 'success', 'dedication'],
  },
  {
    id: 'focus-2',
    text: 'Concentrate all your thoughts upon the work at hand. The sun\'s rays do not burn until brought to a focus.',
    author: 'Alexander Graham Bell',
    category: 'focus',
    timeOfDay: 'any',
    tags: ['concentration', 'focus', 'effectiveness'],
  },
  {
    id: 'focus-3',
    text: 'Focus is not about thinking harder, but thinking differently.',
    category: 'focus',
    timeOfDay: 'any',
    tags: ['focus', 'mindset', 'clarity'],
  },
  {
    id: 'focus-4',
    text: 'Where focus goes, energy flows.',
    author: 'Tony Robbins',
    category: 'focus',
    timeOfDay: 'any',
    tags: ['focus', 'energy', 'direction'],
  },

  // Morning motivation
  {
    id: 'morning-1',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    category: 'motivation',
    timeOfDay: 'morning',
    tags: ['action', 'beginning', 'motivation'],
  },
  {
    id: 'morning-2',
    text: 'Today is the perfect day to start pursuing your dreams with focused determination.',
    category: 'motivation',
    timeOfDay: 'morning',
    tags: ['dreams', 'start', 'determination'],
  },
  {
    id: 'morning-3',
    text: 'Every morning brings new potential, but only if you focus on making the most of it.',
    category: 'motivation',
    timeOfDay: 'morning',
    tags: ['potential', 'morning', 'focus'],
  },
  {
    id: 'morning-4',
    text: 'The morning is when your mind is clearest. Use this time to tackle your most important work.',
    category: 'productivity',
    timeOfDay: 'morning',
    tags: ['clarity', 'productivity', 'priorities'],
  },

  // Afternoon energy
  {
    id: 'afternoon-1',
    text: 'The middle of every successful project looks like a disaster. Keep going.',
    author: 'Rosabeth Moss Kanter',
    category: 'perseverance',
    timeOfDay: 'afternoon',
    tags: ['perseverance', 'progress', 'persistence'],
  },
  {
    id: 'afternoon-2',
    text: 'Productivity is never an accident. It is always the result of a commitment to excellence.',
    author: 'Paul J. Meyer',
    category: 'productivity',
    timeOfDay: 'afternoon',
    tags: ['productivity', 'excellence', 'commitment'],
  },
  {
    id: 'afternoon-3',
    text: 'This is your time to push through. The afternoon is when champions are made.',
    category: 'motivation',
    timeOfDay: 'afternoon',
    tags: ['perseverance', 'champions', 'push'],
  },

  // Evening reflection
  {
    id: 'evening-1',
    text: 'Don\'t go to bed with unfinished business. Complete what you started.',
    category: 'productivity',
    timeOfDay: 'evening',
    tags: ['completion', 'finish', 'dedication'],
  },
  {
    id: 'evening-2',
    text: 'End your day with intention. Every focused session is an investment in your future.',
    category: 'motivation',
    timeOfDay: 'evening',
    tags: ['intention', 'investment', 'future'],
  },
  {
    id: 'evening-3',
    text: 'The evening is your chance to finish strong and set the stage for tomorrow.',
    category: 'motivation',
    timeOfDay: 'evening',
    tags: ['finish', 'tomorrow', 'preparation'],
  },

  // Beginner streaks (1-7 days)
  {
    id: 'beginner-1',
    text: 'Every expert was once a beginner. Every pro was once an amateur.',
    author: 'Robin Sharma',
    category: 'motivation',
    streakRange: { min: 0, max: 7 },
    tags: ['beginner', 'growth', 'journey'],
  },
  {
    id: 'beginner-2',
    text: 'The journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    category: 'motivation',
    streakRange: { min: 0, max: 7 },
    tags: ['journey', 'beginning', 'persistence'],
  },
  {
    id: 'beginner-3',
    text: 'You don\'t have to be great to get started, but you have to get started to be great.',
    author: 'Les Brown',
    category: 'motivation',
    streakRange: { min: 0, max: 7 },
    tags: ['start', 'greatness', 'action'],
  },

  // Building momentum (7-30 days)
  {
    id: 'momentum-1',
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
    category: 'success',
    streakRange: { min: 7, max: 30 },
    tags: ['consistency', 'small-efforts', 'repetition'],
  },
  {
    id: 'momentum-2',
    text: 'Consistency is the true foundation of trust.',
    category: 'productivity',
    streakRange: { min: 7, max: 30 },
    tags: ['consistency', 'foundation', 'trust'],
  },
  {
    id: 'momentum-3',
    text: 'You\'re building something incredible, one focused session at a time.',
    category: 'motivation',
    streakRange: { min: 7, max: 30 },
    tags: ['building', 'incredible', 'session'],
  },

  // Strong streaks (30+ days)
  {
    id: 'strong-1',
    text: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
    category: 'perseverance',
    streakRange: { min: 30 },
    tags: ['discipline', 'choice', 'long-term'],
  },
  {
    id: 'strong-2',
    text: 'Your consistency is inspiring. You\'re proving what\'s possible with dedication.',
    category: 'motivation',
    streakRange: { min: 30 },
    tags: ['consistency', 'inspiring', 'dedication'],
  },
  {
    id: 'strong-3',
    text: 'Champions aren\'t made in the gyms. Champions are made from something deep inside them.',
    author: 'Muhammad Ali',
    category: 'success',
    streakRange: { min: 30 },
    tags: ['champions', 'inner-strength', 'dedication'],
  },

  // Productivity focus
  {
    id: 'productivity-1',
    text: 'Being busy is a form of laziness - lazy thinking and indiscriminate action.',
    author: 'Tim Ferriss',
    category: 'productivity',
    tags: ['busy', 'thinking', 'action'],
  },
  {
    id: 'productivity-2',
    text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.',
    author: 'Stephen Covey',
    category: 'productivity',
    tags: ['priorities', 'schedule', 'planning'],
  },
  {
    id: 'productivity-3',
    text: 'Efficiency is doing the thing right. Effectiveness is doing the right thing.',
    author: 'Peter Drucker',
    category: 'productivity',
    tags: ['efficiency', 'effectiveness', 'right-thing'],
  },
  {
    id: 'productivity-4',
    text: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
    category: 'productivity',
    tags: ['productive', 'busy', 'focus'],
  },

  // Success mindset
  {
    id: 'success-1',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'success',
    tags: ['success', 'failure', 'courage', 'continue'],
  },
  {
    id: 'success-2',
    text: 'Don\'t be afraid to give up the good to go for the great.',
    author: 'John D. Rockefeller',
    category: 'success',
    tags: ['good', 'great', 'ambition'],
  },
  {
    id: 'success-3',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    category: 'success',
    tags: ['start', 'action', 'doing'],
  },

  // Perseverance
  {
    id: 'perseverance-1',
    text: 'It\'s not that I\'m so smart, it\'s just that I stay with problems longer.',
    author: 'Albert Einstein',
    category: 'perseverance',
    tags: ['persistence', 'problems', 'smart'],
  },
  {
    id: 'perseverance-2',
    text: 'The difference between ordinary and extraordinary is that little extra.',
    author: 'Jimmy Johnson',
    category: 'perseverance',
    tags: ['ordinary', 'extraordinary', 'extra'],
  },
  {
    id: 'perseverance-3',
    text: 'When you feel like quitting, think about why you started.',
    category: 'perseverance',
    tags: ['quitting', 'why', 'started'],
  },
  {
    id: 'perseverance-4',
    text: 'Difficult roads often lead to beautiful destinations.',
    category: 'perseverance',
    tags: ['difficult', 'roads', 'destinations'],
  },

  // General motivation
  {
    id: 'general-1',
    text: 'Your limitation—it\'s only your imagination.',
    category: 'general',
    tags: ['limitation', 'imagination', 'mindset'],
  },
  {
    id: 'general-2',
    text: 'Push yourself, because no one else is going to do it for you.',
    category: 'general',
    tags: ['push', 'self-motivation', 'responsibility'],
  },
  {
    id: 'general-3',
    text: 'Great things never come from comfort zones.',
    category: 'general',
    tags: ['great-things', 'comfort-zone', 'growth'],
  },
  {
    id: 'general-4',
    text: 'Dream it. Wish it. Do it.',
    category: 'general',
    tags: ['dream', 'wish', 'do', 'action'],
  },
  {
    id: 'general-5',
    text: 'Success doesn\'t just find you. You have to go out and get it.',
    category: 'general',
    tags: ['success', 'find', 'get', 'pursue'],
  },

  // Time-specific motivational quotes
  {
    id: 'time-1',
    text: 'Time is the most valuable thing we have, because it is the most irrevocable.',
    author: 'Dietrich Bonhoeffer',
    category: 'productivity',
    tags: ['time', 'valuable', 'irrevocable'],
  },
  {
    id: 'time-2',
    text: 'Time flies, but memories last forever. Make your focused work memorable.',
    category: 'motivation',
    tags: ['time', 'memories', 'memorable', 'work'],
  },

  // Deep work quotes
  {
    id: 'deep-work-1',
    text: 'To produce at your peak level you need to work for extended periods with full concentration.',
    author: 'Cal Newport',
    category: 'focus',
    tags: ['peak', 'concentration', 'extended', 'deep-work'],
  },
  {
    id: 'deep-work-2',
    text: 'Clarity about what matters provides clarity about what does not.',
    author: 'Cal Newport',
    category: 'focus',
    tags: ['clarity', 'matters', 'priorities'],
  },

  // Growth mindset
  {
    id: 'growth-1',
    text: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'motivation',
    tags: ['impossible', 'journey', 'begin'],
  },
  {
    id: 'growth-2',
    text: 'In a growth mindset, challenges are exciting rather than threatening.',
    author: 'Carol Dweck',
    category: 'motivation',
    tags: ['growth-mindset', 'challenges', 'exciting'],
  },

  // Achievement-focused
  {
    id: 'achievement-1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'success',
    tags: ['great-work', 'love', 'passion'],
  },
  {
    id: 'achievement-2',
    text: 'Don\'t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
    category: 'perseverance',
    tags: ['clock', 'keep-going', 'persistence'],
  },
];

// Helper functions for quote selection
export function getQuotesByCategory(category: MotivationalQuote['category']): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(quote => quote.category === category);
}

export function getQuotesByTimeOfDay(timeOfDay: 'morning' | 'afternoon' | 'evening'): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(quote => 
    quote.timeOfDay === timeOfDay || quote.timeOfDay === 'any' || !quote.timeOfDay
  );
}

export function getQuotesByStreakRange(streak: number): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(quote => {
    if (!quote.streakRange) return true;
    const { min, max } = quote.streakRange;
    return streak >= min && (!max || streak <= max);
  });
}

export function getRandomQuote(): MotivationalQuote {
  if (MOTIVATIONAL_QUOTES.length === 0) {
    // Fallback quote if somehow the array is empty
    return {
      id: 'fallback-1',
      text: 'Focus on progress, not perfection.',
      category: 'general',
      tags: ['progress', 'perfection', 'focus'],
    };
  }
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex]!;
}

export function getQuoteByTags(tags: string[]): MotivationalQuote[] {
  return MOTIVATIONAL_QUOTES.filter(quote =>
    quote.tags?.some(tag => tags.includes(tag))
  );
}
