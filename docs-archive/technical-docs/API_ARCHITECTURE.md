# SafeWork Pro - API Architecture Specification

**Document Version**: 1.0  
**Last Updated**: September 29, 2025  
**Status**: Implementation Guide  
**Related Tasks**: 3.1A-3.1D in CHECKLIST_V2.md  
**Framework**: Next.js 14 API Routes with TypeScript

---

## Executive Summary

This document establishes comprehensive API design patterns, error handling strategies, and security standards for SafeWork Pro. It addresses a critical gap identified in the strategic review: lack of defined API architecture.

**Goals:**
1. Consistent API patterns across all endpoints
2. Standardized error handling and validation
3. Security-first approach with authentication and rate limiting
4. Type-safe development with TypeScript and Zod
5. Comprehensive monitoring and logging

**Target Audience**: Solo developer (current and future reference), potential team members

---

## 1. API Design Principles

### 1.1 Core Design Philosophy

**RESTful Conventions:**
- Use HTTP methods semantically (GET, POST, PUT, PATCH, DELETE)
- Resources represented as nouns, not verbs
- Predictable URL structure
- Stateless requests (no server-side sessions)
- HATEOAS where beneficial (links to related resources)

**Next.js-Specific Patterns:**
- API routes in `/app/api/` directory
- Route handlers using Next.js 14 Route Handlers
- Leverage Next.js middleware for cross-cutting concerns
- Use TypeScript for type safety
- Streaming responses where appropriate

**Developer Experience (DX) Priorities:**
1. **Predictability**: Consistent patterns reduce cognitive load
2. **Type Safety**: TypeScript + Zod eliminate runtime errors
3. **Clear Errors**: Helpful error messages for debugging
4. **Self-Documenting**: Code serves as documentation
5. **Testability**: Easy to unit test with Firebase emulators

---

### 1.2 URL Structure & Naming Conventions

**Base URL Pattern:**
```
https://safeworkpro.com/api/v1/{resource}/{identifier}/{sub-resource}
```

**Version Strategy:**
- Start with `/api/v1/`
- Version in URL for major breaking changes
- Maintain backward compatibility within version

**Resource Naming:**
- Use plural nouns: `/api/v1/organizations`, `/api/v1/tras`
- Lowercase with hyphens for multi-word: `/api/v1/lmra-sessions`
- Nested resources: `/api/v1/organizations/{orgId}/tras`
- Actions as sub-resources: `/api/v1/tras/{traId}/approve`

**Examples:**

```typescript
// Organizations
GET    /api/v1/organizations                      // List organizations (admin)
POST   /api/v1/organizations                      // Create organization
GET    /api/v1/organizations/{orgId}              // Get organization details
PATCH  /api/v1/organizations/{orgId}              // Update organization
DELETE /api/v1/organizations/{orgId}              // Delete organization

// Users (scoped to organization)
GET    /api/v1/organizations/{orgId}/users        // List org users
POST   /api/v1/organizations/{orgId}/users        // Invite user
GET    /api/v1/organizations/{orgId}/users/{userId}
PATCH  /api/v1/organizations/{orgId}/users/{userId}
DELETE /api/v1/organizations/{orgId}/users/{userId}

// TRAs
GET    /api/v1/tras                               // List TRAs (filtered by org)
POST   /api/v1/tras                               // Create TRA
GET    /api/v1/tras/{traId}                       // Get TRA details
PATCH  /api/v1/tras/{traId}                       // Update TRA
DELETE /api/v1/tras/{traId}                       // Delete TRA
POST   /api/v1/tras/{traId}/approve               // Approve TRA
POST   /api/v1/tras/{traId}/duplicate             // Duplicate TRA
GET    /api/v1/tras/{traId}/history               // Get version history

// LMRA Sessions
GET    /api/v1/lmra-sessions                      // List LMRA sessions
POST   /api/v1/lmra-sessions                      // Create LMRA session
GET    /api/v1/lmra-sessions/{sessionId}          // Get session details
PATCH  /api/v1/lmra-sessions/{sessionId}          // Update session
POST   /api/v1/lmra-sessions/{sessionId}/complete // Complete LMRA

// Templates
GET    /api/v1/templates                          // List templates
POST   /api/v1/templates                          // Create template
GET    /api/v1/templates/{templateId}             // Get template
PATCH  /api/v1/templates/{templateId}
DELETE /api/v1/templates/{templateId}

// Reports
POST   /api/v1/reports/generate                   // Generate report
GET    /api/v1/reports/{reportId}                 // Get report
GET    /api/v1/reports/{reportId}/download        // Download PDF

// Analytics
GET    /api/v1/analytics/dashboard                // Dashboard data
GET    /api/v1/analytics/risk-trends              // Risk trend data
GET    /api/v1/analytics/compliance               // Compliance metrics
```

---

## 2. Request/Response Formats

### 2.1 Standard Request Format

**Headers (Required):**
```typescript
{
  "Authorization": "Bearer {firebase_id_token}",
  "Content-Type": "application/json",
  "X-Organization-ID": "{orgId}"  // For multi-tenant context
}
```

**Query Parameters (Common):**
```typescript
// Pagination
?page=1&limit=20                    // Default: page=1, limit=20
?cursor={cursor_token}              // For cursor-based pagination

// Filtering
?status=active,approved             // Comma-separated
?projectId={projectId}              // Filter by relationship
?createdAfter=2024-01-01            // Date filters
?createdBefore=2024-12-31

// Sorting
?sort=createdAt                     // Default ascending
?sort=-createdAt                    // Descending (- prefix)
?sort=riskScore,-createdAt          // Multiple fields

// Searching
?q=electrical                       // Full-text search (basic)
?search=keywords                    // Algolia integration

// Field selection
?fields=id,title,status             // Sparse fieldsets
?expand=project,createdBy           // Include related resources
```

