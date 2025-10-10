import { NextResponse } from "next/server";
import { z } from "zod";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { writeAuditLog } from "@/lib/audit";
import { nanoid } from "nanoid";

/**
 * Members endpoints for a project:
 * - POST   /invite      -> invite user by email (creates invite token + audit)
 * - POST   /accept      -> accept invite with token
 * - GET    /             -> list members
 * - PATCH  /:memberId   -> change role
 * - DELETE /:memberId   -> remove member
 *
 * Note: This implementation stores invites under organizations/{orgId}/projectInvites
 * and members under organizations/{orgId}/projects/{projectId}/members
 */

/* Schemas */
const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "manager", "contributor", "reader"]).default("contributor"),
  projectNameSnapshot: z.string().optional(),
});

const AcceptSchema = z.object({
  token: z.string(),
});

const ChangeRoleSchema = z.object({
  role: z.enum(["owner", "manager", "contributor", "reader"]),
});

/* Helpers */
function membersCol(firestore: any, orgId: string, projectId: string) {
  return firestore
    .collection("organizations")
    .doc(orgId)
    .collection("projects")
    .doc(projectId)
    .collection("members");
}
function invitesCol(firestore: any, orgId: string) {
  return firestore.collection("organizations").doc(orgId).collection("projectInvites");
}

/* Invite: create invite token and audit */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await requireOrgAuth(request);
  const body = await request.json();
  const parsed = InviteSchema.parse(body);

  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const token = nanoid(32);
  const invite = {
    token,
    projectId,
    email: parsed.email,
    role: parsed.role,
    projectNameSnapshot: parsed.projectNameSnapshot || null,
    createdBy: user.uid,
    createdAt: new Date(),
    used: false,
  };

  await invitesCol(firestore, orgId).add(invite);
  await writeAuditLog(orgId, projectId, user.uid, "member.invite", {
    invite: { email: parsed.email, role: parsed.role },
  });

  // TODO: enqueue/send email with token (out of scope here)
  return NextResponse.json({ success: true, token });
}

/* Accept invite */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Accept with body { token }
  const { id: projectId } = await params;
  const body = await request.json();
  const parsed = AcceptSchema.parse(body);

  // For simplicity requireOrgAuth to obtain accepting user identity (in prod, accept via auth flow)
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  // Find invite
  const q = await invitesCol(firestore, orgId).where("token", "==", parsed.token).get();
  if (q.empty) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const inviteDoc = q.docs[0];
  const inviteData = inviteDoc.data();
  if (inviteData.used) return NextResponse.json({ error: "Token already used" }, { status: 400 });
  if (inviteData.projectId !== projectId)
    return NextResponse.json({ error: "Token mismatch" }, { status: 400 });

  // Add member
  const members = membersCol(firestore, orgId, projectId);
  await members.add({
    uid: user.uid,
    email: user.uid, // in test helper we use uid as identifier, adapt as needed
    role: inviteData.role,
    invitedBy: inviteData.createdBy,
    joinedAt: new Date(),
  });

  // mark invite used
  await inviteDoc.ref.update({ used: true, usedBy: user.uid, usedAt: new Date() });

  await writeAuditLog(orgId, projectId, user.uid, "member.accept", {
    inviteId: inviteDoc.id,
    role: inviteData.role,
  });

  return NextResponse.json({ success: true });
}

/* List members */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const snaps = await membersCol(firestore, orgId, projectId).get();
  const members: any[] = [];
  snaps.forEach((d: any) => members.push({ id: d.id, ...d.data() }));

  return NextResponse.json({ members });
}

/* Change role or remove member determined by query/method */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const body = await request.json();
  const parsed = ChangeRoleSchema.parse(body);

  const memberRef = membersCol(firestore, orgId, projectId).doc(memberId);
  await memberRef.update({ role: parsed.role, updatedAt: new Date() });

  await writeAuditLog(orgId, projectId, user.uid, "member.role_change", {
    memberId,
    role: parsed.role,
  });
  return NextResponse.json({ success: true });
}

/* Delete (remove) member */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await requireOrgAuth(request);
  const { firestore } = initializeAdmin();
  const orgId = user.orgId;

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const memberRef = membersCol(firestore, orgId, projectId).doc(memberId);
  await memberRef.delete();

  await writeAuditLog(orgId, projectId, user.uid, "member.remove", { memberId });
  return NextResponse.json({ success: true });
}
