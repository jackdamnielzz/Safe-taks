/**
 * Rate limiting utilities using Upstash Redis
 * Implements sliding window rate limiting for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { Errors } from "./errors";

// Rate limit configurations
export const RATE_LIMITS = Object.freeze({
  // Per user limits (per minute)
  USER_REQUESTS_PER_MINUTE: 100,
  // Per organization limits (per hour)
  ORG_REQUESTS_PER_HOUR: 1000,
  // Auth attempts (per IP, per hour)
  AUTH_ATTEMPTS_PER_HOUR: 10,
  // Password reset attempts (per IP, per day)
  PASSWORD_RESET_PER_DAY: 5,
} as const);

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  key: string;
  limit: number;
  window: number; // in seconds
}

/**
 * Mock rate limiter for development (replace with Upstash Redis in production)
 */
class MockRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  async limit(config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = config.window * 1000;
    const resetTime = Math.ceil(now / windowMs) * windowMs;

    const current = this.store.get(config.key);

    // Clean up expired entries
    if (current && current.resetTime <= now) {
      this.store.delete(config.key);
    }

    const entry = this.store.get(config.key) || { count: 0, resetTime };

    if (entry.count >= config.limit) {
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    entry.count++;
    this.store.set(config.key, entry);

    return {
      success: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - entry.count),
      reset: entry.resetTime,
    };
  }
}

// Initialize rate limiter (will be replaced with Upstash Redis)
const rateLimiter = new MockRateLimiter();

/**
 * Apply rate limiting to an API route
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return await rateLimiter.limit(config);
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  limit = RATE_LIMITS.USER_REQUESTS_PER_MINUTE,
  window = 60 // 1 minute
): Promise<RateLimitResult> {
  return await applyRateLimit({} as NextRequest, {
    key: `user:${userId}`,
    limit,
    window,
  });
}

/**
 * Rate limit by organization ID
 */
export async function rateLimitByOrg(
  orgId: string,
  limit = RATE_LIMITS.ORG_REQUESTS_PER_HOUR,
  window = 3600 // 1 hour
): Promise<RateLimitResult> {
  return await applyRateLimit({} as NextRequest, {
    key: `org:${orgId}`,
    limit,
    window,
  });
}

/**
 * Rate limit by IP address (for auth attempts)
 */
export async function rateLimitByIP(
  ip: string,
  action: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  return await applyRateLimit({} as NextRequest, {
    key: `ip:${ip}:${action}`,
    limit,
    window,
  });
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (real) {
    return real.trim();
  }

  // Fallback for development
  return "127.0.0.1";
}

/**
 * Middleware to check rate limits and return appropriate responses
 */
export async function withRateLimit(
  request: NextRequest,
  configs: RateLimitConfig[]
): Promise<NextResponse | null> {
  for (const config of configs) {
    const result = await applyRateLimit(request, config);

    if (!result.success) {
      return Errors.rateLimitExceeded(result.retryAfter || 60);
    }
  }

  return null; // No rate limit exceeded
}

/**
 * Create rate limit headers for responses
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
    ...(result.retryAfter && {
      "Retry-After": result.retryAfter.toString(),
    }),
  };
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Standard API requests
  api: {
    key: "api",
    limit: RATE_LIMITS.USER_REQUESTS_PER_MINUTE,
    window: 60,
  },
  // Authentication attempts
  auth: {
    key: "auth",
    limit: RATE_LIMITS.AUTH_ATTEMPTS_PER_HOUR,
    window: 3600,
  },
  // Password reset requests
  passwordReset: {
    key: "password-reset",
    limit: RATE_LIMITS.PASSWORD_RESET_PER_DAY,
    window: 86400, // 24 hours
  },
} as const;

// TODO: Replace MockRateLimiter with Upstash Redis implementation
// import { Redis } from '@upstash/redis';
// import { Ratelimit } from '@upstash/ratelimit';
//
// const redis = Redis.fromEnv();
//
// export const userRateLimit = new Ratelimit({
//   redis,
//   limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
//   analytics: true,
// });
//
// export const orgRateLimit = new Ratelimit({
//   redis,
//   limiter: Ratelimit.slidingWindow(1000, "1 h"), // 1000 requests per hour
//   analytics: true,
// });
