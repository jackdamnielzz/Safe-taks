import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";

/**
 * POST /api/stop-work/[alertId]/acknowledge
 * Acknowledge a stop-work alert (supervisor action)
 */
export async function POST(request: Request, { params }: { params: { alertId: string } }) {
  try {
    const user = await requireOrgAuth(request);
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { alertId } = params;

    // Find the alert
    const alertRef = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("stopWorkAlerts")
      .doc(alertId);

    const alertSnap = await alertRef.get();
    if (!alertSnap.exists) {
      return NextResponse.json({ error: "Stop-work alert not found" }, { status: 404 });
    }

    const alertData = alertSnap.data();

    // Check if already acknowledged
    if (alertData?.status === "acknowledged" || alertData?.status === "resolved") {
      return NextResponse.json(
        { error: "Alert already acknowledged or resolved" },
        { status: 400 }
      );
    }

    // Update alert
    const now = new Date();
    await alertRef.update({
      status: "acknowledged",
      acknowledgedBy: user.uid,
      acknowledgedByName: "Supervisor", // TODO: Get actual name from user profile
      acknowledgedAt: now,
      updatedAt: now,
    });

    // Get updated data
    const updatedSnap = await alertRef.get();
    const updatedData = updatedSnap.data();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSnap.id,
        ...updatedData,
      },
    });
  } catch (error: any) {
    console.error("Error acknowledging stop-work alert:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
