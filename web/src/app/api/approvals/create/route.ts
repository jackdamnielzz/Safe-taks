import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import type { CreateApprovalPayload, ApprovalRequest, ApprovalStep } from "@/types/approval";
import { writeAuditLog } from "@/lib/audit";
import { sendTraApprovalRequest } from "@/lib/notifications/notification-service";

/**
 * POST /api/approvals/create
 * Creates an approval workflow for a TRA by attaching it to the TRA document
 * under organizations/{orgId}/tras/{traId}. Also stores a central approvals doc.
 *
 * Expected payload: CreateApprovalPayload
 */

export async function POST(request: Request) {
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userName = (auth as any).displayName || "unknown";

  let body: CreateApprovalPayload;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || !body.traId || !Array.isArray(body.steps) || body.steps.length === 0) {
    return NextResponse.json({ error: "Invalid payload - traId and steps required" }, { status: 400 });
  }

  const traId = body.traId;

  try {
    // ensure TRA exists
    const traRef = db.collection(`organizations/${orgId}/tras`).doc(traId);
    const traSnap = await traRef.get();
    if (!traSnap.exists) {
      return NextResponse.json({ error: "TRA not found" }, { status: 404 });
    }

    const now = Date.now();

    // normalize steps into ApprovalStep shape
    const stepsNormalized: ApprovalStep[] = body.steps.map((s, idx) => ({
      step: idx + 1,
      name: s.name || `Step ${idx + 1}`,
      approverRole: s.approverRole || "safety_manager",
      approverId: s.approverId ?? null,
      dueDate: s.dueDate ?? null,
      status: "pending",
      decidedAt: null,
      decidedBy: null,
      comments: null,
    }));

    // Create approval request object
    const approvalId = db.collection(`organizations/${orgId}/approvals`).doc().id;
    const approval: ApprovalRequest = {
      id: approvalId,
      traId,
      templateId: null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      currentStep: 1,
      steps: stepsNormalized,
      status: "pending",
      notificationsSent: [],
      metadata: { createdByName: userName, ...body.metadata },
    };

    // Write central approvals collection
    const centralRef = db.collection(`organizations/${orgId}/approvals`).doc(approvalId);
    await centralRef.set(approval);

    // Attach to TRA as approvalWorkflow (simple embedded)
    const workflow = {
      approvalId,
      currentStep: 0, // 0-based index; UI/handlers may use currentStep number differently
      steps: stepsNormalized.map((s) => ({ ...s, status: "pending" })),
      createdAt: now,
      createdBy: userId,
    };

    await traRef.update({
      approvalWorkflow: workflow,
      updatedAt: now,
    });

    await writeAuditLog(orgId, traId, userId, "approval.create", {
      approvalId,
      steps: stepsNormalized.length,
    });

    // Send email notification to first approver
    try {
      const firstStep = stepsNormalized[0];
      if (firstStep?.approverId) {
        const approverSnap = await db.collection(`organizations/${orgId}/users`).doc(firstStep.approverId).get();
        const approver = approverSnap.data();
        const tra = traSnap.data();
        
        if (approver?.email) {
          await sendTraApprovalRequest(approver.email, {
            traTitle: tra?.title || 'TRA',
            creatorName: userName,
            projectName: tra?.projectName || 'Project',
            approvalLink: `${process.env.NEXT_PUBLIC_APP_URL}/approvals/${approvalId}`,
            dueDate: firstStep.dueDate ? new Date(firstStep.dueDate).toLocaleDateString('nl-NL') : undefined,
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send approval request email:', emailError);
      // Don't fail the approval creation if email fails
    }

    return NextResponse.json({ approvalId, item: approval }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/approvals/create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
