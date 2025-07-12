'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardHomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to track your productive time today?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Today's Focus</h3>
          <p className="text-2xl font-bold text-primary">0h 0m</p>
          <p className="text-sm text-muted-foreground">No sessions yet</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">This Week</h3>
          <p className="text-2xl font-bold text-primary">0h 0m</p>
          <p className="text-sm text-muted-foreground">0 sessions</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Projects</h3>
          <p className="text-2xl font-bold text-primary">0</p>
          <p className="text-sm text-muted-foreground">Create your first project</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Start Timer
          </button>
          <Link href="/projects" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Create Project
          </Link>
          <Link href="/analytics" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            View Analytics
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-center text-muted-foreground py-8">
            No time sessions yet. Start your first timer to see your activity here.
          </p>
        </div>
      </div>
    </div>
  );
}
