/**
 * TRA (Task Risk Analysis) API Helper Functions
 *
 * Client-side helper functions for TRA operations.
 * These functions handle API communication, error handling, and data transformation.
 */

import {
  TRA,
  TRASummary,
  TRAStatistics,
  TRAFilters,
  CreateTRARequest,
  UpdateTRARequest,
  SubmitTRARequest,
  ApprovalDecisionRequest,
  ListTRAsResponse,
  TaskStep,
  Hazard,
  ControlMeasure,
  TRAStatus,
  RiskLevel,
  calculateRiskScore,
  getRiskLevel,
  isTRAValid,
  isTRAExpiringSoon,
  getOverallRiskScore,
  getTotalHazardCount,
  canEditTRA,
  canSubmitTRA,
} from "@/lib/types/tra";

// ============================================================================
// TRA CRUD OPERATIONS
// ============================================================================

/**
 * Create a new TRA
 */
export async function createTRA(data: CreateTRARequest, token: string): Promise<{ tra: TRA }> {
  const response = await fetch("/api/tras", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create TRA");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get TRA by ID
 */
export async function getTRA(
  traId: string,
  token: string,
  options?: {
    includeComments?: boolean;
    includeApprovals?: boolean;
  }
): Promise<{ tra: TRA }> {
  const params = new URLSearchParams();
  if (options?.includeComments) params.append("includeComments", "true");
  if (options?.includeApprovals) params.append("includeApprovals", "true");

  const response = await fetch(`/api/tras/${traId}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch TRA");
  }

  const result = await response.json();
  return result.data;
}

/**
 * List TRAs with filtering and pagination
 */
export async function listTRAs(
  token: string,
  filters?: TRAFilters,
  pagination?: {
    pageSize?: number;
    cursor?: string;
  }
): Promise<ListTRAsResponse> {
  const params = new URLSearchParams();

  // Pagination
  if (pagination?.pageSize) params.append("pageSize", pagination.pageSize.toString());
  if (pagination?.cursor) params.append("cursor", pagination.cursor);

  // Filters
  if (filters?.projectId) params.append("projectId", filters.projectId);
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach((s) => params.append("status", s));
    } else {
      params.append("status", filters.status);
    }
  }
  if (filters?.riskLevel) {
    if (Array.isArray(filters.riskLevel)) {
      filters.riskLevel.forEach((r) => params.append("riskLevel", r));
    } else {
      params.append("riskLevel", filters.riskLevel);
    }
  }
  if (filters?.createdBy) params.append("createdBy", filters.createdBy);
  if (filters?.validityStatus) params.append("validityStatus", filters.validityStatus);
  if (filters?.templateId) params.append("templateId", filters.templateId);
  if (filters?.searchQuery) params.append("search", filters.searchQuery);
  if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
  if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());

  const response = await fetch(`/api/tras?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch TRAs");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update TRA
 */
export async function updateTRA(
  traId: string,
  data: UpdateTRARequest,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update TRA");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete (archive) TRA
 */
export async function deleteTRA(traId: string, token: string): Promise<void> {
  const response = await fetch(`/api/tras/${traId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete TRA");
  }
}

// ============================================================================
// TRA WORKFLOW OPERATIONS
// ============================================================================

/**
 * Submit TRA for approval
 */
export async function submitTRA(data: SubmitTRARequest, token: string): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${data.traId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ comments: data.comments }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to submit TRA");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Approve or reject TRA at current approval step
 */
export async function approveTRA(
  data: ApprovalDecisionRequest,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${data.traId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      stepNumber: data.stepNumber,
      decision: data.decision,
      comments: data.comments,
      digitalSignature: data.digitalSignature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to process approval");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Activate TRA (make it valid for use)
 */
export async function activateTRA(
  traId: string,
  validFrom: Date,
  validUntil: Date,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to activate TRA");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a revision of an existing TRA
 */
export async function createTRARevision(
  traId: string,
  reason: string,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/revise`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create revision");
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// HAZARD & CONTROL MEASURE OPERATIONS
// ============================================================================

/**
 * Add hazard to task step
 */
export async function addHazardToStep(
  traId: string,
  stepNumber: number,
  hazard: Partial<Hazard>,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/hazards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stepNumber, hazard }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to add hazard");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update hazard
 */
export async function updateHazard(
  traId: string,
  stepNumber: number,
  hazardId: string,
  updates: Partial<Hazard>,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/hazards/${hazardId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stepNumber, updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update hazard");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete hazard from task step
 */
export async function deleteHazard(
  traId: string,
  stepNumber: number,
  hazardId: string,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/hazards/${hazardId}?stepNumber=${stepNumber}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete hazard");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Add control measure to hazard
 */
export async function addControlMeasure(
  traId: string,
  stepNumber: number,
  hazardId: string,
  controlMeasure: Partial<ControlMeasure>,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(`/api/tras/${traId}/hazards/${hazardId}/controls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stepNumber, controlMeasure }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to add control measure");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update control measure
 */
export async function updateControlMeasure(
  traId: string,
  stepNumber: number,
  hazardId: string,
  controlMeasureId: string,
  updates: Partial<ControlMeasure>,
  token: string
): Promise<{ tra: TRA }> {
  const response = await fetch(
    `/api/tras/${traId}/hazards/${hazardId}/controls/${controlMeasureId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stepNumber, updates }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update control measure");
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get TRA statistics for organization or project
 */
export async function getTRAStatistics(token: string, projectId?: string): Promise<TRAStatistics> {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);

  const response = await fetch(`/api/tras/statistics?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch statistics");
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get TRAs by project
 */
export async function getTRAsByProject(
  projectId: string,
  token: string,
  options?: {
    activeOnly?: boolean;
    includeExpired?: boolean;
  }
): Promise<TRA[]> {
  const filters: TRAFilters = {
    projectId,
    validityStatus: options?.includeExpired ? "all" : "valid",
  };

  if (options?.activeOnly) {
    filters.status = ["active", "approved"];
  }

  const { items } = await listTRAs(token, filters);
  return items;
}

/**
 * Get expiring TRAs (expiring within specified days)
 */
export async function getExpiringTRAs(token: string, daysThreshold: number = 30): Promise<TRA[]> {
  const { items } = await listTRAs(token, {
    validityStatus: "expiring_soon",
    status: "active",
  });

  return items.filter((tra) => isTRAExpiringSoon(tra, daysThreshold));
}

/**
 * Get high-risk TRAs
 */
export async function getHighRiskTRAs(token: string, projectId?: string): Promise<TRA[]> {
  const filters: TRAFilters = {
    riskLevel: ["high", "very_high"],
  };

  if (projectId) {
    filters.projectId = projectId;
  }

  const { items } = await listTRAs(token, filters);
  return items;
}

/**
 * Get TRAs pending approval
 */
export async function getPendingApprovalTRAs(token: string, projectId?: string): Promise<TRA[]> {
  const filters: TRAFilters = {
    status: ["submitted", "in_review"],
  };

  if (projectId) {
    filters.projectId = projectId;
  }

  const { items } = await listTRAs(token, filters);
  return items;
}

/**
 * Get user's TRAs (created by user)
 */
export async function getUserTRAs(userId: string, token: string): Promise<TRA[]> {
  const { items } = await listTRAs(token, {
    createdBy: userId,
  });

  return items;
}

/**
 * Format TRA for summary display
 */
export function formatTRASummary(tra: TRA): TRASummary {
  return {
    id: tra.id,
    title: tra.title,
    projectId: tra.projectId,
    projectName: tra.projectRef?.projectName || "",
    status: tra.status,
    overallRiskLevel: tra.overallRiskLevel,
    overallRiskScore: tra.overallRiskScore,
    createdBy: tra.createdBy,
    createdByName: tra.createdByName,
    createdAt: tra.createdAt,
    validFrom: tra.validFrom,
    validUntil: tra.validUntil,
    taskStepCount: tra.taskSteps.length,
    hazardCount: getTotalHazardCount(tra.taskSteps),
    lmraExecutionCount: tra.lmraExecutionCount || 0,
  };
}

/**
 * Calculate TRA compliance score
 * Based on control measures implementation and risk reduction
 */
export function calculateComplianceScore(tra: TRA): number {
  let totalHazards = 0;
  let hazardsWithControls = 0;
  let implementedControls = 0;
  let totalControls = 0;

  for (const step of tra.taskSteps) {
    for (const hazard of step.hazards) {
      totalHazards++;

      if (hazard.controlMeasures.length > 0) {
        hazardsWithControls++;
        totalControls += hazard.controlMeasures.length;

        const completed = hazard.controlMeasures.filter(
          (cm) => cm.implementationStatus === "completed" || cm.implementationStatus === "verified"
        ).length;
        implementedControls += completed;
      }
    }
  }

  if (totalHazards === 0) return 0;

  // Score = (hazards with controls / total hazards) * 50 +
  //         (implemented controls / total controls) * 50
  const controlCoverage = (hazardsWithControls / totalHazards) * 50;
  const implementationRate = totalControls > 0 ? (implementedControls / totalControls) * 50 : 0;

  return Math.round(controlCoverage + implementationRate);
}

/**
 * Check if TRA needs review (due to expiration, high risk, etc.)
 */
export function needsReview(tra: TRA): {
  needsReview: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check expiration
  if (isTRAExpiringSoon(tra, 30)) {
    reasons.push("Expiring within 30 days");
  }

  // Check if expired
  if (!isTRAValid(tra)) {
    reasons.push("TRA has expired");
  }

  // Check high risk
  if (tra.overallRiskLevel === "very_high" || tra.overallRiskLevel === "high") {
    reasons.push("High risk level");
  }

  // Check missing control measures
  const hazardsWithoutControls = tra.taskSteps.reduce((count, step) => {
    return count + step.hazards.filter((h) => h.controlMeasures.length === 0).length;
  }, 0);

  if (hazardsWithoutControls > 0) {
    reasons.push(`${hazardsWithoutControls} hazard(s) without control measures`);
  }

  // Check low compliance
  const compliance = calculateComplianceScore(tra);
  if (compliance < 70) {
    reasons.push("Low compliance score");
  }

  return {
    needsReview: reasons.length > 0,
    reasons,
  };
}

/**
 * Get TRA status display info
 */
export function getTRAStatusInfo(status: TRAStatus): {
  label: string;
  color: string;
  description: string;
} {
  const statusInfo: Record<TRAStatus, { label: string; color: string; description: string }> = {
    draft: {
      label: "Draft",
      color: "#6B7280",
      description: "TRA is being created",
    },
    submitted: {
      label: "Submitted",
      color: "#3B82F6",
      description: "Waiting for review",
    },
    in_review: {
      label: "In Review",
      color: "#8B5CF6",
      description: "Under review by approver",
    },
    approved: {
      label: "Approved",
      color: "#10B981",
      description: "Approved but not yet active",
    },
    rejected: {
      label: "Rejected",
      color: "#EF4444",
      description: "Rejected, needs revision",
    },
    active: {
      label: "Active",
      color: "#059669",
      description: "Currently valid and in use",
    },
    expired: {
      label: "Expired",
      color: "#DC2626",
      description: "Validity period ended",
    },
    archived: {
      label: "Archived",
      color: "#78716C",
      description: "Archived/deleted",
    },
  };

  return statusInfo[status];
}

/**
 * Validate TRA is ready for submission
 */
export function validateTRAForSubmission(tra: TRA): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check task steps
  if (tra.taskSteps.length === 0) {
    errors.push("TRA must have at least one task step");
  }

  // Check hazards
  for (const step of tra.taskSteps) {
    if (step.hazards.length === 0) {
      errors.push(`Task step ${step.stepNumber} has no hazards identified`);
    }

    // Check control measures
    for (const hazard of step.hazards) {
      if (hazard.controlMeasures.length === 0) {
        errors.push(`Hazard "${hazard.description.substring(0, 30)}..." has no control measures`);
      }
    }
  }

  // Check team members
  if (tra.teamMembers.length === 0) {
    errors.push("TRA must have at least one team member assigned");
  }

  // Check title and description
  if (!tra.title || tra.title.trim().length < 5) {
    errors.push("TRA title must be at least 5 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Export TRA to JSON for backup/transfer
 */
export function exportTRAToJSON(tra: TRA): string {
  return JSON.stringify(tra, null, 2);
}

/**
 * Calculate average risk score for TRA
 */
export function getAverageRiskScore(tra: TRA): number {
  let totalScore = 0;
  let hazardCount = 0;

  for (const step of tra.taskSteps) {
    for (const hazard of step.hazards) {
      totalScore += hazard.riskScore;
      hazardCount++;
    }
  }

  return hazardCount > 0 ? totalScore / hazardCount : 0;
}

/**
 * Get risk distribution for TRA
 */
export function getRiskDistribution(
  tra: TRA
): Record<RiskLevel, { count: number; percentage: number }> {
  const distribution: Record<RiskLevel, { count: number; percentage: number }> = {
    trivial: { count: 0, percentage: 0 },
    acceptable: { count: 0, percentage: 0 },
    possible: { count: 0, percentage: 0 },
    substantial: { count: 0, percentage: 0 },
    high: { count: 0, percentage: 0 },
    very_high: { count: 0, percentage: 0 },
  };

  let totalHazards = 0;

  for (const step of tra.taskSteps) {
    for (const hazard of step.hazards) {
      distribution[hazard.riskLevel].count++;
      totalHazards++;
    }
  }

  // Calculate percentages
  if (totalHazards > 0) {
    for (const level in distribution) {
      distribution[level as RiskLevel].percentage =
        (distribution[level as RiskLevel].count / totalHazards) * 100;
    }
  }

  return distribution;
}
