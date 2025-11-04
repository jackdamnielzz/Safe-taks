import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";
import type { ApprovalRequest, ApprovalAction } from "@/types/approval";
import {
  sendTraApprovalRequest,
  sendTraApprovedNotification,
  sendTraRejectedNotification,
} from "@/lib/notifications/notification-service";

/**
 * GET /api/approvals/[approvalId]
 * Get a specific approval request
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  const { approvalId } = await params;
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;

  try {
    const approvalRef = db.collection(`organizations/${orgId}/approvals`).doc(approvalId);
    const approvalSnap = await approvalRef.get();

    if (!approvalSnap.exists) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    const approval: ApprovalRequest = {
      id: approvalSnap.id,
      ...approvalSnap.data(),
    } as ApprovalRequest;

    return NextResponse.json(approval, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/approvals/[approvalId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/approvals/[approvalId]
 * Process an approval action (approve, reject, request_changes)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  const { approvalId } = await params;
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userName = (auth as any).displayName || (auth as any).email || "unknown";
  const userRole = (auth as any).role || "field_worker";

  let body: Partial<ApprovalAction>;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.action || !["approve", "reject", "request_changes"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const approvalRef = db.collection(`organizations/${orgId}/approvals`).doc(approvalId);
    const approvalSnap = await approvalRef.get();

    if (!approvalSnap.exists) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    const approval = approvalSnap.data() as ApprovalRequest;

    // Check if approval is still pending
    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: `Approval already ${approval.status}` },
        { status: 409 }
      );
    }

    // Get current step
    const currentStep = approval.steps.find((s) => s.step === approval.currentStep);
    if (!currentStep) {
      return NextResponse.json({ error: "Invalid approval state" }, { status: 500 });
    }

    // Check permissions
    const hasPermission =
      userRole === "admin" ||
      userRole === currentStep.approverRole ||
      currentStep.approverId === userId;

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to approve this step" },
        { status: 403 }
      );
    }

    const now = Date.now();
    const updatedSteps = [...approval.steps];
    const stepIndex = updatedSteps.findIndex((s) => s.step === approval.currentStep);

    // Update current step based on action
    if (body.action === "approve") {
      updatedSteps[stepIndex] = {
        ...currentStep,
        status: "approved",
        decidedAt: now,
        decidedBy: userId,
        comments: body.comments || null,
      };

      // Move to next step or complete
      const nextStep = approval.currentStep + 1;
      const isComplete = nextStep > approval.steps.length;

      const update: Partial<ApprovalRequest> = {
        steps: updatedSteps,
        currentStep: isComplete ? approval.currentStep : nextStep,
        status: isComplete ? "approved" : "pending",
        updatedAt: now,
      };

      await approvalRef.update(update);

      // Update TRA status
      const traRef = db.collection(`organizations/${orgId}/tras`).doc(approval.traId);
      await traRef.update({
        status: isComplete ? "approved" : "in_review",
        approvalWorkflow: {
          approvalId,
          currentStep: isComplete ? approval.currentStep : nextStep - 1,
          steps: updatedSteps,
          completedAt: isComplete ? now : null,
        },
        updatedAt: new Date(now),
      });

      await writeAuditLog(orgId, approval.traId, userId, "approval.step.approved", {
        approvalId,
        step: approval.currentStep,
        comments: body.comments,
      });

      // Send email notifications
      try {
        const traSnap = await db.collection(`organizations/${orgId}/tras`).doc(approval.traId).get();
        const tra = traSnap.data();
        
        if (isComplete) {
          // Notify TRA creator that TRA is approved
          if (tra?.createdBy) {
            const creatorSnap = await db.collection(`organizations/${orgId}/users`).doc(tra.createdBy).get();
            const creator = creatorSnap.data();
            if (creator?.email) {
              await sendTraApprovedNotification(creator.email, {
                traTitle: tra.title || 'TRA',
                approverName: userName,
                traLink: `${process.env.NEXT_PUBLIC_APP_URL}/tras/${approval.traId}`,
              });
            }
          }
        } else {
          // Notify next approver
          const nextStepData = updatedSteps[nextStep - 1];
          if (nextStepData?.approverId) {
            const approverSnap = await db.collection(`organizations/${orgId}/users`).doc(nextStepData.approverId).get();
            const approver = approverSnap.data();
            if (approver?.email) {
              await sendTraApprovalRequest(approver.email, {
                traTitle: tra?.title || 'TRA',
                creatorName: userName,
                projectName: tra?.projectName || 'Project',
                approvalLink: `${process.env.NEXT_PUBLIC_APP_URL}/approvals/${approvalId}`,
              });
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send approval email notification:', emailError);
        // Don't fail the approval if email fails
      }
    } else if (body.action === "reject") {
      updatedSteps[stepIndex] = {
        ...currentStep,
        status: "rejected",
        decidedAt: now,
        decidedBy: userId,
        comments: body.comments || null,
      };

      const update: Partial<ApprovalRequest> = {
        steps: updatedSteps,
        status: "rejected",
        updatedAt: now,
      };

      await approvalRef.update(update);

      // Update TRA status to rejected
      const traRef = db.collection(`organizations/${orgId}/tras`).doc(approval.traId);
      await traRef.update({
        status: "rejected",
        approvalWorkflow: {
          approvalId,
          currentStep: approval.currentStep - 1,
          steps: updatedSteps,
          rejectedAt: now,
          rejectedBy: userId,
        },
        updatedAt: new Date(now),
      });

      await writeAuditLog(orgId, approval.traId, userId, "approval.step.rejected", {
        approvalId,
        step: approval.currentStep,
        comments: body.comments,
      });

      // Send rejection notification to TRA creator
      try {
        const traSnap = await db.collection(`organizations/${orgId}/tras`).doc(approval.traId).get();
        const tra = traSnap.data();
        
        if (tra?.createdBy) {
          const creatorSnap = await db.collection(`organizations/${orgId}/users`).doc(tra.createdBy).get();
          const creator = creatorSnap.data();
          if (creator?.email) {
            await sendTraRejectedNotification(creator.email, {
              traTitle: tra.title || 'TRA',
              rejectorName: userName,
              reason: body.comments || 'Geen reden opgegeven',
              traLink: `${process.env.NEXT_PUBLIC_APP_URL}/tras/${approval.traId}`,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send rejection email notification:', emailError);
        // Don't fail the rejection if email fails
      }
    } else if (body.action === "request_changes") {
      updatedSteps[stepIndex] = {
        ...currentStep,
        status: "pending",
        comments: body.comments || null,
      };

      await approvalRef.update({
        steps: updatedSteps,
        updatedAt: now,
      });

      await writeAuditLog(orgId, approval.traId, userId, "approval.changes_requested", {
        approvalId,
        step: approval.currentStep,
        comments: body.comments,
      });

      // Send changes requested notification to TRA creator
      try {
        const traSnap = await db.collection(`organizations/${orgId}/tras`).doc(approval.traId).get();
        const tra = traSnap.data();
        
        if (tra?.createdBy) {
          const creatorSnap = await db.collection(`organizations/${orgId}/users`).doc(tra.createdBy).get();
          const creator = creatorSnap.data();
          if (creator?.email) {
            // Use rejection template for changes requested (similar notification)
            await sendTraRejectedNotification(creator.email, {
              traTitle: tra.title || 'TRA',
              rejectorName: userName,
              reason: `Wijzigingen gevraagd: ${body.comments || 'Zie opmerkingen'}`,
              traLink: `${process.env.NEXT_PUBLIC_APP_URL}/tras/${approval.traId}`,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send changes requested email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Fetch updated approval
    const updatedSnap = await approvalRef.get();
    const updatedApproval: ApprovalRequest = {
      id: updatedSnap.id,
      ...updatedSnap.data(),
    } as ApprovalRequest;

    return NextResponse.json(updatedApproval, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/approvals/[approvalId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}