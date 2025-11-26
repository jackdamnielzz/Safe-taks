/**
 * API Route: GET /api/compliance/trends
 *
 * Get compliance trends for an organization
 */

import { NextResponse } from "next/server";
import { getComplianceTrends } from "@/lib/compliance-analytics";

export async function GET(request: Request) {
  try {
    // In production, use requireOrgAuth from lib/server-helpers
    // For now, using test-org for development
    const organizationId = "test-org";

    // Get query parameters
    const url = new URL(request.url);
    const dateFromParam = url.searchParams.get("dateFrom");
    const dateToParam = url.searchParams.get("dateTo");
    const groupBy = (url.searchParams.get("groupBy") || "week") as "day" | "week" | "month";

    // Default to last 30 days if not specified
    const dateTo = dateToParam ? new Date(dateToParam) : new Date();
    const dateFrom = dateFromParam
      ? new Date(dateFromParam)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trends = await getComplianceTrends(organizationId, dateFrom, dateTo, groupBy);

    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        groupBy,
      },
    });
  } catch (error: any) {
    console.error("Error fetching compliance trends:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch compliance trends" },
      { status: 500 }
    );
  }
}
