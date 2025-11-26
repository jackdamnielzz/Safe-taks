/**
 * API Route: GET /api/compliance/statistics
 *
 * Get compliance statistics for an organization
 */

import { NextResponse } from "next/server";
import { getComplianceStatistics } from "@/lib/compliance-analytics";

export async function GET(request: Request) {
  try {
    // In production, use requireOrgAuth from lib/server-helpers
    // For now, using test-org for development
    const organizationId = "test-org";

    // Get query parameters
    const url = new URL(request.url);
    const dateFromParam = url.searchParams.get("dateFrom");
    const dateToParam = url.searchParams.get("dateTo");

    // Default to last 30 days if not specified
    const dateTo = dateToParam ? new Date(dateToParam) : new Date();
    const dateFrom = dateFromParam
      ? new Date(dateFromParam)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    const statistics = await getComplianceStatistics(organizationId, dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      statistics,
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching compliance statistics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch compliance statistics" },
      { status: 500 }
    );
  }
}
