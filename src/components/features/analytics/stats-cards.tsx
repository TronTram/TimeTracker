/**
 * Stats Cards Component
 * Summary cards with key statistics
 */

'use client';

import { Card } from '@/components/ui/card';
import { StatsCardData } from '@/types/analytics';
import { 
  Clock, 
  Activity, 
  TrendingUp, 
  Target, 
  Users, 
  Calendar,
  Zap,
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface StatsCardsProps {
  cards: StatsCardData[];
  className?: string;
}

export function StatsCards({ cards, className = "" }: StatsCardsProps) {
  
  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      clock: Clock,
      activity: Activity,
      'trending-up': TrendingUp,
      target: Target,
      users: Users,
      calendar: Calendar,
      zap: Zap,
      award: Award,
    };
    
    const IconComponent = iconMap[iconName] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  // Trend icon mapping
  const getTrendIcon = (isPositive: boolean) => {
    if (isPositive) {
      return <ArrowUp className="w-3 h-3" />;
    } else {
      return <ArrowDown className="w-3 h-3" />;
    }
  };

  // Format trend value
  const formatTrendValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue === 0) return '0%';
    return `${absValue.toFixed(1)}%`;
  };

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {cards.map((card, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold" style={{ color: card.color || 'inherit' }}>
                {card.value}
              </p>
              {card.trend && (
                <div className="flex items-center gap-1 mt-2">
                  <div 
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      card.trend.isPositive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : card.trend.value === 0
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {card.trend.value === 0 ? (
                      <Minus className="w-3 h-3" />
                    ) : (
                      getTrendIcon(card.trend.isPositive)
                    )}
                    <span className="font-medium">
                      {formatTrendValue(card.trend.value)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-1">
                    {card.trend.period}
                  </span>
                </div>
              )}
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: card.color ? `${card.color}20` : 'rgb(59 130 246 / 0.1)',
                color: card.color || '#3b82f6'
              }}
            >
              {getIcon(card.icon)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Individual stat card component for more customization
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  description?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  description,
  className = ""
}: StatCardProps) {
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      clock: Clock,
      activity: Activity,
      'trending-up': TrendingUp,
      target: Target,
      users: Users,
      calendar: Calendar,
      zap: Zap,
      award: Award,
    };
    
    const IconComponent = iconMap[iconName] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  const getTrendIcon = (isPositive: boolean) => {
    if (isPositive) {
      return <ArrowUp className="w-3 h-3" />;
    } else {
      return <ArrowDown className="w-3 h-3" />;
    }
  };

  const formatTrendValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue === 0) return '0%';
    return `${absValue.toFixed(1)}%`;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: color || 'inherit' }}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <div 
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  trend.isPositive 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : trend.value === 0
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {trend.value === 0 ? (
                  <Minus className="w-3 h-3" />
                ) : (
                  getTrendIcon(trend.isPositive)
                )}
                <span className="font-medium">
                  {formatTrendValue(trend.value)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                {trend.period}
              </span>
            </div>
          )}
        </div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center ml-4"
          style={{ 
            backgroundColor: color ? `${color}20` : 'rgb(59 130 246 / 0.1)',
            color: color || '#3b82f6'
          }}
        >
          {getIcon(icon)}
        </div>
      </div>
    </Card>
  );
}
