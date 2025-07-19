'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UnifiedTimer } from '@/components/features/unified-timer';
import { PomodoroDashboard } from '@/components/features/pomodoro/pomodoro-dashboard';
import { TimerProgress } from '@/components/features/timer/timer-progress';
import { SessionSummary } from '@/components/features/timer/session-summary';
import { useTimer } from '@/hooks/use-timer';
import { SessionType } from '@/types/timer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { 
    status, 
    currentSession, 
    formattedTime, 
    progress,
    start,
    isOvertime 
  } = useTimer();
  
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [timerMode, setTimerMode] = useState<'regular' | 'pomodoro'>('pomodoro'); // Default to pomodoro to match design

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Ready to track your productive time today?
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Timer Section */}
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {/* Unified Timer */}
              <UnifiedTimer onModeChange={setTimerMode} />

              {/* Session Progress */}
              {(status === 'running' || status === 'paused') && (
                <Card className="p-6 bg-gradient-to-r from-card to-card/80 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Session Progress</h3>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(progress)}% complete
                    </div>
                  </div>
                  <TimerProgress 
                    variant="linear"
                    size="lg"
                    showPercentage={false}
                    sessionType={currentSession?.sessionType}
                  />
                </Card>
              )}

              {/* Recent Sessions */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Sessions</h3>
                <div className="text-center text-muted-foreground py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">No time sessions yet</p>
                  <p className="text-sm">Start your first timer to see your activity here.</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {timerMode === 'pomodoro' ? (
              <PomodoroDashboard />
            ) : (
              <>
                {/* Today's Goal */}
                <Card className="p-6 bg-gradient-to-br from-card to-card/80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Today's Goal</h3>
                    <div className="text-sm text-muted-foreground">0 / 5 sessions</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <div className="text-right text-sm font-medium">0%</div>
                  </div>
                </Card>

                {/* Current Cycle */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Current Cycle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-1">0</div>
                      <div className="text-sm text-muted-foreground">Current</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-1">0</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                        <div className="text-2xl font-bold">0%</div>
                        <div className="text-xs text-muted-foreground">Last 30 days</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Streak</div>
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-xs text-muted-foreground">days</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/analytics" className="block">
                      <Button variant="outline" className="w-full justify-start h-11">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Statistics
                      </Button>
                    </Link>
                    <Link href="/settings" className="block">
                      <Button variant="ghost" className="w-full justify-start h-11">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Adjust Settings
                      </Button>
                    </Link>
                  </div>
                </Card>
              </>
            )}
          </div>
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
    </div>
  );
}
