import { ErrorHandler } from './errors';
import { performanceMonitor } from './performance-monitor';

// =============================================================================
// Error Logging Service
// =============================================================================

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  source: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  remoteEndpoint?: string;
  maxLocalEntries: number;
  includeBreadcrumbs: boolean;
  includeStackTrace: boolean;
  includeUserContext: boolean;
  enablePerformanceLogging: boolean;
}

class ErrorLogger {
  private config: LoggerConfig;
  private breadcrumbs: Array<{ timestamp: Date; message: string; data?: any }> = [];
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'error',
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      enableLocalStorage: true,
      maxLocalEntries: 100,
      includeBreadcrumbs: true,
      includeStackTrace: true,
      includeUserContext: true,
      enablePerformanceLogging: false,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', event.reason, {
        type: 'unhandled_rejection',
        promise: event.promise,
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', event.error || new Error(event.message), {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== (window as any)) {
        this.warn('Resource Loading Error', undefined, {
          type: 'resource_error',
          tagName: target.tagName,
          source: (target as any).src || (target as any).href,
        });
      }
    }, true);
  }

  // Set user context
  setUser(userId: string, userInfo?: Record<string, any>): void {
    this.userId = userId;
    this.addBreadcrumb('User context set', { userId, ...userInfo });
  }

  // Add breadcrumb
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    if (!this.config.includeBreadcrumbs) return;

    this.breadcrumbs.push({
      timestamp: new Date(),
      message,
      data,
    });

    // Keep only the last 20 breadcrumbs
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs = this.breadcrumbs.slice(-20);
    }
  }

  // Log error
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    this.log('error', message, error, context);
  }

  // Log warning
  warn(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    this.log('warn', message, error, context);
  }

  // Log info
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, undefined, context);
  }

  // Log debug
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, undefined, context);
  }

  // Core logging method
  private log(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) return;

    const normalizedError = error instanceof Error ? error : undefined;
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      error: normalizedError,
      context: {
        ...context,
        ...(this.config.includeUserContext && {
          userId: this.userId,
          sessionId: this.sessionId,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        }),
        ...(this.config.includeBreadcrumbs && {
          breadcrumbs: [...this.breadcrumbs],
        }),
        ...(this.config.enablePerformanceLogging && {
          performance: performanceMonitor.getMetrics(),
        }),
      },
      source: 'error-handler',
    };

    // Log to console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Log to local storage
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(entry);
    }

    // Log to remote service
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.logToRemote(entry);
    }

    // Add as breadcrumb for future logs
    this.addBreadcrumb(`${level.toUpperCase()}: ${message}`, { error: error?.toString() });
  }

  // Check if we should log this level
  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex <= configLevelIndex;
  }

  // Generate unique log ID
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log to console
  private logToConsole(entry: LogEntry): void {
    const { level, message, error, context } = entry;

    switch (level) {
      case 'error':
        console.error(`🚨 ${message}`, error, context);
        break;
      case 'warn':
        console.warn(`⚠️ ${message}`, error, context);
        break;
      case 'info':
        console.info(`ℹ️ ${message}`, context);
        break;
      case 'debug':
        console.debug(`🐛 ${message}`, context);
        break;
    }
  }

  // Log to local storage
  private logToLocalStorage(entry: LogEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const existingLogs = this.getLocalLogs();
      existingLogs.push(entry);

      // Keep only the most recent entries
      const recentLogs = existingLogs.slice(-this.config.maxLocalEntries);
      
      localStorage.setItem('app_error_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to save log to localStorage:', error);
    }
  }

  // Log to remote service
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('Failed to send log to remote service:', error);
      // Fallback to local storage
      this.logToLocalStorage(entry);
    }
  }

  // Get logs from local storage
  getLocalLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const logs = localStorage.getItem('app_error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to retrieve logs from localStorage:', error);
      return [];
    }
  }

  // Clear local logs
  clearLocalLogs(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('app_error_logs');
    } catch (error) {
      console.warn('Failed to clear logs from localStorage:', error);
    }
  }

  // Export logs for debugging
  exportLogs(): string {
    const logs = this.getLocalLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    recentErrors: LogEntry[];
    errorsByType: Record<string, number>;
  } {
    const logs = this.getLocalLogs();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentErrors = logs.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo && log.level === 'error'
    );

    const errorsByLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByType = logs.reduce((acc, log) => {
      const type = log.context?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: logs.filter(log => log.level === 'error').length,
      errorsByLevel,
      recentErrors,
      errorsByType,
    };
  }
}

// =============================================================================
// Performance Monitoring Integration
// =============================================================================

export class PerformanceErrorHandler {
  private logger: ErrorLogger;

  constructor(logger: ErrorLogger) {
    this.logger = logger;
  }

  // Monitor slow operations
  async monitorOperation<T>(
    name: string,
    operation: () => Promise<T>,
    threshold: number = 1000
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (duration > threshold) {
        this.logger.warn(`Slow operation detected: ${name}`, undefined, {
          type: 'performance_warning',
          operation: name,
          duration,
          threshold,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(`Operation failed: ${name}`, error, {
        type: 'operation_error',
        operation: name,
        duration,
      });
      throw error;
    }
  }

  // Monitor memory usage
  checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      const usage = (usedMB / limitMB) * 100;

      if (usage > 80) {
        this.logger.warn('High memory usage detected', undefined, {
          type: 'memory_warning',
          usedMB: usedMB.toFixed(2),
          limitMB: limitMB.toFixed(2),
          usage: usage.toFixed(2),
        });
      }
    }
  }
}

// =============================================================================
// Create and export singleton instances
// =============================================================================

export const errorLogger = new ErrorLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  enableLocalStorage: true,
  remoteEndpoint: process.env.NEXT_PUBLIC_ERROR_LOGGING_ENDPOINT,
  maxLocalEntries: 100,
  includeBreadcrumbs: true,
  includeStackTrace: true,
  includeUserContext: true,
  enablePerformanceLogging: process.env.NODE_ENV === 'development',
});

export const performanceErrorHandler = new PerformanceErrorHandler(errorLogger);

// Export error handler with logging integration
export const loggedErrorHandler = {
  handle: (error: unknown): never => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorLogger.error('Unhandled error', normalizedError);
    throw normalizedError;
  },

  handleAsync: async (error: unknown): Promise<never> => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorLogger.error('Unhandled async error', normalizedError);
    throw normalizedError;
  },

  handleWithContext: (error: unknown, context: Record<string, any>): never => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorLogger.error('Contextual error', normalizedError, context);
    throw normalizedError;
  },
};
