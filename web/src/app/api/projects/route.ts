import { NextResponse } from "next/server";
import { ProjectCreateSchema } from "@/lib/validators/project";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";

/**
 * POST /api/projects
 * Create a new project under the caller's organization.
 */
export async function POST(request: Request) {
  const user = await requireOrgAuth(request);
  const body = await request.json();
  const parsed = ProjectCreateSchema.parse(body);

  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const projectsCol = firestore.collection("organizations").doc(orgId).collection("projects");

  // create project document
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

  // write audit log
  await writeAuditLog(orgId, docRef.id, user.uid, "project.create", { project: project });

  return NextResponse.json({ id: docRef.id, ...snap.data() });
}

/**
 * GET /api/projects
 * List projects for the caller's organization (RBAC: readers can list)
 */
export async function GET(request: Request) {
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const projectsCol = firestore.collection("organizations").doc(orgId).collection("projects");
  const snaps = await projectsCol.where("deleted", "==", false).orderBy("createdAt", "desc").get();

  const projects: any[] = [];
  snaps.forEach((d: any) => {
    projects.push({ id: d.id, ...d.data() });
  });

  return NextResponse.json({ projects });
}
