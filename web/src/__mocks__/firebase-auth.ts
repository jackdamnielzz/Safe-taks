/**
 * Lightweight mock for firebase/auth used in tests.
 * Exports commonly used functions so tests don't make real network calls.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Global auth instance that can be accessed across tests
let globalAuthInstance: any = null;

export function getAuth() {
  if (!globalAuthInstance) {
    globalAuthInstance = {
      currentUser: null,
    };
  }
  return globalAuthInstance;
}

export const __mockUsers: Record<string, any> = {};

// Helper to reset mock state between tests
export function __resetAuthMock() {
  Object.keys(__mockUsers).forEach((key) => delete __mockUsers[key]);
  if (globalAuthInstance) {
    globalAuthInstance.currentUser = null;
  }
}

// Expose a getter so tests can inspect the in-memory users map without mutating it.
export function __getUsers() {
  return __mockUsers;
}

export async function createUserWithEmailAndPassword(auth: any, email: string, password: string) {
  // Basic password policy for tests: at least 6 chars
  if (!password || password.length < 6) {
    return Promise.reject(new Error("auth/weak-password"));
  }
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return Promise.reject(new Error("auth/invalid-email"));
  }
  if (__mockUsers[email]) {
    return Promise.reject(new Error("auth/email-already-in-use"));
  }

  // Create a more complete user object that matches Firebase User interface
  const user = {
    uid: `uid-${Math.random().toString(36).slice(2, 9)}`,
    email,
    emailVerified: false,
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [
      {
        providerId: "password",
        uid: email,
        displayName: null,
        email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    refreshToken: "mock-refresh-token",
    tenantId: null,
  };

  __mockUsers[email] = { password, user };
  if (auth) auth.currentUser = user;
  return Promise.resolve({ user });
}

export async function signInWithEmailAndPassword(auth: any, email: string, password: string) {
  const record = __mockUsers[email];
  if (!record) {
    return Promise.reject(new Error("auth/user-not-found"));
  }
  if (record.password !== password) {
    return Promise.reject(new Error("auth/wrong-password"));
  }
  const user = record.user;
  // Update last sign in time
  if (user.metadata) {
    user.metadata.lastSignInTime = new Date().toISOString();
  }
  if (auth) auth.currentUser = user;
  return Promise.resolve({ user });
}

export async function signOut(auth: any) {
  if (auth) auth.currentUser = null;
  return Promise.resolve();
}

export async function updateProfile(
  user: any,
  { displayName, photoURL }: { displayName?: string; photoURL?: string }
) {
  if (!user) return Promise.reject(new Error("auth/no-current-user"));
  // Find mock user by uid
  const record = Object.values(__mockUsers).find((r: any) => r.user.uid === user.uid);
  if (!record) return Promise.reject(new Error("auth/user-not-found"));
  if (displayName !== undefined) record.user.displayName = displayName;
  if (photoURL !== undefined) record.user.photoURL = photoURL;
  return Promise.resolve();
}

export async function updatePassword(user: any, newPassword: string) {
  if (!user) return Promise.reject(new Error("auth/no-current-user"));
  const record = Object.values(__mockUsers).find((r: any) => r.user.uid === user.uid);
  if (!record) return Promise.reject(new Error("auth/user-not-found"));

  // Prefer emulator auth instance to determine signed-in status.
  // If emulator helper is not available, fall back to any auth object passed via getAuth().
  let isSignedIn = false;
  try {
    const emulator = require("../lib/firebase-emulator");
    if (emulator && typeof emulator.getEmulatorAuth === "function") {
      const emAuth = emulator.getEmulatorAuth();
      if (emAuth && emAuth.currentUser && emAuth.currentUser.uid === user.uid) {
        isSignedIn = true;
      }
    }
  } catch (e) {
    // ignore
  }

  if (!isSignedIn) {
    try {
      const { getAuth } = require("firebase/auth");
      const currentAuth = getAuth();
      if (currentAuth && currentAuth.currentUser && currentAuth.currentUser.uid === user.uid) {
        isSignedIn = true;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!isSignedIn) {
    // When user is not signed-in, reject as tests expect
    return Promise.reject(new Error("auth/requires-recent-login"));
  }

  if (!newPassword || newPassword.length < 6)
    return Promise.reject(new Error("auth/weak-password"));
  record.password = newPassword;
  return Promise.resolve();
}

export async function sendPasswordResetEmail(auth: any, email: string) {
  if (!__mockUsers[email]) return Promise.reject(new Error("auth/user-not-found"));
  // In emulator this would send an email; here we just resolve
  return Promise.resolve();
}

export async function deleteUser(user: any) {
  if (!user) return Promise.reject(new Error("auth/no-current-user"));
  const entry = Object.entries(__mockUsers).find(([, r]: any) => r.user.uid === user.uid);
  if (!entry) return Promise.reject(new Error("auth/user-not-found"));
  delete __mockUsers[entry[0]];

  // Clear currentUser on global auth if it matches deleted user
  try {
    const { getAuth } = require("firebase/auth");
    const currentAuth = getAuth();
    if (currentAuth && currentAuth.currentUser && currentAuth.currentUser.uid === user.uid) {
      currentAuth.currentUser = null;
    }
  } catch (e) {
    // ignore
  }

  // Also try to clear emulator auth instance if available
  try {
    const emulator = require("../lib/firebase-emulator");
    if (emulator && typeof emulator.getEmulatorAuth === "function") {
      const emAuth = emulator.getEmulatorAuth();
      if (emAuth && emAuth.currentUser && emAuth.currentUser.uid === user.uid) {
        emAuth.currentUser = null;
      }
    }
  } catch (e) {
    // ignore if helper not available
  }

  // Fallback: clear any auth-like objects on global that reference the user
  try {
    const g: any = globalThis || (typeof global !== "undefined" ? global : {});
    for (const key of Object.keys(g)) {
      try {
        const val = (g as any)[key];
        if (
          val &&
          typeof val === "object" &&
          "currentUser" in val &&
          val.currentUser &&
          val.currentUser.uid === user.uid
        ) {
          val.currentUser = null;
        }
      } catch (e) {
        // ignore property access errors
      }
    }
  } catch (e) {
    // ignore global scan failures
  }

  return Promise.resolve();
}

export function onAuthStateChanged(auth: any, cb: any) {
  // Immediately call back with currentUser (null or existing)
  setImmediate(() => cb(auth?.currentUser || null));
  // Return unsubscribe
  return () => {};
}

export function connectAuthEmulator(auth: any, url: string) {
  // No-op mock for tests
  return;
}
