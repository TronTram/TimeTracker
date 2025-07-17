import { ErrorHandler, AppError } from './errors';

// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceEntry> = new Map();
  private thresholds = {
    loadTime: 3000, // 3 seconds
    apiResponse: 1000, // 1 second
    renderTime: 16, // 16ms for 60fps
    memoryUsage: 50 * 1024 * 1024, // 50MB
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  // Mark the end of a performance measurement and calculate duration
  measure(name: string): number | null {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.metrics.set(name, measure);
          this.checkThreshold(name, measure.duration);
          return measure.duration;
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return null;
  }

  // Get all performance metrics
  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.metrics.forEach((entry, name) => {
      metrics[name] = entry.duration;
    });
    return metrics;
  }

  // Monitor API call performance
  async monitorApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    this.mark(`api-${name}`);
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      this.measure(`api-${name}`);
      this.checkThreshold(`api-${name}`, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logSlowApi(`api-${name}`, duration, error);
      throw error;
    }
  }

  // Monitor component render performance
  monitorRender<T>(name: string, renderFn: () => T): T {
    this.mark(`render-${name}`);
    const result = renderFn();
    this.measure(`render-${name}`);
    return result;
  }

  // Check if performance exceeds thresholds
  private checkThreshold(name: string, duration: number): void {
    let threshold: number | undefined;
    
    if (name.startsWith('api-')) {
      threshold = this.thresholds.apiResponse;
    } else if (name.startsWith('render-')) {
      threshold = this.thresholds.renderTime;
    } else if (name.includes('load')) {
      threshold = this.thresholds.loadTime;
    }

    if (threshold && duration > threshold) {
      this.logSlowOperation(name, duration, threshold);
    }
  }

  // Log slow operations
  private logSlowOperation(name: string, duration: number, threshold: number): void {
    const message = `Slow operation detected: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`;
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Performance Warning:', message);
    }

    // In production, you might want to send this to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendPerformanceAlert({
        type: 'slow_operation',
        name,
        duration,
        threshold,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Log slow API calls with additional context
  private logSlowApi(name: string, duration: number, error?: unknown): void {
    const message = `Slow API call: ${name} took ${duration.toFixed(2)}ms`;
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ API Performance Warning:', message, error);
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendPerformanceAlert({
        type: 'slow_api',
        name,
        duration,
        error: error ? String(error) : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Send performance alerts to monitoring service
  private async sendPerformanceAlert(alert: any): Promise<void> {
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  // Get memory usage information
  getMemoryUsage(): MemoryInfo | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Monitor memory usage
  monitorMemory(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      if (usedMB > this.thresholds.memoryUsage / (1024 * 1024)) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB`);
      }
    }
  }

  // Clear performance metrics
  clearMetrics(): void {
    this.metrics.clear();
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<CoreWebVitals> {
    return new Promise((resolve) => {
      const vitals: Partial<CoreWebVitals> = {};

      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          vitals.lcp = lastEntry.startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.fid = (entry as any).processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        vitals.cls = cls;
      }).observe({ entryTypes: ['layout-shift'] });

      // Return vitals after a short delay to collect data
      setTimeout(() => {
        resolve(vitals as CoreWebVitals);
      }, 2000);
    });
  }
}

// Core Web Vitals interface
interface CoreWebVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Performance optimization utilities
export class PerformanceOptimizer {
  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Lazy load images
  static lazyLoadImages(selector: string = 'img[data-src]'): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // Preload critical resources
  static preloadResource(href: string, as: string, type?: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  }

  // Optimize bundle loading - commented out for now as chunks directory doesn't exist
  static async loadChunk(chunkName: string): Promise<any> {
    try {
      // This would be used for dynamic imports of specific chunks
      // const module = await import(/* webpackChunkName: "[request]" */ `@/chunks/${chunkName}`);
      // return module.default || module;
      console.warn(`Chunk loading not implemented: ${chunkName}`);
      throw new AppError(`Feature not available: ${chunkName}`, 501, 'FEATURE_NOT_IMPLEMENTED');
    } catch (error) {
      console.error(`Failed to load chunk: ${chunkName}`, error);
      throw new AppError(`Failed to load feature: ${chunkName}`, 500, 'CHUNK_LOAD_ERROR');
    }
  }

  // Service Worker registration with error handling
  static async registerServiceWorker(swPath: string = '/sw.js'): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('SW registered:', registration);
        
        registration.addEventListener('updatefound', () => {
          console.log('SW update found');
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
  }
}

// Resource cleanup utilities
export class ResourceManager {
  private static cleanup: (() => void)[] = [];

  // Register cleanup function
  static addCleanup(cleanup: () => void): void {
    this.cleanup.push(cleanup);
  }

  // Cleanup all registered resources
  static cleanupAll(): void {
    this.cleanup.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    this.cleanup = [];
  }

  // Cleanup on page unload
  static setupPageCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanupAll();
    });

    window.addEventListener('unload', () => {
      this.cleanupAll();
    });
  }
}

// Bundle analyzer for development
export class BundleAnalyzer {
  static analyzeBundleSize(): void {
    if (process.env.NODE_ENV === 'development') {
      // This would analyze bundle size and report large modules
      console.log('Bundle analysis would run here in development');
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export types
export type { CoreWebVitals, MemoryInfo };
