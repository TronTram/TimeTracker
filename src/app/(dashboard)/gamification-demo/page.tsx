'use client';

import React from 'react';
import { StreakCounter } from '@/components/features/gamification/streak-counter';
import { MotivationalQuotes } from '@/components/features/gamification/motivational-quotes';
import { ProgressVisualization } from '@/components/features/gamification/progress-visualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GamificationDemo() {
  // Mock data for demonstration
  const mockStreakData = {
    currentStreak: 7,
    longestStreak: 15,
    daysToNextMilestone: 7,
    nextMilestone: 14,
    streakPercentage: 50,
    lastActiveDate: new Date(),
  };

  const mockProgressData = {
    currentStreak: 7,
    longestStreak: 15,
    totalSessions: 45,
    totalFocusTime: 1200, // 20 hours in minutes
    weeklyGoal: 600, // 10 hours
    weeklyProgress: 420, // 7 hours
    recentAchievements: [
      { id: '1', title: 'Week Warrior', unlockedAt: new Date() },
      { id: '2', title: 'Focus Master', unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ],
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 16: Streak Tracking & Motivation Features</h1>
        <p className="text-muted-foreground">
          Demo of the gamification components implemented in Step 16
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Streak Counter */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Streak Counter</h2>
            <StreakCounter {...mockStreakData} />
          </div>

          {/* Motivational Quotes */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Motivational Quotes</h2>
            <MotivationalQuotes
              userStreak={7}
              currentTimeOfDay="afternoon"
              userPreferences={{
                quotesEnabled: true,
                quoteCategory: 'focus',
              }}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Progress Visualization */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress Visualization</h2>
            <ProgressVisualization {...mockProgressData} />
          </div>
        </div>
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Step 16 Implementation Status ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">✅ Completed Components</h3>
              <ul className="text-sm space-y-1">
                <li>• StreakCounter component</li>
                <li>• MotivationalQuotes component</li>
                <li>• ProgressVisualization component</li>
                <li>• StreakService for business logic</li>
                <li>• MotivationService for quotes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-600">🔧 Features Implemented</h3>
              <ul className="text-sm space-y-1">
                <li>• Daily streak tracking</li>
                <li>• Motivational quote rotation</li>
                <li>• Visual progress indicators</li>
                <li>• Growth stage visualization</li>
                <li>• Milestone progress tracking</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-purple-600">🎯 Ready for Integration</h3>
              <ul className="text-sm space-y-1">
                <li>• Dashboard integration</li>
                <li>• User preferences</li>
                <li>• Achievement system connection</li>
                <li>• Analytics integration</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
