import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * GET /api/stop-work
 * List stop-work alerts for the organization
 * Query params:
 * - status: filter by status (active, acknowledged, resolved)
 * - lmraId: filter by LMRA ID
 */
export async function GET(request: Request) {
  try {
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const lmraIdFilter = searchParams.get("lmraId");

    // Build query
    let query = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("stopWorkAlerts")
      .orderBy("triggeredAt", "desc");

    // Apply filters
    if (statusFilter) {
      query = query.where("status", "==", statusFilter) as any;
    }
    if (lmraIdFilter) {
      query = query.where("lmraId", "==", lmraIdFilter) as any;
    }

    // Execute query
    const snapshot = await query.get();

    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    console.error("Error fetching stop-work alerts:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
