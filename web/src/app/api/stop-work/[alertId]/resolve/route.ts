import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { z } from "zod";

/**
 * POST /api/stop-work/[alertId]/resolve
 * Resolve a stop-work alert (supervisor action)
 */

const resolveSchema = z.object({
  resolutionNotes: z.string().min(1).max(1000),
});

export async function POST(request: Request, { params }: { params: { alertId: string } }) {
  try {
    const user = await requireOrgAuth(request);
    const body = await request.json();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { alertId } = params;

    // Validate request body
    const validationResult = resolveSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

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

    // Check if already resolved
    if (alertData?.status === "resolved") {
      return NextResponse.json({ error: "Alert already resolved" }, { status: 400 });
    }

    // Update alert
    const now = new Date();
    await alertRef.update({
      status: "resolved",
      resolvedBy: user.uid,
      resolvedByName: "Supervisor", // TODO: Get actual name from user profile
      resolvedAt: now,
      resolutionNotes: data.resolutionNotes,
      updatedAt: now,
    });

    // Update associated LMRA if needed
    if (alertData?.lmraId) {
      const lmraRef = firestore
        .collection("organizations")
        .doc(orgId)
        .collection("lmras")
        .doc(alertData.lmraId);

      const lmraSnap = await lmraRef.get();
      if (lmraSnap.exists) {
        await lmraRef.update({
          status: "completed", // Or appropriate status
          updatedAt: now,
        });
      }
    }

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
    console.error("Error resolving stop-work alert:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
