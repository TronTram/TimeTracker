'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  X, 
  Clock, 
  Target, 
  Flame,
  FolderPlus,
  Star,
  Calendar,
  Crown,
  Folders,
  Award,
  Moon,
  Sun,
  Timer,
  Brain,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AchievementWithProgress, CelebrationAnimationType } from '@/types/achievement';

interface AchievementNotificationProps {
  achievement: AchievementWithProgress;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showCelebration?: boolean;
  animationType?: CelebrationAnimationType;
}

// Icon mapping for achievement icons
const iconMap = {
  Trophy,
  Timer: Clock,
  Clock,
  Brain,
  Zap,
  Target,
  Star,
  Flame,
  Calendar,
  Crown,
  FolderPlus,
  Folders,
  Award,
  Moon,
  Sun,
  TimerIcon: Timer,
};

function getAchievementIcon(iconName: string) {
  const Icon = iconMap[iconName as keyof typeof iconMap] || Trophy;
  return Icon;
}

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case 'time':
      return 'bg-blue-500 text-blue-50';
    case 'streak':
      return 'bg-orange-500 text-orange-50';
    case 'project':
      return 'bg-green-500 text-green-50';
    case 'focus':
      return 'bg-purple-500 text-purple-50';
    case 'special':
      return 'bg-pink-500 text-pink-50';
    default:
      return 'bg-gray-500 text-gray-50';
  }
}

export function AchievementNotification({
  achievement,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
  showCelebration = true,
  animationType = 'confetti',
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(showCelebration);
  
  const Icon = getAchievementIcon(achievement.achievement.iconName);
  const categoryColor = getCategoryColor(achievement.achievement.category);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, autoHideDelay]);

  useEffect(() => {
    if (showConfetti) {
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      return () => clearTimeout(confettiTimer);
    }
    return undefined;
  }, [showConfetti]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Allow animation to complete
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Confetti/celebration overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 overflow-hidden">
            {animationType === 'confetti' && (
              <div className="confetti-container">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: Math.random() * 100 + '%',
                      animationDelay: Math.random() * 2 + 's',
                      backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'][Math.floor(Math.random() * 4)],
                    }}
                  />
                ))}
              </div>
            )}
            {animationType === 'sparkles' && (
              <div className="sparkles-container">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="sparkle"
                    style={{
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      animationDelay: Math.random() * 2 + 's',
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification card */}
      <Card className={cn(
        'fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]',
        'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400',
        'border-yellow-300 shadow-lg',
        'transition-all duration-300 ease-in-out',
        isVisible ? 'animate-in slide-in-from-right' : 'animate-out slide-out-to-right'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Achievement icon */}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
              'bg-white/20 backdrop-blur-sm'
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white text-sm">
                  Achievement Unlocked!
                </h3>
              </div>
              
              <h4 className="font-semibold text-white text-base mb-1">
                {achievement.achievement.title}
              </h4>
              
              <p className="text-white/90 text-sm mb-2">
                {achievement.achievement.description}
              </p>

              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                {achievement.achievement.category}
              </Badge>
            </div>

            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress celebration (if just unlocked) */}
          {achievement.isUnlocked && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
                <Trophy className="h-4 w-4" />
                <span>100% Complete</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Celebration styles */}
      <style jsx>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .sparkles-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .sparkle {
          position: absolute;
          animation: sparkle-twinkle 2s ease-in-out forwards;
          font-size: 1.2rem;
        }

        @keyframes sparkle-twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