**Request Body (POST/PATCH):**
```typescript
// POST /api/v1/tras
{
  "title": "Electrical Maintenance - Building A",
  "projectId": "proj_abc123",
  "templateId": "tmpl_electrical_001",  // Optional
  "taskSteps": [
    {
      "stepNumber": 1,
      "description": "Isolate electrical systems",
      "hazards": [
        {
          "description": "Electric shock risk",
          "category": "electrical",
          "effectScore": 15,
          "exposureScore": 6,
          "probabilityScore": 3,
          "controlMeasures": [
            {
              "type": "elimination",
              "description": "De-energize and lockout",
              "responsiblePerson": "user_xyz789",
              "deadline": "2024-10-30T00:00:00Z"
            }
          ]
        }
      ]
    }
  ],
  "validFrom": "2024-10-15T00:00:00Z",
  "validUntil": "2025-10-15T00:00:00Z"
}
```

---

### 2.2 Standard Success Response Format

**Success Response Structure:**
```typescript
// GET (Single Resource)
{
  "success": true,
  "data": {
    "id": "tra_abc123",
    "title": "Electrical Maintenance - Building A",
    "status": "approved",
    // ... resource fields
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z"
  }
}

// GET (Collection)
{
  "success": true,
  "data": [
    { /* resource 1 */ },
    { /* resource 2 */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": "cursor_abc123"  // For cursor pagination
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z"
  }
}

// POST/PATCH (Created/Updated)
{
  "success": true,
  "data": {
    "id": "tra_abc123",
    // ... full resource
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z",
    "created": true  // or "updated": true
  }
}

// DELETE
{
  "success": true,
  "data": {
    "id": "tra_abc123",
    "deleted": true
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z"
  }
}

// Action Endpoints (approve, duplicate, etc.)
{
  "success": true,
  "data": {
    "id": "tra_abc123",
    "status": "approved",
    "approvedBy": "user_xyz789",
    "approvedAt": "2024-10-15T14:30:00Z"
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z",
    "action": "approved"
  }
}
```

---

### 2.3 Standard Error Response Format

**Error Response Structure:**
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",           // Machine-readable code
    "message": "Validation failed",       // Human-readable message
    "details": {                          // Optional detailed info
      "fields": {
        "title": "Title is required",
        "validFrom": "Date must be in the future"
      }
    },
    "requestId": "req_xyz789",
    "timestamp": "2024-10-15T14:30:00Z",
    "documentation": "https://docs.safeworkpro.com/errors/VALIDATION_ERROR"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Successful GET, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error, malformed request
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but lacks permission
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Resource already exists, version conflict
- `422 Unprocessable Entity`: Semantic validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error (logged to Sentry)
- `503 Service Unavailable`: Temporary unavailability

---

## 3. Error Code Catalog

### 3.1 Standard Error Codes

**Authentication & Authorization Errors (AUTH_*):**
```typescript
{
  "AUTH_REQUIRED": {
    "status": 401,
    "message": "Authentication required",
    "userMessage": "Please log in to continue"
  },
  "AUTH_INVALID_TOKEN": {
    "status": 401,
    "message": "Invalid or expired authentication token",
    "userMessage": "Your session has expired. Please log in again."
  },
  "AUTH_INSUFFICIENT_PERMISSIONS": {
    "status": 403,
    "message": "Insufficient permissions for this action",
    "userMessage": "You don't have permission to perform this action"
  },
  "AUTH_ORGANIZATION_MISMATCH": {
    "status": 403,
    "message": "Resource belongs to different organization",
    "userMessage": "You cannot access resources from other organizations"
  }
}
```

**Validation Errors (VALIDATION_*):**
```typescript
{
  "VALIDATION_ERROR": {
    "status": 400,
    "message": "Request validation failed",
    "userMessage": "Please check your input and try again"
  },
  "VALIDATION_REQUIRED_FIELD": {
    "status": 400,
    "message": "Required field missing",
    "userMessage": "Please fill in all required fields"
  },
  "VALIDATION_INVALID_FORMAT": {
    "status": 400,
    "message": "Invalid data format",
    "userMessage": "Please provide data in the correct format"
  },
  "VALIDATION_OUT_OF_RANGE": {
    "status": 400,
    "message": "Value out of acceptable range",
    "userMessage": "Please provide a value within the acceptable range"
  }
}
```

**Resource Errors (RESOURCE_*):**
```typescript
{
  "RESOURCE_NOT_FOUND": {
    "status": 404,
    "message": "Resource not found",
    "userMessage": "The requested item could not be found"
  },
  "RESOURCE_ALREADY_EXISTS": {
    "status": 409,
    "message": "Resource already exists",
    "userMessage": "An item with this identifier already exists"
  },
  "RESOURCE_CONFLICT": {
    "status": 409,
    "message": "Resource state conflict",
    "userMessage": "This action conflicts with the current state"
  },
  "RESOURCE_LOCKED": {
    "status": 409,
    "message": "Resource is locked for editing",
    "userMessage": "Another user is currently editing this item"
  }
}
```

