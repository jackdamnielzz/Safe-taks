/**
 * LMRA (Last Minute Risk Analysis) Type Definitions
 * Based on FIRESTORE_DATA_MODEL.md LMRA Sessions schema
 */

import { Timestamp, GeoPoint } from "firebase/firestore";

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * Location verification status
 */
export type LocationVerificationStatus =
  | "verified" // GPS verified within acceptable range
  | "approximate" // GPS available but accuracy is poor
  | "manual_override"; // Manual override by user

/**
 * Check status for various LMRA verification steps
 */
export type CheckStatus =
  | "pass" // Check passed successfully
  | "fail" // Check failed
  | "caution" // Check passed with caution
  | "not_applicable"; // Check not applicable for this session

/**
 * Equipment condition status
 */
export type EquipmentCondition =
  | "good" // Equipment in good condition
  | "acceptable" // Equipment acceptable for use
  | "damaged" // Equipment damaged
  | "expired"; // Equipment inspection expired

/**
 * Overall LMRA assessment result
 */
export type LMRAAssessment =
  | "safe_to_proceed" // Safe to proceed with work
  | "proceed_with_caution" // Proceed but with extra caution
  | "stop_work"; // Stop work - unsafe conditions

/**
 * LMRA photo categories
 */
export type PhotoCategory =
  | "work_area"
  | "equipment"
  | "hazard"
  | "team"
  | "environmental"
  | "other";

/**
 * Competency validation status
 */
export type CompetencyStatus = "valid" | "expiring_soon" | "expired" | "missing";

/**
 * Offline sync status
 */
export type SyncStatus =
  | "synced" // Fully synced with server
  | "pending_sync" // Waiting to sync
  | "sync_failed"; // Sync failed, needs retry

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Location verification data
 */
export interface LocationVerification {
  coordinates: GeoPoint;
  accuracy: number; // GPS accuracy in meters
  verificationStatus: LocationVerificationStatus;
  manualOverrideReason?: string;
  capturedAt: Timestamp | Date;
}

/**
 * Weather conditions from API
 */
export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage 0-100
  windSpeed: number; // km/h
  visibility: number; // km
  conditions: string; // e.g., "Clear", "Rainy", "Foggy"
  description?: string; // Detailed description
  apiSource: string; // e.g., "OpenWeather"
  fetchedAt: Timestamp | Date;
  iconCode?: string; // Weather icon code
}

/**
 * Environmental check item
 */
export interface EnvironmentalCheck {
  checkType: string; // e.g., "Gas levels", "Noise", "Lighting"
  required: boolean;
  status: CheckStatus;
  measurement?: string;
  notes?: string;
  photoURL?: string;
  checkedAt?: Timestamp | Date;
}

/**
 * Competency status for a team member
 */
export interface CompetencyValidation {
  competencyName: string;
  status: CompetencyStatus;
  expiryDate?: Timestamp | Date;
  certificateNumber?: string;
}

/**
 * Personnel check for team member
 */
export interface PersonnelCheck {
  userId: string;
  displayName?: string;
  competenciesVerified: boolean;
  competencyStatus: CompetencyValidation[];
  checkedIn: boolean;
  checkInTime: Timestamp | Date;
  digitalSignature?: string; // Base64 encoded signature
  notes?: string;
}

/**
 * Equipment verification check
 */
export interface EquipmentCheck {
  equipmentName: string;
  equipmentId?: string;
  required: boolean;
  available: boolean;
  condition: EquipmentCondition;
  inspectionDate?: Timestamp | Date;
  qrCode?: string; // Equipment QR code scanned
  photoURL?: string;
  notes?: string;
  checkedBy?: string; // User ID
}

/**
 * LMRA photo documentation
 */
export interface LMRAPhoto {
  id: string;
  url: string; // Cloud Storage URL
  thumbnailURL?: string;
  category: PhotoCategory;
  caption?: string;
  location?: GeoPoint;
  takenAt: Timestamp | Date;
  takenBy: string; // User ID
  uploadStatus?: "pending" | "uploaded" | "failed";
}

// ============================================================================
// MAIN LMRA SESSION INTERFACE
// ============================================================================

/**
 * LMRA Session - Complete execution record
 */
export interface LMRASession {
  // Identity
  id: string;

  // Relationships
  traId: string; // Associated TRA
  projectId: string; // For direct project queries
  organizationId: string; // For security/queries

  // Execution Details
  performedBy: string; // User ID (field worker)
  performedByName?: string; // Denormalized for display
  teamMembers: string[]; // All team member User IDs
  teamMembersInfo?: {
    // Denormalized team info
    userId: string;
    displayName: string;
    role?: string;
  }[];

  // Location Verification
  location: LocationVerification;

  // Weather Conditions (from API)
  weatherConditions?: WeatherConditions;

  // Environmental Checks (from TRA hazards)
  environmentalChecks: EnvironmentalCheck[];

  // Personnel Verification
  personnelChecks: PersonnelCheck[];

  // Equipment Verification
  equipmentChecks: EquipmentCheck[];

  // Photos & Documentation
  photos: LMRAPhoto[];

  // Final Assessment
  overallAssessment: LMRAAssessment;
  stopWorkReason?: string;
  additionalHazards?: string; // Unforeseen hazards identified
  comments?: string;

  // Stop Work Authority
  stopWorkTriggeredBy?: string; // User ID
  stopWorkTriggeredByName?: string; // Denormalized
  stopWorkAcknowledgedBy?: string; // Supervisor ID
  stopWorkAcknowledgedByName?: string;
  workResumedAt?: Timestamp | Date;
  resumeApprovedBy?: string;
  resumeApprovedByName?: string;

