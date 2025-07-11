// Caching layer for frequently accessed data
import { LRUCache } from 'lru-cache';

// =============================================================================
// Cache Configuration
// =============================================================================

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// =============================================================================
// Simple In-Memory Cache
// =============================================================================

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.maxSize = options.max || 1000;
  }

  set(key: string, value: T, ttl?: number): void {
    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// Cache Service
// =============================================================================

export class CacheService {
  private static userCache = new SimpleCache<any>({ ttl: 10 * 60 * 1000 }); // 10 minutes
  private static projectCache = new SimpleCache<any>({ ttl: 5 * 60 * 1000 }); // 5 minutes
  private static sessionCache = new SimpleCache<any>({ ttl: 2 * 60 * 1000 }); // 2 minutes
  private static achievementCache = new SimpleCache<any>({ ttl: 30 * 60 * 1000 }); // 30 minutes
  private static analyticsCache = new SimpleCache<any>({ ttl: 15 * 60 * 1000 }); // 15 minutes

  // =============================================================================
  // User Cache Methods
  // =============================================================================

  static setUser(userId: string, userData: any, ttl?: number): void {
    this.userCache.set(`user:${userId}`, userData, ttl);
  }

  static getUser(userId: string): any | null {
    return this.userCache.get(`user:${userId}`);
  }

  static invalidateUser(userId: string): void {
    this.userCache.delete(`user:${userId}`);
    this.userCache.delete(`user:preferences:${userId}`);
  }

  static setUserPreferences(userId: string, preferences: any, ttl?: number): void {
    this.userCache.set(`user:preferences:${userId}`, preferences, ttl);
  }

  static getUserPreferences(userId: string): any | null {
    return this.userCache.get(`user:preferences:${userId}`);
  }

  // =============================================================================
  // Project Cache Methods
  // =============================================================================

  static setProjects(userId: string, projects: any, cacheKey?: string, ttl?: number): void {
    const key = cacheKey || `projects:${userId}`;
    this.projectCache.set(key, projects, ttl);
  }

  static getProjects(userId: string, cacheKey?: string): any | null {
    const key = cacheKey || `projects:${userId}`;
    return this.projectCache.get(key);
  }

  static setProject(projectId: string, projectData: any, ttl?: number): void {
    this.projectCache.set(`project:${projectId}`, projectData, ttl);
  }

  static getProject(projectId: string): any | null {
    return this.projectCache.get(`project:${projectId}`);
  }

  static invalidateProjects(userId: string): void {
    // Clear all project-related cache for user
    this.projectCache.clear(); // Simple approach - clear all
    // In production, you might want more granular invalidation
  }

  static invalidateProject(projectId: string): void {
    this.projectCache.delete(`project:${projectId}`);
  }

  // =============================================================================
  // Session Cache Methods
  // =============================================================================

  static setSessions(userId: string, sessions: any, cacheKey?: string, ttl?: number): void {
    const key = cacheKey || `sessions:${userId}`;
    this.sessionCache.set(key, sessions, ttl);
  }

  static getSessions(userId: string, cacheKey?: string): any | null {
    const key = cacheKey || `sessions:${userId}`;
    return this.sessionCache.get(key);
  }

  static setSession(sessionId: string, sessionData: any, ttl?: number): void {
    this.sessionCache.set(`session:${sessionId}`, sessionData, ttl);
  }

  static getSession(sessionId: string): any | null {
    return this.sessionCache.get(`session:${sessionId}`);
  }

  static invalidateSessions(userId: string): void {
    this.sessionCache.clear(); // Simple approach
  }

  static invalidateSession(sessionId: string): void {
    this.sessionCache.delete(`session:${sessionId}`);
  }

  // =============================================================================
  // Achievement Cache Methods
  // =============================================================================

  static setAchievements(achievements: any, ttl?: number): void {
    this.achievementCache.set('achievements:all', achievements, ttl);
  }

  static getAchievements(): any | null {
    return this.achievementCache.get('achievements:all');
  }

  static setUserAchievements(userId: string, achievements: any, ttl?: number): void {
    this.achievementCache.set(`achievements:user:${userId}`, achievements, ttl);
  }

  static getUserAchievements(userId: string): any | null {
    return this.achievementCache.get(`achievements:user:${userId}`);
  }

  static invalidateAchievements(): void {
    this.achievementCache.clear();
  }

  static invalidateUserAchievements(userId: string): void {
    this.achievementCache.delete(`achievements:user:${userId}`);
  }

  // =============================================================================
  // Analytics Cache Methods
  // =============================================================================

  static setAnalytics(cacheKey: string, data: any, ttl?: number): void {
    this.analyticsCache.set(cacheKey, data, ttl);
  }

  static getAnalytics(cacheKey: string): any | null {
    return this.analyticsCache.get(cacheKey);
  }

  static invalidateAnalytics(userId?: string): void {
    if (userId) {
      // Clear user-specific analytics
      this.analyticsCache.clear(); // Simple approach
    } else {
      this.analyticsCache.clear();
    }
  }

  // =============================================================================
  // General Cache Methods
  // =============================================================================

  static set(key: string, value: any, ttl?: number): void {
    // Default to session cache for general purpose
    this.sessionCache.set(key, value, ttl);
  }

  static get(key: string): any | null {
    return this.sessionCache.get(key);
  }

  static delete(key: string): boolean {
    return this.sessionCache.delete(key);
  }

  static clear(): void {
    this.userCache.clear();
    this.projectCache.clear();
    this.sessionCache.clear();
    this.achievementCache.clear();
    this.analyticsCache.clear();
  }

  // =============================================================================
  // Cache Statistics and Maintenance
  // =============================================================================

  static getStats() {
    return {
      users: this.userCache.size(),
      projects: this.projectCache.size(),
      sessions: this.sessionCache.size(),
      achievements: this.achievementCache.size(),
      analytics: this.analyticsCache.size(),
    };
  }

  static cleanup(): void {
    this.userCache.cleanup();
    this.projectCache.cleanup();
    this.sessionCache.cleanup();
    this.achievementCache.cleanup();
    this.analyticsCache.cleanup();
  }

  // =============================================================================
  // Cache Key Generators
  // =============================================================================

  static generateProjectsKey(userId: string, filters?: any): string {
    if (!filters) return `projects:${userId}`;
    
    const filterString = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    return `projects:${userId}:${filterString}`;
  }

  static generateSessionsKey(userId: string, filters?: any): string {
    if (!filters) return `sessions:${userId}`;
    
    const filterString = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    return `sessions:${userId}:${filterString}`;
  }

  static generateAnalyticsKey(userId: string, type: string, filters?: any): string {
    let key = `analytics:${userId}:${type}`;
    
    if (filters) {
      const filterString = Object.keys(filters)
        .sort()
        .map(key => `${key}:${filters[key]}`)
        .join('|');
      key += `:${filterString}`;
    }
    
    return key;
  }

  // =============================================================================
  // Cache Invalidation Patterns
  // =============================================================================

  static invalidateUserData(userId: string): void {
    this.invalidateUser(userId);
    this.invalidateProjects(userId);
    this.invalidateSessions(userId);
    this.invalidateUserAchievements(userId);
    this.invalidateAnalytics(userId);
  }

  static invalidateProjectData(userId: string, projectId?: string): void {
    this.invalidateProjects(userId);
    this.invalidateSessions(userId); // Sessions might include project data
    this.invalidateAnalytics(userId);
    
    if (projectId) {
      this.invalidateProject(projectId);
    }
  }

  static invalidateSessionData(userId: string, sessionId?: string): void {
    this.invalidateSessions(userId);
    this.invalidateAnalytics(userId);
    this.invalidateUserAchievements(userId); // Sessions might affect achievements
    
    if (sessionId) {
      this.invalidateSession(sessionId);
    }
  }
}

// =============================================================================
// Cache Decorators/Wrappers
// =============================================================================

/**
 * Wrapper function that adds caching to any async function
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKeyGenerator: (...args: T) => string,
  ttl?: number
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const cacheKey = cacheKeyGenerator(...args);
    
    // Try to get from cache first
    const cached = CacheService.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    CacheService.set(cacheKey, result, ttl);
    
    return result;
  };
}

// =============================================================================
// Auto-cleanup setup
// =============================================================================

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    CacheService.cleanup();
  }, 5 * 60 * 1000);
}
