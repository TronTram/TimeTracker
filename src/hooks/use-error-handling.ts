import { useCallback, useState, useRef, useEffect } from 'react';
import { AppError, ErrorHandler, ValidationError } from '@/lib/errors';
import { performanceMonitor } from '@/lib/performance-monitor';

// =============================================================================
// Error Handling Hook
// =============================================================================

interface UseErrorHandlingOptions {
  onError?: (error: Error) => void;
  throwOnError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface ErrorState {
  error: Error | null;
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
  errorId: string | null;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    onError,
    throwOnError = false,
    retryable = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    isRetrying: false,
    retryCount: 0,
    errorId: null,
  });

  const lastOperationRef = useRef<() => Promise<any>>();

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      isRetrying: false,
      retryCount: 0,
      errorId: null,
    });
  }, []);

  // Handle error
  const handleError = useCallback((error: unknown, operation?: () => Promise<any>) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    // Store the operation for potential retry
    if (operation) {
      lastOperationRef.current = operation;
    }

    const newErrorState: ErrorState = {
      error: normalizedError,
      hasError: true,
      isRetrying: false,
      retryCount: 0,
      errorId,
    };

    setErrorState(newErrorState);

    // Log error with performance context
    performanceMonitor.mark('error-occurred');
    console.error('Error handled by useErrorHandling:', {
      error: normalizedError,
      errorId,
      timestamp: new Date().toISOString(),
    });

    // Call optional error handler
    onError?.(normalizedError);

    // Throw if configured to do so
    if (throwOnError) {
      throw normalizedError;
    }

    return normalizedError;
  }, [onError, throwOnError]);

  // Retry last operation
  const retry = useCallback(async () => {
    if (!lastOperationRef.current || !retryable || errorState.retryCount >= maxRetries) {
      return false;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // Wait before retrying
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * errorState.retryCount));
      }

      const result = await lastOperationRef.current();
      clearError();
      return result;
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      
      if (errorState.retryCount >= maxRetries) {
        setErrorState(prev => ({
          ...prev,
          error: normalizedError,
          isRetrying: false,
        }));
      } else {
        // Try again
        setTimeout(() => retry(), retryDelay);
      }
      
      return false;
    }
  }, [retryable, maxRetries, retryDelay, errorState.retryCount, clearError]);

  // Wrap async operations with error handling
  const withErrorHandling = useCallback(<T>(
    operation: () => Promise<T>,
    operationName?: string
  ) => {
    return async (): Promise<T | null> => {
      try {
        clearError();
        
        if (operationName) {
          performanceMonitor.mark(`operation-${operationName}`);
        }

        const result = await operation();
        
        if (operationName) {
          performanceMonitor.measure(`operation-${operationName}`);
        }

        return result;
      } catch (error) {
        handleError(error, operation);
        return null;
      }
    };
  }, [clearError, handleError]);

  // Wrap sync operations with error handling
  const withSyncErrorHandling = useCallback(<T>(
    operation: () => T,
    operationName?: string
  ) => {
    return (): T | null => {
      try {
        clearError();
        
        if (operationName) {
          performanceMonitor.mark(`sync-operation-${operationName}`);
        }

        const result = operation();
        
        if (operationName) {
          performanceMonitor.measure(`sync-operation-${operationName}`);
        }

        return result;
      } catch (error) {
        handleError(error);
        return null;
      }
    };
  }, [clearError, handleError]);

  return {
    ...errorState,
    clearError,
    handleError,
    retry,
    withErrorHandling,
    withSyncErrorHandling,
    canRetry: retryable && errorState.retryCount < maxRetries,
  };
}

// =============================================================================
// Async Error Boundary Hook
// =============================================================================

export function useAsyncErrorBoundary() {
  const [, setError] = useState();

  return useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// =============================================================================
// Form Error Handling Hook
// =============================================================================

interface FieldError {
  message: string;
  code?: string;
}

interface FormErrorState {
  [field: string]: FieldError;
}

export function useFormErrorHandling() {
  const [fieldErrors, setFieldErrors] = useState<FormErrorState>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const setFieldError = useCallback((field: string, error: string | FieldError) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: typeof error === 'string' ? { message: error } : error,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGlobalError(null);
  }, []);

  const handleValidationError = useCallback((error: ValidationError) => {
    setGlobalError(error.message);
    
    // Set field-specific errors
    Object.entries(error.errors).forEach(([field, messages]) => {
      if (messages.length > 0 && messages[0]) {
        setFieldError(field, messages[0]);
      }
    });
  }, [setFieldError]);

  const handleFormError = useCallback((error: unknown) => {
    clearAllErrors();

    if (error instanceof ValidationError) {
      handleValidationError(error);
    } else if (error instanceof AppError) {
      setGlobalError(error.message);
    } else {
      setGlobalError('An unexpected error occurred');
    }
  }, [clearAllErrors, handleValidationError]);

  return {
    fieldErrors,
    globalError,
    setFieldError,
    clearFieldError,
    setGlobalError,
    clearAllErrors,
    handleFormError,
    hasErrors: Object.keys(fieldErrors).length > 0 || globalError !== null,
  };
}

