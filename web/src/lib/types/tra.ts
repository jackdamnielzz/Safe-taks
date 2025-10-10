/**
 * TRA (Task Risk Analysis) Type Definitions
 * Based on FIRESTORE_DATA_MODEL.md and Kinney & Wiruth risk assessment methodology
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * TRA Status - workflow states
 */
export type TRAStatus =
  | "draft" // Initial creation
  | "submitted" // Submitted for review
  | "in_review" // Under review
  | "approved" // Approved for use
  | "rejected" // Rejected, needs revision
  | "active" // Currently valid and in use
  | "expired" // Validity period ended
  | "archived"; // Archived/soft deleted

/**
 * Hazard categories based on VCA/ISO45001 standards
 */
export type HazardCategory =
  | "electrical"
  | "mechanical"
  | "chemical"
  | "biological"
  | "physical"
  | "ergonomic"
  | "psychosocial"
  | "fire_explosion"
  | "environmental"
  | "other";

/**
 * Risk levels based on Kinney & Wiruth calculations
 */
export type RiskLevel =
  | "trivial" // Risk score: 0-20
  | "acceptable" // Risk score: 21-70
  | "possible" // Risk score: 71-200
  | "substantial" // Risk score: 201-400
  | "high" // Risk score: 401-1000
  | "very_high"; // Risk score: 1000+

/**
 * Control measure types (Hierarchy of Controls)
 */
export type ControlMeasureType =
  | "elimination" // Remove the hazard
  | "substitution" // Replace with safer alternative
  | "engineering" // Engineering controls
  | "administrative" // Administrative controls
  | "ppe"; // Personal Protective Equipment

/**
 * Control measure implementation status
 */
export type ImplementationStatus = "planned" | "in_progress" | "completed" | "verified";

/**
 * Approval workflow step status
 */
export type ApprovalStepStatus = "pending" | "approved" | "rejected" | "skipped";

/**
 * Compliance frameworks
 */
export type ComplianceFramework = "vca" | "iso45001" | "both";

/**
 * Hazard source - where the hazard came from
 */
export type HazardSource =
  | "template" // From TRA template
  | "library" // From hazard library
  | "custom"; // Custom user entry

// ============================================================================
// KINNEY & WIRUTH RISK ASSESSMENT SCORES
// ============================================================================

/**
 * Effect Score (Consequence/Severity)
 * E = Effect/Consequence of incident
 */
export type EffectScore = 1 | 3 | 7 | 15 | 40 | 100;

/**
 * Exposure Score (Frequency of exposure)
 * B = Blootstelling (Dutch: Exposure)
 */
export type ExposureScore = 0.5 | 1 | 2 | 3 | 6 | 10;

/**
 * Probability Score (Likelihood of incident)
 * W = Waarschijnlijkheid (Dutch: Probability)
 */
export type ProbabilityScore = 0.1 | 0.2 | 0.5 | 1 | 3 | 6 | 10;

/**
 * Risk score = Effect × Exposure × Probability
 * Range: 0.05 to 10,000
 */
export type RiskScore = number;

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * User reference for denormalization
 */
export interface UserRef {
  uid: string;
  displayName?: string;
  email?: string;
}

/**
 * Control Measure - actions to mitigate hazards
 */
export interface ControlMeasure {
  id: string;
  type: ControlMeasureType;
  description: string;
  responsiblePerson?: string; // User ID
  responsiblePersonName?: string; // Denormalized for display
  deadline?: Timestamp | Date;
  implementationStatus?: ImplementationStatus;
  verificationMethod?: string;
  verifiedAt?: Timestamp | Date;
  verifiedBy?: string; // User ID
  notes?: string;
}

/**
 * Hazard - individual risk within a task step
 */
export interface Hazard {
  id: string; // Unique within TRA
  description: string;
  category: HazardCategory;
  source: HazardSource;

  // Kinney & Wiruth Initial Risk Assessment
  effectScore: EffectScore;
  exposureScore: ExposureScore;
  probabilityScore: ProbabilityScore;
  riskScore: RiskScore; // E × B × W
  riskLevel: RiskLevel;

