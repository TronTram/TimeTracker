'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();

  // If user is signed in, they should be redirected via middleware
  // This is just a fallback for the landing page

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Navigation for unauthenticated users */}
      {isLoaded && !isSignedIn && (
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold">Time Tracker</span>
          </div>
          <div className="flex gap-2">
            <Link href="/sign-in" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign Up
            </Link>
          </div>
        </header>
      )}

      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Cursor Time Tracker
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          A focused time tracking application with Pomodoro technique support.
          Track your productivity, manage projects, and achieve your goals.
        </p>
        {isLoaded && (
          <div className="flex gap-4">
            {isSignedIn ? (
              <Link href="/dashboard" className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors">
                  Get Started
                </Link>
                <Link href="#features" className="rounded-lg border border-border px-6 py-3 hover:bg-accent hover:text-accent-foreground transition-colors">
                  Learn More
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      
      <div id="features" className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">🍅</div>
          <h3 className="mb-2 text-xl font-semibold">Pomodoro Timer</h3>
          <p className="text-muted-foreground">
            Customizable work and break intervals to maximize your focus and productivity.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">📊</div>
          <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Detailed insights into your productivity patterns and time usage.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="mb-4 text-2xl">🎯</div>
          <h3 className="mb-2 text-xl font-semibold">Project Management</h3>
          <p className="text-muted-foreground">
            Organize your work with projects, tags, and detailed time tracking.
          </p>
        </div>
      </div>

      {/* Call to Action for unauthenticated users */}
      {isLoaded && !isSignedIn && (
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to boost your productivity?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of users who trust Time Tracker to manage their time effectively.</p>
          <Link href="/sign-up" className="rounded-lg bg-primary px-8 py-3 text-primary-foreground hover:bg-primary/90 transition-colors inline-block">
            Start Free Today
          </Link>
        </div>
      )}
    </div>
  );
}
