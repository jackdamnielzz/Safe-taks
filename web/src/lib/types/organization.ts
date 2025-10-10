/**
 * Organization Type Definitions
 * Based on FIRESTORE_DATA_MODEL.md
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export type SubscriptionTier = "trial" | "starter" | "professional" | "enterprise";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "paused";
export type IndustryType = "construction" | "industrial" | "offshore" | "logistics" | "other";
export type ComplianceFramework = "vca" | "iso45001" | "both";
export type ApprovalWorkflowType = "simple" | "standard" | "enterprise";

export interface OrganizationSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Timestamp | Date;
  currentPeriodEnd: Timestamp | Date;
  trialEndsAt?: Timestamp | Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface OrganizationLimits {
  maxUsers: number;
  maxProjects: number;
  maxTRAs: number;
  maxStorageGB: number;
}

export interface OrganizationUsage {
  userCount: number;
  projectCount: number;
  traCount: number;
  storageGB: number;
  lastUpdated: Timestamp | Date;
}

export interface OrganizationSettings {
  // TRA Settings
  defaultTRAValidityMonths: number;
  approvalWorkflow: ApprovalWorkflowType;
  requireDigitalSignatures: boolean;

  // LMRA Settings
  requireGPSVerification: boolean;
  requirePhotoDocumentation: boolean;
  allowOfflineExecution: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;

  // Compliance
  complianceFramework: ComplianceFramework;
  enableAuditLog: boolean;

  // General
  industry?: string;
  timeZone: string;
  language: string;
}

export interface OrganizationBranding {
  logoURL?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface Organization {
  // Identity
  id: string;
  name: string;
  slug: string;

  // Business Information
  industry?: IndustryType;
  country?: string;
  language: "nl" | "en";

  // Subscription & Billing
  subscription: OrganizationSubscription;

  // Usage Limits & Current Usage
  limits?: OrganizationLimits;
  usage?: OrganizationUsage;

  // Settings
  settings: OrganizationSettings;

  // Branding
  branding?: OrganizationBranding;

  // Metadata
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  isActive: boolean;
}

// ============================================================================
// ORGANIZATION MEMBER TYPES
// ============================================================================

export type OrganizationRole = "admin" | "safety_manager" | "supervisor" | "field_worker";
export type ProjectAccess = "all" | "assigned";

export interface OrganizationMember {
  // Identity
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;

  // Profile
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  // Role & Permissions
  role: OrganizationRole;
  roleAssignedAt: Timestamp | Date;
  roleAssignedBy: string;

  // Project Assignment
  projectAccess: ProjectAccess;
  assignedProjects?: string[];

  // Organization Context
  organizationId: string;

  // Metadata
  invitedBy?: string;
  invitedAt?: Timestamp | Date;
  acceptedInviteAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  isActive: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  settings?: Partial<OrganizationSettings>;
  industry?: IndustryType;
  country?: string;
  language?: "nl" | "en";
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  industry?: IndustryType;
  country?: string;
  language?: "nl" | "en";
  settings?: Partial<OrganizationSettings>;
  branding?: Partial<OrganizationBranding>;
}

export interface AddMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: OrganizationRole;
  phoneNumber?: string;
  projectAccess?: ProjectAccess;
  assignedProjects?: string[];
}

export interface UpdateMemberRequest {
  role?: OrganizationRole;
  projectAccess?: ProjectAccess;
  assignedProjects?: string[];
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrganizationRole;
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;
  status: "pending" | "accepted" | "expired" | "revoked";
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
  memberCount: number;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  };
  memberCount: number;
  projectCount: number;
  traCount: number;
  createdAt: Timestamp | Date;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  defaultTRAValidityMonths: 6,
  approvalWorkflow: "standard",
  requireDigitalSignatures: false,
  requireGPSVerification: true,
  requirePhotoDocumentation: true,
  allowOfflineExecution: true,
  emailNotifications: true,
  pushNotifications: true,
  complianceFramework: "vca",
  enableAuditLog: true,
  timeZone: "Europe/Amsterdam",
  language: "nl",
};

export const SUBSCRIPTION_TIER_LIMITS: Record<SubscriptionTier, OrganizationLimits> = {
  trial: {
    maxUsers: 3,
    maxProjects: 2,
    maxTRAs: 10,
    maxStorageGB: 1,
  },
  starter: {
    maxUsers: 10,
    maxProjects: 5,
    maxTRAs: 100,
    maxStorageGB: 10,
  },
  professional: {
    maxUsers: 50,
    maxProjects: 25,
    maxTRAs: 500,
    maxStorageGB: 50,
  },
  enterprise: {
    maxUsers: 999999, // Effectively unlimited
    maxProjects: 999999,
    maxTRAs: 999999,
    maxStorageGB: 500,
  },
};

export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  field_worker: 1,
  supervisor: 2,
  safety_manager: 3,
  admin: 4,
};

/**
 * Check if a role has sufficient permissions (is equal or higher)
 */
export function hasRolePermission(
  userRole: OrganizationRole,
  requiredRole: OrganizationRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if organization is within usage limits
 */
export function isWithinLimits(
  usage: OrganizationUsage,
  limits: OrganizationLimits
): {
  withinLimits: boolean;
  exceeded: string[];
} {
  const exceeded: string[] = [];

  if (usage.userCount >= limits.maxUsers) exceeded.push("users");
  if (usage.projectCount >= limits.maxProjects) exceeded.push("projects");
  if (usage.traCount >= limits.maxTRAs) exceeded.push("tras");
  if (usage.storageGB >= limits.maxStorageGB) exceeded.push("storage");

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Get subscription tier display name
 */
export function getSubscriptionTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    trial: "Trial",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };
  return names[tier];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: OrganizationRole): string {
  const names: Record<OrganizationRole, string> = {
    admin: "Administrator",
    safety_manager: "Safety Manager",
    supervisor: "Supervisor",
    field_worker: "Field Worker",
  };
  return names[role];
}
