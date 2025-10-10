/**
 * Firebase Query Result Caching System
 *
 * Implements intelligent caching for Firestore queries with:
 * - In-memory LRU cache
 * - TTL-based expiration
 * - Cache invalidation strategies
 * - Performance monitoring
 *
 * Target: >80% cache hit rate for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of entries
  enableStats: boolean;
}

/**
 * LRU Cache implementation with TTL support
 */
export class QueryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[]; // For LRU tracking
  private stats: CacheStats;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
    };
    this.config = {
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB default
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes default
      maxEntries: config.maxEntries || 1000,
      enableStats: config.enableStats !== false,
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      if (this.config.enableStats) this.stats.misses++;
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    entry.hits++;

    if (this.config.enableStats) this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const size = this.estimateSize(data);
    const entryTTL = ttl || this.config.defaultTTL;

    // Check if we need to evict entries
    this.ensureCapacity(size);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: entryTTL,
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    this.stats.totalSize += size;
    this.stats.entryCount = this.cache.size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);

    this.stats.totalSize -= entry.size;
    this.stats.entryCount = this.cache.size;

    return true;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      this.delete(oldestKey);
      this.stats.evictions++;
    }

    // Check size limit
    while (
      this.stats.totalSize + newEntrySize > this.config.maxSize &&
      this.accessOrder.length > 0
    ) {
      const oldestKey = this.accessOrder[0];
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(
  collection: string,
  filters: Record<string, any> = {},
  options: Record<string, any> = {}
): string {
  const parts = [collection];

  // Add filters
  const filterKeys = Object.keys(filters).sort();
  for (const key of filterKeys) {
    const value = filters[key];
    if (value !== undefined && value !== null) {
      parts.push(`${key}:${JSON.stringify(value)}`);
    }
  }

  // Add options
  const optionKeys = Object.keys(options).sort();
  for (const key of optionKeys) {
    const value = options[key];
    if (value !== undefined && value !== null) {
      parts.push(`${key}:${JSON.stringify(value)}`);
    }
  }

  return parts.join("|");
}

/**
 * Cache key patterns for invalidation
 */
export const CachePatterns = {
  tras: (orgId: string) => `tras:${orgId}`,
  traById: (orgId: string, traId: string) => `tras:${orgId}|id:${traId}`,
  trasByProject: (orgId: string, projectId: string) => `tras:${orgId}|projectId:"${projectId}"`,
  templates: (orgId: string) => `templates:${orgId}`,
  templateById: (orgId: string, templateId: string) => `templates:${orgId}|id:${templateId}`,
  lmraSessions: (orgId: string) => `lmraSessions:${orgId}`,
  lmraByTra: (orgId: string, traId: string) => `lmraSessions:${orgId}|traId:"${traId}"`,
};

// Global cache instances
export const traCache = new QueryCache({
  maxSize: 20 * 1024 * 1024, // 20MB for TRAs
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 500,
});

export const templateCache = new QueryCache({
  maxSize: 10 * 1024 * 1024, // 10MB for templates
  defaultTTL: 15 * 60 * 1000, // 15 minutes (templates change less frequently)
  maxEntries: 200,
});

export const lmraCache = new QueryCache({
  maxSize: 15 * 1024 * 1024, // 15MB for LMRA sessions
  defaultTTL: 2 * 60 * 1000, // 2 minutes (more real-time)
  maxEntries: 300,
});

/**
 * Periodic cleanup of expired entries
 */
if (typeof window !== "undefined") {
  setInterval(() => {
    traCache.cleanup();
    templateCache.cleanup();
    lmraCache.cleanup();
  }, 60 * 1000); // Every minute
}
