'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Target, Calendar, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/time-utils';
import type { ProductivityInsights as ProductivityInsightsType } from '@/types/analytics';

interface ProductivityInsightsProps {
  data: ProductivityInsightsType | null;
  isLoading?: boolean;
}

interface InsightCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function InsightCard({ 
  title, 
  value, 
  trend, 
  icon, 
  description, 
  badge, 
  badgeVariant = 'default' 
}: InsightCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendText = () => {
    if (trend === undefined || trend === null) return null;
    const absChange = Math.abs(trend);
    const direction = trend > 0 ? 'increase' : 'decrease';
    return `${absChange.toFixed(1)}% ${direction}`;
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon()}
              <span>{getTrendText()}</span>
              <span>from last period</span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

function StreakDisplay({ currentStreak, longestStreak, totalDays }: StreakDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-orange-500" />
          Activity Streaks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{totalDays}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FocusRatioDisplayProps {
  focusRatio: number;
}

function FocusRatioDisplay({ focusRatio }: FocusRatioDisplayProps) {
  const getRatioColor = (ratio: number) => {
    if (ratio >= 80) return 'text-green-500';
    if (ratio >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatioLabel = (ratio: number) => {
    if (ratio >= 80) return 'Excellent';
    if (ratio >= 60) return 'Good';
    if (ratio >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Focus Ratio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className={`text-3xl font-bold ${getRatioColor(focusRatio)}`}>
            {focusRatio.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {getRatioLabel(focusRatio)}
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                focusRatio >= 80 ? 'bg-green-500' :
                focusRatio >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(focusRatio, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Percentage of time spent in focused work vs breaks
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductivityInsights({ data, isLoading = false }: ProductivityInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.current) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <p>No productivity insights available</p>
            <p className="text-sm">Start tracking time to see your productivity metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { current, improvements, streakData, focusRatio } = data;

  return (
    <div className="space-y-6">
      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          title="Total Focus Time"
          value={formatTime(current.totalTime)}
          trend={improvements?.totalTime}
          icon={<Zap className="h-4 w-4 text-blue-500" />}
          description="Time spent in productive work"
        />
        
        <InsightCard
          title="Focus Sessions"
          value={current.sessionsCount}
          trend={improvements?.sessions}
          icon={<Target className="h-4 w-4 text-green-500" />}
          description="Number of completed focus sessions"
        />
        
        <InsightCard
          title="Pomodoros Completed"
          value={current.pomodoroCount}
          trend={improvements?.pomodoros}
          icon={<Award className="h-4 w-4 text-orange-500" />}
          description="Pomodoro technique sessions finished"
        />
        
        <InsightCard
          title="Average Session"
          value={formatTime(current.averageSessionLength)}
          icon={<Calendar className="h-4 w-4 text-purple-500" />}
          description="Average length per focus session"
          badge={current.averageSessionLength > 1800 ? "Good Length" : "Short Sessions"}
          badgeVariant={current.averageSessionLength > 1800 ? "default" : "secondary"}
        />
      </div>

      {/* Secondary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus Ratio */}
        <FocusRatioDisplay focusRatio={focusRatio || 0} />
        
        {/* Activity Streaks */}
        <StreakDisplay 
          currentStreak={streakData?.currentStreak || 0}
          longestStreak={streakData?.longestStreak || 0}
          totalDays={streakData?.totalDays || 0}
        />
      </div>

      {/* Improvement Summary */}
      {improvements && (
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {improvements.totalTime > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold ${
                    improvements.totalTime > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {improvements.totalTime > 0 ? '+' : ''}{improvements.totalTime.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {improvements.focusTime > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold ${
                    improvements.focusTime > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {improvements.focusTime > 0 ? '+' : ''}{improvements.focusTime.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Focus Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {improvements.sessions > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold ${
                    improvements.sessions > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {improvements.sessions > 0 ? '+' : ''}{improvements.sessions.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {improvements.pomodoros > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold ${
                    improvements.pomodoros > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {improvements.pomodoros > 0 ? '+' : ''}{improvements.pomodoros.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Pomodoros</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProductivityInsights;
