/**
 * Firebase Cache Wrapper
 *
 * Wraps Firestore queries with intelligent caching layer
 * Provides transparent caching for read operations
 */

import {
  QueryCache,
  generateCacheKey as genCacheKey,
  traCache as traQueryCache,
  templateCache as templateQueryCache,
  lmraCache as lmraQueryCache,
} from "./query-cache";

// Re-export for convenience
export { generateCacheKey, traCache, templateCache, lmraCache } from "./query-cache";

interface CachedQueryOptions {
  cache?: QueryCache;
  ttl?: number;
  bypassCache?: boolean;
  cacheKey?: string;
}

interface QueryPerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  resultCount: number;
  timestamp: number;
}

/**
 * Performance metrics tracker
 */
class PerformanceTracker {
  private metrics: QueryPerformanceMetrics[] = [];
  private maxMetrics = 1000;

  track(metric: QueryPerformanceMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getStats() {
    if (this.metrics.length === 0) {
      return {
        avgQueryTime: 0,
        cacheHitRate: 0,
        totalQueries: 0,
        p95QueryTime: 0,
        p99QueryTime: 0,
      };
    }

    const sortedTimes = this.metrics.map((m) => m.queryTime).sort((a, b) => a - b);

    const cacheHits = this.metrics.filter((m) => m.cacheHit).length;
    const avgQueryTime = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      avgQueryTime: Math.round(avgQueryTime),
      cacheHitRate: cacheHits / this.metrics.length,
      totalQueries: this.metrics.length,
      p95QueryTime: sortedTimes[p95Index] || 0,
      p99QueryTime: sortedTimes[p99Index] || 0,
    };
  }

  reset(): void {
    this.metrics = [];
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Cached query executor for Firestore
 */
export async function cachedQuery<T = any>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options: CachedQueryOptions = {}
): Promise<T> {
  const startTime = Date.now();
  const cache = options.cache || traQueryCache;

  // Check cache first (unless bypassed)
  if (!options.bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      const queryTime = Date.now() - startTime;
      performanceTracker.track({
        queryTime,
        cacheHit: true,
        resultCount: Array.isArray(cached) ? cached.length : 1,
        timestamp: Date.now(),
      });
      return cached as T;
    }
  }

  // Execute query
  const result = await queryFn();
  const queryTime = Date.now() - startTime;

  // Store in cache
  cache.set(cacheKey, result, options.ttl);

  // Track performance
  performanceTracker.track({
    queryTime,
    cacheHit: false,
    resultCount: Array.isArray(result) ? result.length : 1,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Batch query executor with caching
 * Optimizes multiple queries by checking cache first
 */
export async function cachedBatchQuery<T = any>(
  queries: Array<{
    queryFn: () => Promise<T>;
    cacheKey: string;
    options?: CachedQueryOptions;
  }>
): Promise<T[]> {
  const results: T[] = [];
  const uncachedQueries: typeof queries = [];

  // Check cache for all queries
  for (const query of queries) {
    const cache = query.options?.cache || traQueryCache;
    const cached = cache.get(query.cacheKey);

    if (cached !== null && !query.options?.bypassCache) {
      results.push(cached as T);
    } else {
      uncachedQueries.push(query);
      results.push(null as any); // Placeholder
    }
  }

  // Execute uncached queries in parallel
  if (uncachedQueries.length > 0) {
    const uncachedResults = await Promise.all(uncachedQueries.map((q) => q.queryFn()));

    // Store results in cache and update results array
    let uncachedIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) {
        const query = uncachedQueries[uncachedIndex];
        const result = uncachedResults[uncachedIndex];
        const cache = query.options?.cache || traQueryCache;

        cache.set(query.cacheKey, result, query.options?.ttl);
        results[i] = result;
        uncachedIndex++;
      }
    }
  }

  return results;
}

/**
 * Invalidate cache entries for a collection
 */
export function invalidateCollection(
  collection: "tras" | "templates" | "lmraSessions",
  orgId: string,
  pattern?: string
): number {
  const cache =
    collection === "tras"
      ? traQueryCache
      : collection === "templates"
        ? templateQueryCache
        : lmraQueryCache;

  const basePattern = `${collection}:${orgId}`;
  const fullPattern = pattern ? `${basePattern}.*${pattern}` : basePattern;

  return cache.invalidatePattern(fullPattern);
}

/**
 * Invalidate cache for specific document
 */
export function invalidateDocument(
  collection: "tras" | "templates" | "lmraSessions",
  orgId: string,
  docId: string
): boolean {
  const cache =
    collection === "tras"
      ? traQueryCache
      : collection === "templates"
        ? templateQueryCache
        : lmraQueryCache;

  const pattern = `${collection}:${orgId}.*id:"${docId}"`;
  return cache.invalidatePattern(pattern) > 0;
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmupCache(
  collection: "tras" | "templates" | "lmraSessions",
  orgId: string,
  queryFn: () => Promise<any[]>,
  options: { ttl?: number } = {}
): Promise<void> {
  const cache =
    collection === "tras"
      ? traQueryCache
      : collection === "templates"
        ? templateQueryCache
        : lmraQueryCache;

  const cacheKey = genCacheKey(collection, { orgId }, { warmup: true });
  const data = await queryFn();

  cache.set(cacheKey, data, options.ttl);
}

/**
 * Get cache statistics for all caches
 */
export function getAllCacheStats() {
  return {
    tras: traQueryCache.getStats(),
    templates: templateQueryCache.getStats(),
    lmraSessions: lmraQueryCache.getStats(),
    performance: performanceTracker.getStats(),
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  traQueryCache.clear();
  templateQueryCache.clear();
  lmraQueryCache.clear();
  performanceTracker.reset();
}
