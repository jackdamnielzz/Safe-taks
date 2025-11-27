/**
 * API Route: POST /api/compliance/batch-check
 *
 * Batch check compliance for multiple TRAs
 */

import { NextResponse } from "next/server";
import { batchCheckCompliance } from "@/lib/compliance-analytics";

export async function POST(request: Request) {
  try {
    // In production, use requireOrgAuth from lib/server-helpers
    // For now, using test-org for development
    const organizationId = "test-org";

    const body = await request.json();
    const { traIds } = body;

    if (!traIds || !Array.isArray(traIds) || traIds.length === 0) {
      return NextResponse.json(
        { error: "traIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (traIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 TRAs can be checked at once" },
        { status: 400 }
      );
    }

    const result = await batchCheckCompliance(organizationId, traIds);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error in batch compliance check:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform batch compliance check" },
      { status: 500 }
    );
  }
}
