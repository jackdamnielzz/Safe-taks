/**
 * API Route: Accept Invitation
 *
 * Public route for accepting user invitations.
 * Creates a new user account if needed or links existing account.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setCustomClaims } from "@/lib/firebase-admin";
import { auth, db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";
import { AcceptInvitationRequest } from "@/lib/types/invitation";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const acceptInvitationSchema = z.object({
  invitationToken: z.string().min(32, "Invalid invitation token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
});

// ============================================================================
// POST /api/invitations/[id]/accept - Accept invitation
// ============================================================================

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const validatedData = acceptInvitationSchema.parse(body) as AcceptInvitationRequest;
    const { invitationToken, password } = validatedData;

    const resolvedParams = await params;
    const invitationId = resolvedParams.id;

    // Find invitation by ID
    // We need to search across organizations - this requires knowing the orgId
    // For now, we'll accept orgId as a query parameter
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

    // Check expiry
    const expiresAt = invitation.expiresAt.toDate();
    if (expiresAt < new Date()) {
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

    // Create user account
    let userId: string;
    let userCreated = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
      userId = userCredential.user.uid;
      userCreated = true;

      // Set custom claims for the new user
      await setCustomClaims(userId, {
        orgId: orgId,
        role: invitation.role,
      });
    } catch (error: any) {
      // If user already exists with this email, they need to log in first
      if (error.code === "auth/email-already-in-use") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EMAIL_EXISTS",
              message:
                "An account with this email already exists. Please log in to accept the invitation.",
            },
          },
          { status: 409 }
        );
      }
      throw error;
    }

    // Create user profile in Firestore
    const now = Timestamp.now();
    const userProfile = {
      id: userId,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      displayName: `${invitation.firstName} ${invitation.lastName}`,
      phoneNumber: invitation.phoneNumber || null,
      role: invitation.role,
      roleAssignedAt: now,
      roleAssignedBy: invitation.invitedBy,
      projectAccess: invitation.projectAccess,
      assignedProjects: invitation.assignedProjects || [],
      organizationId: orgId,
      competencies: [],
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
      acceptedInviteAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      loginCount: 1,
    };

    await setDoc(doc(db, `organizations/${orgId}/users`, userId), userProfile);

    // Update invitation status
    await updateDoc(doc(db, `organizations/${orgId}/invitations`, invitationId), {
      status: "accepted",
      acceptedAt: now,
      acceptedBy: userId,
      userCreated: userCreated,
      updatedAt: serverTimestamp(),
    });

    // Update organization user count
    const orgDoc = await getDoc(doc(db, "organizations", orgId));
    if (orgDoc.exists()) {
      const currentUserCount = orgDoc.data().usage?.userCount || 0;
      await updateDoc(doc(db, "organizations", orgId), {
        "usage.userCount": currentUserCount + 1,
        "usage.lastUpdated": serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Invitation accepted successfully",
        data: {
          userId,
          organizationId: orgId,
          userCreated,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Accept invitation error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to accept invitation"));
  }
}
