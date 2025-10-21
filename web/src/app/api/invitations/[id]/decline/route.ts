/**
 * API Route: Decline Invitation
 *
 * Public route for declining user invitations.
 * Users can optionally provide a reason for declining.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";
import { DeclineInvitationRequest } from "@/lib/types/invitation";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const declineInvitationSchema = z.object({
  invitationToken: z.string().min(32, "Invalid invitation token"),
  reason: z.string().max(500).optional(),
});

// ============================================================================
// POST /api/invitations/[id]/decline - Decline invitation
// ============================================================================

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const validatedData = declineInvitationSchema.parse(body) as DeclineInvitationRequest;
    const { invitationToken, reason } = validatedData;

    const { id: invitationId } = await params;

    // Get orgId from query parameters
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return Errors.validation({ orgId: "Organization ID is required" });
    }

    const invitationDoc = await getDoc(doc(db, `organizations/${orgId}/invitations`, invitationId));

    if (!invitationDoc.exists()) {
      return Errors.notFound("Invitation");
    }

    const invitation = invitationDoc.data();

    // Validate token
    if (invitation.invitationToken !== invitationToken) {
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

    // Check status
    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVITATION_NOT_PENDING",
            message: `This invitation has already been ${invitation.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Update invitation status to declined
    const updateData: any = {
      status: "declined",
      declinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (reason) {
      updateData.declineReason = reason;
    }

    await updateDoc(doc(db, `organizations/${orgId}/invitations`, invitationId), updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Invitation declined successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Decline invitation error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to decline invitation"));
  }
}
