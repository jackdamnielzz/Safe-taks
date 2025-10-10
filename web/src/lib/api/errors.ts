/**
 * API Error Handling Utilities
 *
 * Provides standardized error response formatting and common error helpers
 * for Next.js API routes.
 *
 * @see API_ARCHITECTURE.md Section 7 for complete error handling patterns
 */

import { NextResponse } from "next/server";

/**
 * Standard API error structure
 */
export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
  userMessage?: string;
}

/**
 * Creates a standardized error response
 *
 * @param error - Error configuration object
 * @returns NextResponse with error payload
 *
 * @example
 * ```typescript
 * return createErrorResponse({
 *   code: 'VALIDATION_ERROR',
 *   message: 'Request validation failed',
 *   status: 400,
 *   details: { fields: { email: 'Invalid email format' } }
 * });
 * ```
 */
export function createErrorResponse(error: APIError): NextResponse {
  const { code, message, status, details, userMessage } = error;

  // Log to Sentry for 500 errors (will be implemented in Task 2.7A)
  if (status >= 500) {
    // TODO: Add Sentry integration when Task 2.7A is complete
    console.error("Server Error:", { code, message, details });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        userMessage: userMessage || message,
        details,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        documentation: `https://docs.safeworkpro.com/errors/${code}`,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Common error helpers for consistent error responses
 */
export const Errors = {
  /**
   * 404 Not Found error
   */
  notFound: (resource: string) =>
    createErrorResponse({
      code: "RESOURCE_NOT_FOUND",
      message: `${resource} not found`,
      status: 404,
      userMessage: `The requested ${resource.toLowerCase()} could not be found`,
    }),

  /**
   * 401 Unauthorized error - authentication required
   */
  unauthorized: () =>
    createErrorResponse({
      code: "AUTH_REQUIRED",
      message: "Authentication required",
      status: 401,
      userMessage: "Please log in to continue",
    }),

  /**
   * 401 Invalid/expired token error
   */
  invalidToken: () =>
    createErrorResponse({
      code: "AUTH_INVALID_TOKEN",
      message: "Invalid or expired authentication token",
      status: 401,
      userMessage: "Your session has expired. Please log in again.",
    }),

  /**
   * 403 Forbidden error - insufficient permissions
   */
  forbidden: (action?: string) =>
    createErrorResponse({
      code: "AUTH_INSUFFICIENT_PERMISSIONS",
      message: "Insufficient permissions",
      status: 403,
      userMessage: action
        ? `You don't have permission to ${action}`
        : "You don't have permission to perform this action",
    }),

  /**
   * 403 Organization mismatch error
   */
  organizationMismatch: () =>
    createErrorResponse({
      code: "AUTH_ORGANIZATION_MISMATCH",
      message: "Resource belongs to different organization",
      status: 403,
      userMessage: "You cannot access resources from other organizations",
    }),

  /**
   * 400 Validation error with field details
   */
  validation: (fields: Record<string, any>) =>
    createErrorResponse({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      status: 400,
      details: { fields },
      userMessage: "Please check your input and try again",
    }),

  /**
   * 400 Required field missing
   */
  requiredField: (field: string) =>
    createErrorResponse({
      code: "VALIDATION_REQUIRED_FIELD",
      message: `Required field missing: ${field}`,
      status: 400,
      userMessage: "Please fill in all required fields",
    }),

  /**
   * 400 Invalid format error
   */
  invalidFormat: (field: string, expectedFormat: string) =>
    createErrorResponse({
      code: "VALIDATION_INVALID_FORMAT",
      message: `Invalid format for ${field}. Expected: ${expectedFormat}`,
      status: 400,
      userMessage: "Please provide data in the correct format",
    }),

  /**
   * 409 Conflict error - resource already exists
   */
  alreadyExists: (resource: string, identifier?: string) =>
    createErrorResponse({
      code: "RESOURCE_ALREADY_EXISTS",
      message: identifier
        ? `${resource} with identifier '${identifier}' already exists`
        : `${resource} already exists`,
      status: 409,
      userMessage: "An item with this identifier already exists",
    }),

  /**
   * 409 Generic conflict error
   */
  conflict: (message: string) =>
    createErrorResponse({
      code: "RESOURCE_CONFLICT",
      message,
      status: 409,
      userMessage: message,
    }),

  /**
   * 409 Resource locked error
   */
  locked: (resource: string, lockedBy?: string) =>
    createErrorResponse({
      code: "RESOURCE_LOCKED",
      message: lockedBy
        ? `${resource} is locked for editing by ${lockedBy}`
        : `${resource} is locked for editing`,
      status: 409,
      userMessage: "Another user is currently editing this item",
    }),

  /**
   * 422 Invalid state transition
   */
  invalidStateTransition: (from: string, to: string) =>
    createErrorResponse({
      code: "BUSINESS_INVALID_STATE_TRANSITION",
      message: `Invalid status transition from '${from}' to '${to}'`,
      status: 422,
      userMessage: `Cannot change from ${from} to ${to} status`,
    }),

  /**
   * 422 Quota exceeded
   */
  quotaExceeded: (quota: string, limit: number) =>
    createErrorResponse({
      code: "BUSINESS_QUOTA_EXCEEDED",
      message: `${quota} quota exceeded. Limit: ${limit}`,
      status: 422,
      userMessage: "You've reached your plan limit. Please upgrade.",
    }),

  /**
   * 422 Resource limit reached
   */
  resourceLimitReached: (resource: string, limit: number) =>
    createErrorResponse({
      code: "BUSINESS_RESOURCE_LIMIT_REACHED",
      message: `Maximum ${resource} limit reached: ${limit}`,
      status: 422,
      userMessage: `You've reached the maximum number of ${resource}. Please upgrade your plan.`,
    }),

  /**
   * 422 Approval required
   */
  approvalRequired: (resource: string) =>
    createErrorResponse({
      code: "BUSINESS_APPROVAL_REQUIRED",
      message: `${resource} must be approved before this action`,
      status: 422,
      userMessage: "This item must be approved before activation",
    }),

  /**
   * 429 Rate limit exceeded
   */
  rateLimitExceeded: (retryAfter: number = 60) =>
    createErrorResponse({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests",
      status: 429,
      userMessage: "Please wait before trying again",
      details: { retryAfter },
    }),

  /**
   * 500 Internal server error
   */
  serverError: (error?: Error) => {
    // TODO: Add Sentry integration when Task 2.7A is complete
    if (error) {
      console.error("Server Error:", error);
    }

    return createErrorResponse({
      code: "SERVER_ERROR",
      message: "Internal server error",
      status: 500,
      userMessage: "Something went wrong. We've been notified and will fix it soon.",
    });
  },

  /**
   * 500 Database error
   */
  databaseError: (operation?: string) => {
    console.error("Database Error:", operation);

    return createErrorResponse({
      code: "SERVER_DATABASE_ERROR",
      message: operation ? `Database operation failed: ${operation}` : "Database operation failed",
      status: 500,
      userMessage: "Unable to process your request. Please try again.",
    });
  },

  /**
   * 503 External service unavailable
   */
  externalServiceError: (service: string) =>
    createErrorResponse({
      code: "SERVER_EXTERNAL_SERVICE_ERROR",
      message: `External service unavailable: ${service}`,
      status: 503,
      userMessage: "A required service is temporarily unavailable",
    }),
};

/**
 * Error code catalog for documentation reference
 * @see API_ARCHITECTURE.md Section 3 for complete error code documentation
 */
export const ErrorCodes = {
  // Authentication & Authorization (4xx)
  AUTH_REQUIRED: { status: 401, message: "Authentication required" },
  AUTH_INVALID_TOKEN: { status: 401, message: "Invalid or expired token" },
  AUTH_INSUFFICIENT_PERMISSIONS: { status: 403, message: "Insufficient permissions" },
  AUTH_ORGANIZATION_MISMATCH: { status: 403, message: "Organization mismatch" },

  // Validation (4xx)
  VALIDATION_ERROR: { status: 400, message: "Validation failed" },
  VALIDATION_REQUIRED_FIELD: { status: 400, message: "Required field missing" },
  VALIDATION_INVALID_FORMAT: { status: 400, message: "Invalid format" },
  VALIDATION_OUT_OF_RANGE: { status: 400, message: "Value out of range" },

  // Resource (4xx)
  RESOURCE_NOT_FOUND: { status: 404, message: "Resource not found" },
  RESOURCE_ALREADY_EXISTS: { status: 409, message: "Resource already exists" },
  RESOURCE_CONFLICT: { status: 409, message: "Resource conflict" },
  RESOURCE_LOCKED: { status: 409, message: "Resource locked" },

  // Business Logic (4xx)
  BUSINESS_INVALID_STATE_TRANSITION: { status: 422, message: "Invalid state transition" },
  BUSINESS_QUOTA_EXCEEDED: { status: 422, message: "Quota exceeded" },
  BUSINESS_APPROVAL_REQUIRED: { status: 422, message: "Approval required" },

  // Rate Limiting (4xx)
  RATE_LIMIT_EXCEEDED: { status: 429, message: "Rate limit exceeded" },

  // Server Errors (5xx)
  SERVER_ERROR: { status: 500, message: "Internal server error" },
  SERVER_DATABASE_ERROR: { status: 500, message: "Database error" },
  SERVER_EXTERNAL_SERVICE_ERROR: { status: 503, message: "External service error" },
} as const;
