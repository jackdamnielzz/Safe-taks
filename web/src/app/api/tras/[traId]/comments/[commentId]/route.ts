import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { UpdateCommentSchema } from "@/lib/validators/comment";
import { writeAuditLog } from "@/lib/audit";

/**
 * PATCH - update own comment (body)
 * POST  - resolve/unresolve (role-based)
 * DELETE - soft-delete (own or admin)
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ traId: string; commentId: string }> }
) {
  const { traId, commentId } = await params;

  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const uid = auth.uid;

  const body = await request.json().catch(() => ({}));
  const parse = UpdateCommentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.flatten() },
      { status: 400 }
    );
  }
  const data = parse.data;

  const docRef = db.collection(`organizations/${orgId}/tras/${traId}/comments`).doc(commentId);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = doc.data();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only author may edit body
  if (data.body !== undefined) {
    if (existing.authorId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await docRef.update({ body: data.body, updatedAt: new Date() });
    await writeAuditLog(orgId, commentId, uid, "comment.update", {
      before: existing,
      after: { body: data.body },
    });
  }

  // Resolve/unresolve - only safety_manager or admin can resolve
  if (data.isResolved !== undefined) {
    const roleList = (auth as any).roles || [];
    const isManager = roleList.includes("admin") || roleList.includes("safety_manager");
    if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resolvedBy = data.isResolved
      ? { uid, displayName: (auth as any).email ?? uid, role: roleList[0] || null }
      : null;
    const resolvedAt = data.isResolved ? new Date() : null;
    await docRef.update({
      isResolved: !!data.isResolved,
      resolvedBy,
      resolvedAt,
      updatedAt: new Date(),
    });
    await writeAuditLog(
      orgId,
      commentId,
      uid,
      data.isResolved ? "comment.resolve" : "comment.unresolve",
      { resolvedBy, resolvedAt }
    );
  }

  const updated = await docRef.get();
  return NextResponse.json({ item: updated.data() }, { status: 200 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ traId: string; commentId: string }> }
) {
  const { traId, commentId } = await params;

  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const uid = auth.uid;

  const docRef = db.collection(`organizations/${orgId}/tras/${traId}/comments`).doc(commentId);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = doc.data();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: author or admin
  const roleList = (auth as any).roles || [];
  const isAdmin = roleList.includes("admin");
  if (existing.authorId !== uid && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await docRef.update({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() });
  await writeAuditLog(orgId, commentId, uid, "comment.delete", { before: existing });
  return NextResponse.json({ success: true }, { status: 200 });
}
