import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireOrgAuth } from "@/lib/server-helpers";
import { rateLimitByUser } from "@/lib/api/rate-limit";
import { CreateCommentSchema } from "@/lib/validators/comment";
import { nanoid } from "nanoid";
import { writeAuditLog } from "@/lib/audit";

/**
 * POST - create comment
 * GET  - list comments for TRA (optionally filtered by anchor)
 */

export async function POST(request: Request, { params }: { params: { traId: string } }) {
  // Basic server-side auth helper (uses TEST_UID/TEST_ORG in emulator/test)
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = auth.orgId;
  const userId = auth.uid;

  // Apply simple per-user rate limit (development/mock)
  await rateLimitByUser(userId);

  const body = await request.json().catch(() => ({}));
  const parse = CreateCommentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parse.error.flatten() },
      { status: 400 }
    );
  }
  const data = parse.data;
  if (data.traId !== params.traId) {
    return NextResponse.json({ error: "traId mismatch" }, { status: 400 });
  }

  const now = new Date();
  const commentId = nanoid();
  const docRef = db
    .collection(`organizations/${orgId}/tras/${params.traId}/comments`)
    .doc(commentId);
  const payload = {
    id: commentId,
    traId: params.traId,
    anchor: data.anchor || null,
    body: data.body,
    authorId: userId,
    authorDisplayName: auth.email || "unknown",
    authorRole: auth.role || null,
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    organizationId: orgId,
  };

  await docRef.set(payload);
  await writeAuditLog(orgId, commentId, userId, "comment.create", {
    traId: params.traId,
    anchor: data.anchor ?? null,
  });

  return NextResponse.json(payload, { status: 201 });
}

export async function GET(request: Request, { params }: { params: { traId: string } }) {
  const auth = await requireOrgAuth(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = auth.orgId;

  const url = new URL(request.url);
  const anchor = url.searchParams.get("anchor");

  let ref = db
    .collection(`organizations/${orgId}/tras/${params.traId}/comments`)
    .where("isDeleted", "==", false)
    .orderBy("createdAt", "desc")
    .limit(200);
  if (anchor) {
    ref = ref.where("anchor", "==", anchor);
  }

  const snap = await ref.get();
  const items = snap.docs.map((d: any) => d.data());
  return NextResponse.json({ items }, { status: 200 });
}
