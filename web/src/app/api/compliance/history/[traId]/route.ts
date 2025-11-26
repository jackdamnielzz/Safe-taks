/**
 * API Route: GET /api/compliance/history/:traId
 *
 * Get compliance history for a specific TRA
 */

import { NextResponse } from "next/server";
import { getComplianceHistory } from "@/lib/compliance-analytics";

export async function GET(request: Request, { params }: { params: { traId: string } }) {
  try {
    // In production, use requireOrgAuth from lib/server-helpers
    // For now, using test-org for development
    const organizationId = "test-org";

    const { traId } = params;

    if (!traId) {
      return NextResponse.json({ error: "TRA ID is required" }, { status: 400 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const history = await getComplianceHistory(organizationId, traId, limit);

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error("Error fetching compliance history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch compliance history" },
      { status: 500 }
    );
  }
}
