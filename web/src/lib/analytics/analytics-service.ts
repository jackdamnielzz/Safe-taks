/**
 * Firebase Analytics Service
 * Centralized event tracking for all key user actions in SafeWork Pro
 */

import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from "firebase/analytics";
import { getApp } from "firebase/app";

// Analytics instance (lazy-loaded)
let analytics: Analytics | null = null;

/**
 * Initialize Firebase Analytics
 * Only works in browser environment
 */
function getAnalyticsInstance(): Analytics | null {
  if (typeof window === "undefined") {
    return null; // Analytics only works in browser
  }

  if (!analytics) {
    try {
      const app = getApp();
      analytics = getAnalytics(app);
    } catch (error) {
      console.error("Failed to initialize Firebase Analytics:", error);
      return null;
    }
  }

  return analytics;
}

// ============================================================================
// USER IDENTIFICATION
// ============================================================================

/**
 * Set the current user ID for analytics tracking
 */
export function setAnalyticsUserId(userId: string): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error("Failed to set analytics user ID:", error);
  }
}

/**
 * Set user properties for analytics segmentation
 */
export function setAnalyticsUserProperties(properties: {
  organizationId?: string;
  role?: string;
  subscriptionTier?: string;
  [key: string]: string | undefined;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error("Failed to set analytics user properties:", error);
  }
}

// ============================================================================
// TRA EVENTS
// ============================================================================

/**
 * Track TRA creation
 */
export function trackTRACreated(params: {
  traId: string;
  projectId: string;
  templateId?: string;
  status: string;
  overallRiskScore: number;
  hazardCount: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "tra_created", {
      tra_id: params.traId,
      project_id: params.projectId,
      template_id: params.templateId || "none",
      status: params.status,
      risk_score: params.overallRiskScore,
      hazard_count: params.hazardCount,
    });
  } catch (error) {
    console.error("Failed to track TRA created:", error);
  }
}

/**
 * Track TRA submission for approval
 */
export function trackTRASubmitted(params: {
  traId: string;
  projectId: string;
  overallRiskScore: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "tra_submitted", {
      tra_id: params.traId,
      project_id: params.projectId,
      risk_score: params.overallRiskScore,
    });
  } catch (error) {
    console.error("Failed to track TRA submitted:", error);
  }
}

/**
 * Track TRA approval
 */
export function trackTRAApproved(params: {
  traId: string;
  projectId: string;
  approvalTimeHours: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "tra_approved", {
      tra_id: params.traId,
      project_id: params.projectId,
      approval_time_hours: params.approvalTimeHours,
    });
  } catch (error) {
    console.error("Failed to track TRA approved:", error);
  }
}

/**
 * Track TRA rejection
 */
export function trackTRARejected(params: {
  traId: string;
  projectId: string;
  reason?: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "tra_rejected", {
      tra_id: params.traId,
      project_id: params.projectId,
      reason: params.reason || "not_specified",
    });
  } catch (error) {
    console.error("Failed to track TRA rejected:", error);
  }
}

/**
 * Track TRA export
 */
export function trackTRAExported(params: { traId: string; format: "pdf" | "excel" | "csv" }): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "tra_exported", {
      tra_id: params.traId,
      format: params.format,
    });
  } catch (error) {
    console.error("Failed to track TRA exported:", error);
  }
}

// ============================================================================
// LMRA EVENTS
// ============================================================================

/**
 * Track LMRA session start
 */
export function trackLMRAStarted(params: {
  sessionId: string;
  traId: string;
  projectId: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "lmra_started", {
      session_id: params.sessionId,
      tra_id: params.traId,
      project_id: params.projectId,
    });
  } catch (error) {
    console.error("Failed to track LMRA started:", error);
  }
}

/**
 * Track LMRA session completion
 */
export function trackLMRACompleted(params: {
  sessionId: string;
  traId: string;
  projectId: string;
  assessment: "safe_to_proceed" | "proceed_with_caution" | "stop_work";
  durationMinutes: number;
  photoCount: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "lmra_completed", {
      session_id: params.sessionId,
      tra_id: params.traId,
      project_id: params.projectId,
      assessment: params.assessment,
      duration_minutes: params.durationMinutes,
      photo_count: params.photoCount,
    });
  } catch (error) {
    console.error("Failed to track LMRA completed:", error);
  }
}

/**
 * Track LMRA stop work event (critical safety event)
 */
