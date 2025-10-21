import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { SubmitTRASchema } from "@/lib/validators/tra";
import { writeAuditLog } from "@/lib/audit";

// POST /api/tras/:traId/submit
export async function POST(request: Request, { params }: { params: Promise<{ traId: string }> }) {
  const { traId } = await params;

  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userName = (auth as any).displayName || (auth as any).email || "unknown";

  const body = await request.json().catch(() => ({}));
  const parse = SubmitTRASchema.safeParse({ traId: traId, comments: body.comments });
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const traRef = db.collection(`organizations/${orgId}/tras`).doc(traId);
  const traSnap = await traRef.get();
  if (!traSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tra = traSnap.data() as any;

  // Basic readiness check
  if (tra.status !== "draft" && tra.status !== "rejected") {
    return NextResponse.json({ error: "TRA not in a submittable state" }, { status: 409 });
  }

  // Initialize workflow if missing
  let workflow = tra.approvalWorkflow;
  if (!workflow) {
    // default single-step workflow requiring safety_manager
    workflow = {
      steps: [
        {
          stepNumber: 1,
          name: "Safety manager approval",
          requiredRole: "safety_manager",
          approvers: [],
          status: "pending",
        },
      ],
      currentStep: 0,
    };
  } else {
    // ensure step statuses reset when (re)submitting
    workflow.steps = workflow.steps.map((s: any) => ({
      ...s,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      comments: null,
    }));
    workflow.currentStep = 0;
    workflow.completedAt = null;
  }

  const now = new Date();
  const update: any = {
    status: "submitted",
    approvalWorkflow: workflow,
    submittedBy: userId,
    submittedByName: userName,
    submittedAt: now,
    updatedAt: now,
  };

  await traRef.update(update);
  await writeAuditLog(orgId, traId, userId, "tra.submit", {
    comments: body.comments || null,
  });

  const updated = await traRef.get();
  return NextResponse.json({ item: updated.data() }, { status: 200 });
}