  // Control Measures
  controlMeasures: ControlMeasure[];

  // Residual Risk (after controls)
  residualEffectScore?: EffectScore;
  residualExposureScore?: ExposureScore;
  residualProbabilityScore?: ProbabilityScore;
  residualRiskScore?: RiskScore;
  residualRiskLevel?: RiskLevel;

  // Metadata
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Task Step - breakdown of work with associated hazards
 */
export interface TaskStep {
  stepNumber: number;
  description: string;
  duration?: number; // Minutes
  requiredPersonnel?: number;
  location?: string;
  equipment?: string[];

  // Hazards identified in this step
  hazards: Hazard[];

  // Metadata
  notes?: string;
}

/**
 * Approval workflow step
 */
export interface ApprovalStep {
  stepNumber: number;
  name: string; // e.g., "Technical Review", "Safety Manager Approval"
  requiredRole: "safety_manager" | "supervisor" | "admin";
  approvers: string[]; // User IDs who can approve this step
  status: ApprovalStepStatus;

  // Approval details (when approved/rejected)
  approvedBy?: string; // User ID
  approvedByName?: string; // Denormalized
  approvedAt?: Timestamp | Date;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: Timestamp | Date;
  comments?: string;
  digitalSignature?: string; // Base64 encoded signature image
}

/**
 * Approval workflow
 */
export interface ApprovalWorkflow {
  steps: ApprovalStep[];
  currentStep: number; // Current step index (0-based)
  completedAt?: Timestamp | Date;
}

/**
 * Project reference for denormalization
 */
export interface ProjectRef {
  projectId: string;
  projectName: string;
  projectLocation?: string;
}

// ============================================================================
// MAIN TRA INTERFACE
// ============================================================================

/**
 * TRA (Task Risk Analysis) - Complete document
 */
export interface TRA {
  // Identity
  id: string;
  title: string;
  description?: string;

  // Relationships
  organizationId: string; // For security/queries
  projectId: string;
  projectRef?: ProjectRef; // Denormalized project info
  templateId?: string; // Source template (if used)

  // Task Breakdown
  taskSteps: TaskStep[];

  // Overall Risk Assessment
  overallRiskScore: RiskScore; // Highest risk from all hazards
  overallRiskLevel: RiskLevel;

  // Team & Competencies
  teamMembers: string[]; // User IDs
  teamMembersInfo?: UserRef[]; // Denormalized for display
  requiredCompetencies: string[]; // Required certifications/training

  // Approval Workflow
  status: TRAStatus;
  approvalWorkflow?: ApprovalWorkflow;

  // Validity Period (VCA compliance: max 12 months)
  validFrom?: Timestamp | Date;
  validUntil?: Timestamp | Date; // Max 12 months from validFrom

  // Version Control
  version: number;
  parentTraId?: string; // For revisions/copies
  revisionReason?: string;

  // Compliance
  complianceScore?: number; // 0-100%, calculated
  complianceFramework: ComplianceFramework;
  vcaCertified?: boolean;
  vcaVersion?: string;

  // Metadata
  createdBy: string; // User ID
  createdByName?: string; // Denormalized
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  updatedBy?: string;
  submittedAt?: Timestamp | Date;
  submittedBy?: string;
  approvedAt?: Timestamp | Date;
  approvedBy?: string;
  archivedAt?: Timestamp | Date;
  archivedBy?: string;

  // Statistics (for dashboards)
  lmraExecutionCount?: number;
  lastLMRAExecutedAt?: Timestamp | Date;

