/**
 * Invitations API Client Functions
 *
 * Client-side helper functions for invitation operations.
 * These functions handle API communication and error handling.
 */

import {
  Invitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
  DeclineInvitationRequest,
  InvitationStatus,
  ListInvitationsResponse,
} from "@/lib/types/invitation";

// ============================================================================
// INVITATION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new invitation
 * Admin and safety_manager only
 */
export async function createInvitation(
  data: CreateInvitationRequest,
  token: string
): Promise<{ invitation: Invitation; emailSent: boolean; message: string }> {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create invitation");
  }

  const result = await response.json();
  return result.data;
}

/**
 * List all invitations for the organization
 * Admin and safety_manager only
 */
export async function listInvitations(
  token: string,
  options?: {
    status?: InvitationStatus;
    activeOnly?: boolean;
  }
): Promise<ListInvitationsResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append("status", options.status);
  if (options?.activeOnly !== undefined) {
    params.append("activeOnly", options.activeOnly.toString());
  }

  const response = await fetch(`/api/invitations?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch invitations");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get invitation details by ID and token (public)
 */
export async function getInvitationByToken(
  invitationId: string,
  token: string,
  orgId: string
): Promise<{ invitation: Invitation }> {
  const params = new URLSearchParams({
    token,
    orgId,
  });

  const response = await fetch(`/api/invitations/${invitationId}?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch invitation");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Cancel an invitation
 * Admin and safety_manager only
 */
export async function cancelInvitation(invitationId: string, token: string): Promise<void> {
  const response = await fetch(`/api/invitations/${invitationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to cancel invitation");
  }
}

// ============================================================================
// INVITATION ACCEPTANCE/DECLINE
// ============================================================================

/**
 * Accept an invitation (public)
 * Creates a new user account and adds them to the organization
 */
export async function acceptInvitation(
  invitationId: string,
  data: AcceptInvitationRequest,
  orgId: string
): Promise<{ userId: string; organizationId: string; userCreated: boolean; message: string }> {
  const params = new URLSearchParams({ orgId });

  const response = await fetch(`/api/invitations/${invitationId}/accept?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to accept invitation");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Decline an invitation (public)
 */
export async function declineInvitation(
  invitationId: string,
  data: DeclineInvitationRequest,
  orgId: string
): Promise<{ message: string }> {
  const params = new URLSearchParams({ orgId });

  const response = await fetch(`/api/invitations/${invitationId}/decline?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to decline invitation");
  }

  const result = await response.json();
  return { message: result.message };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get pending invitations count
 */
export async function getPendingInvitationsCount(token: string): Promise<number> {
  const result = await listInvitations(token, { activeOnly: true });
  return result.stats.pending;
}

/**
 * Check if an email has a pending invitation
 */
export async function hasPendingInvitation(email: string, token: string): Promise<boolean> {
  try {
    const { invitations } = await listInvitations(token, {
      status: "pending",
      activeOnly: true,
    });
    return invitations.some((inv) => inv.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error("Error checking for pending invitation:", error);
    return false;
  }
}

/**
 * Resend an invitation
 * Creates a new invitation for the same email if the previous one expired or was declined
 */
export async function resendInvitation(
  originalInvitation: Invitation,
  token: string
): Promise<{ invitation: Invitation; emailSent: boolean; message: string }> {
  // Cannot resend as admin - default to safety_manager
  const role = originalInvitation.role === "admin" ? "safety_manager" : originalInvitation.role;

  const invitationData: CreateInvitationRequest = {
    email: originalInvitation.email,
    firstName: originalInvitation.firstName,
    lastName: originalInvitation.lastName,
    role,
    phoneNumber: originalInvitation.phoneNumber,
    projectAccess: originalInvitation.projectAccess,
    assignedProjects: originalInvitation.assignedProjects,
    notes: originalInvitation.notes,
  };

  return await createInvitation(invitationData, token);
}

/**
 * Bulk invite multiple users
 * Returns results for each invitation
 */
export async function bulkInviteUsers(
  invitations: CreateInvitationRequest[],
  token: string
): Promise<
  Array<{
    email: string;
    success: boolean;
    invitation?: Invitation;
    error?: string;
  }>
> {
  const results = await Promise.allSettled(invitations.map((inv) => createInvitation(inv, token)));

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        email: invitations[index].email,
        success: true,
        invitation: result.value.invitation,
      };
    } else {
      return {
        email: invitations[index].email,
        success: false,
        error: result.reason?.message || "Failed to create invitation",
      };
    }
  });
}

/**
 * Get invitations that are expiring soon (within 24 hours)
 */
export async function getExpiringSoonInvitations(token: string): Promise<Invitation[]> {
  const { invitations } = await listInvitations(token, {
    status: "pending",
    activeOnly: true,
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return invitations.filter((inv) => {
    const expiresAt =
      inv.expiresAt instanceof Date ? inv.expiresAt : new Date(inv.expiresAt as any);
    return expiresAt > now && expiresAt <= tomorrow;
  });
}

/**
 * Parse invitation URL to extract token and orgId
 */
export function parseInvitationUrl(url: string): {
  invitationId?: string;
  token?: string;
  orgId?: string;
} {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    const orgId = urlObj.searchParams.get("orgId");

    // Extract invitation ID from path (e.g., /invitations/[id]/accept)
    const pathParts = urlObj.pathname.split("/");
    const invitationIndex = pathParts.indexOf("invitations");
    const invitationId = invitationIndex >= 0 ? pathParts[invitationIndex + 1] : undefined;

    return { invitationId, token: token || undefined, orgId: orgId || undefined };
  } catch (error) {
    console.error("Error parsing invitation URL:", error);
    return {};
  }
}

/**
 * Validate invitation data before sending
 */
export function validateInvitationData(data: CreateInvitationRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.email || !data.email.includes("@")) {
    errors.push("Valid email address is required");
  }

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("First name is required");
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push("Last name is required");
  }

  if (!["safety_manager", "supervisor", "field_worker"].includes(data.role)) {
    errors.push("Valid role is required");
  }

  if (
    data.projectAccess === "assigned" &&
    (!data.assignedProjects || data.assignedProjects.length === 0)
  ) {
    errors.push('At least one project must be assigned when project access is "assigned"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