// =============================================================================
// Network Error Handling Hook
// =============================================================================

interface NetworkErrorState {
  isOffline: boolean;
  networkError: string | null;
  retryQueue: Array<() => Promise<any>>;
}

export function useNetworkErrorHandling() {
  const [networkState, setNetworkState] = useState<NetworkErrorState>({
    isOffline: false,
    networkError: null,
    retryQueue: [],
  });

  // Check if we're online
  useEffect(() => {
    const handleOnline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOffline: false,
        networkError: null,
      }));
    };

    const handleOffline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOffline: true,
        networkError: 'You are currently offline',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToRetryQueue = useCallback((operation: () => Promise<any>) => {
    setNetworkState(prev => ({
      ...prev,
      retryQueue: [...prev.retryQueue, operation],
    }));
  }, []);

  const processRetryQueue = useCallback(async () => {
    if (networkState.isOffline || networkState.retryQueue.length === 0) {
      return;
    }

    const operations = [...networkState.retryQueue];
    setNetworkState(prev => ({ ...prev, retryQueue: [] }));

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to retry queued operation:', error);
        // Could add back to queue or handle differently
      }
    }
  }, [networkState.isOffline, networkState.retryQueue]);

  // Process retry queue when coming back online
  useEffect(() => {
    if (!networkState.isOffline && networkState.retryQueue.length > 0) {
      processRetryQueue();
    }
  }, [networkState.isOffline, processRetryQueue]);

  const handleNetworkError = useCallback((error: unknown, retryOperation?: () => Promise<any>) => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      setNetworkState(prev => ({
        ...prev,
        networkError: 'Network connection failed',
      }));

      if (retryOperation) {
        addToRetryQueue(retryOperation);
      }
    }
  }, [addToRetryQueue]);

  return {
    ...networkState,
    handleNetworkError,
    addToRetryQueue,
    processRetryQueue,
  };
}

// =============================================================================
// API Error Handling Hook
// =============================================================================

export function useApiErrorHandling() {
  const networkErrorHandling = useNetworkErrorHandling();
  const errorHandling = useErrorHandling({
    retryable: true,
    maxRetries: 3,
    retryDelay: 1000,
  });

  const handleApiError = useCallback((error: unknown, operation?: () => Promise<any>) => {
    // Check for network errors first
    if (error instanceof TypeError && error.message.includes('fetch')) {
      networkErrorHandling.handleNetworkError(error, operation);
      return;
    }

    // Handle other API errors
    errorHandling.handleError(error, operation);
  }, [networkErrorHandling, errorHandling]);

  const apiCall = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    try {
      if (operationName) {
        return await performanceMonitor.monitorApiCall(operationName, operation);
      }
      return await operation();
    } catch (error) {
      handleApiError(error, operation);
      return null;
    }
  }, [handleApiError]);

  return {
    ...errorHandling,
    ...networkErrorHandling,
    apiCall,
    handleApiError,
  };
}

// =============================================================================
// Global Error Handler Hook
// =============================================================================

export function useGlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default browser behavior
      event.preventDefault();
      
      // Log to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Send to error tracking service
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'unhandled_rejection',
            error: String(event.reason),
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      // Log to monitoring service
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'global_error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? String(event.error) : null,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

// =============================================================================
// Error Recovery Hook
// =============================================================================

export function useErrorRecovery() {
  const recoveryStrategies = useRef<Map<string, () => void>>(new Map());

  const registerRecoveryStrategy = useCallback((errorType: string, strategy: () => void) => {
    recoveryStrategies.current.set(errorType, strategy);
  }, []);

  const executeRecovery = useCallback((errorType: string) => {
    const strategy = recoveryStrategies.current.get(errorType);
    if (strategy) {
      try {
        strategy();
      } catch (recoveryError) {
        console.error('Error recovery strategy failed:', recoveryError);
      }
    }
  }, []);

  return {
    registerRecoveryStrategy,
    executeRecovery,
  };
}
