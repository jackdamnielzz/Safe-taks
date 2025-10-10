/**
 * API Route: Individual Invitation Operations
 *
 * Handles operations on specific invitations (cancel).
 * GET is for retrieving invitation details by token (public route).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";

// ============================================================================
// GET /api/invitations/[id] - Get invitation by token (public)
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return Errors.validation({ token: "Invitation token is required" });
    }

    // Search for invitation by token across all organizations
    // Note: This is a global search, but invitations are org-scoped
    // We'll need to search each org's invitations collection
    // For now, we'll require orgId in the URL or use a different approach

    // Alternative: Search by invitation ID and validate token
    const { id: invitationId } = await params;

    // We need to find the invitation across all organizations
    // This is inefficient - better to include orgId in the URL or use a global invitations collection
    // For MVP, we'll require the orgId to be passed
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return Errors.validation({ orgId: "Organization ID is required" });
    }

    const invitationDoc = await getDoc(doc(db, `organizations/${orgId}/invitations`, invitationId));

    if (!invitationDoc.exists()) {
      return Errors.notFound("Invitation");
    }

    const invitation = { id: invitationDoc.id, ...invitationDoc.data() };

    // Validate token matches
    if ((invitation as any).invitationToken !== token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid invitation token",
          },
        },
        { status: 401 }
      );
    }

    // Check if invitation is still valid
    if ((invitation as any).status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVITATION_NOT_PENDING",
            message: `This invitation has already been ${(invitation as any).status}`,
          },
        },
        { status: 400 }
      );
    }

    // Check if expired
    const expiresAt = (invitation as any).expiresAt.toDate();
    if (expiresAt < new Date()) {
      // Auto-expire the invitation
      await updateDoc(doc(db, `organizations/${orgId}/invitations`, invitationId), {
        status: "expired",
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVITATION_EXPIRED",
            message: "This invitation has expired",
          },
        },
        { status: 410 }
      );
    }

    // Return invitation details (without sensitive token)
    const { invitationToken: _, ...safeInvitation } = invitation as any;

    return NextResponse.json({
      success: true,
      data: { invitation: safeInvitation },
    });
  } catch (error: any) {
    console.error("Get invitation error:", error);
    return Errors.serverError(new Error("Failed to retrieve invitation"));
  }
}

// ============================================================================
// DELETE /api/invitations/[id] - Cancel invitation
// ============================================================================

export const DELETE = requireAuth(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    try {
      // Only admins and safety managers can cancel invitations
      if (auth.role !== "admin" && auth.role !== "safety_manager") {
        return Errors.forbidden("Only administrators and safety managers can cancel invitations");
      }

      const { id: invitationId } = await params;

      // Get invitation
      const invitationDoc = await getDoc(
        doc(db, `organizations/${auth.orgId}/invitations`, invitationId)
      );

      if (!invitationDoc.exists()) {
        return Errors.notFound("Invitation");
      }

      const invitation = invitationDoc.data();

      // Can only cancel pending invitations
      if (invitation.status !== "pending") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVITATION_NOT_PENDING",
              message: `Cannot cancel invitation with status: ${invitation.status}`,
            },
          },
          { status: 400 }
        );
      }

      // Update invitation status to canceled
      await updateDoc(doc(db, `organizations/${auth.orgId}/invitations`, invitationId), {
        status: "canceled",
        canceledAt: serverTimestamp(),
        canceledBy: auth.userId,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Invitation canceled successfully",
      });
    } catch (error: any) {
      console.error("Cancel invitation error:", error);
      return Errors.serverError(new Error("Failed to cancel invitation"));
    }
  }
);
