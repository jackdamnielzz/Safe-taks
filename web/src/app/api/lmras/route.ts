import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * GET /api/lmras
 * List LMRAs for the caller's organization with optional filtering by projectId.
 */
export async function GET(request: Request) {
  try {
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") || undefined;
    const status = url.searchParams.get("status") || undefined;

    let colRef = firestore.collection("organizations").doc(orgId).collection("lmras") as any;

    if (projectId) {
      colRef = colRef.where("projectId", "==", projectId);
    }
    if (status) {
      colRef = colRef.where("status", "==", status);
    }

    const snaps = await colRef.orderBy("createdAt", "desc").limit(100).get();

    const items: any[] = [];
    snaps.forEach((d: any) => items.push({ id: d.id, ...d.data() }));

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
