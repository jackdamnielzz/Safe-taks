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
        const orgId = idTokenResult.claims['orgId'] as string;

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
        const orgId = idTokenResult.claims['orgId'] as string;

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
        const orgId = idTokenResult.claims['orgId'] as string;

        if (orgId) {
          // Update in organization-specific location
          await setDoc(doc(db, "organizations", orgId, "users", uid), { lastLoginAt: new Date() }, { merge: true });
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
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
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

      // Create Firebase Auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(result.user);

      // Create user profile in Firestore
      const profile = await createUserProfile(result.user, userData);
      setUserProfile(profile);

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
      await sendEmailVerification(user);
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
        const orgId = idTokenResult.claims['orgId'] as string;

        if (orgId) {
          // Update in organization-specific location
          await setDoc(doc(db, "organizations", orgId, "users", user.uid), updates, { merge: true });
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
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
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
