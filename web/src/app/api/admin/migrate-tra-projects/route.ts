import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/server-helpers";
import { migrateTRAProjects, handleMigrationRequest } from "@/lib/data/migrate-tra-projects";

/**
 * POST /api/admin/migrate-tra-projects
 * Execute TRA project migration for the authenticated user's organization
 *
 * This endpoint allows admins to run the migration for their organization
 * and provides detailed reporting on what would be changed.
 *
 * @param dryRun - If true, only reports what would be changed without making actual changes
 * @param createDefaultProjects - If true, creates default projects for organizations that don't have any
 */
export async function POST(request: Request) {
  try {
    // Only allow admin users to run migrations
    const user = await requireOrgAuth(request);

    if (!user.roles.includes("admin")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admin users can run migrations",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dryRun = true, createDefaultProjects = true } = body;

    console.log(`🔄 Migration request from user ${user.uid} for org ${user.orgId}`);

    const result = await migrateTRAProjects({
      dryRun,
      createDefaultProjects,
      batchSize: 50, // Smaller batches for API context
    });

    // Log the migration attempt
    console.log(`✅ Migration completed for org ${user.orgId}:`, {
      success: result.success,
      dryRun: result.dryRun,
      organizationsProcessed: result.stats.organizationsProcessed,
      defaultProjectsCreated: result.stats.defaultProjectsCreated,
      trasUpdated: result.stats.trasUpdated,
      errors: result.stats.errors.length,
      executionTime: result.executionTime,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-tra-projects
 * Check migration status for the authenticated user's organization
 *
 * Returns information about whether migration has been run and current status
 */
export async function GET(request: Request) {
  try {
    const user = await requireOrgAuth(request);

    if (!user.roles.includes("admin")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admin users can check migration status",
        },
        { status: 403 }
      );
    }

    const { initializeAdmin } = await import("@/lib/server-helpers");

    const { firestore } = initializeAdmin();
    const orgId = user.orgId;

    // Check if any TRAs in this organization have projectId field
    const trasRef = firestore.collection("organizations").doc(orgId).collection("tras");
    const snapshot = await trasRef.where("projectId", "!=", null).limit(1).get();

    const migrationStatus = {
      hasProjectReferences: !snapshot.empty,
      organizationId: orgId,
      checkedAt: new Date().toISOString(),
      recommendation: snapshot.empty
        ? "Migration needed - no TRAs have projectId fields"
        : "Migration completed - TRAs already have projectId fields",
    };

    return NextResponse.json({
      success: true,
      migrationStatus,
    });
  } catch (error) {
    console.error("Migration status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
