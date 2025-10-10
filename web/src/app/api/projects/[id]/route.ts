import { NextResponse } from "next/server";
import { ProjectUpdateSchema } from "@/lib/validators/project";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";

// CRUD for single project (GET, PATCH, DELETE - soft delete)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const docRef = firestore
    .collection("organizations")
    .doc(orgId)
    .collection("projects")
    .doc(projectId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const user = await requireOrgAuth(request);
  const body = await request.json();
  const parsed = ProjectUpdateSchema.parse(body);

  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const docRef = firestore
    .collection("organizations")
    .doc(orgId)
    .collection("projects")
    .doc(projectId);
  await docRef.update({ ...parsed, updatedAt: new Date() });
  await writeAuditLog(orgId, projectId, user.uid, "project.update", { changes: parsed });

  const snap = await docRef.get();
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const docRef = firestore
    .collection("organizations")
    .doc(orgId)
    .collection("projects")
    .doc(projectId);

  // Soft-delete
  await docRef.update({
    isActive: false,
    retentionPolicy: {
      archivedAt: new Date(),
      retentionDays: 90,
    },
    updatedAt: new Date(),
  });

  await writeAuditLog(orgId, projectId, user.uid, "project.delete", {});
  return NextResponse.json({ success: true });
}
