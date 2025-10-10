import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";

// POST /api/tras/:traId/signature
const SignatureSchema = z.object({
  traId: z.string().min(1),
  stepNumber: z.number().int().nonnegative(),
  signatureBase64: z.string().min(100), // basic sanity check
  name: z.string().min(1),
  reason: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: { traId: string } }) {
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;
  const userName = (auth as any).displayName || auth.email || "unknown";

  const body = await request.json().catch(() => ({}));
  const parse = SignatureSchema.safeParse({ traId: params.traId, ...body });
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parse.error.flatten() },
      { status: 400 }
    );
  }
  const data = parse.data;

  const traRef = db.collection(`organizations/${orgId}/tras`).doc(params.traId);
  const traSnap = await traRef.get();
  if (!traSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tra = traSnap.data() as any;

  const workflow = tra.approvalWorkflow as any;
  if (!workflow || !Array.isArray(workflow.steps) || workflow.steps.length <= data.stepNumber) {
    return NextResponse.json({ error: "Approval step not found" }, { status: 422 });
  }

  // Permission: only approvers for that step or admin can attach signature
  const step = workflow.steps[data.stepNumber];
  const hasPermission =
    (Array.isArray(step.approvers) && step.approvers.includes(userId)) ||
    (auth as any).role === "admin" ||
    (auth as any).role === step.requiredRole;

  if (!hasPermission) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();

  // Store signature (base64) directly in step.digitalSignature with metadata (redacted in audits)
  workflow.steps[data.stepNumber] = {
    ...step,
    digitalSignature: {
      data: data.signatureBase64,
      capturedBy: userId,
      capturedByName: data.name || userName,
      capturedAt: now,
      reason: data.reason || null,
    },
    // do not change approval status here; signature capture is a record
  };

  await traRef.update({ approvalWorkflow: workflow, updatedAt: now });

  await writeAuditLog(orgId, params.traId, userId, "approval.signature.create", {
    stepNumber: data.stepNumber,
    capturedBy: userId,
    capturedByName: data.name || userName,
    reason: data.reason || null,
    signatureStored: true,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
