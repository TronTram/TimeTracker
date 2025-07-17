'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react';
import { ErrorHandler } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our error handling service
    this.logError(error, errorInfo);
    
    // Call the optional onError prop
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      errorInfo,
    });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      retryCount: this.retryCount,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Details:', errorDetails);
      console.groupEnd();
    }

    // In production, you could send this to an error tracking service
    // Example: Sentry, Bugsnag, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToTracking(errorDetails);
    }
  };

  private sendErrorToTracking = async (errorDetails: any) => {
    try {
      // Example implementation - replace with your error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (trackingError) {
      console.error('Failed to send error to tracking service:', trackingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    } else {
      // Max retries reached, redirect to home or show permanent error
      this.handleGoHome();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleReportIssue = () => {
    const { error, errorId } = this.state;
    const issueTitle = `Error Report: ${error?.message || 'Unknown Error'}`;
    const issueBody = `
## Error Report

**Error ID:** ${errorId}
**Message:** ${error?.message}
**Stack Trace:**
\`\`\`
${error?.stack}
\`\`\`

**Component Stack:**
\`\`\`
${this.state.errorInfo?.componentStack}
\`\`\`

**URL:** ${typeof window !== 'undefined' ? window.location.href : ''}
**User Agent:** ${typeof window !== 'undefined' ? window.navigator.userAgent : ''}
**Timestamp:** ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim();

    const githubUrl = `https://github.com/your-repo/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
    window.open(githubUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const canRetry = this.retryCount < this.maxRetries;
      
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                Oops! Something went wrong
              </h1>
              
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {error?.message || 'An unexpected error occurred'}
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 text-left">
                  <details className="rounded border p-2 text-sm">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                      {error?.stack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="space-y-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again {this.retryCount > 0 && `(${this.maxRetries - this.retryCount} attempts left)`}
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant={canRetry ? "outline" : "default"}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>

                <Button
                  onClick={this.handleReportIssue}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Report Issue
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>

              {errorId && (
                <p className="mt-4 text-xs text-gray-500">
                  Error ID: {errorId}
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different parts of the app
export function TimerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold">Timer Error</h3>
          <p className="mb-4 text-gray-600">
            The timer encountered an error. Your data is safe.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Timer
          </Button>
        </Card>
      }
      isolate
    >
      {children}
    </ErrorBoundary>
  );
}

export function AnalyticsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="mb-2 text-lg font-semibold">Analytics Unavailable</h3>
          <p className="mb-4 text-gray-600">
            Unable to load analytics data. Other features continue to work normally.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      }
      isolate
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
