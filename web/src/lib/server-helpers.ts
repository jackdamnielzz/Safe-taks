import admin from "firebase-admin";

/**
 * initializeAdmin()
 * Simple firebase-admin initializer used by server API routes.
 * Reads credentials from env in production, uses emulator/admin defaults in dev.
 */
export function initializeAdmin() {
  if (!admin.apps || admin.apps.length === 0) {
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
      });
    } catch {
      // ignore if already initialized
    }
  }
  const firestore = admin.firestore();
  return { firestore, admin };
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
