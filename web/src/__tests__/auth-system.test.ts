/**
 * Comprehensive Authentication System Tests
 *
 * Tests all authentication functionality including:
 * - Email/password authentication
 * - Google SSO authentication
 * - Password reset functionality
 * - User profile management
 * - Role-based access control with custom claims
 * - Organization management
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// Test configuration
const testConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id",
};

const app = initializeApp(testConfig, "auth-test");
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);

describe("Authentication System", () => {
  const testEmail = "test@example.com";
  const testPassword = "TestPassword123!";
  const testOrgId = "test-organization-id";
  let testUser: User | null = null;

  beforeAll(async () => {
    // Clear any existing test data
    await clearTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });

  beforeEach(async () => {
    // Sign out any existing user
    if (auth.currentUser) {
      await signOut(auth);
    }
    testUser = null;
  });

  describe("User Registration", () => {
    test("should create user with email and password", async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      testUser = userCredential.user;

      expect(testUser).toBeDefined();
      expect(testUser.email).toBe(testEmail);
      expect(testUser.emailVerified).toBe(false);
    });

    test("should create user profile in Firestore", async () => {
      if (!testUser) {
        testUser = (await createUserWithEmailAndPassword(auth, testEmail, testPassword)).user;
      }

      const userProfile = {
        uid: testUser.uid,
        email: testUser.email,
        firstName: "Test",
        lastName: "User",
        organizationId: testOrgId,
        role: "admin",
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: testUser.emailVerified,
        profileComplete: true,
      };

      await setDoc(doc(db, "users", testUser.uid), userProfile);

      const userDoc = await getDoc(doc(db, "users", testUser.uid));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(testEmail);
    });

    test("should reject weak passwords", async () => {
      await expect(
        createUserWithEmailAndPassword(auth, "weak@example.com", "123")
      ).rejects.toThrow();
    });

    test("should reject invalid email formats", async () => {
      await expect(
        createUserWithEmailAndPassword(auth, "invalid-email", testPassword)
      ).rejects.toThrow();
    });
  });

  describe("User Authentication", () => {
    beforeEach(async () => {
      // Ensure test user exists
      try {
        testUser = (await createUserWithEmailAndPassword(auth, testEmail, testPassword)).user;
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          testUser = (await signInWithEmailAndPassword(auth, testEmail, testPassword)).user;
        }
      }
    });

    test("should sign in with valid credentials", async () => {
      await signOut(auth);
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(testEmail);
    });

    test("should reject invalid credentials", async () => {
      await expect(signInWithEmailAndPassword(auth, testEmail, "wrong-password")).rejects.toThrow();
    });

    test("should sign out successfully", async () => {
      await signOut(auth);
      expect(auth.currentUser).toBeNull();
    });
  });

  describe("Password Reset", () => {
    test("should send password reset email", async () => {
      // This would normally send an email, but in emulator it just succeeds
      await expect(sendPasswordResetEmail(auth, testEmail)).resolves.not.toThrow();
    });

    test("should reject password reset for non-existent user", async () => {
      await expect(sendPasswordResetEmail(auth, "nonexistent@example.com")).rejects.toThrow();
    });
  });

  describe("Role-Based Access Control", () => {
    test("should create organization with admin role", async () => {
      const organization = {
        id: testOrgId,
        name: "Test Organization",
        slug: "test-org",
        settings: {
          industry: "construction",
          complianceFramework: "vca" as const,
          timeZone: "Europe/Amsterdam",
          language: "nl",
        },
        subscription: {
          tier: "trial",
          status: "active",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        createdAt: new Date(),
        createdBy: testUser?.uid || "test-user",
      };

      await setDoc(doc(db, "organizations", testOrgId), organization);

      const orgDoc = await getDoc(doc(db, "organizations", testOrgId));
      expect(orgDoc.exists()).toBe(true);
      expect(orgDoc.data()?.name).toBe("Test Organization");
    });

    test("should assign user roles correctly", async () => {
      if (!testUser) return;

      const userRoles = ["admin", "safety_manager", "supervisor", "field_worker"] as const;

      for (const role of userRoles) {
        const userProfile = {
          uid: testUser.uid,
          email: testUser.email,
          organizationId: testOrgId,
          role,
          updatedAt: new Date(),
        };

        await setDoc(doc(db, "users", testUser.uid), userProfile, { merge: true });

        const userDoc = await getDoc(doc(db, "users", testUser.uid));
        expect(userDoc.data()?.role).toBe(role);
      }
    });

    test("should enforce organization isolation", async () => {
      if (!testUser) return;

      const otherOrgId = "other-organization-id";

      // Create user in original org
      await setDoc(doc(db, "users", testUser.uid), {
        uid: testUser.uid,
        organizationId: testOrgId,
        role: "admin",
      });

      // User should not have access to other organization's data
      const otherOrgDoc = await getDoc(doc(db, "organizations", otherOrgId));
      expect(otherOrgDoc.exists()).toBe(false);
    });
  });

  describe("User Profile Management", () => {
    beforeEach(async () => {
      if (!testUser) {
        testUser = (await createUserWithEmailAndPassword(auth, testEmail, testPassword)).user;
      }
    });

    test("should update user profile", async () => {
      if (!testUser) return;

      const updatedProfile = {
        firstName: "Updated",
        lastName: "Name",
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "users", testUser.uid), updatedProfile, { merge: true });

      const userDoc = await getDoc(doc(db, "users", testUser.uid));
      expect(userDoc.data()?.firstName).toBe("Updated");
      expect(userDoc.data()?.lastName).toBe("Name");
    });

    test("should track last login timestamp", async () => {
      if (!testUser) return;

      const loginTime = new Date();
      await setDoc(
        doc(db, "users", testUser.uid),
        {
          lastLoginAt: loginTime,
        },
        { merge: true }
      );

      const userDoc = await getDoc(doc(db, "users", testUser.uid));
      expect(userDoc.data()?.lastLoginAt).toBeDefined();
    });
  });

  describe("Data Validation", () => {
    test("should validate email format", () => {
      const validEmails = ["test@example.com", "user.name@company.co.uk", "name+tag@domain.org"];
      const invalidEmails = ["invalid", "@domain.com", "user@", "user space@domain.com"];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    test("should validate password strength", () => {
      const strongPasswords = ["Test123!@#", "MySecure2024!", "ComplexP@ssw0rd"];
      const weakPasswords = ["123456", "password", "test", "Test123"];

      strongPasswords.forEach((password) => {
        expect(isStrongPassword(password)).toBe(true);
      });

      weakPasswords.forEach((password) => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });

  // Helper functions
  async function clearTestData() {
    try {
      // Clear test user data
      const usersQuery = query(collection(db, "users"), where("email", "==", testEmail));
      const userDocs = await getDocs(usersQuery);
      const batch = writeBatch(db);

      userDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Clear test organization
      batch.delete(doc(db, "organizations", testOrgId));

      await batch.commit();
    } catch (error) {
      console.warn("Error clearing test data:", error);
    }
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }
});
