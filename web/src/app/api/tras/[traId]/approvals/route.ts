import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { ApprovalDecisionSchema } from "@/lib/validators/tra";
import { writeAuditLog } from "@/lib/audit";

// POST /api/tras/:traId/approvals
export async function POST(request: Request, { params }: { params: Promise<{ traId: string }> }) {
  const { traId } = await params;
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userName = (auth as any).displayName || "unknown";
  const userRole = (auth as any).role || "field_worker";

  const body = await request.json().catch(() => ({}));
  const parse = ApprovalDecisionSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parse.error.flatten() },
      { status: 400 }
    );
  }
  const data = parse.data;

  const traRef = db.collection(`organizations/${orgId}/tras`).doc(traId);
  const traSnap = await traRef.get();
  if (!traSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tra = traSnap.data() as any;

  const workflow = tra.approvalWorkflow as any;
  if (!workflow) {
    return NextResponse.json(
      { error: "No approval workflow configured for this TRA" },
      { status: 422 }
    );
  }

  // helper functions from types are not importable here in runtime easily; re-check permissions inline
  const getNextApprovalStep = (wf: any) => {
    if (typeof wf.currentStep !== "number") wf.currentStep = 0;
    if (wf.currentStep >= wf.steps.length) return null;
    return wf.steps[wf.currentStep];
  };

  const currentStep = getNextApprovalStep(workflow);
  if (!currentStep) {
    return NextResponse.json({ error: "All approval steps already completed" }, { status: 409 });
  }

  // Permission: user must be admin OR match requiredRole OR be explicitly listed as approver for the step
  const hasPermission =
    userRole === "admin" ||
    userRole === currentStep.requiredRole ||
    (Array.isArray(currentStep.approvers) && currentStep.approvers.includes(userId));

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Accept decision
  const now = new Date();
  const update: any = { updatedAt: now };

  if (data.decision === "approve") {
    workflow.steps[workflow.currentStep] = {
      ...currentStep,
      status: "approved",
      approvedBy: userId,
      approvedByName: userName,
      approvedAt: now,
      comments: data.comments || null,
      digitalSignature: data.digitalSignature || null,
    };

    workflow.currentStep = Math.min(workflow.currentStep + 1, workflow.steps.length);

    // If all steps done -> mark workflow completed and tra approved
    if (workflow.currentStep >= workflow.steps.length) {
      workflow.completedAt = now;
      update.status = "approved";
      update.approvedAt = now;
    } else {
      // still in review
      update.status = "in_review";
    }
  } else {
    // rejected
    workflow.steps[workflow.currentStep] = {
      ...currentStep,
      status: "rejected",
      rejectedBy: userId,
      rejectedByName: userName,
      rejectedAt: now,
      comments: data.comments || null,
    };

    // Move TRA back to 'rejected' status and leave currentStep as-is (or optionally reset)
    workflow.completedAt = null;
    update.status = "rejected";
    // keep currentStep pointing to rejected step so next actions are clear
  }

  update.approvalWorkflow = workflow;
  update.updatedAt = now;

  await traRef.update(update);
  await writeAuditLog(orgId, traId, userId, "approval.decision", {
    decision: data.decision,
    stepNumber: data.stepNumber,
    comments: data.comments || null,
    digitalSignature: data.digitalSignature ? "[redacted]" : null,
  });

  const updatedTraSnap = await traRef.get();
  return NextResponse.json({ item: updatedTraSnap.data() }, { status: 200 });
}
