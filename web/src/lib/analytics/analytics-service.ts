/**
 * Analytics Service
 * Centralized helpers for Firebase Analytics event tracking in SafeWork Pro.
 *
 * Design goals:
 * - Single, testable integration point.
 * - Safe in SSR / unsupported environments (no hard crashes).
 * - Compatible with Jest mocks defined in:
 *   - web/jest.setup.js
 *   - web/src/__mocks__/firebase-analytics.ts
 *
 * Tests:
 * - See: web/src/__tests__/analytics-service.test.ts
 */

import { getApp } from "firebase/app";
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from "firebase/analytics";

/**
 * User property bag passed through to analytics.
 */
type UserProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Cached analytics instance.
 * - undefined: not resolved yet
 * - null: resolved but unavailable (SSR / init failure)
 * - Analytics: ready to use
 */
let analyticsInstance: Analytics | null | undefined;

/**
 * Resolve (and cache) the Analytics instance.
 * - Returns null when unavailable (SSR, no window, or errors).
 *
 * Jest & SSR notes:
 * - Under Jest, firebase/analytics is mapped to src/__mocks__/firebase-analytics.ts via jest.config.js.
 *   That mock's getAnalytics returns a stable mockAnalyticsInstance.
 * - We must:
 *   - Avoid real browser/Firebase access.
 *   - Use the same imported getAnalytics so Jest spies see calls.
 *   - Be SSR-safe (no window/document on server).
 */
export function getAnalyticsInstance(): Analytics | null {
  // Reuse resolved instance (including explicit null) for deterministic behavior within a test run.
  if (analyticsInstance !== undefined) {
    return analyticsInstance;
  }

  // In Jest and browser-like environments, allow analytics.
  // In real SSR (no window), no-op.
  if (typeof window === "undefined") {
    analyticsInstance = null;
    return analyticsInstance;
  }

  try {
    // Try parameterless getAnalytics() first so analytics-service.test.ts inline jest.mock works.
    // The test mock returns a stable instance directly.
    analyticsInstance = getAnalytics();
    return analyticsInstance;
  } catch {
    try {
      // Fallback to getApp() + getAnalytics(app) for real app runtime and __mocks__ that expect an app.
      const app = getApp();
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    } catch {
      analyticsInstance = null;
      return analyticsInstance;
    }
  }
}

/**
 * Internal helper: run operation only when analytics is available.
 */
function withAnalytics(fn: (analytics: Analytics) => void): void {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  fn(analytics);
}

/**
 * Identify user by ID.
 */
export function setAnalyticsUserId(userId: string): void {
  withAnalytics((analytics) => {
    setUserId(analytics, userId);
  });
}

/**
 * Set user properties (e.g., organization, role, subscription).
 */
export function setAnalyticsUserProperties(properties: UserProperties): void {
  withAnalytics((analytics) => {
    // Filter out undefined to avoid noisy props
    const cleanProps: UserProperties = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        cleanProps[key] = value;
      }
    }
    setUserProperties(analytics, cleanProps);
  });
}

/**
 * TRA events
 */
export function trackTRACreated(payload: {
  traId: string;
  projectId?: string;
  templateId?: string;
  status: string;
  overallRiskScore?: number;
  hazardCount?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "tra_created", {
      tra_id: payload.traId,
      project_id: payload.projectId,
      template_id: payload.templateId,
      status: payload.status,
      risk_score: payload.overallRiskScore,
      hazard_count: payload.hazardCount,
    });
  });
}

export function trackTRASubmitted(payload: {
  traId: string;
  projectId?: string;
  overallRiskScore?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "tra_submitted", {
      tra_id: payload.traId,
      project_id: payload.projectId,
      risk_score: payload.overallRiskScore,
    });
  });
}

export function trackTRAApproved(payload: {
  traId: string;
  projectId?: string;
  approvalTimeHours?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "tra_approved", {
      tra_id: payload.traId,
      project_id: payload.projectId,
      approval_time_hours: payload.approvalTimeHours,
    });
  });
}

