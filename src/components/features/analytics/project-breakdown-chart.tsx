/**
 * Project Breakdown Chart Component
 * Pie chart for project time distribution
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { PieChartData } from '@/types/analytics';
import { formatChartTime } from '@/lib/chart-utils';

interface ProjectBreakdownChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  title?: string;
  className?: string;
}

export function ProjectBreakdownChart({ 
  data, 
  height = 300, 
  showLegend = true, 
  title = "Project Breakdown",
  className = ""
}: ProjectBreakdownChartProps) {
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Time: {formatChartTime(data.value * 60)}
          </p>
          <p className="text-sm text-muted-foreground">
            Share: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label formatter
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Hide labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend formatter
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div 
          className="flex items-center justify-center text-muted-foreground"
          style={{ height }}
        >
          No project data available for the selected period
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={height * 0.35}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              content={renderCustomLegend}
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-primary">
            {data.length}
          </p>
          <p className="text-sm text-muted-foreground">Active Projects</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">
            {formatChartTime(data.reduce((sum, item) => sum + item.value, 0) * 60)}
          </p>
          <p className="text-sm text-muted-foreground">Total Time</p>
        </div>
      </div>
    </Card>
  );
}
