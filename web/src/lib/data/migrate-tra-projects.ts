/**
 * TRA Project Migration Script
 * Backfills projectId and projectRef fields in existing TRAs
 *
 * This script should be run once after implementing the project management system
 * to ensure all existing TRAs have proper project references.
 *
 * Usage:
 * - Import and run this function from a Next.js API route or Firebase Function
 * - Or run directly in Firebase Console for one-time migration
 *
 * Safety Features:
 * - Dry-run mode available for previewing changes
 * - Batch processing to avoid memory issues
 * - Audit logging for all changes
 * - Rollback capability via audit logs
 */

import { initializeAdmin } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";

export interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  stats: {
    organizationsProcessed: number;
    defaultProjectsCreated: number;
    trasUpdated: number;
    errors: string[];
    warnings: string[];
  };
  executionTime: number;
}

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  createDefaultProjects?: boolean;
}

/**
 * Main migration function
 */
export async function migrateTRAProjects(options: MigrationOptions = {}): Promise<MigrationResult> {
  const startTime = Date.now();
  const { dryRun = true, batchSize = 100, createDefaultProjects = true } = options;

  console.log(`🚀 Starting TRA project migration (dryRun: ${dryRun})`);

  const { firestore } = initializeAdmin();
  const stats = {
    organizationsProcessed: 0,
    defaultProjectsCreated: 0,
    trasUpdated: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  try {
    // Get all organizations
    const orgsSnapshot = await firestore.collection("organizations").get();
    console.log(`📋 Found ${orgsSnapshot.size} organizations to process`);

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();

      console.log(`\n🏢 Processing organization: ${orgId}`);

      try {
        // Create default project if needed and requested
        let defaultProjectId: string | null = null;
        if (createDefaultProjects) {
          defaultProjectId = await ensureDefaultProject(firestore, orgId, orgData.name, dryRun);
          if (defaultProjectId) {
            stats.defaultProjectsCreated++;
          }
        }

        // Process TRAs for this organization
        const trasUpdated = await migrateOrganizationTRAs(
          firestore,
          orgId,
          defaultProjectId,
          dryRun,
          batchSize
        );

        stats.trasUpdated += trasUpdated;
        stats.organizationsProcessed++;

        console.log(`✅ Organization ${orgId}: ${trasUpdated} TRAs updated`);
      } catch (error) {
        const errorMsg = `Failed to process organization ${orgId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(`💥 ${errorMsg}`);
    stats.errors.push(errorMsg);
  }

  const executionTime = Date.now() - startTime;

  console.log(`\n🎉 Migration completed in ${executionTime}ms`);
  console.log(`📊 Final Stats:`, {
    organizationsProcessed: stats.organizationsProcessed,
    defaultProjectsCreated: stats.defaultProjectsCreated,
    trasUpdated: stats.trasUpdated,
    errors: stats.errors.length,
    warnings: stats.warnings.length,
    dryRun,
  });

  return {
    success: stats.errors.length === 0,
    dryRun,
    stats,
    executionTime,
  };
}

/**
 * Ensure a default project exists for the organization
 */
async function ensureDefaultProject(
  firestore: any,
  orgId: string,
  orgName: string,
  dryRun: boolean
): Promise<string | null> {
  try {
    // Check if default project already exists
    const projectsRef = firestore.collection("organizations").doc(orgId).collection("projects");
    const existingSnapshot = await projectsRef
      .where("name", "==", "Default Project")
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      const existingProject = existingSnapshot.docs[0];
      console.log(`📁 Default project already exists: ${existingProject.id}`);
      return existingProject.id;
    }

    if (dryRun) {
      console.log(`🔍 Dry run: Would create default project for ${orgName}`);
      return "would-create-default-project-id";
    }

    // Create default project
    const now = new Date();
    const defaultProject = {
      name: "Default Project",
      slug: "default-project",
      description: `Default project for ${orgName}`,
      createdBy: "migration-script",
      createdAt: now,
      updatedAt: now,
      isActive: true,
      memberCount: 1,
      settings: {},
      metadata: {
        createdByMigration: true,
        migrationDate: now.toISOString(),
      },
    };

    const docRef = await projectsRef.add(defaultProject);
    console.log(`✨ Created default project: ${docRef.id}`);

    // Write audit log
    await writeAuditLog(orgId, docRef.id, "migration-script", "project.create", {
      project: defaultProject,
      migrationContext: "tra_project_migration",
    });

    return docRef.id;
  } catch (error) {
    console.error(`Failed to create default project for ${orgId}:`, error);
    return null;
  }
}

/**
 * Migrate TRAs for a specific organization
 */
async function migrateOrganizationTRAs(
  firestore: any,
  orgId: string,
  defaultProjectId: string | null,
  dryRun: boolean,
  batchSize: number
): Promise<number> {
  const trasRef = firestore.collection("organizations").doc(orgId).collection("tras");
  let updatedCount = 0;
  let hasMore = true;
  let lastDoc: any = null;

  while (hasMore) {
    let query = trasRef.where("isActive", "==", true);

    // If we have a cursor, start after it for pagination
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // Limit batch size
    query = query.limit(batchSize);

    const snapshot = await query.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    console.log(`📄 Processing batch of ${snapshot.size} TRAs...`);

    // Process each TRA in the batch
    for (const doc of snapshot.docs) {
      const tra = doc.data();

      // Skip if already has projectId
      if (tra.projectId) {
        console.log(`⏭️  TRA ${doc.id} already has projectId: ${tra.projectId}`);
        continue;
      }

      // Skip if no default project available
      if (!defaultProjectId) {
        const warning = `TRA ${doc.id} has no projectId and no default project available`;
        console.warn(`⚠️  ${warning}`);
        // Note: stats is not available in this scope, warnings are handled at function level
        continue;
      }

      try {
        if (dryRun) {
          console.log(`🔍 Dry run: Would update TRA ${doc.id} with projectId: ${defaultProjectId}`);
          updatedCount++;
        } else {
          // Update TRA with project information
          const updateData = {
            projectId: defaultProjectId,
            projectRef: {
              projectId: defaultProjectId,
              projectName: "Default Project",
              projectLocation: null,
            },
            updatedAt: new Date(),
            updatedBy: "migration-script",
            migrationMetadata: {
              originalMigration: "tra_project_migration",
              migratedAt: new Date().toISOString(),
              previousProjectId: tra.projectId || null,
            },
          };

          await doc.ref.update(updateData);
          updatedCount++;

          // Write audit log
          await writeAuditLog(orgId, doc.id, "migration-script", "tra.update", {
            updateData,
            migrationContext: "tra_project_migration",
          });

          console.log(`✅ Updated TRA ${doc.id} with projectId: ${defaultProjectId}`);
        }
      } catch (error) {
        const errorMsg = `Failed to update TRA ${doc.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    // Set cursor for next batch
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Check if we got a full batch (if not, we're done)
    if (snapshot.size < batchSize) {
      hasMore = false;
    }
  }

  return updatedCount;
}

/**
 * Rollback migration by removing project references from TRAs
 * Useful if migration needs to be undone
 */
export async function rollbackTRAProjectMigration(
  targetOrgId?: string,
  dryRun: boolean = true
): Promise<MigrationResult> {
  const startTime = Date.now();
  const { firestore } = initializeAdmin();

  console.log(`🔄 Starting rollback of TRA project migration (dryRun: ${dryRun})`);

  const stats = {
    organizationsProcessed: 0,
    defaultProjectsCreated: 0, // Not applicable for rollback
    trasUpdated: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  try {
    let query = firestore
      .collectionGroup("tras")
      .where("migrationMetadata.originalMigration", "==", "tra_project_migration");

    if (targetOrgId) {
      query = query.where("organizationId", "==", targetOrgId);
    }

    const snapshot = await query.get();

    console.log(`📋 Found ${snapshot.size} TRAs to rollback`);

    for (const doc of snapshot.docs) {
      const tra = doc.data();

      try {
        if (dryRun) {
          console.log(`🔍 Dry run: Would rollback TRA ${doc.id}`);
          stats.trasUpdated++;
        } else {
          const rollbackData = {
            projectId: null,
            projectRef: null,
            updatedAt: new Date(),
            updatedBy: "migration-rollback-script",
            migrationMetadata: {
              rollbackOf: "tra_project_migration",
              rollbackAt: new Date().toISOString(),
              previousProjectId: tra.projectId,
            },
          };

          await doc.ref.update(rollbackData);
          stats.trasUpdated++;

          // Write audit log
          const orgId = tra.organizationId;
          await writeAuditLog(orgId, doc.id, "migration-rollback-script", "tra.update", {
            rollbackData,
            migrationContext: "tra_project_migration_rollback",
          });

          console.log(`✅ Rolled back TRA ${doc.id}`);
        }
      } catch (error) {
        const errorMsg = `Failed to rollback TRA ${doc.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    stats.organizationsProcessed = targetOrgId ? 1 : 0;
  } catch (error) {
    const errorMsg = `Rollback failed: ${error}`;
    console.error(`💥 ${errorMsg}`);
    stats.errors.push(errorMsg);
  }

  const executionTime = Date.now() - startTime;

  console.log(`\n🎉 Rollback completed in ${executionTime}ms`);
  console.log(`📊 Rollback Stats: ${stats.trasUpdated} TRAs updated`);

  return {
    success: stats.errors.length === 0,
    dryRun,
    stats,
    executionTime,
  };
}

/**
 * API route handler for running migration
 * POST /api/admin/migrate-tra-projects
 */
export async function handleMigrationRequest(request: Request) {
  try {
    const body = await request.json();
    const { dryRun = true, createDefaultProjects = true } = body;

    const result = await migrateTRAProjects({
      dryRun,
      createDefaultProjects,
      batchSize: 50, // Smaller batches for API context
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Migration API error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