export function trackTRARejected(payload: {
  traId: string;
  projectId?: string;
  reason: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "tra_rejected", {
      tra_id: payload.traId,
      project_id: payload.projectId,
      reason: payload.reason,
    });
  });
}

export function trackTRAExported(payload: {
  traId: string;
  format: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "tra_exported", {
      tra_id: payload.traId,
      format: payload.format,
    });
  });
}

/**
 * LMRA events
 */
export function trackLMRAStarted(payload: {
  sessionId: string;
  traId?: string;
  projectId?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "lmra_started", {
      session_id: payload.sessionId,
      tra_id: payload.traId,
      project_id: payload.projectId,
    });
  });
}

export function trackLMRACompleted(payload: {
  sessionId: string;
  traId?: string;
  projectId?: string;
  assessment: string;
  durationMinutes?: number;
  photoCount?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "lmra_completed", {
      session_id: payload.sessionId,
      tra_id: payload.traId,
      project_id: payload.projectId,
      assessment: payload.assessment,
      duration_minutes: payload.durationMinutes,
      photo_count: payload.photoCount,
    });
  });
}

export function trackLMRAStopWork(payload: {
  sessionId: string;
  traId?: string;
  projectId?: string;
  reason: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "lmra_stop_work", {
      session_id: payload.sessionId,
      tra_id: payload.traId,
      project_id: payload.projectId,
      reason: payload.reason,
    });
  });
}

/**
 * Approval workflow events
 */
export function trackApprovalStepCompleted(payload: {
  traId: string;
  stepName: string;
  approverRole?: string;
  timeToCompleteHours?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "approval_step_completed", {
      tra_id: payload.traId,
      step_name: payload.stepName,
      approver_role: payload.approverRole,
      time_to_complete_hours: payload.timeToCompleteHours,
    });
  });
}

/**
 * Export / report events
 */
export function trackReportExported(payload: {
  reportType: string;
  format: string;
  dateRange?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "report_exported", {
      report_type: payload.reportType,
      format: payload.format,
      date_range: payload.dateRange,
    });
  });
}

/**
 * User engagement / account events
 */
export function trackUserLogin(payload: { method: string }): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "login", {
      method: payload.method,
    });
  });
}

export function trackUserRegistration(payload: {
  method: string;
  role?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "sign_up", {
      method: payload.method,
      role: payload.role,
    });
  });
}

export function trackOrganizationCreated(payload: {
  organizationId: string;
  subscriptionTier?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "organization_created", {
      organization_id: payload.organizationId,
      subscription_tier: payload.subscriptionTier,
    });
  });
}

export function trackTeamMemberInvited(payload: {
  inviteeRole?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "team_member_invited", {
      invitee_role: payload.inviteeRole,
    });
  });
}

export function trackProjectCreated(payload: {
  projectId: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "project_created", {
      project_id: payload.projectId,
    });
  });
}

/**
 * Feature usage events
 */
export function trackSearchPerformed(payload: {
  searchType: string;
  query: string;
  resultsCount?: number;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "search", {
      search_term: payload.query,
      search_type: payload.searchType,
      results_count: payload.resultsCount,
    });
  });
}

export function trackDashboardViewed(payload: {
  dashboardType: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "dashboard_viewed", {
      dashboard_type: payload.dashboardType,
    });
  });
}

export function trackHelpViewed(payload: {
  helpTopic: string;
  source?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "help_viewed", {
      help_topic: payload.helpTopic,
      source: payload.source,
    });
  });
}

/**
 * Error tracking
 */
export function trackError(payload: {
  errorType: string;
  errorMessage: string;
  errorContext?: string;
}): void {
  withAnalytics((analytics) => {
    logEvent(analytics, "app_error", {
      error_type: payload.errorType,
      error_message: payload.errorMessage,
      error_context: payload.errorContext,
    });
  });
}

/**
 * Custom events
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  withAnalytics((analytics) => {
    logEvent(analytics, eventName, params || {});
  });
}