  // Timing
  startedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  duration?: number; // Seconds

  // Offline Sync Status
  syncStatus: SyncStatus;
  offlineCreatedAt?: Timestamp | Date;
  syncedAt?: Timestamp | Date;
  syncError?: string;
  retryCount?: number;

  // Metadata
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  version?: number; // For conflict resolution
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create LMRA Session Request
 */
export interface CreateLMRARequest {
  traId: string;
  projectId: string;
  teamMembers: string[];
  location: Omit<LocationVerification, "capturedAt">;
}

/**
 * Update LMRA Session Request
 */
export interface UpdateLMRARequest {
  weatherConditions?: WeatherConditions;
  environmentalChecks?: EnvironmentalCheck[];
  personnelChecks?: PersonnelCheck[];
  equipmentChecks?: EquipmentCheck[];
  photos?: LMRAPhoto[];
  overallAssessment?: LMRAAssessment;
  stopWorkReason?: string;
  additionalHazards?: string;
  comments?: string;
}

/**
 * Complete LMRA Session Request
 */
export interface CompleteLMRARequest {
  sessionId: string;
  overallAssessment: LMRAAssessment;
  comments?: string;
  digitalSignature?: string;
}

/**
 * Stop Work Request
 */
export interface StopWorkRequest {
  sessionId: string;
  reason: string;
  triggeredBy: string;
}

/**
 * LMRA List Response
 */
export interface ListLMRAResponse {
  items: LMRASession[];
  nextCursor?: string;
  totalCount?: number;
  hasMore: boolean;
}

/**
 * LMRA Summary for lists
 */
export interface LMRASummary {
  id: string;
  traId: string;
  traTitle?: string;
  projectId: string;
  projectName?: string;
  performedBy: string;
  performedByName?: string;
  overallAssessment: LMRAAssessment;
  startedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  location: {
    accuracy: number;
    verificationStatus: LocationVerificationStatus;
  };
  photoCount: number;
  teamMemberCount: number;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

/**
 * LMRA Filter options for queries
 */
export interface LMRAFilters {
  traId?: string;
  projectId?: string;
  performedBy?: string;
  overallAssessment?: LMRAAssessment | LMRAAssessment[];
  dateFrom?: Date;
  dateTo?: Date;
  syncStatus?: SyncStatus;
  hasStopWork?: boolean;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * LMRA Statistics
 */
export interface LMRAStatistics {
  totalSessions: number;
  byAssessment: Record<LMRAAssessment, number>;
  stopWorkCount: number;
  averageDuration: number; // seconds
  completionRate: number; // percentage
  byProject: {
    projectId: string;
    projectName: string;
    sessionCount: number;
  }[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if LMRA session is complete
 */
export function isLMRAComplete(session: LMRASession): boolean {
  return !!session.completedAt && !!session.overallAssessment;
}

/**
 * Check if LMRA has stop work triggered
 */
export function hasStopWork(session: LMRASession): boolean {
  return session.overallAssessment === "stop_work" || !!session.stopWorkTriggeredBy;
}

/**
 * Calculate LMRA duration in seconds
 */
export function calculateDuration(session: LMRASession): number | null {
  if (!session.completedAt) return null;

  const start =
    session.startedAt instanceof Date ? session.startedAt : (session.startedAt as any).toDate();
  const end =
    session.completedAt instanceof Date
      ? session.completedAt
      : (session.completedAt as any).toDate();

  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Get LMRA status color
 */
export function getLMRAStatusColor(assessment: LMRAAssessment): string {
  const colors: Record<LMRAAssessment, string> = {
    safe_to_proceed: "#10B981", // Green
    proceed_with_caution: "#F59E0B", // Yellow/Orange
    stop_work: "#EF4444", // Red
  };
  return colors[assessment];
}

/**
 * Get location accuracy quality
 */
export function getLocationAccuracyQuality(
  accuracy: number
): "excellent" | "good" | "fair" | "poor" {
  if (accuracy < 5) return "excellent";
  if (accuracy < 10) return "good";
  if (accuracy < 20) return "fair";
  return "poor";
}

/**
 * Check if all required personnel checks are complete
 */
export function arePersonnelChecksComplete(checks: PersonnelCheck[]): boolean {
  return (
    checks.length > 0 && checks.every((check) => check.checkedIn && check.competenciesVerified)
  );
}

/**
 * Check if all required equipment checks are complete
 */
export function areEquipmentChecksComplete(checks: EquipmentCheck[]): boolean {
  const requiredChecks = checks.filter((c) => c.required);
  return requiredChecks.every(
    (check) => check.available && (check.condition === "good" || check.condition === "acceptable")
  );
}

/**
 * Check if LMRA can be completed (all checks done)
 */
export function canCompleteLMRA(session: LMRASession): boolean {
  return (
    !!session.location &&
    session.environmentalChecks.length > 0 &&
    arePersonnelChecksComplete(session.personnelChecks) &&
    areEquipmentChecksComplete(session.equipmentChecks)
  );
}

/**
 * Get pending sync count from sessions
 */
export function getPendingSyncCount(sessions: LMRASession[]): number {
  return sessions.filter((s) => s.syncStatus === "pending_sync").length;
}

/**
 * Get failed sync sessions
 */
export function getFailedSyncSessions(sessions: LMRASession[]): LMRASession[] {
  return sessions.filter((s) => s.syncStatus === "sync_failed");
}