**Business Logic Errors (BUSINESS_*):**
```typescript
{
  "BUSINESS_INVALID_STATE_TRANSITION": {
    "status": 422,
    "message": "Invalid status transition",
    "userMessage": "Cannot change from {from} to {to} status"
  },
  "BUSINESS_QUOTA_EXCEEDED": {
    "status": 422,
    "message": "Subscription quota exceeded",
    "userMessage": "You've reached your plan limit. Please upgrade."
  },
  "BUSINESS_APPROVAL_REQUIRED": {
    "status": 422,
    "message": "Approval required before this action",
    "userMessage": "This TRA must be approved before activation"
  }
}
```

**Rate Limiting Errors (RATE_*):**
```typescript
{
  "RATE_LIMIT_EXCEEDED": {
    "status": 429,
    "message": "Too many requests",
    "userMessage": "Please wait before trying again",
    "retryAfter": 60  // seconds
  }
}
```

**Server Errors (SERVER_*):**
```typescript
{
  "SERVER_ERROR": {
    "status": 500,
    "message": "Internal server error",
    "userMessage": "Something went wrong. We've been notified."
  },
  "SERVER_DATABASE_ERROR": {
    "status": 500,
    "message": "Database operation failed",
    "userMessage": "Unable to process your request. Please try again."
  },
  "SERVER_EXTERNAL_SERVICE_ERROR": {
    "status": 503,
    "message": "External service unavailable",
    "userMessage": "A required service is temporarily unavailable"
  }
}
```

---

## 4. Request Validation with Zod

### 4.1 Zod Schema Patterns

**Basic Schema Example:**
```typescript
// lib/validations/tra.ts
import { z } from 'zod';

// Hazard schema
export const hazardSchema = z.object({
  description: z.string().min(10).max(500),
  category: z.enum([
    'electrical', 'mechanical', 'chemical', 'biological',
    'physical', 'ergonomic', 'psychosocial'
  ]),
  effectScore: z.number().int().min(1).max(100),
  exposureScore: z.number().int().min(0).max(10),
  probabilityScore: z.number().int().min(0).max(10),
  controlMeasures: z.array(controlMeasureSchema).min(1)
});

// Control measure schema
export const controlMeasureSchema = z.object({
  type: z.enum([
    'elimination', 'substitution', 'engineering',
    'administrative', 'ppe'
  ]),
  description: z.string().min(10).max(500),
  responsiblePerson: z.string().uuid(),
  deadline: z.string().datetime()
});

// Task step schema
export const taskStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(10).max(1000),
  duration: z.number().positive().optional(),
  personnel: z.string().optional(),
  hazards: z.array(hazardSchema).min(1)
});

// Main TRA schema (POST request)
export const createTRASchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  taskSteps: z.array(taskStepSchema).min(1).max(50),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime()
}).refine(
  (data) => new Date(data.validUntil) > new Date(data.validFrom),
  { message: "validUntil must be after validFrom", path: ["validUntil"] }
);

// Update TRA schema (PATCH request) - all fields optional
export const updateTRASchema = createTRASchema.partial();

// Type inference
export type CreateTRARequest = z.infer<typeof createTRASchema>;
export type UpdateTRARequest = z.infer<typeof updateTRASchema>;
```

**Validation in Route Handler:**
```typescript
// app/api/v1/tras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTRASchema } from '@/lib/validations/tra';
import { createErrorResponse } from '@/lib/api/errors';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate with Zod
    const validatedData = createTRASchema.parse(body);
    
    // Validation passed, proceed with business logic
    // ...
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        status: 400,
        details: {
          fields: error.flatten().fieldErrors
        }
      });
    }
    
    // Other errors
    return createErrorResponse({
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      status: 500
    });
  }
}
```

---

### 4.2 Common Validation Patterns

**UUID Validation:**
```typescript
const uuidSchema = z.string().uuid();
```

**Email Validation:**
```typescript
const emailSchema = z.string().email().toLowerCase();
```

**Date/Time Validation:**
```typescript
const dateTimeSchema = z.string().datetime();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
```

**Enum Validation:**
```typescript
const statusSchema = z.enum(['draft', 'review', 'approved', 'active', 'archived']);
```

**Numeric Range Validation:**
```typescript
const riskScoreSchema = z.number().int().min(0).max(1000);
const percentageSchema = z.number().min(0).max(100);
```

**Array Validation:**
```typescript
const tagsSchema = z.array(z.string()).min(1).max(10);
const uniqueTagsSchema = z.array(z.string()).min(1).max(10)
  .refine((tags) => new Set(tags).size === tags.length, {
    message: "Tags must be unique"
  });
```

**Conditional Validation:**
```typescript
const traSchema = z.object({
  status: z.enum(['draft', 'approved']),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.status === 'approved') {
      return data.approvedBy && data.approvedAt;
    }
    return true;
  },
  {
    message: "approvedBy and approvedAt required when status is approved",
    path: ["status"]
  }
);
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Middleware

**Firebase Token Verification:**
```typescript
// middleware.ts or lib/api/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createErrorResponse } from '@/lib/api/errors';

export async function authenticateRequest(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        status: 401
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check token hasn't expired
    if (decodedToken.exp * 1000 < Date.now()) {
      return createErrorResponse({
        code: 'AUTH_INVALID_TOKEN',
        message: 'Token expired',
        status: 401
      });
    }
    
    // Return user context
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      orgId: decodedToken.orgId,  // Custom claim
      role: decodedToken.role      // Custom claim
    };
    
  } catch (error) {
    return createErrorResponse({
      code: 'AUTH_INVALID_TOKEN',
      message: 'Invalid authentication token',
      status: 401
    });
  }
}
```

**Usage in Route Handler:**
```typescript
// app/api/v1/tras/route.ts
export async function GET(req: NextRequest) {
  // Authenticate request
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return authResult;  // Return error response
  }
  
  const { userId, orgId, role } = authResult;
  
  // Proceed with authenticated request
  // ...
}
```

---

### 5.2 Authorization Patterns

**Role-Based Access Control:**
```typescript
// lib/api/permissions.ts

