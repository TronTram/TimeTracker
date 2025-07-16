/**
 * Time Trend Chart Component
 * Line chart for daily/weekly time trends
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { LineChartData } from '@/types/analytics';
import { formatChartTime } from '@/lib/chart-utils';

interface TimeTrendChartProps {
  data: LineChartData[];
  height?: number;
  showLegend?: boolean;
  title?: string;
  className?: string;
}

export function TimeTrendChart({ 
  data, 
  height = 300, 
  showLegend = true, 
  title = "Time Trends",
  className = ""
}: TimeTrendChartProps) {
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatChartTime(entry.value * 60)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tick formatter for Y-axis
  const formatYAxisTick = (value: number) => {
    return formatChartTime(value * 60);
  };

  if (data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div 
          className="flex items-center justify-center text-muted-foreground"
          style={{ height }}
        >
          No time data available for the selected period
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatYAxisTick}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
          )}
          <Line 
            type="monotone" 
            dataKey="totalTime" 
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="Total Time"
          />
          <Line 
            type="monotone" 
            dataKey="focusTime" 
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Focus Time"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
