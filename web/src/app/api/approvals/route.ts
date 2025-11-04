import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import type { ApprovalRequest } from "@/types/approval";

/**
 * GET /api/approvals
 * List approval requests for the current user's organization
 * Filters by user role to show only relevant approvals
 */
export async function GET(request: Request) {
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userRole = (auth as any).role || "field_worker";

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected, cancelled
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    let query = db.collection(`organizations/${orgId}/approvals`);

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status) as any;
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc") as any;

    const snapshot = await query.get();
    let approvals: ApprovalRequest[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ApprovalRequest[];

    // Filter approvals based on user role and assignment
    if (assignedToMe) {
      approvals = approvals.filter((approval) => {
        const currentStep = approval.steps[approval.currentStep - 1];
        if (!currentStep) return false;

        // Check if user has permission for current step
        return (
          userRole === "admin" ||
          userRole === currentStep.approverRole ||
          currentStep.approverId === userId
        );
      });
    }

    return NextResponse.json(approvals, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/approvals error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}