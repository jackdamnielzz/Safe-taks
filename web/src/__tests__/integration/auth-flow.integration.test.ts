/**
 * Authentication Flow Integration Tests
 * Tests Firebase Authentication operations using Firebase Emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore";
import { initializeEmulatorApp, clearEmulatorData } from "../../lib/firebase-emulator";

describe("Authentication Flow Integration Tests", () => {
  let auth: any;
  let db: any;

  beforeAll(async () => {
    const services = initializeEmulatorApp();
    auth = services.auth;
    db = services.firestore;
  });

  beforeEach(async () => {
    await clearEmulatorData();
    // Sign out any existing user
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  afterAll(async () => {
    await clearEmulatorData();
  });

  describe("User Registration", () => {
    it("should create a new user with email and password", async () => {
      const email = "test@example.com";
      const password = "TestPassword123!";

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(email);
      expect(userCredential.user.uid).toBeDefined();
    });

    it("should fail to create user with weak password", async () => {
      const email = "test@example.com";
      const password = "123"; // Too weak

      await expect(createUserWithEmailAndPassword(auth, email, password)).rejects.toThrow();
    });

    it("should fail to create duplicate user", async () => {
      const email = "test@example.com";
      const password = "TestPassword123!";

      await createUserWithEmailAndPassword(auth, email, password);

      await expect(createUserWithEmailAndPassword(auth, email, password)).rejects.toThrow();
    });

    it("should update user profile after registration", async () => {
      const email = "test@example.com";
      const password = "TestPassword123!";

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: "Test User",
      });

      expect(user.displayName).toBe("Test User");
    });
  });

  describe("User Login", () => {
    beforeEach(async () => {
      // Create a test user
      await createUserWithEmailAndPassword(auth, "test@example.com", "TestPassword123!");
      await signOut(auth);
    });

    it("should sign in with correct credentials", async () => {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        "test@example.com",
        "TestPassword123!"
      );

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe("test@example.com");
      expect(auth.currentUser).toBeDefined();
    });

    it("should fail to sign in with wrong password", async () => {
      await expect(
        signInWithEmailAndPassword(auth, "test@example.com", "WrongPassword123!")
      ).rejects.toThrow();
    });

    it("should fail to sign in with non-existent user", async () => {
      await expect(
        signInWithEmailAndPassword(auth, "nonexistent@example.com", "TestPassword123!")
      ).rejects.toThrow();
    });
  });

  describe("User Logout", () => {
    beforeEach(async () => {
      await createUserWithEmailAndPassword(auth, "test@example.com", "TestPassword123!");
    });

    it("should sign out successfully", async () => {
      expect(auth.currentUser).toBeDefined();

      await signOut(auth);

      expect(auth.currentUser).toBeNull();
    });
  });

  describe("Password Management", () => {
    let user: User;

    beforeEach(async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "test@example.com",
        "TestPassword123!"
      );
      user = userCredential.user;
    });

    it("should send password reset email", async () => {
      // In emulator, this won't actually send email but should succeed
      await expect(sendPasswordResetEmail(auth, "test@example.com")).resolves.not.toThrow();
    });

    it("should update password for authenticated user", async () => {
      const newPassword = "NewPassword123!";

      await updatePassword(user, newPassword);

      // Sign out and try to sign in with new password
      await signOut(auth);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        "test@example.com",
        newPassword
      );

      expect(userCredential.user).toBeDefined();
    });
  });

  describe("User Profile Management", () => {
    let user: User;

    beforeEach(async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "test@example.com",
        "TestPassword123!"
      );
      user = userCredential.user;
    });

    it("should update display name", async () => {
      await updateProfile(user, {
        displayName: "John Doe",
      });

      expect(user.displayName).toBe("John Doe");
    });

    it("should update photo URL", async () => {
      const photoURL = "https://example.com/photo.jpg";

      await updateProfile(user, {
        photoURL,
      });

      expect(user.photoURL).toBe(photoURL);
    });

    it("should update both display name and photo URL", async () => {
      await updateProfile(user, {
        displayName: "John Doe",
        photoURL: "https://example.com/photo.jpg",
      });

      expect(user.displayName).toBe("John Doe");
      expect(user.photoURL).toBe("https://example.com/photo.jpg");
    });
  });

  describe("User Deletion", () => {
    it("should delete user account", async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "test@example.com",
        "TestPassword123!"
      );
      const user = userCredential.user;

      await deleteUser(user);

      expect(auth.currentUser).toBeNull();

      // Should not be able to sign in with deleted account
      await expect(
        signInWithEmailAndPassword(auth, "test@example.com", "TestPassword123!")
      ).rejects.toThrow();
    });
  });

  describe("User Data Integration", () => {
    it("should create user profile in Firestore after registration", async () => {
      const email = "test@example.com";
      const userCredential = await createUserWithEmailAndPassword(auth, email, "TestPassword123!");
      const user = userCredential.user;

      // Create user profile in Firestore
      const userRef = doc(db, `organizations/test-org/users/${user.uid}`);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "",
        role: "field_worker",
        createdAt: new Date(),
      });

      const userDoc = await getDoc(userRef);
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(email);
    });

    it("should maintain user session across operations", async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "test@example.com",
        "TestPassword123!"
      );
      const userId = userCredential.user.uid;

      // Perform Firestore operation
      const docRef = doc(db, `organizations/test-org/tras/tra-1`);
      await setDoc(docRef, {
        title: "Test TRA",
        createdBy: userId,
      });

      // User should still be authenticated
      expect(auth.currentUser).toBeDefined();
      expect(auth.currentUser?.uid).toBe(userId);
    });
  });

  describe("Multi-user Scenarios", () => {
    it("should handle multiple user registrations", async () => {
      const user1 = await createUserWithEmailAndPassword(auth, "user1@example.com", "Password123!");
      await signOut(auth);

      const user2 = await createUserWithEmailAndPassword(auth, "user2@example.com", "Password123!");

      expect(user1.user.uid).not.toBe(user2.user.uid);
      expect(auth.currentUser?.uid).toBe(user2.user.uid);
    });

    it("should switch between users", async () => {
      await createUserWithEmailAndPassword(auth, "user1@example.com", "Password123!");
      const user1Id = auth.currentUser?.uid;
      await signOut(auth);

      await createUserWithEmailAndPassword(auth, "user2@example.com", "Password123!");
      await signOut(auth);

      // Sign in as user1
      await signInWithEmailAndPassword(auth, "user1@example.com", "Password123!");
      expect(auth.currentUser?.uid).toBe(user1Id);

      // Sign out and sign in as user2
      await signOut(auth);
      await signInWithEmailAndPassword(auth, "user2@example.com", "Password123!");
      expect(auth.currentUser?.uid).not.toBe(user1Id);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid email format", async () => {
      await expect(
        createUserWithEmailAndPassword(auth, "invalid-email", "Password123!")
      ).rejects.toThrow();
    });

    it("should handle empty password", async () => {
      await expect(createUserWithEmailAndPassword(auth, "test@example.com", "")).rejects.toThrow();
    });

    it("should handle operations on signed-out user", async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "test@example.com",
        "Password123!"
      );
      const user = userCredential.user;

      await signOut(auth);

      // Operations requiring authentication should fail
      await expect(updatePassword(user, "NewPassword123!")).rejects.toThrow();
    });
  });
});
