import { withRetry } from '@/lib/errors';
import { performanceMonitor } from '@/lib/performance-monitor';

// =============================================================================
// Retry Logic for Operations
// =============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  jitter?: boolean;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export class RetryManager {
  private static defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBackoff: true,
    jitter: true,
    shouldRetry: (error: Error) => {
      // Don't retry client errors (4xx), but retry server errors (5xx) and network errors
      if (error instanceof Response) {
        return error.status >= 500;
      }
      // Retry network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return true;
      }
      // Retry timeout errors
      if (error.message.toLowerCase().includes('timeout')) {
        return true;
      }
      return false;
    },
    onRetry: (error: Error, attempt: number) => {
      console.warn(`Retrying operation (attempt ${attempt}):`, error.message);
    },
  };

  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        performanceMonitor.mark(`retry-attempt-${attempt}`);
        const result = await operation();
        
        if (attempt > 1) {
          performanceMonitor.measure(`retry-success-${attempt}`);
          console.log(`Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this is the last attempt, throw the error
        if (attempt === config.maxRetries + 1) {
          performanceMonitor.measure(`retry-failed-${attempt}`);
          throw lastError;
        }

        // Check if we should retry this error
        if (!config.shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, config);
        
        // Call retry callback
        config.onRetry(lastError, attempt);
        
        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private static calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    let delay = config.baseDelay;

    if (config.exponentialBackoff) {
      delay = Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
    }

    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() * 2 - 1) * jitterRange;
    }

    return Math.max(delay, 0);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry with exponential backoff
  static withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      baseDelay,
      exponentialBackoff: true,
      jitter: true,
    });
  }

  // Retry with linear backoff
  static withLinearBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      baseDelay: delay,
      exponentialBackoff: false,
      jitter: false,
    });
  }

  // Retry only network errors
  static forNetworkErrors<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      shouldRetry: (error: Error) => {
        return error instanceof TypeError && error.message.includes('fetch');
      },
    });
  }

  // Retry with custom condition
  static withCondition<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error, attempt: number) => boolean,
    maxRetries: number = 3
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      shouldRetry,
    });
  }
}

// =============================================================================
// Circuit Breaker Pattern
// =============================================================================

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
  expectedErrors?: Array<new (...args: any[]) => Error>;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      expectedErrors: [],
      ...options,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      
      // If we've had enough successes, close the circuit
      if (this.successCount >= 3) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        console.log('Circuit breaker reset to CLOSED');
      }
    }
  }

  private onFailure(error: Error): void {
    // Don't count expected errors
    if (this.isExpectedError(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Go back to OPEN if we fail in HALF_OPEN state
      this.state = CircuitBreakerState.OPEN;
      this.successCount = 0;
      console.log('Circuit breaker opened due to failure in HALF_OPEN state');
    } else if (this.failureCount >= this.options.failureThreshold) {
      // Open the circuit if we've exceeded the failure threshold
      this.state = CircuitBreakerState.OPEN;
      console.log(`Circuit breaker opened due to ${this.failureCount} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.recoveryTimeout;
  }

  private isExpectedError(error: Error): boolean {
    return this.options.expectedErrors.some(
      expectedError => error instanceof expectedError
    );
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// =============================================================================
// Bulkhead Pattern
// =============================================================================

export class BulkheadManager {
  private pools: Map<string, Promise<any>[]> = new Map();
  private maxConcurrency: Map<string, number> = new Map();

  // Create a resource pool with limited concurrency
  createPool(name: string, maxConcurrency: number): void {
    this.pools.set(name, []);
    this.maxConcurrency.set(name, maxConcurrency);
  }

  // Execute operation in a specific pool
  async execute<T>(
    poolName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const pool = this.pools.get(poolName);
    const maxConcurrent = this.maxConcurrency.get(poolName);

    if (!pool || maxConcurrent === undefined) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    // Wait if pool is at capacity
    while (pool.length >= maxConcurrent) {
      await Promise.race(pool);
    }

    // Execute the operation
    const promise = operation().finally(() => {
      // Remove from pool when done
      const index = pool.indexOf(promise);
      if (index > -1) {
        pool.splice(index, 1);
      }
    });

    pool.push(promise);
    return promise;
  }

  // Get pool statistics
  getPoolStats(poolName: string) {
    const pool = this.pools.get(poolName);
    const maxConcurrent = this.maxConcurrency.get(poolName);

    if (!pool || maxConcurrent === undefined) {
      return null;
    }

    return {
      active: pool.length,
      maxConcurrency: maxConcurrent,
      utilization: pool.length / maxConcurrent,
    };
  }
}

// =============================================================================
// Rate Limiter
// =============================================================================

export class RateLimiter {
  private tokens: Map<string, { count: number; lastRefill: number }> = new Map();

  constructor(
    private maxTokens: number = 10,
    private refillRate: number = 1, // tokens per second
  ) {}

  async execute<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.tryConsume(key)) {
      throw new Error('Rate limit exceeded');
    }

    return operation();
  }

  private tryConsume(key: string): boolean {
    const now = Date.now();
    const bucket = this.tokens.get(key) || { count: this.maxTokens, lastRefill: now };

    // Refill tokens based on time elapsed
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.count = Math.min(this.maxTokens, bucket.count + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Try to consume a token
    if (bucket.count > 0) {
      bucket.count--;
      this.tokens.set(key, bucket);
      return true;
    }

    this.tokens.set(key, bucket);
    return false;
  }

  getRemainingTokens(key: string): number {
    const bucket = this.tokens.get(key);
    return bucket ? bucket.count : this.maxTokens;
  }
}

// =============================================================================
// Composite Resilience Strategy
// =============================================================================

export class ResilienceStrategy {
  private circuitBreaker?: CircuitBreaker;
  private rateLimiter?: RateLimiter;
  private bulkhead?: BulkheadManager;
  private retryOptions?: RetryOptions;

  constructor(config: {
    circuitBreaker?: CircuitBreakerOptions;
    rateLimiter?: { maxTokens: number; refillRate: number };
    bulkhead?: { poolName: string; maxConcurrency: number };
    retry?: RetryOptions;
  } = {}) {
    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    }

    if (config.rateLimiter) {
      this.rateLimiter = new RateLimiter(
        config.rateLimiter.maxTokens,
        config.rateLimiter.refillRate
      );
    }

    if (config.bulkhead) {
      this.bulkhead = new BulkheadManager();
      this.bulkhead.createPool(config.bulkhead.poolName, config.bulkhead.maxConcurrency);
    }

    if (config.retry) {
      this.retryOptions = config.retry;
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: { key?: string; poolName?: string } = {}
  ): Promise<T> {
    let wrappedOperation = operation;

    // Apply circuit breaker
    if (this.circuitBreaker) {
      const cb = this.circuitBreaker;
      wrappedOperation = () => cb.execute(wrappedOperation);
    }

    // Apply bulkhead
    if (this.bulkhead && context.poolName) {
      const bh = this.bulkhead;
      const poolName = context.poolName;
      wrappedOperation = () => bh.execute(poolName, wrappedOperation);
    }

    // Apply rate limiting
    if (this.rateLimiter && context.key) {
      const rl = this.rateLimiter;
      const key = context.key;
      wrappedOperation = () => rl.execute(key, wrappedOperation);
    }

    // Apply retry logic
    if (this.retryOptions) {
      return RetryManager.execute(wrappedOperation, this.retryOptions);
    }

    return wrappedOperation();
  }
}

// =============================================================================
// Exported Utilities
// =============================================================================

export const defaultResilienceStrategy = new ResilienceStrategy({
  circuitBreaker: { failureThreshold: 5, recoveryTimeout: 30000 },
  retry: { maxRetries: 3, exponentialBackoff: true },
});

export const apiResilienceStrategy = new ResilienceStrategy({
  circuitBreaker: { failureThreshold: 3, recoveryTimeout: 60000 },
  rateLimiter: { maxTokens: 10, refillRate: 2 },
  retry: { maxRetries: 3, exponentialBackoff: true },
});

// Convenience function for simple retry scenarios
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return RetryManager.withExponentialBackoff(operation, maxRetries);
}
