'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/use-analytics';
import { 
  TimeTrendChart, 
  ProjectBreakdownChart, 
  DateRangePicker, 
  StatsCards,
  ProductivityInsights,
  useDateRange,
  DateRange
} from '@/components/features/analytics';
import { Download, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { formatDuration } from '@/lib/time-utils';

export default function AnalyticsPage() {
  const { user } = useUser();
  const { dateRange, setDateRange } = useDateRange();
  const { 
    timeBreakdown,
    timeTrends,
    projectBreakdown, 
    insights,
    lineChartData,
    pieChartData,
    statsCards: hookStatsCards,
    loading, 
    error,
    refetch 
  } = useAnalytics({
    timeRange: 'custom',
    startDate: dateRange.from.toISOString().split('T')[0],
    endDate: dateRange.to.toISOString().split('T')[0]
  });

  // Generate stats cards data
  const statsCards = useMemo(() => {
    if (!timeBreakdown) return [];

    const totalMinutes = timeBreakdown.totalTime;
    const sessionsCount = timeBreakdown.sessionsCount;
    const avgSessionLength = sessionsCount > 0 ? totalMinutes / sessionsCount : 0;
    const streakDays = insights?.streakData.currentStreak || 0;

    return [
      {
        title: 'Total Time',
        value: formatDuration(totalMinutes),
        icon: 'clock',
        color: '#3b82f6',
        trend: insights?.improvements ? {
          value: insights.improvements.totalTime,
          isPositive: insights.improvements.totalTime >= 0,
          period: 'vs last period'
        } : undefined
      },
      {
        title: 'Sessions',
        value: sessionsCount.toString(),
        icon: 'activity',
        color: '#10b981',
        trend: insights?.improvements ? {
          value: insights.improvements.sessions,
          isPositive: insights.improvements.sessions >= 0,
          period: 'vs last period'
        } : undefined
      },
      {
        title: 'Avg Session',
        value: formatDuration(avgSessionLength),
        icon: 'trending-up',
        color: '#f59e0b'
      },
      {
        title: 'Current Streak',
        value: `${streakDays} ${streakDays === 1 ? 'day' : 'days'}`,
        icon: 'zap',
        color: '#8b5cf6'
      }
    ];
  }, [timeBreakdown, insights]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
          <p className="text-muted-foreground">
            You need to be signed in to view analytics.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Insights into your productivity patterns and time usage.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <DateRangePicker 
          value={dateRange} 
          onChange={setDateRange}
        />
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
        <Button variant="outline" onClick={refetch}>
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-8 text-center border-destructive">
          <h3 className="text-lg font-semibold mb-2 text-destructive">
            Failed to load analytics
          </h3>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <Button onClick={refetch}>Try Again</Button>
        </Card>
      )}

      {/* Analytics Content */}
      {!loading && !error && (
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Cards */}
              <StatsCards cards={statsCards} />

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Time Trends
                  </h3>
                  {lineChartData && lineChartData.length > 0 ? (
                    <TimeTrendChart 
                      data={lineChartData}
                      className="h-64"
                    />
                  ) : (
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No time trend data available</p>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Project Breakdown
                  </h3>
                  {pieChartData && pieChartData.length > 0 ? (
                    <ProjectBreakdownChart 
                      data={pieChartData}
                      className="h-64"
                    />
                  ) : (
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No project data available</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Empty State for New Users */}
              {timeBreakdown && timeBreakdown.totalTime === 0 && (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No data to analyze yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your time to see detailed analytics and insights.
                  </p>
                  <Button>
                    Start Your First Timer
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <ProductivityInsights 
              data={insights} 
              isLoading={loading}
            />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              {/* Project Analytics Overview */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Active Projects
                  </h4>
                  <p className="text-2xl font-bold">
                    {projectBreakdown ? projectBreakdown.length : 0}
                  </p>
                </Card>
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Most Productive Project
                  </h4>
                  <p className="text-lg font-semibold">
                    {projectBreakdown && projectBreakdown.length > 0 
                      ? projectBreakdown[0]?.projectName || 'No projects yet'
                      : 'No projects yet'
                    }
                  </p>
                </Card>
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Total Project Time
                  </h4>
                  <p className="text-2xl font-bold">
                    {timeBreakdown ? formatDuration(timeBreakdown.totalTime) : '0m'}
                  </p>
                </Card>
              </div>

              {/* Project Breakdown Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Project Time Distribution</h3>
                {pieChartData && pieChartData.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ProjectBreakdownChart 
                      data={pieChartData}
                      className="h-80"
                    />
                    <div className="space-y-4">
                      <h4 className="font-medium">Project Details</h4>
                      <div className="space-y-3">
                        {projectBreakdown.slice(0, 5).map((project, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.projectColor }}
                              />
                              <span className="font-medium">{project.projectName}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatDuration(project.totalTime)}</div>
                              <div className="text-sm text-muted-foreground">
                                {project.sessionsCount} sessions
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No project data available</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
