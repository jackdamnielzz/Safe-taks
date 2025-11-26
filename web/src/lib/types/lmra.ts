/**
 * LMRA (Last Minute Risk Assessment) Type Definitions
 * 8-step workflow for field workers to assess risks before task execution
 * Based on VCA 2017 v5.1 and ISO 45001 standards
 *
 * Generated to match patterns used in web/src/lib/types/tra.ts
 */

import { Timestamp } from "firebase/firestore";
import type { Material } from "./tra";

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

export type LMRAStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type LMRAStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type GoNoGoDecision = "go" | "no_go" | "pending";

export type WeatherSeverity = "clear" | "moderate" | "severe" | "extreme";

export type EquipmentStatus = "available" | "unavailable" | "damaged" | "maintenance";

export type CompetencyLevel = "certified" | "trained" | "supervised" | "not_qualified";

export type SignatureType = "image" | "typed" | "consent_checkbox";

// ============================================================================
// STEP INTERFACES (1..8)
// ============================================================================

/**
 * Step 1: TRA Selection
 */
export interface LMRAStep1_TraSelection {
  traId: string;
  traTitle?: string;
  traVersion?: number;
  templateId?: string;
  selectedAt?: Timestamp | Date;
}

/**
 * Step 2: Location Verification (GPS)
 */
export interface LMRAStep2_LocationVerification {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  deviceTimestamp?: Timestamp | Date;
  verifiedBy?: string; // userId
  verifiedAt?: Timestamp | Date;
  gpsNotes?: string;
  locationName?: string; // denormalized
}

/**
 * Step 3: Weather Conditions
 */
export interface LMRAStep3_WeatherConditions {
  provider?: string; // e.g., "openweathermap"
  observationTimestamp?: Timestamp | Date;
  temperatureC?: number | null;
  humidityPct?: number | null;
  windSpeedMs?: number | null;
  windDirectionDeg?: number | null;
  precipitationMm?: number | null;
  weatherDescription?: string;
  severity?: WeatherSeverity;
  manualOverride?: boolean; // if user overrides API
  manualNotes?: string;
}

/**
 * Step 4: Team Competencies
 */
export interface TeamMemberCompetency {
  userId: string;
  displayName?: string;
  competencyLevel: CompetencyLevel;
  certifications?: string[]; // list of certification ids or names
  validUntil?: Timestamp | Date | null;
  notes?: string;
}

export interface LMRAStep4_TeamCompetencies {
  requiredCompetencies: string[]; // from TRA
  teamMembers: TeamMemberCompetency[];
  allQualified?: boolean;
  notes?: string;
}

/**
 * Step 5: Equipment Verification
 */
export interface EquipmentCheck {
  equipmentId?: string;
  name?: string;
  status: EquipmentStatus;
  serialNumber?: string;
  inspectedBy?: string;
  inspectedAt?: Timestamp | Date;
  notes?: string;
}

export interface LMRAStep5_EquipmentVerification {
  equipmentList: EquipmentCheck[];
  allEquipmentAvailable?: boolean;
  notes?: string;
  
  /**
   * Reference to TRA materials - displayed as reminder during equipment check
   * This helps field workers verify they have materials needed for the task
   * @since Phase 1.3 (TRA Context Fields)
   */
  referencedTraMaterials?: Material[];
}

/**
 * Step 6: Hazard Assessment
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
 * Kinney & Wiruth style scores (reuse simplified numeric approach)
 */
export type LMRAEffectScore = 1 | 3 | 7 | 15 | 40 | 100;
export type LMRAExposureScore = 0.5 | 1 | 2 | 3 | 6 | 10;
export type LMRAProbabilityScore = 0.1 | 0.2 | 0.5 | 1 | 3 | 6 | 10;
export type LMRARiskScore = number;

export type LMRARiskLevel =
  | "trivial"
  | "acceptable"
  | "possible"
  | "substantial"
  | "high"
  | "very_high";

export interface LMRAStep6_Hazard {
  id: string;
  description: string;
  category: HazardCategory;
  effectScore: LMRAEffectScore;
  exposureScore: LMRAExposureScore;
  probabilityScore: LMRAProbabilityScore;
  riskScore: LMRARiskScore;
  riskLevel: LMRARiskLevel;
  controlMeasures?: {
    id: string;
    description: string;
    responsible?: string;
    status?: "planned" | "in_progress" | "completed" | "verified";
  }[];
  notes?: string;
  createdAt?: Timestamp | Date;
}

export interface LMRAStep6_HazardAssessment {
  hazards: LMRAStep6_Hazard[];
  identifiedAt?: Timestamp | Date;
  notes?: string;
}

/**
 * Step 7: Go / No-Go Decision
 */