type Role = 'admin' | 'safety_manager' | 'supervisor' | 'field_worker';

const roleHierarchy: Record<Role, number> = {
  'admin': 4,
  'safety_manager': 3,
  'supervisor': 2,
  'field_worker': 1
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canCreateTRA(role: Role): boolean {
  return hasRole(role, 'supervisor');
}

export function canApproveTRA(role: Role): boolean {
  return hasRole(role, 'safety_manager');
}

export function canDeleteTRA(role: Role): boolean {
  return role === 'admin';
}

export function canManageUsers(role: Role): boolean {
  return role === 'admin';
}
```

**Resource-Level Authorization:**
```typescript
// Check if user can access specific resource
export async function canAccessTRA(
  userId: string,
  orgId: string,
  traId: string
): Promise<boolean> {
  const tra = await db.collection('organizations')
    .doc(orgId)
    .collection('tras')
    .doc(traId)
    .get();
    
  if (!tra.exists) {
    return false;
  }
  
  // Check organization match
  return tra.ref.parent.parent?.id === orgId;
}

// Check if user can edit specific TRA
export async function canEditTRA(
  userId: string,
  role: Role,
  traId: string
): Promise<boolean> {
  // Admins and safety managers can edit any TRA
  if (hasRole(role, 'safety_manager')) {
    return true;
  }
  
  // Others can only edit drafts they created
  const tra = await getTRA(traId);
  return tra.status === 'draft' && tra.createdBy === userId;
}
```

**Usage in Route Handler:**
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { traId: string } }
) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  
  // Check authorization
  const canEdit = await canEditTRA(auth.userId, auth.role, params.traId);
  if (!canEdit) {
    return createErrorResponse({
      code: 'AUTH_INSUFFICIENT_PERMISSIONS',
      message: 'Cannot edit this TRA',
      status: 403
    });
  }
  
  // Proceed with update
  // ...
}
```

---

## 6. Rate Limiting Strategy

### 6.1 Rate Limit Configuration

**Rate Limits by Endpoint Type:**
```typescript
// lib/api/rate-limit.ts

export const rateLimits = {
  // Authentication endpoints (prevent brute force)
  'auth': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 requests per window
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  
  // Read operations (generous)
  'read': {
    windowMs: 60 * 1000,       // 1 minute
    max: 100,                   // 100 requests per minute
    message: 'Too many requests. Please slow down.'
  },
  
  // Write operations (moderate)
  'write': {
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                    // 30 requests per minute
    message: 'Too many requests. Please slow down.'
  },
  
  // File uploads (restrictive)
  'upload': {
    windowMs: 60 * 1000,       // 1 minute
    max: 10,                    // 10 uploads per minute
    message: 'Too many file uploads. Please wait.'
  },
  
  // Report generation (restrictive - CPU intensive)
  'report': {
    windowMs: 60 * 1000,       // 1 minute
    max: 5,                     // 5 reports per minute
    message: 'Too many report requests. Please wait.'
  },
  
  // Organization-level limits (prevent abuse)
  'organization': {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 1000,                  // 1000 requests per hour per org
    message: 'Organization rate limit exceeded. Contact support.'
  }
};
```

**Implementation with Vercel KV or Upstash Redis:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true
  }),
  
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true
  }),
  
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true
  }),
  
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true
  }),
  
  report: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true
  }),
  
  organization: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'),
    analytics: true,
    prefix: 'org'
  })
};

// Middleware function
export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimiters
) {
  const limiter = rateLimiters[limitType];
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    return createErrorResponse({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      status: 429,
      details: {
        limit,
        reset: new Date(reset).toISOString(),
        remaining
      }
    });
  }
  
  return { success: true, remaining, reset };
}
```

**Usage in Route Handler:**
```typescript
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  
  // Check rate limit (per user)
  const rateLimit = await checkRateLimit(auth.userId, 'write');
  if (rateLimit instanceof NextResponse) return rateLimit;
  
  // Add rate limit headers to response
  const response = NextResponse.json(/* ... */);
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());
  
  return response;
}
```

---

## 7. Error Handling Utilities

### 7.1 Error Response Helper

```typescript
// lib/api/errors.ts
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
  userMessage?: string;
}

