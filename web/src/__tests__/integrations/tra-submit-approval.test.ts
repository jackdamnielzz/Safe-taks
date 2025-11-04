/**
 * Integration test: submit TRA with createApproval=true
 * Verifies that an approval document is created and the TRA is updated with approvalId and status "in_review".
 *
 * Note: This test uses the firebase-admin mock configured in __mocks__/firebase-admin.js
 * and Next.js route handler invocation. Adjust mocks if necessary.
 */

import { POST } from "@/app/api/tras/[traId]/submit/route";
import { db } from "@/lib/firebase-admin";

jest.mock("@/lib/firebase-admin");

describe("TRA submit with approval creation", () => {
  beforeEach(async () => {
    // reset mock database
    (db as any).__reset && (db as any).__reset();
  });

  it("creates approval and links to TRA when createApproval=true", async () => {
    // Arrange: create a fake organization, TRA doc in the mocked db
    const orgId = "test-org";
    const traId = "tra-123";
    const userId = "user-1";

    // Seed a TRA document
    const traRef = db.collection(`organizations/${orgId}/tras`).doc(traId);
    await traRef.set({
      title: "Test TRA",
      status: "draft",
      approvalWorkflow: null,
      createdAt: new Date(),
    });

    // Mock requireOrgAuth to return auth - use mockImplementation to override the global mock
    const { requireOrgAuth } = require("@/lib/server-helpers");
    requireOrgAuth.mockImplementation(async () => ({ 
      orgId, 
      uid: userId, 
      displayName: "Test User", 
      email: "test@example.com" 
    }));

    // Create a fake request with body { comments, createApproval: true }
    const request = new Request(`https://example.com/api/tras/${traId}/submit`, {
      method: "POST",
      body: JSON.stringify({ comments: "Please review", createApproval: true }),
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const res = await POST(request, { params: Promise.resolve({ traId }) });
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json).toHaveProperty("item");
    const item = json.item;
    expect(item).toHaveProperty("approvalId");
    expect(item.status).toBe("in_review");

    // Check approval document exists
    const approvalsSnap = await db.collection(`organizations/${orgId}/approvals`).where("traId", "==", traId).get();
    expect(approvalsSnap.empty).toBe(false);
    const approvals = approvalsSnap.docs.map((d: any) => d.data());
    expect(approvals[0].status).toBe("pending");
    expect(approvals[0].requestedBy).toBe(userId);
  });
});
