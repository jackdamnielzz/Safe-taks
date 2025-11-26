import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * GET /api/lmras/[lmraId]
 * PUT /api/lmras/[lmraId]
 */
export async function GET(request: Request, context: any) {
  try {
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { params } = context;
    // Resolve lmraId robustly from params or URL fallback
    let lmraId = (params && params.lmraId) || null;
    if (!lmraId) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);
        const lmrasIndex = parts.indexOf("lmras");
        if (lmrasIndex !== -1 && parts.length > lmrasIndex + 1) {
          lmraId = parts[lmrasIndex + 1];
        } else {
          lmraId = parts[parts.length - 1];
        }
      } catch (e) {
        lmraId = null;
      }
    }
    console.log("[dev] Resolved lmraId:", lmraId);

    const docRef = firestore.collection("organizations").doc(orgId).collection("lmras").doc(lmraId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const user = await requireOrgAuth(request);
    const body = await request.json();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { params } = context;
    const { lmraId } = await params;

    const docRef = firestore.collection("organizations").doc(orgId).collection("lmras").doc(lmraId);
    const now = new Date();

    await docRef.update({
      ...body,
      updatedAt: now,
      updatedBy: user.uid,
    });

    const snap = await docRef.get();
    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