export function createErrorResponse(error: APIError): NextResponse {
  const { code, message, status, details, userMessage } = error;
  
  // Log to Sentry for 500 errors
  if (status >= 500) {
    Sentry.captureException(new Error(message), {
      tags: { errorCode: code },
      extra: details
    });
  }
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        documentation: `https://docs.safeworkpro.com/errors/${code}`
      }
    },
    { 
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Helper for common errors
export const Errors = {
  notFound: (resource: string) => createErrorResponse({
    code: 'RESOURCE_NOT_FOUND',
    message: `${resource} not found`,
    status: 404,
    userMessage: `The requested ${resource.toLowerCase()} could not be found`
  }),
  
  unauthorized: () => createErrorResponse({
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
    status: 401,
    userMessage: 'Please log in to continue'
  }),
  
  forbidden: (action?: string) => createErrorResponse({
    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    status: 403,
    userMessage: action 
      ? `You don't have permission to ${action}`
      : 'You don\'t have permission to perform this action'
  }),
  
  validation: (fields: Record<string, string>) => createErrorResponse({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    status: 400,
    details: { fields },
    userMessage: 'Please check your input and try again'
  }),
  
  conflict: (message: string) => createErrorResponse({
    code: 'RESOURCE_CONFLICT',
    message,
    status: 409,
    userMessage: message
  }),
  
  serverError: (error: Error) => {
    Sentry.captureException(error);
    return createErrorResponse({
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      status: 500,
      userMessage: 'Something went wrong. We\'ve been notified and will fix it soon.'
    });
  }
};
```

---

### 7.2 Try-Catch Pattern

**Standard Error Handling Pattern:**
```typescript
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    
    // 2. Rate limit
    const rateLimit = await checkRateLimit(auth.userId, 'write');
    if (rateLimit instanceof NextResponse) return rateLimit;
    
    // 3. Parse and validate request
    const body = await req.json();
    const validatedData = createTRASchema.parse(body);
    
    // 4. Authorize (resource-specific)
    const canCreate = canCreateTRA(auth.role);
    if (!canCreate) {
      return Errors.forbidden('create TRAs');
    }
    
    // 5. Business logic
    const tra = await createTRA({
      ...validatedData,
      orgId: auth.orgId,
      createdBy: auth.userId
    });
    
    // 6. Success response
    return NextResponse.json({
      success: true,
      data: tra,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        created: true
      }
    }, { status: 201 });
    
  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return Errors.validation(error.flatten().fieldErrors);
    }
    
    // Firebase errors
    if (error.code === 'permission-denied') {
      return Errors.forbidden();
    }
    
    if (error.code === 'not-found') {
      return Errors.notFound('Resource');
    }
    
    // Unknown errors
    console.error('API Error:', error);
    return Errors.serverError(error as Error);
  }
}
```

---

## 8. Monitoring & Logging

### 8.1 Request Logging

**Structured Logging Pattern:**
```typescript
// lib/api/logger.ts
import { NextRequest } from 'next/server';

export interface LogContext {
  requestId: string;
  userId?: string;
  orgId?: string;
  method: string;
  path: string;
  timestamp: string;
  duration?: number;
  status?: number;
  error?: any;
}

export function createRequestLogger(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  return {
    info: (message: string, context?: any) => {
      console.log(JSON.stringify({
        level: 'info',
        message,
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        ...context
      }));
    },
    
    error: (message: string, error: any, context?: any) => {
      console.error(JSON.stringify({
        level: 'error',
        message,
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        ...context
      }));
    },
    
    complete: (status: number, context?: any) => {
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        message: 'Request completed',
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status,
        duration,
        timestamp: new Date().toISOString(),
        ...context
      }));
    }
  };
}
```

**Usage:**
```typescript
export async function POST(req: NextRequest) {
  const logger = createRequestLogger(req);
  
  try {
    logger.info('Processing TRA creation request');
    
    const auth = await authenticateRequest(req);
    logger.info('User authenticated', { userId: auth.userId });
    
    // ... business logic
    
    logger.complete(201, { traId: tra.id });
    return NextResponse.json(/* ... */);
    
  } catch (error) {
    logger.error('TRA creation failed', error);
    return Errors.serverError(error as Error);
  }
}
```

---

### 8.2 Performance Monitoring

**Performance Tracking:**
```typescript
// lib/api/performance.ts

export function trackPerformance(operation: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      
      // Log slow operations (>1 second)
      if (duration > 1000) {
        console.warn(`Slow operation: ${operation} took ${duration}ms`);
        
        // Send to Sentry for analysis
        Sentry.captureMessage(`Slow API operation: ${operation}`, {
          level: 'warning',
          tags: { operation },
          extra: { duration }
        });
      }
      
      return duration;
    }
  };
}

// Usage
const perf = trackPerformance('create_tra');
await createTRA(data);
const duration = perf.end();
```

**Firebase Query Optimization:**
```typescript
// Track Firestore query performance
export async function optimizedQuery<T>(
  query: FirebaseFirestore.Query<T>,
  operationName: string
) {
  const perf = trackPerformance(`firestore_${operationName}`);
  const snapshot = await query.get();
  const duration = perf.end();
  
  // Alert if query is expensive
  if (snapshot.size > 100) {
    console.warn(`Large query result: ${operationName} returned ${snapshot.size} docs`);
  }
  
  return snapshot;
}
```

---

## 9. API Route Examples

### 9.1 Complete CRUD Example (TRAs)

**File Structure:**
```
app/api/v1/
├── tras/
│   ├── route.ts              (GET list, POST create)
│   └── [traId]/
│       ├── route.ts          (GET single, PATCH update, DELETE)
│       ├── approve/
│       │   └── route.ts      (POST approve)
│       ├── duplicate/
│       │   └── route.ts      (POST duplicate)
│       └── history/
│           └── route.ts      (GET version history)
```

**GET List TRAs:**
```typescript
// app/api/v1/tras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { authenticateRequest } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { createRequestLogger } from '@/lib/api/logger';
import { Errors } from '@/lib/api/errors';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  projectId: z.string().uuid().optional(),
  sort: z.string().optional()
});

