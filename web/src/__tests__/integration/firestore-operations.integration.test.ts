/**
 * Firestore Operations Integration Tests
 * Tests real Firestore operations using Firebase Emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { initializeEmulatorApp, clearEmulatorData } from "../../lib/firebase-emulator";

describe("Firestore Operations Integration Tests", () => {
  let db: ReturnType<typeof getFirestore>;
  const testOrgId = "test-org-123";
  const testUserId = "test-user-123";

  beforeAll(async () => {
    const services = initializeEmulatorApp();
    db = services.firestore;
  });

  beforeEach(async () => {
    await clearEmulatorData();
  });

  afterAll(async () => {
    await clearEmulatorData();
  });

  describe("Basic CRUD Operations", () => {
    it("should create a document", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      const traData = {
        title: "Test TRA",
        status: "draft",
        createdAt: Timestamp.now(),
        createdBy: testUserId,
      };

      await setDoc(traRef, traData);

      const snapshot = await getDoc(traRef);
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()?.title).toBe("Test TRA");
    });

    it("should read a document", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, {
        title: "Test TRA",
        status: "draft",
        createdAt: Timestamp.now(),
      });

      const snapshot = await getDoc(traRef);
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()?.status).toBe("draft");
    });

    it("should update a document", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, {
        title: "Test TRA",
        status: "draft",
        createdAt: Timestamp.now(),
      });

      await updateDoc(traRef, {
        status: "submitted",
        updatedAt: Timestamp.now(),
      });

      const snapshot = await getDoc(traRef);
      expect(snapshot.data()?.status).toBe("submitted");
    });

    it("should delete a document", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, {
        title: "Test TRA",
        status: "draft",
        createdAt: Timestamp.now(),
      });

      await deleteDoc(traRef);

      const snapshot = await getDoc(traRef);
      expect(snapshot.exists()).toBe(false);
    });
  });

  describe("Query Operations", () => {
    beforeEach(async () => {
      // Create test data
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      await setDoc(doc(trasRef, "tra-1"), {
        title: "TRA 1",
        status: "draft",
        riskScore: 50,
        createdAt: Timestamp.fromDate(new Date("2025-01-01")),
      });
      await setDoc(doc(trasRef, "tra-2"), {
        title: "TRA 2",
        status: "submitted",
        riskScore: 150,
        createdAt: Timestamp.fromDate(new Date("2025-01-02")),
      });
      await setDoc(doc(trasRef, "tra-3"), {
        title: "TRA 3",
        status: "approved",
        riskScore: 200,
        createdAt: Timestamp.fromDate(new Date("2025-01-03")),
      });
    });

    it("should query with where clause", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      const q = query(trasRef, where("status", "==", "submitted"));

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBe(1);
      expect(snapshot.docs[0].data().title).toBe("TRA 2");
    });

    it("should query with multiple where clauses", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      const q = query(
        trasRef,
        where("status", "in", ["draft", "submitted"]),
        where("riskScore", ">", 100)
      );

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBe(1);
      expect(snapshot.docs[0].data().title).toBe("TRA 2");
    });

    it("should query with orderBy", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      const q = query(trasRef, orderBy("riskScore", "desc"));

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBe(3);
      expect(snapshot.docs[0].data().riskScore).toBe(200);
      expect(snapshot.docs[1].data().riskScore).toBe(150);
      expect(snapshot.docs[2].data().riskScore).toBe(50);
    });

    it("should query with limit", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      const q = query(trasRef, orderBy("createdAt", "desc"), limit(2));

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBe(2);
      expect(snapshot.docs[0].data().title).toBe("TRA 3");
      expect(snapshot.docs[1].data().title).toBe("TRA 2");
    });
  });

  describe("Batch Operations", () => {
    it("should perform batch write", async () => {
      const batch = writeBatch(db);
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);

      batch.set(doc(trasRef, "tra-1"), {
        title: "TRA 1",
        status: "draft",
        createdAt: Timestamp.now(),
      });
      batch.set(doc(trasRef, "tra-2"), {
        title: "TRA 2",
        status: "draft",
        createdAt: Timestamp.now(),
      });
      batch.set(doc(trasRef, "tra-3"), {
        title: "TRA 3",
        status: "draft",
        createdAt: Timestamp.now(),
      });

      await batch.commit();

      const snapshot = await getDocs(trasRef);
      expect(snapshot.size).toBe(3);
    });

    it("should perform batch update", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      await setDoc(doc(trasRef, "tra-1"), { title: "TRA 1", status: "draft" });
      await setDoc(doc(trasRef, "tra-2"), { title: "TRA 2", status: "draft" });

      const batch = writeBatch(db);
      batch.update(doc(trasRef, "tra-1"), { status: "submitted" });
      batch.update(doc(trasRef, "tra-2"), { status: "submitted" });
      await batch.commit();

      const tra1 = await getDoc(doc(trasRef, "tra-1"));
      const tra2 = await getDoc(doc(trasRef, "tra-2"));
      expect(tra1.data()?.status).toBe("submitted");
      expect(tra2.data()?.status).toBe("submitted");
    });

    it("should perform batch delete", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      await setDoc(doc(trasRef, "tra-1"), { title: "TRA 1" });
      await setDoc(doc(trasRef, "tra-2"), { title: "TRA 2" });

      const batch = writeBatch(db);
      batch.delete(doc(trasRef, "tra-1"));
      batch.delete(doc(trasRef, "tra-2"));
      await batch.commit();

      const snapshot = await getDocs(trasRef);
      expect(snapshot.size).toBe(0);
    });
  });

  describe("Transaction Operations", () => {
    it("should perform transaction read and write", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, {
        title: "Test TRA",
        viewCount: 0,
      });

      await runTransaction(db, async (transaction) => {
        const traDoc = await transaction.get(traRef);
        const currentCount = traDoc.data()?.viewCount || 0;
        transaction.update(traRef, { viewCount: currentCount + 1 });
      });

      const snapshot = await getDoc(traRef);
      expect(snapshot.data()?.viewCount).toBe(1);
    });

    it("should rollback transaction on error", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, {
        title: "Test TRA",
        status: "draft",
      });

      try {
        await runTransaction(db, async (transaction) => {
          transaction.update(traRef, { status: "submitted" });
          throw new Error("Simulated error");
        });
      } catch (error) {
        // Expected error
      }

      const snapshot = await getDoc(traRef);
      expect(snapshot.data()?.status).toBe("draft"); // Should not be updated
    });
  });

  describe("Multi-tenant Isolation", () => {
    it("should isolate data between organizations", async () => {
      const org1Ref = doc(db, "organizations/org-1/tras/tra-1");
      const org2Ref = doc(db, "organizations/org-2/tras/tra-1");

      await setDoc(org1Ref, { title: "Org 1 TRA", orgId: "org-1" });
      await setDoc(org2Ref, { title: "Org 2 TRA", orgId: "org-2" });

      const org1Snapshot = await getDoc(org1Ref);
      const org2Snapshot = await getDoc(org2Ref);

      expect(org1Snapshot.data()?.title).toBe("Org 1 TRA");
      expect(org2Snapshot.data()?.title).toBe("Org 2 TRA");
      expect(org1Snapshot.data()?.orgId).not.toBe(org2Snapshot.data()?.orgId);
    });

    it("should query only organization-specific data", async () => {
      await setDoc(doc(db, "organizations/org-1/tras/tra-1"), {
        title: "Org 1 TRA 1",
      });
      await setDoc(doc(db, "organizations/org-1/tras/tra-2"), {
        title: "Org 1 TRA 2",
      });
      await setDoc(doc(db, "organizations/org-2/tras/tra-1"), {
        title: "Org 2 TRA 1",
      });

      const org1Snapshot = await getDocs(collection(db, "organizations/org-1/tras"));
      const org2Snapshot = await getDocs(collection(db, "organizations/org-2/tras"));

      expect(org1Snapshot.size).toBe(2);
      expect(org2Snapshot.size).toBe(1);
    });
  });

  describe("Subcollection Operations", () => {
    it("should create and query subcollections", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, { title: "Test TRA" });

      const commentsRef = collection(traRef, "comments");
      await setDoc(doc(commentsRef, "comment-1"), {
        text: "Comment 1",
        createdAt: Timestamp.now(),
      });
      await setDoc(doc(commentsRef, "comment-2"), {
        text: "Comment 2",
        createdAt: Timestamp.now(),
      });

      const snapshot = await getDocs(commentsRef);
      expect(snapshot.size).toBe(2);
    });

    it("should delete parent without affecting subcollections", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      await setDoc(traRef, { title: "Test TRA" });

      const commentsRef = collection(traRef, "comments");
      await setDoc(doc(commentsRef, "comment-1"), { text: "Comment 1" });

      await deleteDoc(traRef);

      const traSnapshot = await getDoc(traRef);
      expect(traSnapshot.exists()).toBe(false);

      // Subcollection still exists (Firestore behavior)
      const commentSnapshot = await getDoc(doc(commentsRef, "comment-1"));
      expect(commentSnapshot.exists()).toBe(true);
    });
  });

  describe("Timestamp Operations", () => {
    it("should handle Timestamp fields correctly", async () => {
      const traRef = doc(db, `organizations/${testOrgId}/tras/tra-1`);
      const now = Timestamp.now();

      await setDoc(traRef, {
        title: "Test TRA",
        createdAt: now,
        updatedAt: now,
      });

      const snapshot = await getDoc(traRef);
      const data = snapshot.data();

      expect(data?.createdAt).toBeInstanceOf(Timestamp);
      expect(data?.createdAt.toMillis()).toBeCloseTo(now.toMillis(), -2);
    });

    it("should query by timestamp range", async () => {
      const trasRef = collection(db, `organizations/${testOrgId}/tras`);
      const date1 = Timestamp.fromDate(new Date("2025-01-01"));
      const date2 = Timestamp.fromDate(new Date("2025-01-15"));
      const date3 = Timestamp.fromDate(new Date("2025-02-01"));

      await setDoc(doc(trasRef, "tra-1"), { title: "TRA 1", createdAt: date1 });
      await setDoc(doc(trasRef, "tra-2"), { title: "TRA 2", createdAt: date2 });
      await setDoc(doc(trasRef, "tra-3"), { title: "TRA 3", createdAt: date3 });

      const q = query(trasRef, where("createdAt", ">=", date1), where("createdAt", "<", date3));

      const snapshot = await getDocs(q);
      expect(snapshot.size).toBe(2);
    });
  });
});
