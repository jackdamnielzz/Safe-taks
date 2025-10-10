/**
 * API Route: Organization Member Management
 *
 * Handles adding, removing, and updating organization members.
 * Enforces role-based access control for member operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { setCustomClaims } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";
import { AddMemberRequest, UpdateMemberRequest, OrganizationRole } from "@/lib/types/organization";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["safety_manager", "supervisor", "field_worker"]),
  phoneNumber: z.string().optional(),
  projectAccess: z.enum(["all", "assigned"]).default("assigned"),
  assignedProjects: z.array(z.string()).optional(),
});

const updateMemberSchema = z.object({
  role: z.enum(["safety_manager", "supervisor", "field_worker", "admin"]).optional(),
  projectAccess: z.enum(["all", "assigned"]).optional(),
  assignedProjects: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phoneNumber: z.string().optional(),
});

// ============================================================================
// GET /api/organizations/members - List organization members
// ============================================================================

export const GET = requireAuth(async (req: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const role = searchParams.get("role") as OrganizationRole | null;

    // Build query
    let membersQuery = query(collection(db, `organizations/${auth.orgId}/users`));

    // Filter by active status
    if (activeOnly) {
      membersQuery = query(membersQuery, where("isActive", "==", true));
    }

    // Filter by role if specified
    if (role) {
      membersQuery = query(membersQuery, where("role", "==", role));
    }

    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        members,
        count: members.length,
      },
    });
  } catch (error: any) {
    console.error("List members error:", error);
    return Errors.serverError(new Error("Failed to fetch organization members"));
  }
});

// ============================================================================
// POST /api/organizations/members - Add new member to organization
// ============================================================================

export const POST = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins and safety managers can add members
    if (auth.role !== "admin" && auth.role !== "safety_manager") {
      return Errors.forbidden("Only administrators and safety managers can add members");
    }

    const body = await req.json();
    const validatedData = addMemberSchema.parse(body) as AddMemberRequest;
    const { email, firstName, lastName, role, phoneNumber, projectAccess, assignedProjects } =
      validatedData;

    // Check if email already exists in organization
    const existingMemberQuery = query(
      collection(db, `organizations/${auth.orgId}/users`),
      where("email", "==", email)
    );
    const existingMembers = await getDocs(existingMemberQuery);

    if (!existingMembers.empty) {
      return Errors.alreadyExists("User", email);
    }

    // Check organization limits
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

    // Generate user ID (will be replaced when user signs up)
    const userId = crypto.randomUUID();
    const now = Timestamp.now();

    // Create member profile
    const memberProfile = {
      id: userId,
      email,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      role,
      roleAssignedAt: now,
      roleAssignedBy: auth.userId,
      projectAccess: projectAccess || "assigned",
      assignedProjects: assignedProjects || [],
      organizationId: auth.orgId,
      invitedBy: auth.userId,
      invitedAt: now,
      isActive: false, // Will be activated when user accepts invitation
      createdAt: now,
      updatedAt: now,
    };

    // Save member profile
    await setDoc(doc(db, `organizations/${auth.orgId}/users`, userId), memberProfile);

    // Update organization user count
    await updateDoc(doc(db, "organizations", auth.orgId), {
      "usage.userCount": currentUserCount + 1,
      "usage.lastUpdated": serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // TODO: Send invitation email via Cloud Function or SendGrid

    return NextResponse.json(
      {
        success: true,
        message: "Member invited successfully",
        data: {
          member: memberProfile,
          invitationSent: true,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Add member error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to add member"));
  }
});

// ============================================================================
// PATCH /api/organizations/members/[id] - Update member
// ============================================================================

export const PATCH = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins and safety managers can update members
    if (auth.role !== "admin" && auth.role !== "safety_manager") {
      return Errors.forbidden("Only administrators and safety managers can update members");
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return Errors.validation({ id: "Member ID is required" });
    }

    const body = await req.json();
    const validatedData = updateMemberSchema.parse(body) as UpdateMemberRequest;

    // Get existing member
    const memberDoc = await getDoc(doc(db, `organizations/${auth.orgId}/users`, memberId));

    if (!memberDoc.exists()) {
      return Errors.notFound("Member");
    }

    const existingMember = memberDoc.data();

    // Prevent non-admins from promoting to admin
    if (validatedData.role === "admin" && auth.role !== "admin") {
      return Errors.forbidden("Only administrators can promote users to admin role");
    }

    // Prevent users from demoting themselves
    if (
      memberId === auth.userId &&
      validatedData.role &&
      validatedData.role !== existingMember.role
    ) {
      return Errors.forbidden("You cannot change your own role");
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
      updateData.roleAssignedAt = serverTimestamp();
      updateData.roleAssignedBy = auth.userId;
    }

    if (validatedData.projectAccess !== undefined) {
      updateData.projectAccess = validatedData.projectAccess;
    }

    if (validatedData.assignedProjects !== undefined) {
      updateData.assignedProjects = validatedData.assignedProjects;
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    if (validatedData.firstName !== undefined) {
      updateData.firstName = validatedData.firstName;
    }

    if (validatedData.lastName !== undefined) {
      updateData.lastName = validatedData.lastName;
    }

    if (validatedData.phoneNumber !== undefined) {
      updateData.phoneNumber = validatedData.phoneNumber;
    }

    // Update member document
    await updateDoc(doc(db, `organizations/${auth.orgId}/users`, memberId), updateData);

    // Update custom claims if role changed
    if (validatedData.role && existingMember.uid) {
      await setCustomClaims(existingMember.uid, {
        orgId: auth.orgId,
        role: validatedData.role,
      });
    }

    // Fetch updated member
    const updatedMemberDoc = await getDoc(doc(db, `organizations/${auth.orgId}/users`, memberId));
    const updatedMember = { id: updatedMemberDoc.id, ...updatedMemberDoc.data() };

    return NextResponse.json({
      success: true,
      message: "Member updated successfully",
      data: { member: updatedMember },
    });
  } catch (error: any) {
    console.error("Update member error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to update member"));
  }
});

// ============================================================================
// DELETE /api/organizations/members/[id] - Remove member
// ============================================================================

export const DELETE = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins can remove members
    if (auth.role !== "admin") {
      return Errors.forbidden("Only administrators can remove members");
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return Errors.validation({ id: "Member ID is required" });
    }

    // Prevent self-deletion
    if (memberId === auth.userId) {
      return Errors.forbidden("You cannot remove yourself from the organization");
    }

    // Get member
    const memberDoc = await getDoc(doc(db, `organizations/${auth.orgId}/users`, memberId));

    if (!memberDoc.exists()) {
      return Errors.notFound("Member");
    }

    // Soft delete by setting isActive to false
    await updateDoc(doc(db, `organizations/${auth.orgId}/users`, memberId), {
      isActive: false,
      removedAt: serverTimestamp(),
      removedBy: auth.userId,
      updatedAt: serverTimestamp(),
    });

    // Update organization user count
    const orgDoc = await getDoc(doc(db, "organizations", auth.orgId));
    if (orgDoc.exists()) {
      const currentUserCount = orgDoc.data().usage?.userCount || 0;
      await updateDoc(doc(db, "organizations", auth.orgId), {
        "usage.userCount": Math.max(0, currentUserCount - 1),
        "usage.lastUpdated": serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return Errors.serverError(new Error("Failed to remove member"));
  }
});