export interface LMRAStep7_GoNoGo {
  decision: GoNoGoDecision;
  decidedBy?: string;
  decidedAt?: Timestamp | Date;
  reason?: string;
  mitigationRequired?: boolean;
  mitigationNotes?: string;
}

/**
 * Step 8: Digital Signatures
 */
export interface LMRAStep8_Signature {
  signerId: string;
  signerName?: string;
  signatureType: SignatureType;
  signatureData: string; // base64 image, typed name or consent marker
  signedAt: Timestamp | Date;
  role?: string; // e.g., "field_worker", "supervisor"
  notes?: string;
}

export interface LMRAStep8_Signatures {
  signatures: LMRAStep8_Signature[];
  completedAt?: Timestamp | Date;
  notes?: string;
}

// ============================================================================
// MAIN LMRA INTERFACE
// ============================================================================

export interface LMRA {
  id: string;
  organizationId: string;
  projectId?: string;
  traId?: string;

  status: LMRAStatus;
  currentStep: LMRAStepNumber;

  // optional step payloads
  step1?: LMRAStep1_TraSelection;
  step2?: LMRAStep2_LocationVerification;
  step3?: LMRAStep3_WeatherConditions;
  step4?: LMRAStep4_TeamCompetencies;
  step5?: LMRAStep5_EquipmentVerification;
  step6?: LMRAStep6_HazardAssessment;
  step7?: LMRAStep7_GoNoGo;
  step8?: LMRAStep8_Signatures;

  // metadata
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  submittedAt?: Timestamp | Date;
  submittedBy?: string;
  approvedAt?: Timestamp | Date;
  approvedBy?: string;

  // derived fields
  overallRiskScore?: LMRARiskScore;
  overallRiskLevel?: LMRARiskLevel;
  isOffline?: boolean;
  version?: number;
  notes?: string;
}

// ============================================================================
// API REQUEST / RESPONSE TYPES
// ============================================================================

export interface CreateLMRARequest {
  projectId?: string;
  traId?: string;
  organizationId: string;
  createdBy: string;
  initialStep?: LMRAStep1_TraSelection;
}

export interface UpdateLMRARequest {
  lmraId: string;
  status?: LMRAStatus;
  currentStep?: LMRAStepNumber;
  stepPayload?: Partial<
    | LMRAStep1_TraSelection
    | LMRAStep2_LocationVerification
    | LMRAStep3_WeatherConditions
    | LMRAStep4_TeamCompetencies
    | LMRAStep5_EquipmentVerification
    | LMRAStep6_HazardAssessment
    | LMRAStep7_GoNoGo
    | LMRAStep8_Signatures
  >;
  updatedBy: string;
}

export interface SubmitLMRARequest {
  lmraId: string;
  submittedBy: string;
  comments?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

export function calculateLMRARiskScore(
  effect: LMRAEffectScore,
  exposure: LMRAExposureScore,
  probability: LMRAProbabilityScore
): LMRARiskScore {
  return effect * exposure * probability;
}

export function getLMRARiskLevel(score: LMRARiskScore): LMRARiskLevel {
  if (score <= 20) return "trivial";
  if (score <= 70) return "acceptable";
  if (score <= 200) return "possible";
  if (score <= 400) return "substantial";
  if (score <= 1000) return "high";
  return "very_high";
}

export function getLMRARiskColor(level: LMRARiskLevel): string {
  const map: Record<LMRARiskLevel, string> = {
    trivial: "#10B981",
    acceptable: "#84CC16",
    possible: "#F59E0B",
    substantial: "#F97316",
    high: "#EF4444",
    very_high: "#DC2626",
  };
  return map[level];
}

export function computeOverallLMRARiskScore(
  hazardAssessment?: LMRAStep6_HazardAssessment
): LMRARiskScore {
  if (!hazardAssessment || !hazardAssessment.hazards || hazardAssessment.hazards.length === 0)
    return 0;
  return Math.max(...hazardAssessment.hazards.map((h) => h.riskScore || 0));
}

export function isLMRAValid(lmra: LMRA, now: Date = new Date()): boolean {
  // Basic validity: must have been signed (step8) and not cancelled
  if (lmra.status === "cancelled") return false;
  if (lmra.status === "completed" || lmra.status === "approved") return true;
  return false;
}

/**
 * Lightweight checker to determine if LMRA can progress to next step
 */
export function canAdvanceFromStep(lmra: LMRA, step: LMRAStepNumber): boolean {
  switch (step) {
    case 1:
      return !!lmra.step1?.traId;
    case 2:
      return !!lmra.step2?.latitude && !!lmra.step2?.longitude;
    case 3:
      // weather can be optional if manual override is set
      return !!lmra.step3;
    case 4:
      return !!lmra.step4?.teamMembers && lmra.step4.teamMembers.length > 0;
    case 5:
      return !!lmra.step5?.equipmentList && lmra.step5.equipmentList.length > 0;
    case 6:
      return !!lmra.step6?.hazards && lmra.step6.hazards.length > 0;
    case 7:
      return lmra.step7?.decision !== undefined;
    case 8:
      return !!lmra.step8?.signatures && lmra.step8.signatures.length > 0;
    default:
      return false;
  }
}

// ============================================================================
// ADDITIONAL TYPES FOR LMRA SESSIONS
// ============================================================================

/**
 * LMRASession - Extended LMRA with session-specific data
 * Used for tracking active LMRA executions in the field
 *
 * IMPORTANT: This interface includes derived/computed properties for backward compatibility
 * with legacy code. These properties are computed from step data and should be considered
 * deprecated for new code. Use step payloads directly instead.
 */
export interface LMRASession extends LMRA {
  sessionId?: string;
  startedAt?: Timestamp | Date;
  pausedAt?: Timestamp | Date;
  resumedAt?: Timestamp | Date;
  completedAt?: Timestamp | Date;
  duration?: number; // in seconds
  isPaused?: boolean;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    isOnline?: boolean;
  };

