import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * POST /api/lmras/create
 * Create a new LMRA document under the caller's organization.
 */
export async function POST(request: Request) {
  try {
    const user = await requireOrgAuth(request);
    const body = await request.json();

    const { firestore } = initializeAdmin();
    const orgId = user.orgId;

    const lmrasCol = firestore.collection("organizations").doc(orgId).collection("lmras");

    const now = new Date();
    const lmraDoc = {
      organizationId: orgId,
      projectId: body.projectId || null,
      traId: body.traId || null,
      status: body.status || "draft",
      currentStep: body.currentStep || 1,
      step1: body.initialStep || null,
      createdBy: user.uid,
      createdByName: (user as any).displayName ?? null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    const docRef = await lmrasCol.add(lmraDoc);
    const snap = await docRef.get();

    return NextResponse.json({ id: docRef.id, ...snap.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
