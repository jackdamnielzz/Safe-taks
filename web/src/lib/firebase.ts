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
 * - Add the following env vars to your .env.local:
 *   NEXT_PUBLIC_FIREBASE_API_KEY=
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
 *   NEXT_PUBLIC_FIREBASE_APP_ID=
 *
 * This file exports initialized instances for Auth, Firestore and Storage.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization during hot reloads in development
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

// Initialize Analytics (only in browser and if supported)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
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
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  try {
    performance = getPerformance();
    console.log("🔥 Firebase Performance Monitoring initialized");
  } catch (error) {
    console.warn("Firebase Performance Monitoring not supported:", error);
  }
}
export { performance };

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

// Connect to emulators in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const shouldUseEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

  if (shouldUseEmulator) {
    try {
      console.log("🔥 Connecting to Firebase Emulators...");
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "localhost", 8080);
      connectStorageEmulator(storage, "localhost", 9199);
    } catch (error) {
      // Emulators already connected, ignore error
      console.log("Emulators already connected");
    }
  }
}
