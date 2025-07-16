/**
 * Date Range Picker Component
 * Date range selector for analytics
 */

'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Predefined date ranges
  const getPresetRanges = (): DateRange[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return [
      {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Today'
      },
      {
        from: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() - 1),
        label: 'Yesterday'
      },
      {
        from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Last 7 days'
      },
      {
        from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Last 30 days'
      },
      {
        from: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Last 3 months'
      },
      {
        from: new Date(today.getFullYear(), 0, 1),
        to: new Date(today.getFullYear(), 11, 31, 23, 59, 59),
        label: 'This year'
      }
    ];
  };

  const presetRanges = getPresetRanges();

  const formatDateRange = (range: DateRange) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };

    if (range.label === 'Today') {
      return 'Today';
    }
    
    if (range.label === 'Yesterday') {
      return 'Yesterday';
    }

    // For preset ranges, use the label
    const preset = presetRanges.find(p => p.label === range.label);
    if (preset) {
      return range.label;
    }

    // For custom ranges, show the date range
    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  };

  const handleRangeSelect = (range: DateRange) => {
    onChange(range);
    setIsOpen(false);
  };

  const isRangeSelected = (range: DateRange) => {
    return range.label === value.label;
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDateRange(value)}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full left-0 mt-2 w-64 p-2 z-20 shadow-lg border">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Quick ranges
              </div>
              {presetRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handleRangeSelect(range)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    isRangeSelected(range)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            <div className="border-t mt-2 pt-2">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Custom range
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => {
                  // For now, just close the dropdown
                  // In a real implementation, you'd open a calendar picker
                  setIsOpen(false);
                }}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Pick custom dates
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// Hook for managing date range state
export function useDateRange(initialRange?: DateRange) {
  const getDefaultRange = (): DateRange => {
    if (initialRange) return initialRange;
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return {
      from: new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: 'Last 7 days'
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange());

  return {
    dateRange,
    setDateRange,
    isToday: dateRange.label === 'Today',
    isThisWeek: dateRange.label === 'Last 7 days',
    isThisMonth: dateRange.label === 'Last 30 days',
    isThisYear: dateRange.label === 'This year'
  };
}

// Utility functions for working with date ranges
export const dateRangeUtils = {
  // Check if a date is within a range
  isDateInRange: (date: Date, range: DateRange): boolean => {
    return date >= range.from && date <= range.to;
  },

  // Get the number of days in a range
  getDaysInRange: (range: DateRange): number => {
    const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Format a date range for display
  formatRange: (range: DateRange): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  },

  // Create a range from a number of days ago to now
  createRangeFromDays: (days: number, label?: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      from: new Date(today.getTime() - days * 24 * 60 * 60 * 1000),
      to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      label: label || `Last ${days} days`
    };
  },

  // Check if two ranges are equal
  rangesEqual: (range1: DateRange, range2: DateRange): boolean => {
    return range1.from.getTime() === range2.from.getTime() &&
           range1.to.getTime() === range2.to.getTime();
  }
};
