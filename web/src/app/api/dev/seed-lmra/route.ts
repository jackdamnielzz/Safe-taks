/* eslint-disable @typescript-eslint/no-require-imports */

import { NextResponse } from "next/server";
import { initializeAdmin } from "@/lib/server-helpers";

/**
 * Dev-only: POST /api/dev/seed-lmra
 * Body: { id?: string, orgId?: string, title?: string, ... }
 * Seeds a minimal LMRA document into the running server's in-memory firestore stub.
 * This route is intentionally dev-only and should not be used in production.
 */

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Not available" }), { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const { id = "test-lmra-id", orgId = "test-org", title = "Test LMRA (dev-seed)" } = body;
    const { firestore } = initializeAdmin();

    const lmraRef = firestore.collection("organizations").doc(orgId).collection("lmras").doc(id);

    const now = new Date().toISOString();
    const lmraData = {
      id,
      title,
      description: body.description || "Seeded LMRA for dev testing",
      createdBy: body.createdBy || "dev-seeder",
      site: body.site || "test-site",
      createdAt: now,
      updatedAt: now,
      status: body.status || "active",
      projectId: body.projectId || null,
    };

    // The stub's doc.set should exist in dev; call it.
    await lmraRef.set(lmraData);

    // Persist seed to web/.dev-seed.json so other Next dev processes pick it up
    try {
      const fs = require("fs");
      const path = require("path");
      const seedPath = path.join(__dirname, "..", "..", "..", ".dev-seed.json");
      let seed = { lmras: {}, stopWorkAlerts: {} };
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf8");
        seed = JSON.parse(raw);
      }
      seed.lmras = seed.lmras || {};
      seed.lmras[id] = lmraData;
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not persist .dev-seed.json from seed-lmra route:", e && e.message);
    }

    return NextResponse.json({ success: true, data: lmraData });
  } catch (err: any) {
    console.error("Dev seed LMRA error:", err);
    return NextResponse.json({ error: err.message || "Failed to seed LMRA" }, { status: 500 });
  }
}
