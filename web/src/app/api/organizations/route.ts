/**
 * API Route: Organization Management
 *
 * Handles organization CRUD operations and basic member management.
 * Supports multi-tenant isolation and role-based access control.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { requireAuth } from "@/lib/api/auth";
import { setCustomClaims, verifyIdToken } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { Errors } from "@/lib/api/errors";
import {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  DEFAULT_ORGANIZATION_SETTINGS,
  SUBSCRIPTION_TIER_LIMITS,
} from "@/lib/types/organization";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Organization slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  industry: z.enum(["construction", "industrial", "offshore", "logistics", "other"]).optional(),
  country: z.string().min(2).max(2).optional(), // ISO country code
  language: z.enum(["nl", "en"]).default("nl"),
  settings: z
    .object({
      industry: z.string().optional(),
      complianceFramework: z.enum(["vca", "iso45001", "both"]).default("vca"),
      timeZone: z.string().default("Europe/Amsterdam"),
      language: z.string().default("nl"),
    })
    .optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  industry: z.enum(["construction", "industrial", "offshore", "logistics", "other"]).optional(),
  country: z.string().min(2).max(2).optional(),
  language: z.enum(["nl", "en"]).optional(),
  settings: z
    .object({
      defaultTRAValidityMonths: z.number().min(1).max(12).optional(),
      approvalWorkflow: z.enum(["simple", "standard", "enterprise"]).optional(),
      requireDigitalSignatures: z.boolean().optional(),
      requireGPSVerification: z.boolean().optional(),
      requirePhotoDocumentation: z.boolean().optional(),
      allowOfflineExecution: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      complianceFramework: z.enum(["vca", "iso45001", "both"]).optional(),
      enableAuditLog: z.boolean().optional(),
      industry: z.string().optional(),
      timeZone: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
  branding: z
    .object({
      logoURL: z.string().url().optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    })
    .optional(),
});

// ============================================================================
// POST /api/organizations - Create new organization
// ============================================================================

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = createOrganizationSchema.parse(body) as CreateOrganizationRequest;
    const { name, slug, settings, industry, country, language } = validatedData;

    // Get current user info from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Errors.unauthorized();
    }

    const token = authHeader.substring(7);
    if (!token) {
      return Errors.unauthorized();
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return Errors.validation({ email: "User email is required" });
    }

    // Check if organization slug is unique
    const existingOrgQuery = query(collection(db, "organizations"), where("slug", "==", slug));
    const existingOrgs = await getDocs(existingOrgQuery);

    if (!existingOrgs.empty) {
      return Errors.alreadyExists("Organization", slug);
    }

    // Check if user already belongs to an organization
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().organizationId) {
      return Errors.conflict("User already belongs to an organization");
    }

    // Create organization
    const organizationId = crypto.randomUUID();
    const now = Timestamp.now();

    const organization = {
      id: organizationId,
      name,
      slug,
      industry: industry || "other",
      country: country || "NL",
      language: language || "nl",
      subscription: {
        tier: "trial",
        status: "trial",
        startDate: now,
        currentPeriodEnd: Timestamp.fromMillis(now.toMillis() + 14 * 24 * 60 * 60 * 1000),
        trialEndsAt: Timestamp.fromMillis(now.toMillis() + 14 * 24 * 60 * 60 * 1000),
      },
      limits: SUBSCRIPTION_TIER_LIMITS.trial,
      usage: {
        userCount: 1,
        projectCount: 0,
        traCount: 0,
        storageGB: 0,
        lastUpdated: now,
      },
      settings: {
        ...DEFAULT_ORGANIZATION_SETTINGS,
        ...settings,
      },
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    await setDoc(doc(db, "organizations", organizationId), organization);

    // Update user profile with organization and admin role
    const userProfile = {
      uid: userId,
      email: userEmail,
      organizationId,
      role: "admin",
      roleAssignedAt: now,
      roleAssignedBy: userId,
      projectAccess: "all",
      joinedAt: now,
      lastLoginAt: now,
      profileComplete: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, `organizations/${organizationId}/users`, userId), userProfile);

    // Set custom claims for the user
    await setCustomClaims(userId, {
      orgId: organizationId,
      role: "admin",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Organization created successfully",
        data: {
          organization: {
            id: organizationId,
            name,
            slug,
            subscription: organization.subscription,
          },
          user: {
            organizationId,
            role: "admin",
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create organization error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    if (error.code === "auth/id-token-expired") {
      return Errors.invalidToken();
    }

    return Errors.serverError(new Error("Failed to create organization"));
  }
};

// ============================================================================
// GET /api/organizations - Get organization details
// ============================================================================

export const GET = requireAuth(async (req: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeMembers = searchParams.get("includeMembers") === "true";
    const includeUsage = searchParams.get("includeUsage") === "true";

    // Get organization document
    const orgDoc = await getDoc(doc(db, "organizations", auth.orgId));

    if (!orgDoc.exists()) {
      return Errors.notFound("Organization");
    }

    const organization = { id: orgDoc.id, ...orgDoc.data() };

    // Optionally include members
    let members: any[] = [];
    let memberCount = 0;

    if (includeMembers) {
      const membersQuery = query(
        collection(db, `organizations/${auth.orgId}/users`),
        where("isActive", "==", true)
      );
      const membersSnapshot = await getDocs(membersQuery);
      members = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      memberCount = members.length;
    } else if (includeUsage) {
      // Just count members for usage stats
      const membersQuery = query(
        collection(db, `organizations/${auth.orgId}/users`),
        where("isActive", "==", true)
      );
      const membersSnapshot = await getDocs(membersQuery);
      memberCount = membersSnapshot.size;
    }

    return NextResponse.json({
      success: true,
      data: {
        organization,
        ...(includeMembers && { members }),
        ...(includeUsage && { memberCount }),
      },
    });
  } catch (error: any) {
    console.error("Get organization error:", error);
    return Errors.serverError(new Error("Failed to fetch organization"));
  }
});

// ============================================================================
// PATCH /api/organizations - Update organization
// ============================================================================

export const PATCH = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins can update organization
    if (auth.role !== "admin") {
      return Errors.forbidden("Only administrators can update organization settings");
    }

    const body = await req.json();
    const validatedData = updateOrganizationSchema.parse(body) as UpdateOrganizationRequest;

    // Check if slug is being changed and if it's unique
    if (validatedData.slug) {
      const existingOrgQuery = query(
        collection(db, "organizations"),
        where("slug", "==", validatedData.slug)
      );
      const existingOrgs = await getDocs(existingOrgQuery);

      // Check if slug belongs to a different organization
      if (!existingOrgs.empty && existingOrgs.docs[0].id !== auth.orgId) {
        return Errors.alreadyExists("Organization", validatedData.slug);
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    // Update top-level fields
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.industry) updateData.industry = validatedData.industry;
    if (validatedData.country) updateData.country = validatedData.country;
    if (validatedData.language) updateData.language = validatedData.language;

    // Update nested settings
    if (validatedData.settings) {
      Object.keys(validatedData.settings).forEach((key) => {
        updateData[`settings.${key}`] =
          validatedData.settings![key as keyof typeof validatedData.settings];
      });
    }

    // Update nested branding
    if (validatedData.branding) {
      Object.keys(validatedData.branding).forEach((key) => {
        updateData[`branding.${key}`] =
          validatedData.branding![key as keyof typeof validatedData.branding];
      });
    }

    // Update organization document
    const orgRef = doc(db, "organizations", auth.orgId);
    await updateDoc(orgRef, updateData);

    // Fetch updated organization
    const updatedOrgDoc = await getDoc(orgRef);
    const updatedOrganization = { id: updatedOrgDoc.id, ...updatedOrgDoc.data() };

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      data: { organization: updatedOrganization },
    });
  } catch (error: any) {
    console.error("Update organization error:", error);

    if (error.name === "ZodError") {
      return Errors.validation(error.errors);
    }

    return Errors.serverError(new Error("Failed to update organization"));
  }
});

// ============================================================================
// DELETE /api/organizations - Soft delete organization
// ============================================================================

export const DELETE = requireAuth(async (req: NextRequest, auth) => {
  try {
    // Only admins can delete organization
    if (auth.role !== "admin") {
      return Errors.forbidden("Only administrators can delete the organization");
    }

    // Soft delete the organization
    const orgRef = doc(db, "organizations", auth.orgId);
    await updateDoc(orgRef, {
      isActive: false,
      archivedAt: serverTimestamp(),
      archivedBy: auth.userId,
      updatedAt: serverTimestamp(),
    });

    // Deactivate all users in the organization
    const usersQuery = collection(db, `organizations/${auth.orgId}/users`);
    const usersSnapshot = await getDocs(usersQuery);

    const deactivatePromises = usersSnapshot.docs.map((userDoc) =>
      updateDoc(doc(db, `organizations/${auth.orgId}/users`, userDoc.id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(deactivatePromises);

    return NextResponse.json({
      success: true,
      message: "Organization archived successfully",
    });
  } catch (error: any) {
    console.error("Delete organization error:", error);
    return Errors.serverError(new Error("Failed to archive organization"));
  }
});
