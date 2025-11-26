import { NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/server-helpers";

/**
 * Dev-only: POST /api/dev/seed-stopwork
 * Body: {
 *   id?: string,
 *   lmraId?: string,
 *   orgId?: string,
 *   severity?: 'moderate'|'high'|'critical',
 *   category?: 'weather'|'equipment'|'personnel'|'hazard'|'other'
 * }
 *
 * Inserts a stop-work alert document into the running server's in-memory firestore stub
 * and links it to the LMRA (updates LMRA.stopWorkAlertId and status). This is strictly
 * a dev helper for end-to-end testing.
 */

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Not available" }), { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const lmraId = body.lmraId || "test-lmra-id";
    const orgId = body.orgId || "test-org";
    const alertId = body.id || `stopwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const { firestore } = initializeAdmin();

    // Prepare alert
    const alertData = {
      id: alertId,
      lmraId,
      organizationId: orgId,
      triggeredBy: body.triggeredBy || "dev-seeder",
      triggeredByName: body.triggeredByName || "Dev Seeder",
      triggeredAt: now,
      reason: body.reason || "Dev seeded stop-work alert",
      severity: body.severity || "moderate",
      category: body.category || "other",
      description: body.description || "Seeded stop-work alert for testing",
      photoIds: body.photoIds || [],
      signature: body.signature || {
        signerId: "dev-seeder",
        signerName: "Dev Seeder",
        signatureData: "dev-sig",
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

    // Write alert
    const alertRef = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("stopWorkAlerts")
      .doc(alertId);
    await alertRef.set(alertData);

    // Update LMRA if exists
    const lmraRef = firestore
      .collection("organizations")
      .doc(orgId)
      .collection("lmras")
      .doc(lmraId);
    const lmraSnap = await lmraRef.get();
    if (lmraSnap.exists) {
      await lmraRef.update({
        status: "stop_work",
        stopWorkAlertId: alertId,
        updatedAt: now,
      });
    }

    // Persist alert to web/.dev-seed.json so other Next dev processes pick it up
    try {
      const fs = require("fs");
      const path = require("path");
      const seedPath = path.join(__dirname, "..", "..", "..", ".dev-seed.json");
      let seed = { lmras: {}, stopWorkAlerts: {} };
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf8");
        seed = JSON.parse(raw);
      }
      seed.stopWorkAlerts = seed.stopWorkAlerts || {};
      seed.stopWorkAlerts[alertId] = alertData;
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not persist .dev-seed.json from seed-stopwork route:", e && e.message);
    }

    return NextResponse.json({ success: true, data: alertData });
  } catch (err: any) {
    console.error("Dev seed stopwork error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to seed stop-work alert" },
      { status: 500 }
    );
  }
}
