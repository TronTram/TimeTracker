'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UnifiedTimer } from '@/components/features/unified-timer';
import { MobileTimer } from '@/components/features/timer/mobile-timer';
import { PomodoroDashboard } from '@/components/features/pomodoro/pomodoro-dashboard';
import { TimerProgress } from '@/components/features/timer/timer-progress';
import { SessionSummary } from '@/components/features/timer/session-summary';
import { StreakCounter } from '@/components/features/gamification/streak-counter';
import { MotivationalQuotes } from '@/components/features/gamification/motivational-quotes';
import { useTimer } from '@/hooks/use-timer';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { SessionType } from '@/types/timer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardHomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { isMobile, isTablet } = useMobileDetection();
  const { 
    status, 
    currentSession, 
    formattedTime, 
    progress,
    start,
    isOvertime 
  } = useTimer();
  
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [timerMode, setTimerMode] = useState<'regular' | 'pomodoro'>('regular');

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Show session summary when session is completed
  useEffect(() => {
    if (status === 'completed') {
      setShowSessionSummary(true);
    }
  }, [status]);

  const handleStartNext = (sessionType: SessionType) => {
    setShowSessionSummary(false);
    start(sessionType);
  };

  const handleCloseSummary = () => {
    setShowSessionSummary(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
        <MobileTimer onModeChange={setTimerMode} />
        
        {/* Session Summary Modal */}
        {showSessionSummary && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-50">
            <SessionSummary
              onClose={handleCloseSummary}
              onStartNext={handleStartNext}
              showActions={true}
              showRecommendations={true}
            />
          </div>
        )}
      </div>
    );
  }

  // Tablet and desktop layout
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Ready to track your productive time today?
        </p>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Timer Section */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Unified Timer with Mode Toggle */}
          <UnifiedTimer onModeChange={setTimerMode} />

          {/* Progress Indicator */}
          {(status === 'running' || status === 'paused') && (
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-4">Session Progress</h3>
              <TimerProgress 
                variant="linear"
                size="lg"
                showPercentage={true}
                sessionType={currentSession?.sessionType}
              />
            </Card>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Show different sidebar based on timer mode */}
          {timerMode === 'pomodoro' ? (
            <PomodoroDashboard />
          ) : (
            <>
              {/* Streak Counter */}
              <StreakCounter
                currentStreak={5}
                longestStreak={12}
                daysToNextMilestone={2}
                nextMilestone={7}
                streakPercentage={71}
                lastActiveDate={new Date()}
                className="w-full"
              />

              {/* Motivational Quote */}
              <MotivationalQuotes
                userStreak={5}
                currentTimeOfDay={
                  new Date().getHours() < 12 ? 'morning' : 
                  new Date().getHours() < 18 ? 'afternoon' : 'evening'
                }
                userPreferences={{
                  quotesEnabled: true,
                  quoteCategory: 'focus',
                }}
                className="w-full"
              />

              {/* Regular Timer Stats - Mobile optimized grid */}
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-semibold">Today's Stats</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                  <Card className="p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Current Session</h3>
                    <div className="text-lg md:text-2xl font-bold font-mono">
                      {status === 'idle' ? '--:--' : formattedTime}
                    </div>
                    {isOvertime && (
                      <p className="text-xs text-orange-600 mt-1">Overtime</p>
                    )}
                  </Card>

                  <Card className="p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Today's Focus</h3>
                    <p className="text-lg md:text-2xl font-bold text-primary">0h 0m</p>
                    <p className="text-xs text-muted-foreground">No sessions yet</p>
                  </Card>

                  <Card className="p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">This Week</h3>
                    <p className="text-lg md:text-2xl font-bold text-primary">0h 0m</p>
                    <p className="text-xs text-muted-foreground">0 sessions</p>
                  </Card>

                  <Card className="p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Projects</h3>
                    <p className="text-lg md:text-2xl font-bold text-primary">0</p>
                    <p className="text-xs text-muted-foreground">Create first project</p>
                  </Card>
                </div>
              </div>

              {/* Quick Actions - Mobile optimized */}
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-semibold">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-2">
                  <Link href="/projects" className="block">
                    <Button variant="outline" className="w-full justify-start text-sm">
                      Create Project
                    </Button>
                  </Link>
                  <Link href="/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start text-sm">
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/settings" className="block">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Timer Settings
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Session Progress Ring - Hidden on mobile grid layout */}
              {(status === 'running' || status === 'paused') && (
                <Card className="p-4 hidden md:block">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Progress</h3>
                  <div className="flex justify-center">
                    <TimerProgress 
                      variant="circular"
                      size="md"
                      showPercentage={true}
                      sessionType={currentSession?.sessionType}
                    />
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Sessions - More compact on mobile */}
      <div className="mt-8 md:mt-12">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Recent Sessions</h2>
        <Card className="p-4 md:p-6">
          <p className="text-center text-muted-foreground py-6 md:py-8 text-sm md:text-base">
            No time sessions yet. Start your first timer to see your activity here.
          </p>
        </Card>
      </div>

      {/* Session Summary Modal */}
      {showSessionSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SessionSummary
            onClose={handleCloseSummary}
            onStartNext={handleStartNext}
            showActions={true}
            showRecommendations={true}
          />
        </div>
      )}
    </div>
  );
}
