"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
  UserCredential,
  AuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";

/**
 * Enhanced AuthProvider with comprehensive Firebase Authentication support
 *
 * Features:
 * - Email/password authentication
 * - Google SSO authentication
 * - Password reset functionality
 * - Email verification
 * - User profile management
 * - Role-based access control with custom claims
 * - Comprehensive error handling
 */

// User role types matching the API authentication system
export type UserRole = "admin" | "safety_manager" | "supervisor" | "field_worker";

// User profile structure stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  profileComplete: boolean;
}

// Enhanced auth context with full functionality
type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; companyName: string }
  ) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Helper function to handle Firebase Auth errors
  const handleAuthError = (error: any): string => {
    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          return "Invalid email or password. Please try again.";
        case "auth/email-already-in-use":
          return "An account with this email already exists.";
        case "auth/weak-password":
          return "Password is too weak. Please choose a stronger password.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/user-disabled":
          return "This account has been disabled. Please contact support.";
        case "auth/too-many-requests":
          return "Too many failed attempts. Please try again later.";
        case "auth/network-request-failed":
          return "Network error. Please check your connection and try again.";
        case "auth/popup-closed-by-user":
          return "Sign-in cancelled. Please try again.";
        default:
          return error.message || "An unexpected error occurred. Please try again.";
      }
    }
    return error.message || "An unexpected error occurred. Please try again.";
  };

  // Load user profile from Firestore (users are stored under organizations)
  const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      // First, we need to find the user's organization by checking if they have custom claims
      // For now, we'll need to get the organizationId from the auth token or create a fallback method
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Get the user's ID token to access custom claims
        const idTokenResult = await currentUser.getIdTokenResult();
        const orgId = idTokenResult.claims["orgId"] as string;

        if (orgId) {
          // Access user profile under their organization
          const userDoc = await getDoc(doc(db, "organizations", orgId, "users", uid));
          if (userDoc.exists()) {
            return { ...userDoc.data(), uid } as UserProfile;
          }
        }
      }

      // Fallback: try to access as a global user profile (for backwards compatibility)
      try {
        const globalUserDoc = await getDoc(doc(db, "userProfiles", uid));
        if (globalUserDoc.exists()) {
          return { ...globalUserDoc.data(), uid } as UserProfile;
        }
      } catch (fallbackError) {
        console.warn("Global user profile not found, this is expected in multi-tenant setup");
      }

      return null;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (
    user: User,
    userData: { firstName: string; lastName: string; companyName: string }
  ): Promise<UserProfile> => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      firstName: userData.firstName,
      lastName: userData.lastName,
      organizationId: "", // Will be set during organization creation
      role: "admin", // First user becomes admin, others assigned by admin
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: user.emailVerified,
      profileComplete: false,
    };

    // Try to create in organization-specific location first, fallback to global
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        const orgId = idTokenResult.claims["orgId"] as string;

        if (orgId) {
          await setDoc(doc(db, "organizations", orgId, "users", user.uid), profile);
          return profile;
        }
      }
    } catch (orgError) {
      console.warn("Could not access organization context for profile creation");
    }

    // Fallback: create in global user profiles collection
    await setDoc(doc(db, "userProfiles", user.uid), profile);
    return profile;
  };

  // Update last login timestamp
  const updateLastLogin = async (uid: string) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        const orgId = idTokenResult.claims["orgId"] as string;

        if (orgId) {
          // Update in organization-specific location
          await setDoc(
            doc(db, "organizations", orgId, "users", uid),
            { lastLoginAt: new Date() },
            { merge: true }
          );
          return;
        }
      }

      // Fallback: update in global user profiles collection
      await setDoc(doc(db, "userProfiles", uid), { lastLoginAt: new Date() }, { merge: true });
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u: User | null) => {
      // Skip updates if we're in the middle of logging out
      if (isLoggingOut) {
        console.log("🔓 onAuthStateChanged: Skipping update during logout");
        return;
      }

      setUser(u);

      if (u) {
        // Load user profile
        const profile = await loadUserProfile(u.uid);
        setUserProfile(profile);

        // Update last login if profile exists
        if (profile) {
          await updateLastLogin(u.uid);
        }
      } else {
        setUserProfile(null);

        // Ensure auth cookie is cleared when there is no Firebase user
        if (typeof document !== "undefined") {
          document.cookie =
            "auth_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
          console.log("🔐 AuthProvider: Cleared auth_verified cookie because user is null");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggingOut]);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      console.log("🔐 AuthProvider.signIn called with email:", email);
      setError(null);
      setLoading(true);
      
      console.log("🔐 Checking Firebase auth availability...");
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }
      
      console.log("🔐 Calling Firebase signInWithEmailAndPassword...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase signInWithEmailAndPassword successful");
      
      // Extra beveiliging: blokkeer email/password logins zolang email niet is geverifieerd
      // (Google SSO blijft gewoon werken).
      const user = result.user;
      const usesPasswordProvider = user.providerData.some((p) => p.providerId === "password");
      
      if (usesPasswordProvider && !user.emailVerified) {
        console.log("❌ Email not verified for password-based sign-in, blocking login");
        
        // Zorg dat er geen auth-cookie achterblijft
        if (typeof document !== "undefined") {
          document.cookie =
            "auth_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
          console.log("🔐 Cleared auth_verified cookie because email is not verified");
        }
        
        // Firebase session direct beëindigen
        await signOut(auth);
        
        // Duidelijke foutmelding richting UI
        throw new Error(
          "Please verify your email via the link we sent you before signing in."
        );
      }
      
      // Set a simple auth flag cookie for middleware (development-friendly)
      console.log("🔐 Setting auth cookie...");
      if (typeof document !== 'undefined') {
        // Set a simple cookie that middleware can read
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14); // 14 days
        document.cookie = `auth_verified=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
        console.log("✅ Auth cookie set");
      }
      
      return result;
    } catch (error: any) {
      console.error("❌ AuthProvider.signIn error:", error);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error message:", error?.message);
      
      const errorMessage = handleAuthError(error);
      console.error("❌ Formatted error message:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      console.log("🔐 AuthProvider.signIn finally block - setting loading to false");
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; companyName: string }
  ): Promise<UserCredential> => {
    try {
      setError(null);
      setLoading(true);

      // Create Firebase Auth user (this will sign the user in temporarily)
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification with a nice in-app confirmation redirect
      try {
        if (typeof window !== "undefined") {
          const actionCodeSettings = {
            url: `${window.location.origin}/auth/email-verified`,
            handleCodeInApp: false,
          };
          await sendEmailVerification(result.user, actionCodeSettings);
        } else {
          await sendEmailVerification(result.user);
        }
      } catch (verificationError) {
        console.error("Error sending verification email during sign up:", verificationError);
        throw verificationError;
      }

      // Create user profile in Firestore
      const profile = await createUserProfile(result.user, userData);
      setUserProfile(profile);

      // Immediately sign the user out again so registration does NOT equal "logged in"
      try {
        // Clear local auth state
        setUser(null);
        setUserProfile(null);

        // Clear auth cookie used by middleware, so new users are treated as logged out
        if (typeof document !== "undefined") {
          document.cookie =
            "auth_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
        }

        // Sign out from Firebase to drop the client session
        await signOut(auth);
      } catch (signOutError) {
        console.warn("SignUp: error while signing user out after registration:", signOutError);
      }

      // We still return the created user credential (for logging/analytics),
      // but from de gebruikers-perspectief is hij nu uitgelogd en moet hij
      // expliciet inloggen via /auth/login.
      return result;
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      // Set a simple auth flag cookie for middleware
      console.log("🔐 Setting auth cookie for Google sign-in...");
      if (typeof document !== 'undefined') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);
        document.cookie = `auth_verified=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
        console.log("✅ Auth cookie set");
      }

      // Check if user profile exists, create if not
      let profile = await loadUserProfile(result.user.uid);
      if (!profile) {
        // Extract name from Google profile
        const displayName = result.user.displayName || "";
        const [firstName = "", lastName = ""] = displayName.split(" ");

        profile = await createUserProfile(result.user, {
          firstName,
          lastName,
          companyName: "", // Will be filled during onboarding
        });
        setUserProfile(profile);
      }

      return result;
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!user) {
      throw new Error("No user signed in");
    }

    try {
      setError(null);
      // Resend verification email with the same in-app confirmation redirect
      if (typeof window !== "undefined") {
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/email-verified`,
          handleCodeInApp: false,
        };
        await sendEmailVerification(user, actionCodeSettings);
      } else {
        await sendEmailVerification(user);
      }
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error("No user signed in");
    }

    try {
      setError(null);

      const currentUser = auth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        const orgId = idTokenResult.claims["orgId"] as string;

        if (orgId) {
          // Update in organization-specific location
          await setDoc(doc(db, "organizations", orgId, "users", user.uid), updates, {
            merge: true,
          });
          setUserProfile({ ...userProfile, ...updates });
          return;
        }
      }

      // Fallback: update in global user profiles collection
      await setDoc(doc(db, "userProfiles", user.uid), updates, { merge: true });
      setUserProfile({ ...userProfile, ...updates });
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      console.log('🔓 SignOutUser: Starting...');
      setError(null);
      
      // Set logout flag FIRST to prevent onAuthStateChanged from re-loading user
      setIsLoggingOut(true);
      console.log('🔓 SignOutUser: Logout flag set');
      
      // Clear the state immediately
      setUser(null);
      setUserProfile(null);
      console.log('🔓 SignOutUser: State cleared');
      
      // Clear auth cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'auth_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        console.log('🔓 SignOutUser: Auth cookie cleared');
      }
      
      // Then sign out from Firebase
      await signOut(auth);
      console.log('🔓 SignOutUser: Firebase signOut complete');
      
      // Clear ALL Firebase persistence data
      if (typeof window !== 'undefined') {
        // Clear all localStorage items related to Firebase
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
              key.startsWith('firebase:') ||
              key.startsWith('firebaseui::') ||
              key.includes('firebase')
            )) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log(`🔓 SignOutUser: Cleared ${keysToRemove.length} localStorage items`);
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }

        // Clear all sessionStorage items related to Firebase
        try {
          const sessionKeysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (
              key.startsWith('firebase:') ||
              key.startsWith('firebaseui::') ||
              key.includes('firebase')
            )) {
              sessionKeysToRemove.push(key);
            }
          }
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
          console.log(`🔓 SignOutUser: Cleared ${sessionKeysToRemove.length} sessionStorage items`);
        } catch (e) {
          console.warn('Could not clear sessionStorage:', e);
        }

        // Clear Firebase Auth cookies
        try {
          // Firebase uses cookies with pattern: firebase:authUser:[projectId]:[base64]
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.split('=');
            const trimmedName = name.trim();
            if (trimmedName.startsWith('firebase:') || trimmedName.includes('firebase')) {
              // Set cookie to expire immediately
              document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
              document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
              console.log(`🔓 SignOutUser: Cleared cookie: ${trimmedName}`);
            }
          });
        } catch (e) {
          console.warn('Could not clear cookies:', e);
        }

        // Clear IndexedDB databases used by Firebase
        try {
          const databases = ['firebaseLocalStorageDb', 'firestore', 'firebase-installations-database'];
          for (const dbName of databases) {
            indexedDB.deleteDatabase(dbName);
          }
          console.log('🔓 SignOutUser: IndexedDB databases cleared');
        } catch (e) {
          console.warn('Could not clear IndexedDB:', e);
        }
      }
      
      console.log('🔓 SignOutUser: Complete!');
    } catch (error: any) {
      console.error('🔓 SignOutUser: Error occurred:', error);
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOutUser,
    resetPassword,
    resendVerificationEmail,
    updateUserProfile,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access auth context */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * ProtectedRoute wrapper (client-component)
 * Usage:
 *  <ProtectedRoute fallback={<SignIn />}>
 *     <YourProtectedApp />
 *  </ProtectedRoute>
 *
 * This provides a simple client-side guard; for stronger security ensure
 * server-side checks (cookies / session / custom tokens) are implemented.
 */
export function ProtectedRoute({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-slate-500">Loading auth…</div>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
