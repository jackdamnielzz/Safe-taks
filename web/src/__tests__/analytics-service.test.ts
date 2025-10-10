/**
 * Analytics Service Tests
 * Unit tests for Firebase Analytics event tracking
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock Firebase Analytics
const mockLogEvent = jest.fn();
const mockSetUserId = jest.fn();
const mockSetUserProperties = jest.fn();
const mockGetAnalytics = jest.fn(() => ({}));

jest.mock("firebase/analytics", () => ({
  getAnalytics: mockGetAnalytics,
  logEvent: mockLogEvent,
  setUserId: mockSetUserId,
  setUserProperties: mockSetUserProperties,
}));

jest.mock("firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

// Import after mocks are set up
import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  trackTRACreated,
  trackTRASubmitted,
  trackTRAApproved,
  trackTRARejected,
  trackTRAExported,
  trackLMRAStarted,
  trackLMRACompleted,
  trackLMRAStopWork,
  trackApprovalStepCompleted,
  trackReportExported,
  trackUserLogin,
  trackUserRegistration,
  trackOrganizationCreated,
  trackTeamMemberInvited,
  trackProjectCreated,
  trackSearchPerformed,
  trackDashboardViewed,
  trackHelpViewed,
  trackError,
  trackCustomEvent,
} from "@/lib/analytics/analytics-service";

describe("Analytics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Identification", () => {
    it("should set user ID", () => {
      setAnalyticsUserId("user-123");
      expect(mockSetUserId).toHaveBeenCalledWith({}, "user-123");
    });

    it("should set user properties", () => {
      const properties = {
        organizationId: "org-123",
        role: "admin",
        subscriptionTier: "professional",
      };
      setAnalyticsUserProperties(properties);
      expect(mockSetUserProperties).toHaveBeenCalledWith({}, properties);
    });
  });

  describe("TRA Events", () => {
    it("should track TRA created", () => {
      trackTRACreated({
        traId: "tra-123",
        projectId: "project-123",
        templateId: "template-123",
        status: "draft",
        overallRiskScore: 150,
        hazardCount: 5,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "tra_created", {
        tra_id: "tra-123",
        project_id: "project-123",
        template_id: "template-123",
        status: "draft",
        risk_score: 150,
        hazard_count: 5,
      });
    });

    it("should track TRA submitted", () => {
      trackTRASubmitted({
        traId: "tra-123",
        projectId: "project-123",
        overallRiskScore: 150,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "tra_submitted", {
        tra_id: "tra-123",
        project_id: "project-123",
        risk_score: 150,
      });
    });

    it("should track TRA approved", () => {
      trackTRAApproved({
        traId: "tra-123",
        projectId: "project-123",
        approvalTimeHours: 24,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "tra_approved", {
        tra_id: "tra-123",
        project_id: "project-123",
        approval_time_hours: 24,
      });
    });

    it("should track TRA rejected", () => {
      trackTRARejected({
        traId: "tra-123",
        projectId: "project-123",
        reason: "Incomplete hazard analysis",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "tra_rejected", {
        tra_id: "tra-123",
        project_id: "project-123",
        reason: "Incomplete hazard analysis",
      });
    });

    it("should track TRA exported", () => {
      trackTRAExported({
        traId: "tra-123",
        format: "pdf",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "tra_exported", {
        tra_id: "tra-123",
        format: "pdf",
      });
    });
  });

  describe("LMRA Events", () => {
    it("should track LMRA started", () => {
      trackLMRAStarted({
        sessionId: "session-123",
        traId: "tra-123",
        projectId: "project-123",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "lmra_started", {
        session_id: "session-123",
        tra_id: "tra-123",
        project_id: "project-123",
      });
    });

    it("should track LMRA completed", () => {
      trackLMRACompleted({
        sessionId: "session-123",
        traId: "tra-123",
        projectId: "project-123",
        assessment: "safe_to_proceed",
        durationMinutes: 15,
        photoCount: 3,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "lmra_completed", {
        session_id: "session-123",
        tra_id: "tra-123",
        project_id: "project-123",
        assessment: "safe_to_proceed",
        duration_minutes: 15,
        photo_count: 3,
      });
    });

    it("should track LMRA stop work", () => {
      trackLMRAStopWork({
        sessionId: "session-123",
        traId: "tra-123",
        projectId: "project-123",
        reason: "Unsafe weather conditions",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "lmra_stop_work", {
        session_id: "session-123",
        tra_id: "tra-123",
        project_id: "project-123",
        reason: "Unsafe weather conditions",
      });
    });
  });

  describe("Approval Workflow Events", () => {
    it("should track approval step completed", () => {
      trackApprovalStepCompleted({
        traId: "tra-123",
        stepName: "Safety Manager Review",
        approverRole: "safety_manager",
        timeToCompleteHours: 12,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "approval_step_completed", {
        tra_id: "tra-123",
        step_name: "Safety Manager Review",
        approver_role: "safety_manager",
        time_to_complete_hours: 12,
      });
    });
  });

  describe("Export Events", () => {
    it("should track report exported", () => {
      trackReportExported({
        reportType: "dashboard",
        format: "pdf",
        dateRange: "2025-01-01_2025-01-31",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "report_exported", {
        report_type: "dashboard",
        format: "pdf",
        date_range: "2025-01-01_2025-01-31",
      });
    });
  });

  describe("User Engagement Events", () => {
    it("should track user login", () => {
      trackUserLogin({ method: "email" });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "login", { method: "email" });
    });

    it("should track user registration", () => {
      trackUserRegistration({ method: "google", role: "field_worker" });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "sign_up", {
        method: "google",
        role: "field_worker",
      });
    });

    it("should track organization created", () => {
      trackOrganizationCreated({
        organizationId: "org-123",
        subscriptionTier: "professional",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "organization_created", {
        organization_id: "org-123",
        subscription_tier: "professional",
      });
    });

    it("should track team member invited", () => {
      trackTeamMemberInvited({ inviteeRole: "supervisor" });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "team_member_invited", {
        invitee_role: "supervisor",
      });
    });

    it("should track project created", () => {
      trackProjectCreated({ projectId: "project-123" });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "project_created", {
        project_id: "project-123",
      });
    });
  });

  describe("Feature Usage Events", () => {
    it("should track search performed", () => {
      trackSearchPerformed({
        searchType: "tra",
        query: "electrical work",
        resultsCount: 15,
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "search", {
        search_term: "electrical work",
        search_type: "tra",
        results_count: 15,
      });
    });

    it("should track dashboard viewed", () => {
      trackDashboardViewed({ dashboardType: "executive" });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "dashboard_viewed", {
        dashboard_type: "executive",
      });
    });

    it("should track help viewed", () => {
      trackHelpViewed({
        helpTopic: "risk_assessment",
        source: "tooltip",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "help_viewed", {
        help_topic: "risk_assessment",
        source: "tooltip",
      });
    });
  });

  describe("Error Tracking", () => {
    it("should track application errors", () => {
      trackError({
        errorType: "validation_error",
        errorMessage: "Invalid TRA data",
        errorContext: "TRA creation form",
      });

      expect(mockLogEvent).toHaveBeenCalledWith({}, "app_error", {
        error_type: "validation_error",
        error_message: "Invalid TRA data",
        error_context: "TRA creation form",
      });
    });
  });

  describe("Custom Events", () => {
    it("should track custom events", () => {
      trackCustomEvent("custom_action", { key: "value", count: 42 });
      expect(mockLogEvent).toHaveBeenCalledWith({}, "custom_action", {
        key: "value",
        count: 42,
      });
    });
  });
});
