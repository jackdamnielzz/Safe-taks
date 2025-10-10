/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides authorization helpers for API routes based on user roles.
 * Implements hierarchical role system with permission checks.
 *
 * @see API_ARCHITECTURE.md Section 5.2 for authorization patterns
 * @see firestore.rules for database-level security rules
 */

import { db } from "@/lib/firebase-admin";

/**
 * User roles in hierarchical order (highest to lowest privilege)
 */
export type Role = "admin" | "safety_manager" | "supervisor" | "field_worker";

/**
 * Role hierarchy levels for comparison
 */
const roleHierarchy: Record<Role, number> = {
  admin: 4,
  safety_manager: 3,
  supervisor: 2,
  field_worker: 1,
};

/**
 * Checks if user has required role or higher in hierarchy
 *
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns True if user has sufficient role
 *
 * @example
 * ```typescript
 * hasRole('admin', 'supervisor') // true (admin >= supervisor)
 * hasRole('field_worker', 'supervisor') // false
 * ```
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Checks if user is an admin
 */
export function isAdmin(role: Role): boolean {
  return role === "admin";
}

/**
 * Checks if user is safety manager or higher
 */
export function isSafetyManager(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

/**
 * Checks if user is supervisor or higher
 */
export function isSupervisor(role: Role): boolean {
  return hasRole(role, "supervisor");
}

// ============================================================================
// TRA Permissions
// ============================================================================

/**
 * Check if user can create TRAs
 * Required: Supervisor role or higher
 */
export function canCreateTRA(role: Role): boolean {
  return hasRole(role, "supervisor");
}

/**
 * Check if user can edit a specific TRA
 *
 * Rules:
 * - Admins and safety managers can edit any TRA
 * - Supervisors can only edit drafts they created
 * - Field workers cannot edit TRAs
 *
 * @param userId - User ID attempting edit
 * @param role - User's role
 * @param traId - TRA ID to edit
 * @param orgId - Organization ID
 */
export async function canEditTRA(
  userId: string,
  role: Role,
  traId: string,
  orgId: string
): Promise<boolean> {
  // Admins and safety managers can edit any TRA
  if (hasRole(role, "safety_manager")) {
    return true;
  }

  // Supervisors can only edit drafts they created
  if (role === "supervisor") {
    try {
      const traDoc = await db
        .collection("organizations")
        .doc(orgId)
        .collection("tras")
        .doc(traId)
        .get();

      if (!traDoc.exists) {
        return false;
      }

      const traData = traDoc.data();
      return traData?.status === "draft" && traData?.createdBy === userId;
    } catch (error) {
      console.error("Error checking TRA edit permission:", error);
      return false;
    }
  }

  // Field workers cannot edit
  return false;
}

/**
 * Check if user can approve TRAs
 * Required: Safety manager or admin
 */
export function canApproveTRA(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

/**
 * Check if user can delete TRAs
 * Required: Admin only
 */
export function canDeleteTRA(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can view a TRA
 * All organization members can view TRAs
 */
export function canViewTRA(role: Role): boolean {
  return true; // All roles can view
}

// ============================================================================
// Organization & User Management Permissions
// ============================================================================

/**
 * Check if user can manage organization settings
 * Required: Admin only
 */
export function canManageOrganization(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can invite/manage users
 * Required: Admin only
 */
export function canManageUsers(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can assign roles
 * Required: Admin only
 */
export function canAssignRoles(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can view organization users
 * Required: Supervisor or higher
 */
export function canViewUsers(role: Role): boolean {
  return hasRole(role, "supervisor");
}

// ============================================================================
// Project Management Permissions
// ============================================================================

/**
 * Check if user can create projects
 * Required: Safety manager or admin
 */
export function canCreateProject(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

/**
 * Check if user can edit projects
 * Required: Safety manager or admin
 */
export function canEditProject(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

/**
 * Check if user can delete projects
 * Required: Admin only
 */
export function canDeleteProject(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can view projects
 * All organization members can view projects
 */
export function canViewProjects(role: Role): boolean {
  return true; // All roles can view
}

// ============================================================================
// Template Management Permissions
// ============================================================================

/**
 * Check if user can create/edit templates
 * Required: Safety manager or admin
 */
export function canManageTemplates(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

/**
 * Check if user can view templates
 * All organization members can view templates
 */
export function canViewTemplates(role: Role): boolean {
  return true; // All roles can view
}

// ============================================================================
// LMRA Permissions
// ============================================================================

/**
 * Check if user can create LMRA sessions
 * All organization members can create LMRA sessions
 */
export function canCreateLMRA(role: Role): boolean {
  return true; // All roles can create LMRA sessions
}

/**
 * Check if user can edit their own LMRA sessions
 */
export async function canEditLMRA(
  userId: string,
  role: Role,
  sessionId: string,
  orgId: string
): Promise<boolean> {
  // Admins and safety managers can edit any LMRA
  if (hasRole(role, "safety_manager")) {
    return true;
  }

  // Others can only edit their own sessions
  try {
    const sessionDoc = await db
      .collection("organizations")
      .doc(orgId)
      .collection("lmraSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return false;
    }

    const sessionData = sessionDoc.data();
    return sessionData?.performedBy === userId;
  } catch (error) {
    console.error("Error checking LMRA edit permission:", error);
    return false;
  }
}

/**
 * Check if user can view LMRA sessions
 * All organization members can view LMRA sessions
 */
export function canViewLMRA(role: Role): boolean {
  return true; // All roles can view
}

// ============================================================================
// Reporting & Analytics Permissions
// ============================================================================

/**
 * Check if user can generate reports
 * Required: Supervisor or higher
 */
export function canGenerateReports(role: Role): boolean {
  return hasRole(role, "supervisor");
}

/**
 * Check if user can view analytics dashboard
 * Required: Supervisor or higher
 */
export function canViewAnalytics(role: Role): boolean {
  return hasRole(role, "supervisor");
}

/**
 * Check if user can access organization-wide analytics
 * Required: Safety manager or admin
 */
export function canViewOrgAnalytics(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

// ============================================================================
// Billing & Subscription Permissions
// ============================================================================

/**
 * Check if user can manage billing
 * Required: Admin only
 */
export function canManageBilling(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can view billing information
 * Required: Admin only
 */
export function canViewBilling(role: Role): boolean {
  return isAdmin(role);
}

// ============================================================================
// Audit & Compliance Permissions
// ============================================================================

/**
 * Check if user can view audit logs
 * Required: Admin only (sensitive data)
 */
export function canViewAuditLogs(role: Role): boolean {
  return isAdmin(role);
}

/**
 * Check if user can export compliance data
 * Required: Safety manager or admin
 */
export function canExportComplianceData(role: Role): boolean {
  return hasRole(role, "safety_manager");
}

// ============================================================================
// Resource Ownership Validation
// ============================================================================

/**
 * Checks if a resource belongs to the user's organization
 *
 * @param orgId - User's organization ID
 * @param resourcePath - Firestore document path
 * @returns True if resource belongs to organization
 */
export async function validateOrganizationOwnership(
  orgId: string,
  resourcePath: string
): Promise<boolean> {
  try {
    const docRef = db.doc(resourcePath);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    // Check if document path starts with organizations/{orgId}
    const pathParts = resourcePath.split("/");
    if (pathParts[0] === "organizations" && pathParts[1] === orgId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating organization ownership:", error);
    return false;
  }
}

/**
 * Permission check result with detailed information
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Comprehensive permission check for TRA operations
 *
 * Combines role checks with resource-specific validations
 *
 * @param userId - User ID
 * @param role - User role
 * @param orgId - Organization ID
 * @param action - Action to perform
 * @param resourceId - Optional resource ID for resource-specific checks
 */
export async function checkTRAPermission(
  userId: string,
  role: Role,
  orgId: string,
  action: "create" | "read" | "update" | "delete" | "approve",
  resourceId?: string
): Promise<PermissionCheckResult> {
  switch (action) {
    case "create":
      return {
        allowed: canCreateTRA(role),
        reason: canCreateTRA(role) ? undefined : "Requires supervisor role or higher",
      };

    case "read":
      return {
        allowed: canViewTRA(role),
        reason: undefined, // All users can read
      };

    case "update":
      if (!resourceId) {
        return { allowed: false, reason: "Resource ID required for update" };
      }
      const canEdit = await canEditTRA(userId, role, resourceId, orgId);
      return {
        allowed: canEdit,
        reason: canEdit
          ? undefined
          : "Can only edit draft TRAs you created, or have safety manager role",
      };

    case "delete":
      return {
        allowed: canDeleteTRA(role),
        reason: canDeleteTRA(role) ? undefined : "Requires admin role",
      };

    case "approve":
      return {
        allowed: canApproveTRA(role),
        reason: canApproveTRA(role) ? undefined : "Requires safety manager or admin role",
      };

    default:
      return { allowed: false, reason: "Unknown action" };
  }
}
