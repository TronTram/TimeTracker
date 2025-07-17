'use client';

import React from 'react';
import { performanceMonitor, PerformanceOptimizer } from '@/lib/performance-monitor';

interface PerformanceContextType {
  trackOperation: (name: string, operation: () => any) => any;
  trackAsyncOperation: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
  getMetrics: () => Record<string, number>;
  clearMetrics: () => void;
  isMonitoring: boolean;
  setMonitoring: (enabled: boolean) => void;
}

const PerformanceContext = React.createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enableAutoOptimization?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enableMonitoring = process.env.NODE_ENV === 'development',
  enableAutoOptimization = true,
}: PerformanceProviderProps) {
  const [isMonitoring, setMonitoring] = React.useState(enableMonitoring);
  const metricsRef = React.useRef<Record<string, number>>({});

  // Track render performance
  React.useEffect(() => {
    if (!isMonitoring) return;

    performanceMonitor.mark('app-render-start');
    
    return () => {
      const duration = performanceMonitor.measure('app-render');
      if (duration !== null) {
        metricsRef.current['app-render'] = duration;
      }
    };
  }, [isMonitoring]);

  // Monitor memory usage periodically
  React.useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      performanceMonitor.monitorMemory();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Auto-optimization setup
  React.useEffect(() => {
    if (!enableAutoOptimization) return;

    // Preload critical resources
    PerformanceOptimizer.preloadResource('/fonts/inter.woff2', 'font', 'font/woff2');
    
    // Register service worker
    PerformanceOptimizer.registerServiceWorker();
    
    // Setup lazy loading for images
    PerformanceOptimizer.lazyLoadImages();

    // Setup resource cleanup
    return () => {
      // Cleanup performance observers and intervals
    };
  }, [enableAutoOptimization]);

  const trackOperation = React.useCallback((name: string, operation: () => any) => {
    if (!isMonitoring) return operation();
    
    return performanceMonitor.monitorRender(name, operation);
  }, [isMonitoring]);

  const trackAsyncOperation = React.useCallback(<T,>(
    name: string, 
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!isMonitoring) return operation();
    
    return performanceMonitor.monitorApiCall(name, operation);
  }, [isMonitoring]);

  const getMetrics = React.useCallback(() => {
    return {
      ...performanceMonitor.getMetrics(),
      ...metricsRef.current,
    };
  }, []);

  const clearMetrics = React.useCallback(() => {
    performanceMonitor.clearMetrics();
    metricsRef.current = {};
  }, []);

  const value = React.useMemo(
    () => ({
      trackOperation,
      trackAsyncOperation,
      getMetrics,
      clearMetrics,
      isMonitoring,
      setMonitoring,
    }),
    [trackOperation, trackAsyncOperation, getMetrics, clearMetrics, isMonitoring, setMonitoring]
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = React.useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = React.memo((props: P) => {
    const { trackOperation } = usePerformance();
    const name = componentName || Component.displayName || Component.name;

    return trackOperation(`render-${name}`, () => <Component {...props} />);
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for component-level performance monitoring
export function useComponentPerformance(componentName: string) {
  const { trackOperation, trackAsyncOperation } = usePerformance();
  const renderCountRef = React.useRef(0);
  const mountTimeRef = React.useRef<number>();

  React.useEffect(() => {
    mountTimeRef.current = performance.now();
    renderCountRef.current = 0;
    
    return () => {
      if (mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        console.log(`Component ${componentName} was mounted for ${mountDuration.toFixed(2)}ms with ${renderCountRef.current} renders`);
      }
    };
  }, [componentName]);

  React.useEffect(() => {
    renderCountRef.current += 1;
  });

  const trackRender = React.useCallback((operation: () => any) => {
    return trackOperation(`${componentName}-render`, operation);
  }, [componentName, trackOperation]);

  const trackAsyncAction = React.useCallback(<T,>(
    actionName: string,
    operation: () => Promise<T>
  ) => {
    return trackAsyncOperation(`${componentName}-${actionName}`, operation);
  }, [componentName, trackAsyncOperation]);

  return {
    trackRender,
    trackAsyncAction,
    renderCount: renderCountRef.current,
  };
}

// Hook for API performance monitoring
export function useApiPerformance() {
  const { trackAsyncOperation } = usePerformance();

  const trackApiCall = React.useCallback(<T,>(
    endpoint: string,
    apiCall: () => Promise<T>
  ) => {
    const apiName = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    return trackAsyncOperation(`api-${apiName}`, apiCall);
  }, [trackAsyncOperation]);

  return { trackApiCall };
}

// Performance debugging tools (development only)
export function usePerformanceDebugger() {
  const { getMetrics, isMonitoring } = usePerformance();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !isMonitoring) return;

    // Log performance metrics every 10 seconds in development
    const interval = setInterval(() => {
      const metrics = getMetrics();
      if (Object.keys(metrics).length > 0) {
        console.group('🔍 Performance Metrics');
        Object.entries(metrics).forEach(([name, duration]) => {
          const color = duration > 100 ? 'color: red' : duration > 50 ? 'color: orange' : 'color: green';
          console.log(`%c${name}: ${duration.toFixed(2)}ms`, color);
        });
        console.groupEnd();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [getMetrics, isMonitoring]);

  const logComponentTree = React.useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      // This would log the component tree for performance analysis
      console.log('Component tree analysis would be displayed here');
    }
  }, []);

  return { logComponentTree };
}
