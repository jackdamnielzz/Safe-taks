import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * POST /api/lmras/[lmraId]/submit
 * Mark LMRA as submitted for review/approval.
 */
export async function POST(request: Request, { params }: { params: Promise<{ lmraId: string }> }) {
  try {
    const user = await requireOrgAuth(request);
    const body = await request.json();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { lmraId } = await params;

    const docRef = firestore.collection("organizations").doc(orgId).collection("lmras").doc(lmraId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const updatePayload: any = {
      status: "submitted",
      submittedAt: now,
      submittedBy: user.uid,
      updatedAt: now,
    };

    if (body.comments) {
      updatePayload.submissionComments = body.comments;
    }

    await docRef.update(updatePayload);

    const updatedSnap = await docRef.get();
    return NextResponse.json({ id: updatedSnap.id, ...updatedSnap.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
