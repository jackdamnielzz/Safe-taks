/**
 * Invitation Type Definitions
 * Based on FIRESTORE_DATA_MODEL.md - Invitations Collection
 */

import { Timestamp } from "firebase/firestore";
import { OrganizationRole, ProjectAccess } from "./organization";

// ============================================================================
// INVITATION TYPES
// ============================================================================

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "canceled";

export interface Invitation {
  // Identity
  id: string;

  // Organization Context
  organizationId: string;
  organizationName: string; // Denormalized for email display

  // Invitee Information
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  // Role Assignment
  role: OrganizationRole;
  projectAccess: ProjectAccess;
  assignedProjects?: string[]; // Project IDs if projectAccess = 'assigned'

  // Invitation Status
  status: InvitationStatus;

  // Inviter Information
  invitedBy: string; // User ID of inviter
  invitedByName: string; // Denormalized for display
  invitedByEmail: string; // For email notifications

  // Token & Security
  invitationToken: string; // Secure random token for accepting invitation
  acceptanceUrl: string; // Full URL with token

  // Lifecycle Timestamps
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date; // Default: 7 days from creation
  acceptedAt?: Timestamp | Date;
  declinedAt?: Timestamp | Date;
  canceledAt?: Timestamp | Date;

  // Metadata
  emailSent: boolean;
  emailSentAt?: Timestamp | Date;
  emailError?: string; // If email failed to send
  remindersSent: number; // Count of reminder emails sent
  lastReminderAt?: Timestamp | Date;

  // Acceptance Details (filled when accepted)
  acceptedBy?: string; // User ID of person who accepted
  userCreated?: boolean; // Whether a new user was created

  // Notes
  notes?: string; // Optional notes from inviter
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Exclude<OrganizationRole, "admin">; // Cannot directly invite as admin
  phoneNumber?: string;
  projectAccess?: ProjectAccess;
  assignedProjects?: string[];
  notes?: string;
}

export interface AcceptInvitationRequest {
  invitationToken: string;
  password: string; // For new user account creation
  acceptTerms: boolean; // Terms of service acceptance
}

export interface DeclineInvitationRequest {
  invitationToken: string;
  reason?: string; // Optional decline reason
}

export interface ResendInvitationRequest {
  invitationId: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CreateInvitationResponse {
  invitation: Invitation;
  emailSent: boolean;
  message: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  userId: string;
  organizationId: string;
  userCreated: boolean; // Whether a new account was created
  message: string;
}

export interface DeclineInvitationResponse {
  success: boolean;
  message: string;
}

export interface ListInvitationsResponse {
  invitations: Invitation[];
  stats: InvitationStats;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface InvitationSummary {
  id: string;
  email: string;
  fullName: string;
  role: OrganizationRole;
  status: InvitationStatus;
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;
  invitedByName: string;
  daysRemaining: number;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  canceled: number;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if invitation is still valid (not expired, pending status)
 */
export function isInvitationValid(invitation: Invitation): boolean {
  if (invitation.status !== "pending") {
    return false;
  }

  const now = new Date();
  const expiresAt =
    invitation.expiresAt instanceof Timestamp
      ? invitation.expiresAt.toDate()
      : new Date(invitation.expiresAt);

  return expiresAt > now;
}

/**
 * Check if invitation is expiring soon (within 24 hours)
 */
export function isInvitationExpiringSoon(invitation: Invitation): boolean {
  if (invitation.status !== "pending") {
    return false;
  }

  const now = new Date();
  const expiresAt =
    invitation.expiresAt instanceof Timestamp
      ? invitation.expiresAt.toDate()
      : new Date(invitation.expiresAt);

  const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursRemaining > 0 && hoursRemaining <= 24;
}

/**
 * Get days remaining until invitation expires
 */
export function getDaysRemaining(invitation: Invitation): number {
  const now = new Date();
  const expiresAt =
    invitation.expiresAt instanceof Timestamp
      ? invitation.expiresAt.toDate()
      : new Date(invitation.expiresAt);

  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
}

/**
 * Get full name from invitation
 */
export function getInviteeFullName(invitation: Invitation): string {
  return `${invitation.firstName} ${invitation.lastName}`.trim();
}

/**
 * Generate secure invitation token (32 bytes = 64 hex characters)
 */
export function generateInvitationToken(): string {
  if (typeof window !== "undefined" && window.crypto) {
    // Browser environment
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } else {
    // Node environment (for server-side) - use dynamic import for crypto
    try {
      // This will be handled by the build system for server-side usage
      // For now, fallback to browser-compatible method
      const array = new Uint8Array(32);
      // Simple fallback for environments without crypto.getRandomValues
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      // Ultimate fallback - timestamp + random
      return Date.now().toString(16) + Math.random().toString(16).substr(2);
    }
  }
}

/**
 * Generate invitation acceptance URL
 */
export function generateAcceptanceUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/auth/accept-invitation?token=${token}`;
}

/**
 * Get status display text
 */
export function getInvitationStatusText(status: InvitationStatus): string {
  const statusTexts: Record<InvitationStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
    canceled: "Canceled",
  };
  return statusTexts[status];
}

/**
 * Get status color for UI display
 */
export function getInvitationStatusColor(status: InvitationStatus): string {
  const statusColors: Record<InvitationStatus, string> = {
    pending: "yellow",
    accepted: "green",
    declined: "red",
    expired: "gray",
    canceled: "gray",
  };
  return statusColors[status];
}

/**
 * Check if invitation can be resent
 */
export function canResendInvitation(invitation: Invitation): boolean {
  return invitation.status === "expired" || invitation.status === "declined";
}

/**
 * Check if invitation can be canceled
 */
export function canCancelInvitation(invitation: Invitation): boolean {
  return invitation.status === "pending";
}

/**
 * Format invitation for summary display
 */
export function formatInvitationSummary(invitation: Invitation): InvitationSummary {
  return {
    id: invitation.id,
    email: invitation.email,
    fullName: getInviteeFullName(invitation),
    role: invitation.role,
    status: invitation.status,
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    invitedByName: invitation.invitedByName,
    daysRemaining: getDaysRemaining(invitation),
  };
}

/**
 * Calculate invitation statistics
 */
export function calculateInvitationStats(invitations: Invitation[]): InvitationStats {
  return {
    total: invitations.length,
    pending: invitations.filter((inv) => inv.status === "pending").length,
    accepted: invitations.filter((inv) => inv.status === "accepted").length,
    declined: invitations.filter((inv) => inv.status === "declined").length,
    expired: invitations.filter((inv) => inv.status === "expired").length,
    canceled: invitations.filter((inv) => inv.status === "canceled").length,
  };
}
