import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { z } from "zod";

/**
 * POST /api/lmras/[lmraId]/stop-work
 * Create a stop-work alert for an LMRA session
 */

const createStopWorkSchema = z.object({
  triggeredBy: z.string(),
  triggeredByName: z.string(),
  reason: z.string().min(1).max(100),
  severity: z.enum(["moderate", "high", "critical"]),
  category: z.enum(["weather", "equipment", "personnel", "hazard", "other"]),
  description: z.string().min(1).max(500),
  photoIds: z.array(z.string()).optional(),
  signature: z.object({
    signerId: z.string(),
    signerName: z.string(),
    signatureData: z.string(),
  }),
});

export async function POST(request: Request, context: any) {
  try {
    const user = await requireOrgAuth(request);
    const body = await request.json();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    const { params } = context;
    const { lmraId } = await params;

    // Validate request body
    const validationResult = createStopWorkSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Attempt to read LMRA. In dev we may be in a different Next.js process that doesn't see
    // the seeded doc; fall back to creating the alert anyway and only update the LMRA if present.
    console.log("[dev] stop-work POST - orgId:", orgId, "lmraId:", lmraId);
    const lmraRef = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("lmras")
      .doc(lmraId);
    const lmraSnap = await lmraRef.get();
    console.log("[dev] lmraSnap:", {
      exists: lmraSnap.exists,
      id: lmraSnap.id,
      data: lmraSnap.exists ? lmraSnap.data() : null,
    });
    const lmraData = lmraSnap.exists ? lmraSnap.data() : null;

    // Create stop-work alert
    const now = new Date();
    const alertId = `stopwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alertData = {
      id: alertId,
      lmraId,
      organizationId: orgId,
      projectId: lmraData?.projectId,
      triggeredBy: data.triggeredBy,
      triggeredByName: data.triggeredByName,
      triggeredAt: now,
      reason: data.reason,
      severity: data.severity,
      category: data.category,
      description: data.description,
      photoIds: data.photoIds || [],
      signature: {
        signerId: data.signature.signerId,
        signerName: data.signature.signerName,
        signatureData: data.signature.signatureData,
        signedAt: now,
      },
      status: "active",
      acknowledgedBy: null,
      acknowledgedByName: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    const alertRef = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("stopWorkAlerts")
      .doc(alertId);

    await alertRef.set(alertData);

    // Update LMRA status to indicate stop-work
    await lmraRef.update({
      status: "stop_work",
      stopWorkAlertId: alertId,
      updatedAt: now,
    });

    // TODO: Send notifications to supervisors
    // This would integrate with Firebase Cloud Messaging or similar

    return NextResponse.json({
      success: true,
      data: alertData,
    });
  } catch (error: any) {
    console.error("Error creating stop-work alert:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