  // Flags
  isActive?: boolean; // Soft delete flag
  isDraft?: boolean; // Quick check for draft status
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create TRA Request
 */
export interface CreateTRARequest {
  title: string;
  description?: string;
  projectId: string;
  templateId?: string;
  taskSteps: Omit<TaskStep, "hazards">[] & { hazards?: Partial<Hazard>[] };
  teamMembers?: string[];
  requiredCompetencies?: string[];
  complianceFramework?: ComplianceFramework;
}

/**
 * Update TRA Request
 */
export interface UpdateTRARequest {
  title?: string;
  description?: string | null;
  taskSteps?: TaskStep[];
  teamMembers?: string[];
  requiredCompetencies?: string[];
  status?: TRAStatus;
  validFrom?: Timestamp | Date | null;
  validUntil?: Timestamp | Date | null;
}

/**
 * Submit TRA for Approval Request
 */
export interface SubmitTRARequest {
  traId: string;
  comments?: string;
}

/**
 * Approve/Reject TRA Request
 */
export interface ApprovalDecisionRequest {
  traId: string;
  stepNumber: number;
  decision: "approve" | "reject";
  comments?: string;
  digitalSignature?: string;
}

/**
 * TRA List Response (with pagination)
 */
export interface ListTRAsResponse {
  items: TRA[];
  nextCursor?: string;
  totalCount?: number;
  hasMore: boolean;
}

/**
 * TRA Summary for lists/dashboards
 */
export interface TRASummary {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: TRAStatus;
  overallRiskLevel: RiskLevel;
  overallRiskScore: RiskScore;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp | Date;
  validFrom?: Timestamp | Date;
  validUntil?: Timestamp | Date;
  taskStepCount: number;
  hazardCount: number;
  lmraExecutionCount: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * TRA Filter options for queries
 */
export interface TRAFilters {
  projectId?: string;
  status?: TRAStatus | TRAStatus[];
  riskLevel?: RiskLevel | RiskLevel[];
  createdBy?: string;
  validityStatus?: "valid" | "expired" | "expiring_soon" | "all";
  templateId?: string;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * TRA Statistics
 */
export interface TRAStatistics {
  totalTRAs: number;
  byStatus: Record<TRAStatus, number>;
  byRiskLevel: Record<RiskLevel, number>;
  averageRiskScore: number;
  expiringWithin30Days: number;
  expired: number;
  recentlyCreated: number;
  averageHazardsPerTRA: number;
  averageControlMeasuresPerHazard: number;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Effect score definitions (Kinney & Wiruth)
 */
export const EFFECT_SCORES: { score: EffectScore; label: string; description: string }[] = [
  { score: 1, label: "Scratches", description: "Minor injury, no lost time" },
  { score: 3, label: "Important", description: "Minor injury, possible lost time" },
  { score: 7, label: "Serious", description: "Serious injury, lost time" },
  { score: 15, label: "Very serious", description: "Permanent disability, one fatality" },
  { score: 40, label: "Disaster", description: "Multiple fatalities" },
  { score: 100, label: "Catastrophe", description: "Many fatalities" },
];

/**
 * Exposure score definitions
 */
export const EXPOSURE_SCORES: { score: ExposureScore; label: string; description: string }[] = [
  { score: 0.5, label: "Very rarely", description: "Once per year or less" },
  { score: 1, label: "Rarely", description: "Few times per year" },
  { score: 2, label: "Uncommon", description: "Once per month" },
  { score: 3, label: "Occasional", description: "Once per week" },
  { score: 6, label: "Frequent", description: "Once per day" },
  { score: 10, label: "Continuous", description: "Continuously or multiple times per day" },
];

/**
 * Probability score definitions
 */
export const PROBABILITY_SCORES: { score: ProbabilityScore; label: string; description: string }[] =
  [
    { score: 0.1, label: "Almost impossible", description: "Never heard of in industry" },
    { score: 0.2, label: "Practically impossible", description: "Has happened elsewhere" },
    { score: 0.5, label: "Conceivable", description: "Remotely possible" },
    { score: 1, label: "Not unusual", description: "Could happen" },
    { score: 3, label: "Quite possible", description: "About 50/50 chance" },
    { score: 6, label: "Likely", description: "Probable if not corrected" },
    { score: 10, label: "Expected", description: "To be expected" },
  ];

/**
 * Calculate risk score
 */
export function calculateRiskScore(
  effect: EffectScore,
  exposure: ExposureScore,
  probability: ProbabilityScore
): RiskScore {
  return effect * exposure * probability;
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: RiskScore): RiskLevel {
  if (score <= 20) return "trivial";
  if (score <= 70) return "acceptable";
  if (score <= 200) return "possible";
  if (score <= 400) return "substantial";
  if (score <= 1000) return "high";
  return "very_high";
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    trivial: "#10B981", // Green
    acceptable: "#84CC16", // Light green
    possible: "#F59E0B", // Yellow/Orange
    substantial: "#F97316", // Orange
    high: "#EF4444", // Red
    very_high: "#DC2626", // Dark red
  };
  return colors[level];
}

/**
 * Get risk level priority (lower = more urgent)
 */
export function getRiskLevelPriority(level: RiskLevel): number {
  const priorities: Record<RiskLevel, number> = {
    trivial: 6,
    acceptable: 5,
    possible: 4,
    substantial: 3,
    high: 2,
    very_high: 1,
  };
  return priorities[level];
}

/**
 * Check if TRA is valid (within validity period)
 */
export function isTRAValid(tra: TRA, now: Date = new Date()): boolean {
  if (!tra.validFrom || !tra.validUntil) return false;

  const validFrom = tra.validFrom instanceof Date ? tra.validFrom : (tra.validFrom as any).toDate();
  const validUntil =
    tra.validUntil instanceof Date ? tra.validUntil : (tra.validUntil as any).toDate();

  return now >= validFrom && now <= validUntil;
}

/**
 * Check if TRA is expiring soon (within 30 days)
 */
export function isTRAExpiringSoon(tra: TRA, daysThreshold: number = 30): boolean {
  if (!tra.validUntil) return false;

  const validUntil =
    tra.validUntil instanceof Date ? tra.validUntil : (tra.validUntil as any).toDate();
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return validUntil <= threshold && validUntil > now;
}

/**
 * Get overall risk score from TRA (highest hazard risk)
 */
export function getOverallRiskScore(taskSteps: TaskStep[]): RiskScore {
  let maxScore = 0;

  for (const step of taskSteps) {
    for (const hazard of step.hazards) {
      if (hazard.riskScore > maxScore) {
        maxScore = hazard.riskScore;
      }
    }
  }

  return maxScore;
}

/**
 * Count total hazards in TRA
 */
export function getTotalHazardCount(taskSteps: TaskStep[]): number {
  return taskSteps.reduce((count, step) => count + step.hazards.length, 0);
}

/**
 * Get hazards grouped by risk level
 */
export function groupHazardsByRiskLevel(taskSteps: TaskStep[]): Record<RiskLevel, number> {
  const grouped: Record<RiskLevel, number> = {
    trivial: 0,
    acceptable: 0,
    possible: 0,
    substantial: 0,
    high: 0,
    very_high: 0,
  };

  for (const step of taskSteps) {
    for (const hazard of step.hazards) {
      grouped[hazard.riskLevel]++;
    }
  }

  return grouped;
}

/**
 * Check if TRA status allows editing
 */
export function canEditTRA(status: TRAStatus): boolean {
  return status === "draft" || status === "rejected";
}

/**
 * Check if TRA can be submitted for approval
 */
export function canSubmitTRA(tra: TRA): boolean {
  return (
    tra.status === "draft" &&
    tra.taskSteps.length > 0 &&
    tra.taskSteps.every((step) => step.hazards.length > 0) &&
    tra.teamMembers.length > 0
  );
}

/**
 * Get next approval step
 */
export function getNextApprovalStep(workflow: ApprovalWorkflow): ApprovalStep | null {
  if (workflow.currentStep >= workflow.steps.length) {
    return null; // All steps completed
  }
  return workflow.steps[workflow.currentStep];
}

/**
 * Check if user can approve current step
 */
export function canUserApproveStep(
  workflow: ApprovalWorkflow,
  userId: string,
  userRole: string
): boolean {
  const currentStep = getNextApprovalStep(workflow);
  if (!currentStep) return false;

  return (
    currentStep.approvers.includes(userId) || userRole === "admin" // Admins can approve any step
  );
}
