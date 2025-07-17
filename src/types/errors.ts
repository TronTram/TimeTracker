// Error-related TypeScript interfaces and types

// =============================================================================
// Error Types
// =============================================================================

export interface ErrorInfo {
  message: string;
  code: string;
  statusCode: number;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface NetworkErrorInfo extends ErrorInfo {
  url?: string;
  method?: string;
  timeout?: boolean;
  offline?: boolean;
}

export interface DatabaseErrorInfo extends ErrorInfo {
  operation?: string;
  table?: string;
  constraint?: string;
}

// =============================================================================
// Error Response Types
// =============================================================================

export interface ErrorResponse {
  success: false;
  error: ErrorInfo;
  errors?: ValidationErrorDetails[];
  requestId?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// Error State Types
// =============================================================================

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorCode?: string;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastAttempt?: Date;
}

export interface FormErrorState {
  globalError: string | null;
  fieldErrors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}

export interface NetworkErrorState {
  isOnline: boolean;
  lastConnectionCheck: Date;
  failedRequests: Array<{
    url: string;
    method: string;
    timestamp: Date;
    error: string;
  }>;
}

// =============================================================================
// Error Handling Configuration
// =============================================================================

export interface ErrorHandlingConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableCircuitBreaker: boolean;
  enableLogging: boolean;
  enableUserNotification: boolean;
  fallbackBehavior: 'throw' | 'return-null' | 'return-default';
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitter: boolean;
  retryCondition: (error: Error, attempt: number) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  expectedErrors: string[];
}

// =============================================================================
// Error Tracking Types
// =============================================================================

export interface ErrorTrackingEvent {
  id: string;
  timestamp: Date;
  error: ErrorInfo;
  user?: {
    id: string;
    email?: string;
  };
  session?: {
    id: string;
    userAgent: string;
    url: string;
  };
  breadcrumbs: ErrorBreadcrumb[];
  tags: Record<string, string>;
  fingerprint: string[];
}

export interface ErrorBreadcrumb {
  timestamp: Date;
  category: 'navigation' | 'user' | 'http' | 'error' | 'lifecycle';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  failuresByType: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: Date;
  }>;
}

// =============================================================================
// Performance Error Types
// =============================================================================

export interface PerformanceErrorInfo extends ErrorInfo {
  operation: string;
  duration: number;
  threshold: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface PerformanceThresholds {
  apiResponse: number;
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
}

// =============================================================================
// Error Recovery Types
// =============================================================================

export interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  action: () => Promise<void> | void;
  fallback?: () => Promise<void> | void;
}

export interface RecoveryAction {
  type: 'retry' | 'reload' | 'redirect' | 'fallback' | 'ignore';
  params?: Record<string, any>;
  delay?: number;
}

// =============================================================================
// Component Error Types
// =============================================================================

export interface ComponentErrorInfo {
  componentName: string;
  componentStack: string;
  errorBoundary?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
}

export interface ComponentErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ComponentErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

// =============================================================================
// API Error Types
// =============================================================================

export interface ApiErrorInfo extends ErrorInfo {
  endpoint: string;
  method: string;
  requestId?: string;
  responseTime?: number;
  retryAfter?: number;
}

export interface ApiErrorHandler {
  canHandle: (error: Error) => boolean;
  handle: (error: Error) => Promise<ApiResponse<any>>;
  priority: number;
}

// =============================================================================
// Error Logger Types
// =============================================================================

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  source: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorLoggerConfig {
  level: 'error' | 'warning' | 'info';
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  remoteEndpoint?: string;
  maxLocalEntries: number;
  includeBreadcrumbs: boolean;
  includeUserContext: boolean;
}

// =============================================================================
// User Experience Error Types
// =============================================================================

export interface UserFacingError {
  title: string;
  message: string;
  actionLabel?: string;
  actionHandler?: () => void;
  severity: 'low' | 'medium' | 'high' | 'critical';
  persistent?: boolean;
  showDetails?: boolean;
}

export interface ErrorNotification {
  id: string;
  type: 'toast' | 'modal' | 'banner' | 'inline';
  error: UserFacingError;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  dismissible?: boolean;
}

// =============================================================================
// Error Boundaries Types
// =============================================================================

export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean;
  reset?: { keys?: Array<string | number>; resetOnKeys?: boolean };
  resetQuery?: () => void;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  reset: () => void;
  hasError: boolean;
}

// =============================================================================
// Monitoring Types
// =============================================================================

export interface ErrorMonitoringConfig {
  enableRealTimeAlerts: boolean;
  enablePerformanceTracking: boolean;
  enableUserSessionTracking: boolean;
  enableBreadcrumbTracking: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    errorCount: number;
  };
  samplingRate: number;
  ignoreErrors: string[];
}

export interface ErrorAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  errorCount: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success;
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success;
}

export function isNetworkError(error: Error): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}

export function isValidationError(error: Error): boolean {
  return error.name === 'ValidationError';
}

export function isTimeoutError(error: Error): boolean {
  return error.message.toLowerCase().includes('timeout');
}

// =============================================================================
// Error Severity Levels
// =============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  PERFORMANCE = 'performance',
  USER_INPUT = 'user_input',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

// =============================================================================
// Utility Types
// =============================================================================

export type ErrorHandler<T = any> = (error: Error) => Promise<T | null> | T | null;

export type AsyncErrorHandler<T = any> = (error: Error) => Promise<T | null>;

export type ErrorPredicate = (error: Error) => boolean;

export type ErrorTransformer = (error: Error) => Error;

export type ErrorReporter = (error: Error, context?: Record<string, any>) => void;

// =============================================================================
// Generic Error Handling Types
// =============================================================================

export interface WithErrorHandling<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}

export interface ErrorHandlingOptions {
  retryable?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallbackValue?: any;
  onError?: ErrorHandler;
  transformError?: ErrorTransformer;
}

export interface ErrorContextValue {
  reportError: (error: Error, context?: Record<string, any>) => void;
  clearError: () => void;
  globalError: Error | null;
  isOnline: boolean;
  retryFailedOperations: () => Promise<void>;
}
