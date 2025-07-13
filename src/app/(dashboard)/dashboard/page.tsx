'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TimerDisplay } from '@/components/features/timer/timer-display';
import { TimerControls } from '@/components/features/timer/timer-controls';
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to track your productive time today?
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Timer Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Timer Display */}
          <Card className="p-8 text-center">
            <TimerDisplay 
              size="xl"
              showSessionType={true}
              showProgress={false}
              showOvertime={true}
            />
            
            <div className="mt-6">
              <TimerControls 
                size="lg"
                showAdvanced={true}
                showSessionSelector={true}
                onSessionTypeSelect={(type) => console.log('Selected:', type)}
              />
            </div>
          </Card>

          {/* Progress Indicator */}
          {(status === 'running' || status === 'paused') && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Session Progress</h3>
              <TimerProgress 
                variant="linear"
                size="lg"
                showPercentage={true}
                sessionType={currentSession?.sessionType}
              />
            </Card>
          )}

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

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Today's Stats</h2>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Session</h3>
              <div className="text-2xl font-bold font-mono">
                {status === 'idle' ? '--:--' : formattedTime}
              </div>
              {isOvertime && (
                <p className="text-xs text-orange-600 mt-1">Overtime session</p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Today's Focus</h3>
              <p className="text-2xl font-bold text-primary">0h 0m</p>
              <p className="text-xs text-muted-foreground">No sessions yet</p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">This Week</h3>
              <p className="text-2xl font-bold text-primary">0h 0m</p>
              <p className="text-xs text-muted-foreground">0 sessions</p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Projects</h3>
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Create your first project</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/projects" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Create Project
                </Button>
              </Link>
              <Link href="/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  View Analytics
                </Button>
              </Link>
              <Link href="/settings" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  Timer Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Session Progress Ring */}
          {(status === 'running' || status === 'paused') && (
            <Card className="p-4">
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
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        <Card className="p-6">
          <p className="text-center text-muted-foreground py-8">
            No time sessions yet. Start your first timer to see your activity here.
          </p>
        </Card>
      </div>
    </div>
  );
}
