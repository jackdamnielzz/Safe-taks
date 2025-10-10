/**
 * Organization API Helper Functions
 *
 * Client-side helper functions for organization operations.
 * These functions handle API communication and error handling.
 */

import {
  Organization,
  OrganizationMember,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  OrganizationWithMembers,
  OrganizationSummary,
} from "@/lib/types/organization";

// ============================================================================
// ORGANIZATION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new organization
 * First user becomes admin automatically
 */
export async function createOrganization(
  data: CreateOrganizationRequest,
  token: string
): Promise<{ organization: Organization; user: { organizationId: string; role: string } }> {
  const response = await fetch("/api/organizations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create organization");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get organization details
 */
export async function getOrganization(
  token: string,
  options?: {
    includeMembers?: boolean;
    includeUsage?: boolean;
  }
): Promise<{ organization: Organization; members?: OrganizationMember[]; memberCount?: number }> {
  const params = new URLSearchParams();
  if (options?.includeMembers) params.append("includeMembers", "true");
  if (options?.includeUsage) params.append("includeUsage", "true");

  const response = await fetch(`/api/organizations?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch organization");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update organization details
 * Admin only
 */
export async function updateOrganization(
  data: UpdateOrganizationRequest,
  token: string
): Promise<{ organization: Organization }> {
  const response = await fetch("/api/organizations", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update organization");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Archive (soft delete) organization
 * Admin only - deactivates organization and all members
 */
export async function deleteOrganization(token: string): Promise<void> {
  const response = await fetch("/api/organizations", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete organization");
  }
}

// ============================================================================
// ORGANIZATION MEMBER OPERATIONS
// ============================================================================

/**
 * List all organization members
 */
export async function getOrganizationMembers(
  token: string,
  options?: {
    activeOnly?: boolean;
    role?: string;
  }
): Promise<{ members: OrganizationMember[]; count: number }> {
  const params = new URLSearchParams();
  if (options?.activeOnly !== undefined) {
    params.append("activeOnly", options.activeOnly.toString());
  }
  if (options?.role) {
    params.append("role", options.role);
  }

  const response = await fetch(`/api/organizations/members?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch members");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Add a new member to the organization (invite)
 * Admin and safety_manager only
 */
export async function addMemberToOrganization(
  data: AddMemberRequest,
  token: string
): Promise<{ member: OrganizationMember; invitationSent: boolean }> {
  const response = await fetch("/api/organizations/members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to add member");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update member details (role, projects, etc.)
 * Admin and safety_manager only
 */
export async function updateMemberInOrganization(
  memberId: string,
  data: UpdateMemberRequest,
  token: string
): Promise<{ member: OrganizationMember }> {
  const params = new URLSearchParams({ id: memberId });

  const response = await fetch(`/api/organizations/members?${params.toString()}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update member");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Remove a member from the organization (soft delete)
 * Admin only
 */
export async function removeMemberFromOrganization(memberId: string, token: string): Promise<void> {
  const params = new URLSearchParams({ id: memberId });

  const response = await fetch(`/api/organizations/members?${params.toString()}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to remove member");
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get organization with all members
 * Convenience function that combines getOrganization with member list
 */
export async function getOrganizationWithMembers(token: string): Promise<OrganizationWithMembers> {
  const { organization, members, memberCount } = await getOrganization(token, {
    includeMembers: true,
    includeUsage: true,
  });

  return {
    ...organization,
    members: members || [],
    memberCount: memberCount || 0,
  };
}

/**
 * Get organizations for the current user
 * (Currently single-org per user, but architecture supports multi-org)
 */
export async function getUserOrganizations(token: string): Promise<Organization[]> {
  const { organization } = await getOrganization(token);
  return [organization];
}

/**
 * Check if user can perform action based on role
 */
export function canPerformAction(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    field_worker: 1,
    supervisor: 2,
    safety_manager: 3,
    admin: 4,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 99);
}

/**
 * Check if organization is within usage limits
 */
export function checkOrganizationLimits(organization: Organization): {
  withinLimits: boolean;
  exceeded: string[];
  warnings: string[];
} {
  const { usage, limits } = organization;
  const exceeded: string[] = [];
  const warnings: string[] = [];

  if (!usage || !limits) {
    return { withinLimits: true, exceeded: [], warnings: [] };
  }

  // Check hard limits (exceeded)
  if (usage.userCount >= limits.maxUsers) {
    exceeded.push("users");
  }
  if (usage.projectCount >= limits.maxProjects) {
    exceeded.push("projects");
  }
  if (usage.traCount >= limits.maxTRAs) {
    exceeded.push("tras");
  }
  if (usage.storageGB >= limits.maxStorageGB) {
    exceeded.push("storage");
  }

  // Check warnings (approaching limits - 80%)
  if (usage.userCount >= limits.maxUsers * 0.8 && !exceeded.includes("users")) {
    warnings.push("users");
  }
  if (usage.projectCount >= limits.maxProjects * 0.8 && !exceeded.includes("projects")) {
    warnings.push("projects");
  }
  if (usage.traCount >= limits.maxTRAs * 0.8 && !exceeded.includes("tras")) {
    warnings.push("tras");
  }
  if (usage.storageGB >= limits.maxStorageGB * 0.8 && !exceeded.includes("storage")) {
    warnings.push("storage");
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
    warnings,
  };
}

/**
 * Format organization summary for dashboard display
 */
export function formatOrganizationSummary(organization: Organization): OrganizationSummary {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    subscription: {
      tier: organization.subscription.tier,
      status: organization.subscription.status,
    },
    memberCount: organization.usage?.userCount || 0,
    projectCount: organization.usage?.projectCount || 0,
    traCount: organization.usage?.traCount || 0,
    createdAt: organization.createdAt,
  };
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(organization: Organization): boolean {
  const activeStatuses = ["trial", "active"];
  return activeStatuses.includes(organization.subscription.status);
}

/**
 * Check if trial is ending soon (within 3 days)
 */
export function isTrialEndingSoon(organization: Organization): boolean {
  if (organization.subscription.status !== "trial" || !organization.subscription.trialEndsAt) {
    return false;
  }

  const trialEnd = new Date(organization.subscription.trialEndsAt as any);
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return trialEnd <= threeDaysFromNow && trialEnd > now;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(organization: Organization): number | null {
  if (organization.subscription.status !== "trial" || !organization.subscription.trialEndsAt) {
    return null;
  }

  const trialEnd = new Date(organization.subscription.trialEndsAt as any);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Validate organization slug format
 */
export function isValidOrganizationSlug(slug: string): boolean {
  // Must be 2-50 characters, lowercase letters, numbers, and hyphens only
  const slugRegex = /^[a-z0-9-]{2,50}$/;
  return slugRegex.test(slug);
}

/**
 * Generate organization slug from name
 */
export function generateOrganizationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .substring(0, 50); // Limit to 50 characters
}
