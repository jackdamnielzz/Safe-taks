/**
 * Cache Statistics API Endpoint
 *
 * Provides real-time cache performance metrics
 * GET /api/cache/stats - Get cache statistics
 * POST /api/cache/clear - Clear all caches (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/server-helpers";
import { Errors } from "@/lib/api/errors";
import { getAllCacheStats, clearAllCaches } from "@/lib/cache/firebase-cache-wrapper";

/**
 * GET /api/cache/stats
 * Get cache statistics and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireOrgAuth(request);

    // Only admin and safety_manager can view cache stats
    if (!auth.roles.includes("admin") && !auth.roles.includes("safety_manager")) {
      return Errors.forbidden();
    }

    const stats = getAllCacheStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching cache stats:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}

/**
 * POST /api/cache/clear
 * Clear all caches (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireOrgAuth(request);

    // Only admin can clear caches
    if (!auth.roles.includes("admin")) {
      return Errors.forbidden();
    }

    clearAllCaches();

    return NextResponse.json({
      success: true,
      message: "All caches cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error clearing caches:", error);
    if (error.message === "Unauthorized") {
      return Errors.unauthorized();
    }
    return Errors.serverError(error);
  }
}
