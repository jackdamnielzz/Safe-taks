/**
 * Approval workflow types for TRA system
 *
 * Documents are designed to be stored under:
 * - /tras/{traId}/approvals/{approvalId}
 * - Or central collection: /approvals/{approvalId} with ref to traId
 */

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ApprovalStep {
  step: number; // 1-based step index
  name: string; // e.g., "Safety Manager Review"
  approverRole: string; // role required to approve, e.g., "safety_manager"
  approverId?: string | null; // assigned user ID (optional)
  dueDate?: number | null; // epoch ms
  status: ApprovalStatus;
  decidedAt?: number | null; // epoch ms
  decidedBy?: string | null; // userId
  comments?: string | null;
}

export interface ApprovalRequest {
  id: string;
  traId: string;
  templateId?: string | null;
  createdBy: string;
  createdAt: number; // epoch ms
  updatedAt?: number;
  currentStep: number;
  steps: ApprovalStep[];
  status: ApprovalStatus;
  notificationsSent?: string[]; // channels or timestamps
  metadata?: Record<string, any>;
}

/**
 * Minimal payload to create an approval workflow for a TRA
 */
export interface CreateApprovalPayload {
  traId: string;
  createdBy: string;
  steps: Array<{
    name: string;
    approverRole: string;
    approverId?: string | null;
    dueDate?: number | null;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Action performed by an approver
 */
export interface ApprovalAction {
  approvalId: string;
  step: number;
  action: "approve" | "reject" | "request_changes";
  by: string; // userId
  comments?: string;
  timestamp: number;
}
