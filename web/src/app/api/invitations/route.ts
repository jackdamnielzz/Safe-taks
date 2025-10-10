/**
 * API Route: User Invitations Management
 *
 * Handles creating and listing user invitations.
 * Only admins and safety managers can send invitations.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";
import { CreateInvitationRequest, InvitationStatus } from "@/lib/types/invitation";
import { generateInvitationToken } from "@/lib/types/invitation";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["safety_manager", "supervisor", "field_worker"]),
  phoneNumber: z.string().optional(),
  projectAccess: z.enum(["all", "assigned"]).default("assigned"),
  assignedProjects: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// GET /api/invitations - List organization invitations
// ============================================================================

export const GET = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins and safety managers can view invitations
    if (auth.role !== "admin" && auth.role !== "safety_manager") {
      return Errors.forbidden("Only administrators and safety managers can view invitations");
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as InvitationStatus | null;
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Build query
    let invitationsQuery = query(collection(db, `organizations/${auth.orgId}/invitations`));

    // Filter by status if specified
    if (status) {
      invitationsQuery = query(invitationsQuery, where("status", "==", status));
    } else if (activeOnly) {
      // Default: only show pending invitations
      invitationsQuery = query(invitationsQuery, where("status", "==", "pending"));
    }

    const invitationsSnapshot = await getDocs(invitationsQuery);
    const invitations = invitationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Calculate statistics
    const stats = {
      total: invitations.length,
      pending: invitations.filter((inv: any) => inv.status === "pending").length,
      accepted: invitations.filter((inv: any) => inv.status === "accepted").length,
      declined: invitations.filter((inv: any) => inv.status === "declined").length,
      expired: invitations.filter((inv: any) => inv.status === "expired").length,
      canceled: invitations.filter((inv: any) => inv.status === "canceled").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        invitations,
        stats,
      },
    });
  } catch (error: any) {
    console.error("List invitations error:", error);
    return Errors.serverError(new Error("Failed to fetch invitations"));
  }
});

// ============================================================================
// POST /api/invitations - Create new invitation
// ============================================================================

export const POST = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins and safety managers can send invitations
    if (auth.role !== "admin" && auth.role !== "safety_manager") {
      return Errors.forbidden("Only administrators and safety managers can send invitations");
    }

    const body = await req.json();
    const validatedData = createInvitationSchema.parse(body) as CreateInvitationRequest;
    const {
      email,
      firstName,
      lastName,
      role,
      phoneNumber,
      projectAccess,
      assignedProjects,
      notes,
    } = validatedData;

    // Check if email already exists as an active member
    const existingMemberQuery = query(
      collection(db, `organizations/${auth.orgId}/users`),
      where("email", "==", email.toLowerCase()),
      where("isActive", "==", true)
    );
    const existingMembers = await getDocs(existingMemberQuery);

    if (!existingMembers.empty) {
      return Errors.alreadyExists("User", email);
    }

    // Check for existing pending invitations
    const existingInvitationQuery = query(
      collection(db, `organizations/${auth.orgId}/invitations`),
      where("email", "==", email.toLowerCase()),
      where("status", "==", "pending")
    );
    const existingInvitations = await getDocs(existingInvitationQuery);

    if (!existingInvitations.empty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVITATION_EXISTS",
            message: "An active invitation already exists for this email address",
          },
        },
        { status: 409 }
      );
    }

    // Get organization details
    const orgDoc = await getDoc(doc(db, "organizations", auth.orgId));
    if (!orgDoc.exists()) {
      return Errors.notFound("Organization");
    }

    const organization = orgDoc.data();
    const currentUserCount = organization.usage?.userCount || 0;
    const maxUsers = organization.limits?.maxUsers || 10;

    if (currentUserCount >= maxUsers) {
      return Errors.resourceLimitReached("users", maxUsers);
    }

    // Get inviter information
    const inviterDoc = await getDoc(doc(db, `organizations/${auth.orgId}/users`, auth.userId));
    const inviterName = inviterDoc.exists()
      ? `${inviterDoc.data().firstName} ${inviterDoc.data().lastName}`
      : "Administrator";
    const inviterEmail = inviterDoc.exists() ? inviterDoc.data().email : "";

    // Generate invitation
    const invitationId = crypto.randomUUID();
    const invitationToken = generateInvitationToken();
    const now = Timestamp.now();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Base URL for acceptance link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptanceUrl = `${baseUrl}/auth/accept-invitation?token=${invitationToken}`;

    const invitation = {
      id: invitationId,
      organizationId: auth.orgId,
      organizationName: organization.name,
      email: email.toLowerCase(),
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      role,
      projectAccess: projectAccess || "assigned",
      assignedProjects: assignedProjects || [],
      status: "pending" as InvitationStatus,
      invitedBy: auth.userId,
      invitedByName: inviterName,
      invitedByEmail: inviterEmail,
      invitationToken,
      acceptanceUrl,
      createdAt: now,
      expiresAt: Timestamp.fromDate(expiresAt),
      emailSent: false,
      remindersSent: 0,
      notes: notes || null,
    };

    // Save invitation
    await setDoc(doc(db, `organizations/${auth.orgId}/invitations`, invitationId), invitation);

    // TODO: Send invitation email via Cloud Function or SendGrid
    // For now, we'll mark it as email not sent yet
    console.log("TODO: Send invitation email to:", email);
    console.log("Acceptance URL:", acceptanceUrl);

    return NextResponse.json(
      {
        success: true,
        message: "Invitation created successfully",
        data: {
          invitation,
          emailSent: false,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create invitation error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to create invitation"));
  }
});
