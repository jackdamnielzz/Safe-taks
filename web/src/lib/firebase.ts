import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { connectAuthEmulator } from "firebase/auth";

/**
 * Firebase initialization helper
 *
 * Usage:
 * - Add the following env vars to your .env.local (client-side values):
 *   NEXT_PUBLIC_FIREBASE_API_KEY=
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
 *   NEXT_PUBLIC_FIREBASE_APP_ID=
 *
 * Important:
 * - This file is client-only. Do NOT rely on these exports from server-side code.
 * - Server-side code should use the Firebase Admin SDK (web/src/lib/firebase-admin.ts).
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize and export client SDKs when running in the browser.
// This prevents Firebase client SDK from attempting to initialize during SSG/build on the server.
const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  // Prevent re-initialization during hot reloads in development
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
}

export const auth = isBrowser ? getAuth() : (null as unknown as ReturnType<typeof getAuth>);
export const db = isBrowser ? getFirestore() : (null as unknown as ReturnType<typeof getFirestore>);
export const storage = isBrowser
  ? getStorage()
  : (null as unknown as ReturnType<typeof getStorage>);

// Initialize Analytics (only in browser and if supported)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (isBrowser) {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics();
      }
    })
    .catch((error) => {
      console.warn("Firebase Analytics not supported:", error);
    });
}
export { analytics };

// Initialize Performance Monitoring (only in browser and production)
let performance: ReturnType<typeof getPerformance> | null = null;
if (isBrowser && process.env.NODE_ENV === "production") {
  try {
    performance = getPerformance();
    console.log("🔥 Firebase Performance Monitoring initialized");
  } catch (error) {
    console.warn("Firebase Performance Monitoring not supported:", error);
  }
}
export { performance };

// Configure Google Auth Provider (safe to create; only used client-side)
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Connect to emulators in development (client-side only)
if (process.env.NODE_ENV === "development" && isBrowser) {
  const shouldUseEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

  if (shouldUseEmulator) {
    try {
      console.log("🔥 Connecting to Firebase Emulators...");
      // auth/db/storage are only valid in browser
      if (auth) {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      }
      if (db) {
        connectFirestoreEmulator(db, "localhost", 8080);
      }
      if (storage) {
        connectStorageEmulator(storage, "localhost", 9199);
      }
    } catch (error) {
      // Emulators already connected or not available, ignore error
      console.log("Emulator connection skipped or already connected");
    }
  }
}