  // ============================================================================
  // DERIVED PROPERTIES (for backward compatibility with legacy code)
  // These are computed from step data and should be considered deprecated
  // ============================================================================

  /**
   * @deprecated Use createdBy instead
   */
  performedBy?: string;

  /**
   * @deprecated Use createdByName instead
   */
  performedByName?: string;

  /**
   * @deprecated Compute from step7.decision
   */
  overallAssessment?: "safe_to_proceed" | "proceed_with_caution" | "stop_work";

  /**
   * @deprecated Use step2.latitude and step2.longitude
   */
  location?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy?: number;
    locationName?: string;
  };

  /**
   * @deprecated Use step4.teamMembers
   */
  teamMembers?: TeamMemberCompetency[];

  /**
   * @deprecated Use step3 (WeatherConditions)
   */
  weatherConditions?: WeatherConditions;

  /**
   * @deprecated Photos should be stored separately with lmraId reference
   */
  photos?: LMRAPhoto[];

  /**
   * @deprecated Use step7 data
   */
  stopWorkTriggeredBy?: string;

  /**
   * @deprecated Use step7.reason
   */
  stopWorkReason?: string;

  /**
   * @deprecated Use step8 signatures
   */
  stopWorkAcknowledgedBy?: string;

  /**
   * @deprecated Use notes field or step-specific notes
   */
  comments?: string;

  /**
   * @deprecated Environmental checks should be part of step6 hazards
   */
  environmentalChecks?: EnvironmentalCheck[];

  /**
   * @deprecated Personnel checks should be part of step4 team competencies
   */
  personnelChecks?: PersonnelCheck[];

  /**
   * @deprecated Equipment checks are in step5
   */
  equipmentChecks?: EquipmentCheck[];

  /**
   * @deprecated Sync status for offline support
   */
  syncStatus?: SyncStatus;

  /**
   * @deprecated Sync error message
   */
  syncError?: string;
}

/**
 * LMRAAssessment - Simplified assessment data for reporting
 */
export interface LMRAAssessment {
  id: string;
  traId?: string;
  traTitle?: string;
  organizationId: string;
  projectId?: string;
  status: LMRAStatus;
  overallRiskScore?: LMRARiskScore;
  overallRiskLevel?: LMRARiskLevel;
  goNoGoDecision?: GoNoGoDecision;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp | Date;
  submittedAt?: Timestamp | Date;
  completedAt?: Timestamp | Date;
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  weather?: {
    temperatureC?: number;
    weatherDescription?: string;
    severity?: WeatherSeverity;
  };
  teamSize?: number;
  hazardCount?: number;
  photoCount?: number;
}

/**
 * WeatherConditions - Standalone weather data type
 */
export interface WeatherConditions {
  provider?: string;
  observationTimestamp?: Timestamp | Date;
  temperatureC?: number | null;
  humidityPct?: number | null;
  windSpeedMs?: number | null;
  windDirectionDeg?: number | null;
  precipitationMm?: number | null;
  weatherDescription?: string;
  severity?: WeatherSeverity;
  manualOverride?: boolean;
  manualNotes?: string;
}

/**
 * EnvironmentalCheck - Environmental conditions assessment
 */
export interface EnvironmentalCheck {
  id: string;
  checkType: "noise" | "air_quality" | "lighting" | "temperature" | "other";
  description: string;
  measurement?: number;
  unit?: string;
  isAcceptable: boolean;
  notes?: string;
  checkedBy?: string;
  checkedAt?: Timestamp | Date;
}

/**
 * PersonnelCheck - Personnel safety verification
 */
