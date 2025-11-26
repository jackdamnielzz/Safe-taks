import { NextResponse } from "next/server";
import { initializeAdmin, requireOrgAuth } from "@/lib/server-helpers";
import { Errors } from "@/lib/api/errors";

/**
 * TRA Detail API route
 * GET /api/tras/[traId] -> fetch single TRA by ID
 */

initializeAdmin();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ traId: string }> }
) {
  try {
    // Auth check
    const auth = await requireOrgAuth(request).catch(() => null);
    if (!auth) return Errors.unauthorized();
    const { orgId } = auth;

    const { traId } = await params;

    if (!traId) {
      return Errors.validation({ traId: "TRA ID is required" });
    }

    const { firestore } = initializeAdmin();
    const docRef = firestore.collection(`organizations/${orgId}/tras`).doc(traId);

    let doc;
    try {
      doc = await docRef.get();
    } catch (error) {
      console.warn("Firestore connection issue:", error);
      // Return 404 for development/demo purposes
      return NextResponse.json({ error: "TRA not found" }, { status: 404 });
    }

    if (!doc.exists) {
      return NextResponse.json({ error: "TRA not found" }, { status: 404 });
    }

    const tra = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json(tra);
  } catch (err) {
    console.error("GET /api/tras/[traId] error:", err);
    return Errors.serverError(err as Error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ traId: string }> }
) {
  try {
    // Auth check
    const auth = await requireOrgAuth(request).catch(() => null);
    if (!auth) return Errors.unauthorized();
    const { orgId, uid } = auth;

    const { traId } = await params;
    const body = await request.json();

    if (!traId) {
      return Errors.validation({ traId: "TRA ID is required" });
    }

    // For development/demo, return success
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ id: traId, status: "updated" }, { status: 200 });
    }

    const { firestore } = initializeAdmin();
    const docRef = firestore.collection(`organizations/${orgId}/tras`).doc(traId);

    // Check if TRA exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "TRA not found" }, { status: 404 });
    }

    // Update TRA
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: uid,
    };

    await docRef.update(updateData);

    return NextResponse.json({ id: traId, status: "updated" }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/tras/[traId] error:", err);
    return Errors.serverError(err as Error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ traId: string }> }
) {
  try {
    // Auth check
    const auth = await requireOrgAuth(request).catch(() => null);
    if (!auth) return Errors.unauthorized();
    const { orgId, uid } = auth;

    const { traId } = await params;

    if (!traId) {
      return Errors.validation({ traId: "TRA ID is required" });
    }

    // For development/demo, return success
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ id: traId, status: "deleted" }, { status: 200 });
    }

    const { firestore } = initializeAdmin();
    const docRef = firestore.collection(`organizations/${orgId}/tras`).doc(traId);

    // Check if TRA exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "TRA not found" }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await docRef.update({
      isActive: false,
      archivedAt: new Date().toISOString(),
      archivedBy: uid,
    });

    return NextResponse.json({ id: traId, status: "deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/tras/[traId] error:", err);
    return Errors.serverError(err as Error);
  }
}
