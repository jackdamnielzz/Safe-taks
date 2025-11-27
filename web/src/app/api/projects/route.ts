import { NextResponse } from "next/server";
import { ProjectCreateSchema } from "@/lib/validators/project";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";
import { canCreateProject } from "@/lib/payments/feature-gates";

/**
 * POST /api/projects
 * Create a new project under the caller's organization.
 *
 * Subscription constraints:
 * - Uses feature-gates.canCreateProject(org) as single source of truth.
 * - Fails with 402 when limits are exceeded or subscription inactive.
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log("📝 POST /api/projects - Request started");
  
  try {
    // Step 1: Auth
    const authStart = Date.now();
    const user = await requireOrgAuth(request);
    console.log(`✅ Auth completed in ${Date.now() - authStart}ms - User: ${user.uid}, Org: ${user.orgId}`);
    
    // Step 2: Parse body
    const parseStart = Date.now();
    const body = await request.json();
    const parsed = ProjectCreateSchema.parse(body);
    console.log(`✅ Body parsed in ${Date.now() - parseStart}ms - Project name: "${parsed.name}"`);

    // Step 3: Initialize Firestore
    const firestoreStart = Date.now();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    console.log(`✅ Firestore initialized in ${Date.now() - firestoreStart}ms`);

    // Step 4: Load organization
    const orgLoadStart = Date.now();
    const orgRef = firestore.collection("organizations").doc(orgId);
    const orgSnap = await orgRef.get();
    console.log(`✅ Organization loaded in ${Date.now() - orgLoadStart}ms - Exists: ${orgSnap.exists}`);

    if (!orgSnap.exists) {
      console.error(`❌ Organization not found: ${orgId}`);
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgSnap.data();

    // Step 5: Check limits
    const limitsStart = Date.now();
    const canCreate = canCreateProject(org as any);
    console.log(`✅ Limits checked in ${Date.now() - limitsStart}ms - Can create: ${canCreate}`);
    
    if (!canCreate) {
      console.warn(`⚠️ Project limit reached for org: ${orgId}`);
      return NextResponse.json(
        {
          error: "Project limit reached or subscription inactive",
          code: "PROJECT_LIMIT_EXCEEDED",
        },
        { status: 402 }
      );
    }

    const projectsCol = orgRef.collection("projects");

    // Step 6: Create project document
    const createStart = Date.now();
    const now = new Date();
    const project = {
      name: parsed.name,
      slug: parsed.slug || parsed.name.toLowerCase().replace(/\s+/g, "-"),
      description: parsed.description || "",
      location: parsed.location || null,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };

    const docRef = await projectsCol.add(project);
    const snap = await docRef.get();
    console.log(`✅ Project created in ${Date.now() - createStart}ms - ID: ${docRef.id}`);

    // Step 7: Update usage counter
    const usageStart = Date.now();
    try {
      const usage = (org as any)?.usage || {};
      const currentCount =
        typeof usage.projectCount === "number" && Number.isFinite(usage.projectCount)
          ? usage.projectCount
          : 0;

      await orgRef.update({
        "usage.projectCount": currentCount + 1,
        "usage.lastUpdated": now,
      });
      console.log(`✅ Usage updated in ${Date.now() - usageStart}ms - New count: ${currentCount + 1}`);
    } catch (updateErr) {
      console.error(`❌ Failed to update usage in ${Date.now() - usageStart}ms:`, updateErr);
    }

    // Step 8: Write audit log
    const auditStart = Date.now();
    await writeAuditLog(orgId, docRef.id, user.uid, "project.create", { project });
    console.log(`✅ Audit log written in ${Date.now() - auditStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ POST /api/projects completed in ${totalTime}ms`);
    
    return NextResponse.json({ id: docRef.id, ...snap.data() });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ POST /api/projects failed after ${totalTime}ms:`, error);
    
    // Handle validation errors
    if (error.name === "ZodError") {
      console.error("❌ Validation errors:", error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    // Handle other errors
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/projects
 * List projects for the caller's organization (RBAC: readers can list)
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  console.log("📋 GET /api/projects - Request started");
  
  try {
    // Step 1: Auth
    const authStart = Date.now();
    const user = await requireOrgAuth(request);
    console.log(`✅ Auth completed in ${Date.now() - authStart}ms - User: ${user.uid}, Org: ${user.orgId}`);
    
    // Step 2: Initialize Firestore
    const firestoreStart = Date.now();
    const { firestore } = initializeAdmin();
    const orgId = user.orgId;
    console.log(`✅ Firestore initialized in ${Date.now() - firestoreStart}ms`);

    // Step 3: Query projects
    const queryStart = Date.now();
    const projectsCol = firestore.collection("organizations").doc(orgId).collection("projects");
    const snaps = await projectsCol.get();
    
    // Debug: Log detailed query result structure
    console.log(`✅ Query completed in ${Date.now() - queryStart}ms - Found ${snaps?.size ?? 0} documents`);
    console.log("🔍 Query result details:", {
      hasSnaps: !!snaps,
      snapSize: snaps?.size,
      snapEmpty: snaps?.empty,
      hasDocs: !!(snaps?.docs),
      docsType: snaps?.docs ? typeof snaps.docs : 'undefined',
      docsIsArray: snaps?.docs ? Array.isArray(snaps.docs) : false,
      docsLength: snaps?.docs?.length,
      firstDocExists: snaps?.docs?.[0] ? true : false
    });

    // Step 4: Process results
    const processStart = Date.now();
    const projects: any[] = [];
    
    // Handle both real Firebase SDK and development stub
    let docs: any[] = [];
    
    if (snaps) {
      if (snaps.docs && Array.isArray(snaps.docs)) {
        docs = snaps.docs;
      } else if (typeof snaps === 'object' && snaps.docs === undefined) {
        console.log("⚠️ Using fallback: accessing stub internal store");
        const { firestore } = initializeAdmin();
        const internalStore = (firestore as any).__inMemoryStore;
        if (internalStore && internalStore.organizations && internalStore.organizations[orgId]) {
          const orgData = internalStore.organizations[orgId];
          if (orgData.projects) {
            docs = Object.entries(orgData.projects).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }));
            console.log(`✅ Found ${docs.length} projects in internal store`);
          }
        }
      }
    }
    
    if (docs.length > 0) {
      let deletedCount = 0;
      docs.forEach((d: any) => {
        const data = typeof d.data === 'function' ? d.data() : d.data;
        if (data && data.deleted !== true) {
          projects.push({ id: d.id, ...data });
        } else if (data && data.deleted === true) {
          deletedCount++;
        }
      });
      console.log(`✅ Processed ${docs.length} docs in ${Date.now() - processStart}ms - Active: ${projects.length}, Deleted: ${deletedCount}`);
    } else {
      console.warn("⚠️ No documents found in query result");
    }

    // Step 5: Sort projects
    const sortStart = Date.now();
    projects.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    console.log(`✅ Sorted ${projects.length} projects in ${Date.now() - sortStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ GET /api/projects completed in ${totalTime}ms - Returning ${projects.length} projects`);
    
    return NextResponse.json({ projects });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ GET /api/projects failed after ${totalTime}ms:`, error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    // Return empty array instead of error for better UX
    return NextResponse.json({ projects: [] });
  }
}
