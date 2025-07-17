'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quote, RefreshCw, Heart, Star, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTIVATIONAL_QUOTES } from '@/data/motivational-quotes';
import { type MotivationalQuote } from '@/types/gamification';

interface MotivationalQuotesProps {
  userStreak?: number;
  currentTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  userPreferences?: {
    quotesEnabled: boolean;
    quoteCategory?: string;
  };
  className?: string;
}

export function MotivationalQuotes({
  userStreak = 0,
  currentTimeOfDay = 'morning',
  userPreferences = { quotesEnabled: true },
  className,
}: MotivationalQuotesProps) {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);

  // Get initial quote on mount
  useEffect(() => {
    if (userPreferences.quotesEnabled) {
      loadNewQuote();
    }
  }, [userPreferences.quotesEnabled]);

  // Auto-refresh quote every 30 minutes
  useEffect(() => {
    if (!userPreferences.quotesEnabled) return;

    const interval = setInterval(() => {
      loadNewQuote();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [userPreferences.quotesEnabled]);

  const getPersonalizedQuote = (): MotivationalQuote => {
    let filteredQuotes = [...MOTIVATIONAL_QUOTES];

    // Filter by category if specified
    if (userPreferences.quoteCategory) {
      filteredQuotes = filteredQuotes.filter(q => 
        q.category === userPreferences.quoteCategory || q.category === 'general'
      );
    }

    // Filter by time of day
    if (currentTimeOfDay) {
      filteredQuotes = filteredQuotes.filter(q => 
        !q.timeOfDay || q.timeOfDay === currentTimeOfDay || q.timeOfDay === 'any'
      );
    }

    // Filter by streak range
    if (userStreak !== undefined) {
      filteredQuotes = filteredQuotes.filter(q => {
        if (!q.streakRange) return true;
        const { min, max } = q.streakRange;
        return userStreak >= min && (!max || userStreak <= max);
      });
    }

    // If no quotes match filters, use general quotes
    if (filteredQuotes.length === 0) {
      filteredQuotes = MOTIVATIONAL_QUOTES.filter(q => q.category === 'general');
    }

    // Select random quote from filtered results
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    return filteredQuotes[randomIndex] || MOTIVATIONAL_QUOTES[0]!;
  };

  const loadNewQuote = () => {
    const quote = getPersonalizedQuote();
    setCurrentQuote(quote);
    setLiked(false);
  };

  const refreshQuote = async () => {
    setIsRefreshing(true);
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    loadNewQuote();
    setIsRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'focus':
        return <Target className="h-4 w-4" />;
      case 'motivation':
        return <Zap className="h-4 w-4" />;
      case 'productivity':
        return <Star className="h-4 w-4" />;
      case 'success':
        return <Target className="h-4 w-4" />;
      case 'perseverance':
        return <Heart className="h-4 w-4" />;
      default:
        return <Quote className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'focus':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'motivation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'productivity':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'success':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'perseverance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!userPreferences.quotesEnabled || !currentQuote) {
    return null;
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
      
      <CardContent className="relative p-6">
        <div className="space-y-4">
          {/* Header with category and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-muted-foreground" />
              <Badge 
                variant="secondary" 
                className={cn('flex items-center gap-1', getCategoryColor(currentQuote.category))}
              >
                {getCategoryIcon(currentQuote.category)}
                {currentQuote.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLiked(!liked)}
                className={cn(
                  'h-8 w-8 p-0',
                  liked ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshQuote}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  isRefreshing && 'animate-spin'
                )} />
              </Button>
            </div>
          </div>

          {/* Quote content */}
          <blockquote className="space-y-3">
            <p className="text-lg font-medium leading-relaxed text-foreground italic">
              "{currentQuote.text}"
            </p>
            
            {currentQuote.author && (
              <footer className="text-sm text-muted-foreground">
                — {currentQuote.author}
              </footer>
            )}
          </blockquote>

          {/* Contextual message based on streak */}
          {userStreak > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground text-center">
                {userStreak >= 30 && "You're showing incredible dedication! "}
                {userStreak >= 14 && userStreak < 30 && "Your consistency is paying off! "}
                {userStreak >= 7 && userStreak < 14 && "Great momentum building! "}
                {userStreak >= 3 && userStreak < 7 && "You're developing great habits! "}
                {userStreak > 0 && userStreak < 3 && "Every day counts - keep going! "}
                <span className="font-medium text-orange-500">
                  {userStreak} day{userStreak === 1 ? '' : 's'} strong! 🔥
                </span>
              </p>
            </div>
          )}

          {/* Time-based greeting */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {currentTimeOfDay === 'morning' && "Good morning! Ready to focus? ☀️"}
              {currentTimeOfDay === 'afternoon' && "Good afternoon! Time to power through! ⚡"}
              {currentTimeOfDay === 'evening' && "Good evening! Finish strong! 🌙"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MotivationalQuotes;