export async function GET(req: NextRequest) {
  const logger = createRequestLogger(req);
  
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    
    // 2. Rate limit
    const rateLimit = await checkRateLimit(auth.userId, 'read');
    if (rateLimit instanceof NextResponse) return rateLimit;
    
    // 3. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);
    
    // 4. Build Firestore query
    let firestoreQuery = db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('tras')
      .orderBy('createdAt', 'desc');
    
    // Apply filters
    if (query.status) {
      firestoreQuery = firestoreQuery.where('status', '==', query.status);
    }
    if (query.projectId) {
      firestoreQuery = firestoreQuery.where('projectId', '==', query.projectId);
    }
    
    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    firestoreQuery = firestoreQuery.offset(offset).limit(query.limit);
    
    // 5. Execute query
    const snapshot = await firestoreQuery.get();
    
    // 6. Transform data
    const tras = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 7. Get total count (for pagination)
    const totalSnapshot = await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('tras')
      .count()
      .get();
    
    const total = totalSnapshot.data().count;
    
    // 8. Success response
    logger.complete(200, { count: tras.length });
    
    return NextResponse.json({
      success: true,
      data: tras,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrevious: query.page > 1
      },
      meta: {
        requestId: logger.requestId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to list TRAs', error);
    
    if (error instanceof z.ZodError) {
      return Errors.validation(error.flatten().fieldErrors);
    }
    
    return Errors.serverError(error as Error);
  }
}
```

**POST Create TRA:**
```typescript
export async function POST(req: NextRequest) {
  const logger = createRequestLogger(req);
  
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    
    // 2. Authorize
    if (!canCreateTRA(auth.role)) {
      return Errors.forbidden('create TRAs');
    }
    
    // 3. Rate limit
    const rateLimit = await checkRateLimit(auth.userId, 'write');
    if (rateLimit instanceof NextResponse) return rateLimit;
    
    // 4. Parse and validate request
    const body = await req.json();
    const validatedData = createTRASchema.parse(body);
    
    // 5. Business validation
    // Check project exists and belongs to org
    const projectRef = await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('projects')
      .doc(validatedData.projectId)
      .get();
      
    if (!projectRef.exists) {
      return Errors.notFound('Project');
    }
    
    // 6. Calculate risk scores
    const taskStepsWithRisk = validatedData.taskSteps.map(step => ({
      ...step,
      hazards: step.hazards.map(hazard => ({
        ...hazard,
        riskScore: hazard.effectScore * hazard.exposureScore * hazard.probabilityScore,
        riskLevel: calculateRiskLevel(
          hazard.effectScore * hazard.exposureScore * hazard.probabilityScore
        )
      }))
    }));
    
    const overallRiskScore = Math.max(
      ...taskStepsWithRisk.flatMap(step =>
        step.hazards.map(h => h.riskScore)
      )
    );
    
    // 7. Create TRA document
    const traRef = db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('tras')
      .doc();
    
    const traData = {
      ...validatedData,
      taskSteps: taskStepsWithRisk,
      overallRiskScore,
      status: 'draft',
      createdBy: auth.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await traRef.set(traData);
    
    // 8. Create audit log
    await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('auditLogs')
      .add({
        action: 'tra_created',
        resourceType: 'tra',
        resourceId: traRef.id,
        userId: auth.userId,
        timestamp: new Date(),
        details: { title: validatedData.title }
      });
    
    // 9. Success response
    logger.complete(201, { traId: traRef.id });
    
    return NextResponse.json({
      success: true,
      data: {
        id: traRef.id,
        ...traData
      },
      meta: {
        requestId: logger.requestId,
        timestamp: new Date().toISOString(),
        created: true
      }
    }, { status: 201 });
    
  } catch (error) {
    logger.error('TRA creation failed', error);
    
    if (error instanceof z.ZodError) {
      return Errors.validation(error.flatten().fieldErrors);
    }
    
    return Errors.serverError(error as Error);
  }
}
```

---

### 9.2 Action Endpoint Example

**POST Approve TRA:**
```typescript
// app/api/v1/tras/[traId]/approve/route.ts

const approveSchema = z.object({
  comments: z.string().max(1000).optional(),
  signature: z.string().optional()  // Base64 encoded signature
});

export async function POST(
  req: NextRequest,
  { params }: { params: { traId: string } }
) {
  const logger = createRequestLogger(req);
  
  try {
    // Authenticate & authorize
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    
    if (!canApproveTRA(auth.role)) {
      return Errors.forbidden('approve TRAs');
    }
    
    // Validate request
    const body = await req.json();
    const { comments, signature } = approveSchema.parse(body);
    
    // Get TRA
    const traRef = db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('tras')
      .doc(params.traId);
    
    const traDoc = await traRef.get();
    
    if (!traDoc.exists) {
      return Errors.notFound('TRA');
    }
    
    const tra = traDoc.data();
    
    // Validate state transition
    if (tra.status !== 'review') {
      return Errors.conflict('TRA must be in review status to approve');
    }
    
    // Update TRA
    await traRef.update({
      status: 'approved',
      approvedBy: auth.userId,
      approvedAt: new Date(),
      approvalComments: comments,
      approvalSignature: signature,
      updatedAt: new Date()
    });
    
    // Create audit log
    await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('auditLogs')
      .add({
        action: 'tra_approved',
        resourceType: 'tra',
        resourceId: params.traId,
        userId: auth.userId,
        timestamp: new Date(),
        details: { comments }
      });
    
    // Send notification (async, don't await)
    sendApprovalNotification(params.traId, auth.userId).catch(console.error);
    
    logger.complete(200, { traId: params.traId, action: 'approved' });
    
    return NextResponse.json({
      success: true,
      data: {
        id: params.traId,
        status: 'approved',
        approvedBy: auth.userId,
        approvedAt: new Date().toISOString()
      },
      meta: {
        requestId: logger.requestId,
        timestamp: new Date().toISOString(),
        action: 'approved'
      }
    });
    
  } catch (error) {
    logger.error('TRA approval failed', error);
    
    if (error instanceof z.ZodError) {
      return Errors.validation(error.flatten().fieldErrors);
    }
    
    return Errors.serverError(error as Error);
  }
}
```

---

## 10. Performance Best Practices

### 10.1 Database Query Optimization

**Firestore Best Practices:**
```typescript
// ❌ BAD: Fetching unnecessary data
const tras = await db
  .collection('organizations')
  .doc(orgId)
  .collection('tras')
  .get();

// ✅ GOOD: Use pagination and field selection
const tras = await db
  .collection('organizations')
  .doc(orgId)
  .collection('tras')
  .select('id', 'title', 'status', 'createdAt')  // Only needed fields
  .limit(20)
  .get();

// ❌ BAD: N+1 query problem
for (const tra of tras) {
  const project = await db.doc(`projects/${tra.projectId}`).get();
  tra.project = project.data();
}

// ✅ GOOD: Batch read or denormalize
const projectIds = [...new Set(tras.map(t => t.projectId))];
const projects = await db.getAll(...projectIds.map(id => db.doc(`projects/${id}`)));
const projectMap = new Map(projects.map(p => [p.id, p.data()]));

// ❌ BAD: Loading entire collection
const allTRAs = await trasRef.get();
const filtered = allTRAs.docs.filter(doc => doc.data().status === 'active');

// ✅ GOOD: Query with filters
const activeTRAs = await trasRef.where('status', '==', 'active').get();
```

**Caching Strategy:**
```typescript
// Use React Query on client side for automatic caching
// Server-side: Cache reference data (hazards, control measures)

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: any, expires: number }>();

