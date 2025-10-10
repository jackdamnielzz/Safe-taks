/**
 * Test for rate limiting utilities
 * This demonstrates testing utility functions with Jest
 */

import { RATE_LIMITS, createRateLimitHeaders, getClientIP } from "../api/rate-limit";
import { NextRequest } from "next/server";

describe("Rate Limiting Utilities", () => {
  describe("RATE_LIMITS constants", () => {
    it("should have correct default limits", () => {
      expect(RATE_LIMITS.USER_REQUESTS_PER_MINUTE).toBe(100);
      expect(RATE_LIMITS.ORG_REQUESTS_PER_HOUR).toBe(1000);
      expect(RATE_LIMITS.AUTH_ATTEMPTS_PER_HOUR).toBe(10);
      expect(RATE_LIMITS.PASSWORD_RESET_PER_DAY).toBe(5);
    });

    it("should be readonly constants", () => {
      expect(typeof RATE_LIMITS).toBe("object");
      expect(Object.isFrozen(RATE_LIMITS)).toBe(true);
    });
  });

  describe("createRateLimitHeaders", () => {
    it("should create correct headers for successful rate limit", () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 99,
        reset: 1633024800000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "99",
        "X-RateLimit-Reset": "1633024800000",
      });
    });

    it("should include retry-after header when provided", () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: 1633024800000,
        retryAfter: 60,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).toEqual({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1633024800000",
        "Retry-After": "60",
      });
    });

    it("should handle missing retryAfter", () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 50,
        reset: 1633024800000,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers).not.toHaveProperty("Retry-After");
      expect(Object.keys(headers)).toHaveLength(3);
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
            if (name === "x-real-ip") return "192.168.1.2";
            return null;
          }),
        },
      } as unknown as NextRequest;

      const ip = getClientIP(mockRequest);

      expect(ip).toBe("192.168.1.1");
      expect(mockRequest.headers.get).toHaveBeenCalledWith("x-forwarded-for");
    });

    it("should extract IP from x-real-ip header when x-forwarded-for is not available", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === "x-forwarded-for") return null;
            if (name === "x-real-ip") return "192.168.1.2";
            return null;
          }),
        },
      } as unknown as NextRequest;

      const ip = getClientIP(mockRequest);

      expect(ip).toBe("192.168.1.2");
      expect(mockRequest.headers.get).toHaveBeenCalledWith("x-forwarded-for");
      expect(mockRequest.headers.get).toHaveBeenCalledWith("x-real-ip");
    });

    it("should return localhost when no headers available", () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null),
        },
      } as unknown as NextRequest;

      const ip = getClientIP(mockRequest);

      expect(ip).toBe("127.0.0.1");
    });

    it("should handle whitespace in forwarded headers", () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === "x-forwarded-for") return "  192.168.1.1  , 10.0.0.1  ";
            return null;
          }),
        },
      } as unknown as NextRequest;

      const ip = getClientIP(mockRequest);

      expect(ip).toBe("192.168.1.1");
    });
  });
});
