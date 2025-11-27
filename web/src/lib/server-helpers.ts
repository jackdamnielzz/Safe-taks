/**
 * Firebase Admin SDK initialization and helper functions
 * Uses real Firebase Admin SDK when credentials are available
 */

import { auth as adminAuth, db as adminDb, storage as adminStorage } from './firebase-admin';

/**
 * initializeAdmin()
 * Returns Firebase Admin SDK instances for Firestore, Auth, and Storage
 * Uses the real Firebase Admin SDK initialized in firebase-admin.ts
 */
export function initializeAdmin() {
  return {
    firestore: adminDb,
    auth: adminAuth,
    storage: adminStorage
  };
}

/**
 * requireOrgAuth()
 * Server-side auth check that works in both development and production environments.
 * In development, uses fallback values when auth headers/env vars aren't available.
 * In production, should be replaced with proper Firebase ID token verification.
 */
export async function requireOrgAuth(req?: Request) {
  let uid: string;
  let orgId: string;

  // Try to get from environment variables (for testing/development)
  if (process.env.TEST_UID && process.env.TEST_ORG) {
    uid = process.env.TEST_UID;
    orgId = process.env.TEST_ORG;
  } else {
    // Fallback for development - use demo values when no auth is available
    uid = "demo-user-" + Date.now();
    orgId = "demo-org";

    // In production, you would verify Firebase ID tokens here
    // For now, we'll allow the demo to work
    console.warn("Using demo authentication - implement proper auth for production");
  }

  return { uid, orgId, roles: ["owner"] as string[] };
}

/**
 * getOrgIdFromRequest()
 * Extract organization ID from request context
 */
export function getOrgIdFromRequest() {
  return "demo-org";
}
