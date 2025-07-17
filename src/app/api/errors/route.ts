import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ErrorHandler } from '@/lib/errors';

// Schema for error tracking requests
const errorTrackingSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: z.enum(['error', 'warn', 'info', 'debug']),
  message: z.string(),
  error: z.object({
    name: z.string().optional(),
    message: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
  context: z.record(z.any()).optional(),
  source: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const errorData = errorTrackingSchema.parse(body);

    // In production, you would typically:
    // 1. Store in database
    // 2. Send to monitoring service (Sentry, DataDog, etc.)
    // 3. Trigger alerts for critical errors
    // 4. Update error metrics

    // For now, we'll just log and store basic metrics
    console.error('Client Error Tracked:', {
      id: errorData.id,
      level: errorData.level,
      message: errorData.message,
      userId: errorData.userId,
      url: errorData.url,
      timestamp: errorData.timestamp,
    });

    // Store basic error metrics (you'd use a real database in production)
    await storeErrorMetrics(errorData);

    // Check if this is a critical error that needs immediate attention
    if (errorData.level === 'error' && shouldAlert(errorData)) {
      await triggerErrorAlert(errorData);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking failed:', error);
    
    return NextResponse.json(
      ErrorHandler.handle(error),
      { status: 500 }
    );
  }
}

// Store error metrics (mock implementation)
async function storeErrorMetrics(errorData: z.infer<typeof errorTrackingSchema>) {
  // In a real application, you'd store this in a database
  // and aggregate metrics over time
  
  const metrics = {
    timestamp: new Date(errorData.timestamp),
    level: errorData.level,
    message: errorData.message,
    userId: errorData.userId,
    sessionId: errorData.sessionId,
    url: errorData.url,
    userAgent: errorData.userAgent,
    context: errorData.context,
  };

  // Example: Store in database
  // await prisma.errorLog.create({ data: metrics });
  
  // Example: Update error counters
  // await redis.incr(`errors:${errorData.level}:${new Date().toISOString().split('T')[0]}`);
  
  console.log('Error metrics stored:', metrics);
}

// Check if error should trigger an alert
function shouldAlert(errorData: z.infer<typeof errorTrackingSchema>): boolean {
  // Alert criteria examples:
  // - Critical JavaScript errors
  // - High frequency of same error
  // - Errors affecting multiple users
  // - Performance degradation errors

  const alertTriggers = [
    'Unhandled Promise Rejection',
    'Global Error',
    'Circuit breaker is OPEN',
    'Rate limit exceeded',
    'Database connection failed',
  ];

  return alertTriggers.some(trigger => 
    errorData.message.includes(trigger)
  );
}

// Trigger error alert (mock implementation)
async function triggerErrorAlert(errorData: z.infer<typeof errorTrackingSchema>) {
  // In a real application, you'd:
  // - Send to Slack/Discord
  // - Create support ticket
  // - Send email to on-call engineer
  // - Update monitoring dashboard

  console.warn('🚨 CRITICAL ERROR ALERT 🚨', {
    id: errorData.id,
    message: errorData.message,
    userId: errorData.userId,
    url: errorData.url,
    timestamp: errorData.timestamp,
  });

  // Example: Send webhook to Slack
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Critical Error: ${errorData.message}`,
  //     attachments: [{
  //       color: 'danger',
  //       fields: [
  //         { title: 'Error ID', value: errorData.id, short: true },
  //         { title: 'User ID', value: errorData.userId || 'Anonymous', short: true },
  //         { title: 'URL', value: errorData.url, short: false },
  //         { title: 'Timestamp', value: errorData.timestamp, short: true },
  //       ]
  //     }]
  //   })
  // });
}

export async function GET(request: NextRequest) {
  // Return error statistics for monitoring dashboard
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // Mock error statistics
    const stats = {
      timeframe,
      totalErrors: 42,
      errorsByLevel: {
        error: 15,
        warn: 20,
        info: 5,
        debug: 2,
      },
      topErrors: [
        { message: 'Network request failed', count: 8, lastSeen: new Date() },
        { message: 'Validation error in form', count: 5, lastSeen: new Date() },
        { message: 'Timer sync failed', count: 2, lastSeen: new Date() },
      ],
      errorRate: 0.05, // 5%
      affectedUsers: 12,
      resolvedErrors: 38,
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
