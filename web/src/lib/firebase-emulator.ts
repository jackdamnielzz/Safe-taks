/**
 * Firebase emulator initializer helper with compatibility shims
 * - Conditionally loads connect*Emulator functions to avoid "is not a function" errors in Jest environment
 * - Provides convenience getters for tests and a clearEmulatorData helper
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth as firebaseGetAuth } from "firebase/auth";
import { getFirestore as firebaseGetFirestore } from "firebase/firestore";

let connectAuthEmulator: ((auth: any, url: string) => void) | null = null;
let connectFirestoreEmulator: ((db: any, host: string, port: number) => void) | null = null;
let getStorage: any = null;
let connectStorageEmulator: any = null;

// Try to require emulator connector helpers where available (avoid static imports)
// eslint-disable-next-line @typescript-eslint/no-require-imports
try {
  const authModule = require("firebase/auth");
  connectAuthEmulator = authModule.connectAuthEmulator || null;
} catch (e) {
  connectAuthEmulator = null;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
try {
  const firestoreModule = require("firebase/firestore");
  connectFirestoreEmulator = firestoreModule.connectFirestoreEmulator || null;
} catch (e) {
  connectFirestoreEmulator = null;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
try {
  const storageModule = require("firebase/storage");
  getStorage = storageModule.getStorage || null;
  connectStorageEmulator = storageModule.connectStorageEmulator || null;
} catch (e) {
  getStorage = null;
  connectStorageEmulator = null;
}

// Jest/Node environment polyfills: ensure Request/Response/NextRequest/NextResponse exist for modules that reference them
declare const global: any;
if (typeof global !== "undefined") {
  if (typeof global.Request === "undefined") {
    // Minimal Request-like shim
    // eslint-disable-next-line no-global-assign
    global.Request = class {
      constructor(input: any, init?: any) {
        return { url: typeof input === "string" ? input : (input && input.url) || "", ...init };
      }
    };
  }
}

/**
 * Initialize Firebase app and connect to emulators where possible.
 * Returns initialized services used by tests: { auth, firestore, storage? }
 */
export function initializeEmulatorApp(): { auth: any; firestore: any; storage: any } {
  if (getApps().length === 0) {
    // minimal options for test/helper use; ignore TS strictness in this helper
    initializeApp({
      apiKey: process.env.FIREBASE_API_KEY || "fake",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "localhost",
      projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
    });
  }

  const app = getApp();

  const auth = firebaseGetAuth(app);
  const firestore = firebaseGetFirestore(app);
  let storage = null;

  // Connect Firestore emulator if helper exists, otherwise attempt best-effort
  try {
    if (connectFirestoreEmulator) {
      const host = process.env.FIRESTORE_EMULATOR_HOST?.split(":")[0] || "localhost";
      const port = parseInt(process.env.FIRESTORE_EMULATOR_PORT || "8080", 10);
      connectFirestoreEmulator(firestore, host, port);
    }
  } catch (e) {
    // swallow errors in test environments
  }

  // Connect Auth emulator if available
  try {
    if (connectAuthEmulator) {
      const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "http://localhost:9099";
      connectAuthEmulator(auth, authHost.startsWith("http") ? authHost : `http://${authHost}`);
    }
  } catch (e) {
    // ignore
  }

  // Storage: only if modular storage functions are present
  if (getStorage) {
    try {
      storage = getStorage(app);
      if (connectStorageEmulator) {
        connectStorageEmulator(storage, "localhost", 9199);
      }
    } catch (e) {
      storage = null;
    }
  }

  return { auth, firestore, storage };
}

/**
 * Clear emulator data helpers for tests.
 * - If running with @firebase/rules-unit-testing or REST admin endpoints, call appropriate clear methods.
 * - Falls back to deleting all documents in known collections (best-effort, safe for tests).
 */
export async function clearEmulatorData(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    const r = require("@firebase/rules-unit-testing");
    if (r && typeof r.clearFirestoreData === "function") {
      await r.clearFirestoreData({ projectId: process.env.FIREBASE_PROJECT_ID || "demo-project" });
      return;
    }
  } catch (e) {
    // ignore - not available in this environment
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    const { getFirestore, collection, getDocs, deleteDoc, doc } = require("firebase/firestore");
    const db = getFirestore();
    // Best-effort: enumerate top-level collections and delete documents
    // Note: This is intentionally conservative for test environments only.
    const topCollections = ["organizations", "tras", "users", "projects", "projectAudits"];
    for (const col of topCollections) {
      try {
        const q = collection(db, col);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const snaps = await getDocs(q);
        for (const s of snaps.docs || []) {
          await deleteDoc(doc(db, `${col}/${s.id}`));
        }
      } catch (e) {
        // ignore per-collection failures in tests
      }
    }
  } catch (e) {
    // last-resort noop
  }
}

/**
 * Convenience getters for tests
 */
export function isEmulatorMode(): boolean {
  return !!(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

export function getEmulatorAuth() {
  const services = initializeEmulatorApp();
  return services.auth;
}

export function getEmulatorFirestore() {
  const services = initializeEmulatorApp();
  return services.firestore;
}

export function getEmulatorStorage() {
  const services = initializeEmulatorApp();
  return (services && services.storage) || null;
}

export function connectFirestoreEmulatorSafe(db: any, host: string, port: number) {
  if (typeof connectFirestoreEmulator === "function") {
    try {
      return connectFirestoreEmulator(db, host, port);
    } catch {
      return;
    }
  }
  // no-op fallback in Jest / test environments
  return;
}

export default {
  initializeEmulatorApp,
  clearEmulatorData,
  isEmulatorMode,
  getEmulatorAuth,
  getEmulatorFirestore,
  getEmulatorStorage,
  connectFirestoreEmulator: connectFirestoreEmulatorSafe,
};
