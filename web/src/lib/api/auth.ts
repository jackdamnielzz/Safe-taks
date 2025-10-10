/**
 * API Authentication Middleware
 *
 * Provides authentication and authorization helpers for Next.js API routes.
 * Uses Firebase Admin SDK to verify ID tokens and extract user context.
 *
 * @see API_ARCHITECTURE.md Section 5 for authentication patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { Errors } from "./errors";

/**
 * Authenticated user context extracted from Firebase token
 */
export interface AuthContext {
  userId: string;
  email?: string;
  orgId: string;
  role: "admin" | "safety_manager" | "supervisor" | "field_worker";
  emailVerified?: boolean;
}

/**
 * Authenticates a Next.js API request using Firebase ID token
 *
 * Extracts the Bearer token from Authorization header, verifies it with
 * Firebase Admin SDK, and returns user context including custom claims.
 *
 * @param req - Next.js request object
 * @returns AuthContext if successful, NextResponse error if authentication fails
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const auth = await authenticateRequest(req);
 *   if (auth instanceof NextResponse) return auth; // Return error
 *
 *   // Use auth context
 *   const { userId, orgId, role } = auth;
 *   // ... proceed with request
 * }
 * ```
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthContext | NextResponse> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Errors.unauthorized();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return Errors.unauthorized();
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Check if token has expired
    if (decodedToken.exp * 1000 < Date.now()) {
      return Errors.invalidToken();
    }

    // Extract custom claims (set during user creation/update)
    const orgId = decodedToken.orgId as string;
    const role = decodedToken.role as AuthContext["role"];

    // Validate required custom claims
    if (!orgId) {
      console.error("User token missing orgId custom claim:", decodedToken.uid);
      return Errors.forbidden("access this resource. Organization ID missing.");
    }

    if (!role) {
      console.error("User token missing role custom claim:", decodedToken.uid);
      return Errors.forbidden("access this resource. Role missing.");
    }

    // Return user context
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      orgId,
      role,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error: any) {
    // Firebase Admin SDK errors
    if (error.code === "auth/id-token-expired") {
      return Errors.invalidToken();
    }

    if (error.code === "auth/argument-error") {
      return Errors.unauthorized();
    }

    console.error("Authentication error:", error);
    return Errors.unauthorized();
  }
}

/**
 * Middleware to require authentication for an API route
 *
 * Wraps a route handler with authentication check. Returns error response
 * if authentication fails, otherwise calls the handler with auth context.
 *
 * @param handler - Route handler function that receives auth context
 * @returns Wrapped route handler
 *
 * @example
 * ```typescript
 * export const GET = requireAuth(async (req, auth) => {
 *   // auth is guaranteed to be valid AuthContext
 *   const { userId, orgId, role } = auth;
 *
 *   // ... implement route logic
 *   return NextResponse.json({ data: [...] });
 * });
 * ```
 */
export function requireAuth<T extends any[]>(
  handler: (req: NextRequest, auth: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const auth = await authenticateRequest(req);

    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    // Call handler with auth context
    return handler(req, auth, ...args);
  };
}

/**
 * Extracts organization ID from request headers
 *
 * Some endpoints allow passing organization ID in header for context.
 * This is validated against the authenticated user's organization.
 *
 * @param req - Next.js request object
 * @param auth - Authenticated user context
 * @returns Organization ID if valid, error response if mismatch
 */
export function validateOrganizationContext(
  req: NextRequest,
  auth: AuthContext
): string | NextResponse {
  const headerOrgId = req.headers.get("X-Organization-ID");

  // If header provided, validate it matches user's org
  if (headerOrgId && headerOrgId !== auth.orgId) {
    return Errors.organizationMismatch();
  }

  return auth.orgId;
}

/**
 * Helper to check if user's email is verified
 *
 * Some operations may require verified email for security.
 *
 * @param auth - Authenticated user context
 * @returns True if email is verified
 */
export function isEmailVerified(auth: AuthContext): boolean {
  return auth.emailVerified === true;
}

/**
 * Middleware to require verified email
 *
 * @param handler - Route handler
 * @returns Wrapped handler that checks email verification
 */
export function requireVerifiedEmail<T extends any[]>(
  handler: (req: NextRequest, auth: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return requireAuth(async (req: NextRequest, auth: AuthContext, ...args: T) => {
    if (!isEmailVerified(auth)) {
      return Errors.forbidden("perform this action. Please verify your email first.");
    }

    return handler(req, auth, ...args);
  });
}
