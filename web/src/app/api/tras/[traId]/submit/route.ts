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
      { error: "Ongeldige aanvraag", details: parse.error.flatten() },
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

  // If requested, create an approval record and link it to the TRA
  let approvalId: string | null = null;
  if (body.createApproval) {
    try {
      // Inline approval creation using same shape as /api/approvals/create
      const approvalRef = db.collection(`organizations/${orgId}/approvals`).doc();
      const approvalDoc = {
        traId,
        traTitle: tra.title || null,
        organizationId: orgId,
        requestedBy: userId,
        requestedByName: userName,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        workflow: workflow,
        comments: body.comments || null,
      };
      await approvalRef.set(approvalDoc);
      approvalId = approvalRef.id;

      // attach to TRA; set status to in_review when approval is created
      update.approvalId = approvalId;
      update.approvalWorkflow = workflow;
      update.status = "in_review";

      // placeholder: notify approvers (no external integration yet)
      try {
        // write a notification placeholder document
        const notifRef = db.collection(`organizations/${orgId}/notifications`).doc();
        await notifRef.set({
          type: "approval_requested",
          approvalId,
          traId,
          orgId,
          createdAt: now,
          read: false,
          meta: {
            requestedBy: userName,
          },
        });
      } catch (e) {
        // swallow notification failures but write audit log
        await writeAuditLog(orgId, traId, userId, "notification.placeholder_failed", {
          error: (e as any).message || String(e),
        });
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Fout bij het aanmaken van de goedkeuring", details: (e as any).message || null },
        { status: 500 }
      );
    }
  }

  await traRef.update(update);
  await writeAuditLog(orgId, traId, userId, "tra.submit", {
    comments: body.comments || null,
    approvalCreated: !!approvalId,
    approvalId: approvalId,
  });

  const updated = await traRef.get();
  const responseItem: any = updated.data();
  // Localize status message for client visibility if needed
  const message = body.createApproval
    ? "TRA is ingediend en in review geplaatst"
    : "TRA is ingediend";

  return NextResponse.json({ item: responseItem, message }, { status: 200 });
}
