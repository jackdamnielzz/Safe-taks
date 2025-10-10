/**
 * API Route: Set Custom Claims for User
 *
 * Sets custom claims (orgId, role) on a Firebase user for role-based access control.
 * Only admin users can assign roles to other users.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { setCustomClaims } from "@/lib/firebase-admin";
import { Errors } from "@/lib/api/errors";
import { canManageUsers } from "@/lib/api/permissions";

const setClaimsSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  role: z.enum(["admin", "safety_manager", "supervisor", "field_worker"]),
});

export const POST = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Parse request body
    const body = await req.json();
    const { targetUserId, organizationId, role } = setClaimsSchema.parse(body);

    // Check if user has permission to manage other users
    if (!canManageUsers(auth.role)) {
      return Errors.forbidden("manage user roles");
    }

    // Ensure the admin can only assign users to their own organization
    if (organizationId !== auth.orgId) {
      return Errors.organizationMismatch();
    }

    // Set custom claims on the target user
    await setCustomClaims(targetUserId, {
      orgId: organizationId,
      role: role,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully set role '${role}' for user in organization '${organizationId}'`,
      data: {
        userId: targetUserId,
        organizationId,
        role,
      },
    });
  } catch (error: any) {
    console.error("Set claims error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    if (error.code === "auth/user-not-found") {
      return Errors.notFound("User");
    }

    return Errors.serverError(new Error("Failed to set user claims"));
  }
});