export async function getCachedHazards() {
  const cached = cache.get('hazards');
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const hazards = await db.collection('hazards').get();
  const data = hazards.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  cache.set('hazards', {
    data,
    expires: Date.now() + CACHE_TTL
  });
  
  return data;
}
```

---

### 10.2 Response Optimization

**Sparse Fieldsets:**
```typescript
// Allow clients to request only needed fields
// GET /api/v1/tras?fields=id,title,status

const requestedFields = query.fields?.split(',') || null;

function selectFields<T>(obj: T, fields: string[] | null): Partial<T> {
  if (!fields) return obj;
  
  return fields.reduce((acc, field) => {
    if (field in obj) {
      acc[field] = obj[field];
    }
    return acc;
  }, {} as Partial<T>);
}

// In response
const data = tras.map(tra => selectFields(tra, requestedFields));
```

**Pagination Cursors for Large Datasets:**
```typescript
// More efficient than offset pagination for large collections
export async function getCursorPaginatedTRAs(
  orgId: string,
  limit: number = 20,
  cursor?: string
) {
  let query = db
    .collection('organizations')
    .doc(orgId)
    .collection('tras')
    .orderBy('createdAt', 'desc')
    .limit(limit);
  
  if (cursor) {
    const cursorDoc = await db.doc(`organizations/${orgId}/tras/${cursor}`).get();
    query = query.startAfter(cursorDoc);
  }
  
  const snapshot = await query.get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const nextCursor = snapshot.docs.length === limit
    ? snapshot.docs[snapshot.docs.length - 1].id
    : null;
  
  return { data, nextCursor };
}
```

---

## 11. Security Patterns

### 11.1 Input Sanitization

**XSS Prevention:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous HTML/JS
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // No HTML allowed
    ALLOWED_ATTR: []
  });
}

// In validation schema
const sanitizedStringSchema = z.string()
  .transform(sanitizeUserInput);
```

**SQL Injection Prevention:**
- Not applicable (Firestore is NoSQL and parameterized)
- Firebase SDK handles escaping automatically

**NoSQL Injection Prevention:**
```typescript
// ❌ BAD: User input directly in query
const userQuery = req.query.status;
await trasRef.where('status', '==', userQuery).get();

// ✅ GOOD: Validate against enum first
const statusSchema = z.enum(['draft', 'review', 'approved', 'active', 'archived']);
const validatedStatus = statusSchema.parse(userQuery);
await trasRef.where('status', '==', validatedStatus).get();
```

---

### 11.2 CORS Configuration

**Next.js Middleware for CORS:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only allow our domains
  const allowedOrigins = [
    'https://safeworkpro.com',
    'https://www.safeworkpro.com',
    'http://localhost:3000'  // Development
  ];
  
  const origin = request.headers.get('origin');
  const response = NextResponse.next();
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-ID');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};
```

---

### 11.3 Security Headers

**Next.js Configuration:**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com"
    ].join('; ')
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};
```

---

## 12. Testing Strategy

### 12.1 Unit Testing API Routes

**Jest Configuration:**
```typescript
// __tests__/api/tras.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/v1/tras/route';

describe('/api/v1/tras', () => {
  describe('GET', () => {
    it('returns 401 without authentication', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req as any);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_REQUIRED');
    });
    
    it('returns TRAs for authenticated user', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock_token'
        }
      });
      
      // Mock Firebase Admin SDK
      jest.spyOn(auth, 'verifyIdToken').mockResolvedValue({
        uid: 'user_123',
        orgId: 'org_abc',
        role: 'admin'
      });
      
      const response = await GET(req as any);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
  
  describe('POST', () => {
    it('validates request body with Zod', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'Short'  // Fails min length validation
        }
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

### 12.2 Integration Testing with Firebase Emulator

**Test Setup:**
```typescript
// __tests__/setup.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'safework-pro-test',
    firestore: {
      host: 'localhost',
      port: 8080
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});
```

---

## 13. API Documentation Format

### 13.1 Endpoint Specification Template

For each endpoint, document:

```markdown
## POST /api/v1/tras