export interface PersonnelCheck {
  userId: string;
  displayName?: string;
  checkType: "ppe" | "medical" | "training" | "authorization" | "other";
  isCompliant: boolean;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: Timestamp | Date;
}

/**
 * LMRAPhoto - Photo metadata for LMRA documentation
 */
export interface LMRAPhoto {
  id: string;
  lmraId: string;
  stepNumber: LMRAStepNumber;
  url?: string;
  localPath?: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Timestamp | Date;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    mimeType?: string;
    latitude?: number;
    longitude?: number;
  };
  syncStatus?: SyncStatus;
}

/**
 * LMRASummary - Lightweight summary for lists and dashboards
 */
export interface LMRASummary {
  id: string;
  traId?: string;
  traTitle?: string;
  status: LMRAStatus;
  currentStep: LMRAStepNumber;
  overallRiskLevel?: LMRARiskLevel;
  goNoGoDecision?: GoNoGoDecision;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  location?: string;
  isOffline?: boolean;
}

/**
 * SyncStatus - Offline sync status
 */
export type SyncStatus =
  | "pending"
  | "pending_sync"
  | "syncing"
  | "synced"
  | "sync_failed"
  | "error";

// ============================================================================
// STOP-WORK AUTHORITY TYPES
// ============================================================================

/**
 * StopWorkAlert - Emergency work stoppage alert
 */
export interface StopWorkAlert {
  id: string;
  lmraId: string;
  organizationId: string;
  projectId?: string;
  traId?: string;

  // Who triggered
  triggeredBy: string;
  triggeredByName: string;
  triggeredAt: Timestamp | Date;

  // Why
  reason: string;
  severity: "moderate" | "high" | "critical";
  category: "weather" | "equipment" | "personnel" | "hazard" | "other";

  // Evidence
  description: string;
  photoIds: string[];

  // Location
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };

  // Signature
  signature: {
    signerId: string;
    signerName: string;
    signatureData: string;
    signedAt: Timestamp | Date;
  };

  // Status
  status: "active" | "acknowledged" | "resolved";
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp | Date;
  resolvedBy?: string;
  resolvedAt?: Timestamp | Date;
  resolutionNotes?: string;

  // Notifications
  notifiedUsers: string[];
  notificationsSent: boolean;
  notificationError?: string;

  // Sync
  syncStatus?: SyncStatus;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * CreateStopWorkRequest - Request to create stop-work alert
 */
export interface CreateStopWorkRequest {
  lmraId: string;
  triggeredBy: string;
  triggeredByName: string;
  reason: string;
  severity: "moderate" | "high" | "critical";
  category: "weather" | "equipment" | "personnel" | "hazard" | "other";
  description: string;
  photoIds?: string[];
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  signature: {
    signerId: string;
    signerName: string;
    signatureData: string;
  };
}

/**
 * StopWorkSummary - Lightweight summary for lists
 */
export interface StopWorkSummary {
  id: string;
  lmraId: string;
  severity: "moderate" | "high" | "critical";
  category: "weather" | "equipment" | "personnel" | "hazard" | "other";
  reason: string;
  triggeredBy: string;
  triggeredByName: string;
  triggeredAt: Timestamp | Date;
  status: "active" | "acknowledged" | "resolved";
  location?: string;
}

/**
 * ListLMRAResponse - API response for listing LMRAs
 */
export interface ListLMRAResponse {
  lmras: LMRASession[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate duration of LMRA session in seconds
 */
export function calculateDuration(lmra: LMRASession): number {
  if (!lmra.startedAt) return 0;

  const start =
    lmra.startedAt instanceof Date ? lmra.startedAt.getTime() : lmra.startedAt.toMillis();

  const end = lmra.completedAt
    ? lmra.completedAt instanceof Date
      ? lmra.completedAt.getTime()
      : lmra.completedAt.toMillis()
    : Date.now();

  return Math.floor((end - start) / 1000);
}

/**
 * Check if LMRA can be completed (all steps valid)
 */
export function canCompleteLMRA(lmra: LMRA): boolean {
  // Must have all 8 steps completed
  if (!lmra.step1?.traId) return false;
  if (!lmra.step2?.latitude || !lmra.step2?.longitude) return false;
  if (!lmra.step3) return false;
  if (!lmra.step4?.teamMembers || lmra.step4.teamMembers.length === 0) return false;
  if (!lmra.step5?.equipmentList || lmra.step5.equipmentList.length === 0) return false;
  if (!lmra.step6?.hazards || lmra.step6.hazards.length === 0) return false;
  if (!lmra.step7?.decision || lmra.step7.decision === "pending") return false;
  if (!lmra.step8?.signatures || lmra.step8.signatures.length === 0) return false;

  // If decision is "no_go", LMRA is complete but work cannot proceed
  // Still return true as the LMRA itself is complete
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================
