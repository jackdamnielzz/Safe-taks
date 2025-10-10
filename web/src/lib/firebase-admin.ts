/**
 * Firebase Admin SDK Configuration
 *
 * This file initializes the Firebase Admin SDK for server-side operations.
 * Used in API routes for token verification and Firestore operations.
 *
 * @see API_ARCHITECTURE.md Section 5 for authentication patterns
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

/**
 * Initialize Firebase Admin SDK
 *
 * Uses service account credentials for server-side authentication.
 * Prevents re-initialization in serverless environments.
 */
let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    // Already initialized
    adminApp = getApps()[0];
  } else {
    // Initialize with service account or default credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Option 1: Using service account JSON (recommended for production)
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } catch (error) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
        throw new Error("Invalid Firebase service account configuration");
      }
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Option 2: Using individual environment variables
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Option 3: Development mode (will work in Firebase emulator)
      console.warn(
        "Firebase Admin: No service account credentials found. Using default credentials."
      );
      console.warn("This is only suitable for development with Firebase emulator.");

      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
}

// Initialize on import
initializeFirebaseAdmin();

/**
 * Firebase Admin Auth instance for server-side authentication
 * @example
 * ```typescript
 * import { auth } from '@/lib/firebase-admin';
 * const decodedToken = await auth.verifyIdToken(token);
 * ```
 */
export const auth = adminAuth;

/**
 * Firebase Admin Firestore instance for server-side database operations
 * @example
 * ```typescript
 * import { db } from '@/lib/firebase-admin';
 * const doc = await db.collection('organizations').doc(orgId).get();
 * ```
 */
export const db = adminDb;

/**
 * Firebase Admin Storage instance for server-side storage operations
 * @example
 * ```typescript
 * import { storage } from '@/lib/firebase-admin';
 * const bucket = storage.bucket();
 * ```
 */
export const storage = adminStorage;

/**
 * Helper function to set custom claims for user authentication
 *
 * @param uid - User ID
 * @param claims - Custom claims object (orgId, role, etc.)
 *
 * @example
 * ```typescript
 * await setCustomClaims('user_123', {
 *   orgId: 'org_abc',
 *   role: 'admin'
 * });
 * ```
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Helper function to verify and decode ID token
 *
 * @param token - Firebase ID token from client
 * @returns Decoded token with custom claims
 */
export async function verifyIdToken(token: string) {
  return await auth.verifyIdToken(token);
}