Create a new Task Risk Analysis.

**Authentication**: Required  
**Authorization**: Supervisor role or higher  
**Rate Limit**: 30 requests per minute

### Request

**Headers:**
- `Authorization`: Bearer token (required)
- `X-Organization-ID`: Organization UUID (required)

**Body:**
```json
{
  "title": "string (5-200 chars, required)",
  "projectId": "uuid (required)",
  "templateId": "uuid (optional)",
  "taskSteps": [/* array of task steps, required */]
}
```

**Validation Rules:**
- Title: 5-200 characters
- At least 1 task step
- Valid project ID belonging to organization
- Task steps numbered sequentially

### Response

**Success (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "tra_abc123",
    "title": "Electrical Maintenance",
    "status": "draft",
    "overallRiskScore": 240,
    "createdAt": "2024-10-15T14:30:00Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid request data
- `401 AUTH_REQUIRED`: Missing authentication
- `403 AUTH_INSUFFICIENT_PERMISSIONS`: Lacks required role
- `404 RESOURCE_NOT_FOUND`: Project not found
- `429 RATE_LIMIT_EXCEEDED`: Too many requests
- `500 SERVER_ERROR`: Internal server error

### Examples

**cURL:**
```bash
curl -X POST https://safeworkpro.com/api/v1/tras \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Organization-ID: org_abc123" \
  -H "Content-Type: application/json" \
  -d '{ "title": "...", "projectId": "..." }'
```

**TypeScript:**
```typescript
const response = await fetch('/api/v1/tras', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-ID': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Electrical Maintenance',
    projectId: 'proj_123'
  })
});

const result = await response.json();
if (result.success) {
  console.log('TRA created:', result.data.id);
}
```
```

---

## 14. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create `lib/api/errors.ts` with error utilities
- [ ] Create `lib/api/auth.ts` with authentication middleware
- [ ] Create `lib/api/logger.ts` with logging utilities
- [ ] Create `lib/api/permissions.ts` with RBAC functions
- [ ] Configure security headers in `next.config.ts`

### Phase 2: Validation (Week 1)
- [ ] Create `lib/validations/` directory
- [ ] Define Zod schemas for all resources (TRA, User, Org, etc.)
- [ ] Create validation utility functions
- [ ] Document validation patterns

### Phase 3: Rate Limiting (Week 2)
- [ ] Set up Upstash Redis account
- [ ] Install `@upstash/ratelimit` and `@upstash/redis`
- [ ] Create `lib/api/rate-limit.ts`
- [ ] Implement rate limiting middleware
- [ ] Test rate limits with load testing

### Phase 4: API Routes (Weeks 2-8)
- [ ] Implement `/api/v1/organizations/**` routes
- [ ] Implement `/api/v1/users/**` routes
- [ ] Implement `/api/v1/tras/**` routes
- [ ] Implement `/api/v1/lmra-sessions/**` routes
- [ ] Implement `/api/v1/templates/**` routes
- [ ] Implement `/api/v1/reports/**` routes
- [ ] Implement `/api/v1/analytics/**` routes

### Phase 5: Testing & Documentation (Ongoing)
- [ ] Write unit tests for all routes
- [ ] Write integration tests with Firebase emulator
- [ ] Document each endpoint (format above)
- [ ] Create Postman/Insomnia collection
- [ ] Performance test critical paths

---

## 15. Migration Path from Current State

**Current State**: No API routes implemented yet

**Implementation Order:**

1. **Month 2 (Foundation)**: 
   - Set up error handling, auth, validation (Tasks 3.1A-3.1D)
   - First API route: User authentication (Task 3.1)

2. **Month 2-3**: 
   - Organization and user management APIs (Tasks 3.2-3.4)
   - Project management APIs (Task 3.5)
   - File upload API (Task 3.6)

3. **Month 3-4**: 
   - TRA CRUD APIs (Tasks 4.1-4.12)
   - Template APIs
   - Approval workflow APIs

4. **Month 5-6**: 
   - LMRA session APIs (Tasks 5.5-5.10)
   - Real-time listener setup (Firebase, not REST)

5. **Month 7**: 
   - Reporting APIs (Tasks 6.1-6.8)
   - Analytics APIs

6. **Month 8**: 
   - Billing/webhook APIs (Tasks 7.1-7.5)
   - Final polish and optimization

---

## Conclusion

This API architecture provides:
- ✅ Consistent patterns for predictable development
- ✅ Type safety with TypeScript and Zod
- ✅ Comprehensive error handling
- ✅ Security-first approach
- ✅ Performance optimization built-in
- ✅ Testability and maintainability

**Next Steps:**
1. Implement foundation utilities (Tasks 3.1A-3.1D)
2. Create first API routes for authentication (Task 3.1)
3. Build iteratively following this specification
4. Update this document based on learnings

---

**Document Status**: READY FOR IMPLEMENTATION  
**Related Documents**: 
- [`CHECKLIST_V2.md`](CHECKLIST_V2.md:1) - Tasks 3.1A-3.1D
- [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1) - Overall architecture
- [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md:1) - Database security rules

**Maintenance**: Update as new patterns emerge during development