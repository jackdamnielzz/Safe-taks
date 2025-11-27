/**
 * Audit Logs API Endpoint
 * Provides access to audit trail data with filtering
 * 
 * GET /api/audit-logs
 * 
 * Features:
 * - Organization-scoped queries
 * - Multiple filter options
 * - Pagination support
 * - Compliance-focused retrieval
 */

import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";
import { AuditTrailService } from "@/lib/audit/audit-trail";
import type { AuditLogFilters } from "@/lib/audit/audit-trail";

export const dynamic = "force-dynamic";

/**
 * Get audit logs with filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication check
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header provided" },
        { status: 401 }
      );
    }

    // Extract user ID from bearer token
    const userId = authHeader.replace("Bearer ", "").split(":")[0];

    // 2. Get user details for authorization
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userOrgId = userData?.organizationId;

    if (!userOrgId) {
      return NextResponse.json(
        { error: "Forbidden - User not associated with an organization" },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId") || userOrgId;

    // Authorization check - user can only access their organization's logs
    if (organizationId !== userOrgId) {
      return NextResponse.json(
        { error: "Forbidden - Cannot access other organization's audit logs" },
        { status: 403 }
      );
    }

    // Build filters
    const filters: AuditLogFilters = {};

    // Event types filter
    const eventTypes = searchParams.get("eventTypes");
    if (eventTypes) {
      filters.eventTypes = eventTypes.split(",") as any[];
    }

    // Categories filter
    const categories = searchParams.get("categories");
    if (categories) {
      filters.categories = categories.split(",") as any[];
    }

    // Severities filter
    const severities = searchParams.get("severities");
    if (severities) {
      filters.severities = severities.split(",") as any[];
    }

    // Actor ID filter
    const actorId = searchParams.get("actorId");
    if (actorId) {
      filters.actorId = actorId;
    }

    // Subject ID filter
    const subjectId = searchParams.get("subjectId");
    if (subjectId) {
      filters.subjectId = subjectId;
    }

    // Subject type filter
    const subjectType = searchParams.get("subjectType");
    if (subjectType) {
      filters.subjectType = subjectType;
    }

    // Project ID filter
    const projectId = searchParams.get("projectId");
    if (projectId) {
      filters.projectId = projectId;
    }

    // Date range filters
    const dateFrom = searchParams.get("dateFrom");
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get("dateTo");
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Compliance relevant filter
    const complianceRelevant = searchParams.get("complianceRelevant");
    if (complianceRelevant !== null) {
      filters.complianceRelevant = complianceRelevant === "true";
    }

    // Limit
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // 4. Query audit logs
    const logs = await AuditTrailService.queryLogs(
      organizationId,
      filters,
      Math.min(limit, 1000) // Cap at 1000 for performance
    );

    // 5. Return logs
    return NextResponse.json({
      logs,
      count: logs.length,
      filters: {
        organizationId,
        ...filters,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to fetch audit logs",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get audit log statistics
 * HEAD /api/audit-logs
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return new NextResponse(null, { status: 401 });
    }

    const userId = authHeader.replace("Bearer ", "").split(":")[0];
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userOrgId = userData?.organizationId;

    if (!userOrgId) {
      return new NextResponse(null, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId") || userOrgId;

    if (organizationId !== userOrgId) {
      return new NextResponse(null, { status: 403 });
    }

    // Get basic count
    const logs = await AuditTrailService.queryLogs(organizationId, {}, 1);

    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Audit-Logs-Available": logs.length > 0 ? "true" : "false",
        "X-Organization-Id": organizationId,
      },
    });
  } catch (error) {
    console.error("Error checking audit logs availability:", error);
    return new NextResponse(null, { status: 500 });
  }
}