export function trackLMRAStopWork(params: {
  sessionId: string;
  traId: string;
  projectId: string;
  reason: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "lmra_stop_work", {
      session_id: params.sessionId,
      tra_id: params.traId,
      project_id: params.projectId,
      reason: params.reason,
    });
  } catch (error) {
    console.error("Failed to track LMRA stop work:", error);
  }
}

// ============================================================================
// APPROVAL WORKFLOW EVENTS
// ============================================================================

/**
 * Track approval workflow step completion
 */
export function trackApprovalStepCompleted(params: {
  traId: string;
  stepName: string;
  approverRole: string;
  timeToCompleteHours: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "approval_step_completed", {
      tra_id: params.traId,
      step_name: params.stepName,
      approver_role: params.approverRole,
      time_to_complete_hours: params.timeToCompleteHours,
    });
  } catch (error) {
    console.error("Failed to track approval step completed:", error);
  }
}

// ============================================================================
// EXPORT EVENTS
// ============================================================================

/**
 * Track report export
 */
export function trackReportExported(params: {
  reportType: "dashboard" | "risk_analysis" | "compliance" | "custom";
  format: "pdf" | "excel" | "csv";
  dateRange: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "report_exported", {
      report_type: params.reportType,
      format: params.format,
      date_range: params.dateRange,
    });
  } catch (error) {
    console.error("Failed to track report exported:", error);
  }
}

// ============================================================================
// USER ENGAGEMENT EVENTS
// ============================================================================

/**
 * Track user login
 */
export function trackUserLogin(params: { method: "email" | "google" | "microsoft" }): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "login", {
      method: params.method,
    });
  } catch (error) {
    console.error("Failed to track user login:", error);
  }
}

/**
 * Track user registration
 */
export function trackUserRegistration(params: {
  method: "email" | "google" | "microsoft";
  role: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "sign_up", {
      method: params.method,
      role: params.role,
    });
  } catch (error) {
    console.error("Failed to track user registration:", error);
  }
}

/**
 * Track organization creation
 */
export function trackOrganizationCreated(params: {
  organizationId: string;
  subscriptionTier: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "organization_created", {
      organization_id: params.organizationId,
      subscription_tier: params.subscriptionTier,
    });
  } catch (error) {
    console.error("Failed to track organization created:", error);
  }
}

/**
 * Track team member invitation
 */
export function trackTeamMemberInvited(params: { inviteeRole: string }): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "team_member_invited", {
      invitee_role: params.inviteeRole,
    });
  } catch (error) {
    console.error("Failed to track team member invited:", error);
  }
}

/**
 * Track project creation
 */
export function trackProjectCreated(params: { projectId: string }): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "project_created", {
      project_id: params.projectId,
    });
  } catch (error) {
    console.error("Failed to track project created:", error);
  }
}

// ============================================================================
// FEATURE USAGE EVENTS
// ============================================================================

/**
 * Track search usage
 */
export function trackSearchPerformed(params: {
  searchType: "tra" | "lmra" | "hazard" | "template";
  query: string;
  resultsCount: number;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "search", {
      search_term: params.query,
      search_type: params.searchType,
      results_count: params.resultsCount,
    });
  } catch (error) {
    console.error("Failed to track search performed:", error);
  }
}

/**
 * Track dashboard view
 */
export function trackDashboardViewed(params: {
  dashboardType: "executive" | "safety" | "compliance" | "project";
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "dashboard_viewed", {
      dashboard_type: params.dashboardType,
    });
  } catch (error) {
    console.error("Failed to track dashboard viewed:", error);
  }
}

/**
 * Track help/tutorial usage
 */
export function trackHelpViewed(params: {
  helpTopic: string;
  source: "tooltip" | "modal" | "tour" | "documentation";
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "help_viewed", {
      help_topic: params.helpTopic,
      source: params.source,
    });
  } catch (error) {
    console.error("Failed to track help viewed:", error);
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track application errors
 */
export function trackError(params: {
  errorType: string;
  errorMessage: string;
  errorContext?: string;
}): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, "app_error", {
      error_type: params.errorType,
      error_message: params.errorMessage,
      error_context: params.errorContext || "unknown",
    });
  } catch (error) {
    console.error("Failed to track error:", error);
  }
}

// ============================================================================
// CUSTOM EVENT
// ============================================================================

/**
 * Track custom event with arbitrary parameters
 */
export function trackCustomEvent(eventName: string, params?: Record<string, any>): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.error(`Failed to track custom event ${eventName}:`, error);
  }
}
