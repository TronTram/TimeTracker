import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ErrorHandler } from '@/lib/errors';

// Schema for performance alerts
const performanceAlertSchema = z.object({
  type: z.enum(['slow_operation', 'slow_api', 'memory_warning', 'performance_threshold']),
  name: z.string(),
  duration: z.number().optional(),
  threshold: z.number().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
  context: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const alertData = performanceAlertSchema.parse(body);

    // Log performance issue
    console.warn('Performance Alert:', {
      type: alertData.type,
      name: alertData.name,
      duration: alertData.duration,
      threshold: alertData.threshold,
      timestamp: alertData.timestamp,
    });

    // Store performance metrics
    await storePerformanceMetrics(alertData);

    // Check if this requires immediate attention
    if (shouldAlertPerformance(alertData)) {
      await triggerPerformanceAlert(alertData);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance alert recorded',
    });

  } catch (error) {
    console.error('Performance monitoring failed:', error);
    
    return NextResponse.json(
      ErrorHandler.handle(error),
      { status: 500 }
    );
  }
}

// Store performance metrics (mock implementation)
async function storePerformanceMetrics(alertData: z.infer<typeof performanceAlertSchema>) {
  const metrics = {
    timestamp: new Date(alertData.timestamp),
    type: alertData.type,
    name: alertData.name,
    duration: alertData.duration,
    threshold: alertData.threshold,
    context: alertData.context,
  };

  // In production, store in time-series database
  // await influxDB.writePoint({
  //   measurement: 'performance_alerts',
  //   tags: { type: alertData.type, name: alertData.name },
  //   fields: { duration: alertData.duration, threshold: alertData.threshold },
  //   timestamp: new Date(alertData.timestamp),
  // });

  console.log('Performance metrics stored:', metrics);
}

// Check if performance issue requires alerting
function shouldAlertPerformance(alertData: z.infer<typeof performanceAlertSchema>): boolean {
  // Alert for severe performance issues
  switch (alertData.type) {
    case 'slow_api':
      return (alertData.duration || 0) > 5000; // > 5 seconds
    case 'slow_operation':
      return (alertData.duration || 0) > 3000; // > 3 seconds
    case 'memory_warning':
      return true; // Always alert on memory issues
    default:
      return false;
  }
}

// Trigger performance alert
async function triggerPerformanceAlert(alertData: z.infer<typeof performanceAlertSchema>) {
  console.warn('🐌 PERFORMANCE ALERT 🐌', {
    type: alertData.type,
    name: alertData.name,
    duration: alertData.duration,
    threshold: alertData.threshold,
    timestamp: alertData.timestamp,
  });

  // In production, send to monitoring service
  // await sendSlackAlert(`Performance issue detected: ${alertData.name} took ${alertData.duration}ms`);
}

export async function GET(request: NextRequest) {
  // Return performance statistics
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1h';
    
    // Mock performance statistics
    const stats = {
      timeframe,
      avgResponseTime: 245, // ms
      slowestOperations: [
        { name: 'api-analytics-data', avgDuration: 1200, count: 15 },
        { name: 'render-analytics-chart', avgDuration: 800, count: 32 },
        { name: 'api-projects-list', avgDuration: 650, count: 28 },
      ],
      performanceScore: 85,
      memoryUsage: {
        avg: 45.2, // MB
        peak: 67.8,
        alerts: 2,
      },
      thresholdViolations: {
        apiResponse: 8,
        renderTime: 15,
        loadTime: 3,
      },
      coreWebVitals: {
        fcp: 1200, // First Contentful Paint
        lcp: 2100, // Largest Contentful Paint
        fid: 45,   // First Input Delay
        cls: 0.05, // Cumulative Layout Shift
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    return NextResponse.json(
      ErrorHandler.handle(error),
      { status: 500 }
    );
  }
}
