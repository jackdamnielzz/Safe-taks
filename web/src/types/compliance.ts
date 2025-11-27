/**
 * VCA Compliance Type Definitions
 *
 * Extended types for compliance history, analytics, and tracking
 */

import { Timestamp } from "firebase/firestore";
import type {
  VCAComplianceResult,
  ComplianceBreakdown,
  ComplianceIssue,
} from "@/lib/vca-compliance";

/**
 * Compliance history record stored in Firestore
 */
export interface ComplianceHistory {
  // Identity
  id: string;
  traId: string;
  organizationId: string;

  // Compliance Result
  score: number;
  level: "NON_COMPLIANT" | "PARTIALLY_COMPLIANT" | "COMPLIANT" | "FULLY_COMPLIANT";
  isCompliant: boolean;

  // Detailed Breakdown
  breakdown: ComplianceBreakdown;
  issues: ComplianceIssue[];
  recommendations: string[];

  // Context
  traTitle?: string;
  projectId?: string;
  projectName?: string;

  // User Info
  checkedBy?: string;
  checkedByName?: string;

  // Metadata
  checkedAt: Timestamp | Date;
  version: number; // TRA version at time of check

  // Flags
  isActive: boolean;
}

/**
 * Compliance trend data point
 */
export interface ComplianceTrendPoint {
  date: Date;
  score: number;
  level: string;
  traCount: number;
}

/**
 * Compliance statistics for an organization
 */
export interface ComplianceStatistics {
  // Overall Stats
  totalTRAs: number;
  compliantTRAs: number;
  nonCompliantTRAs: number;
  averageScore: number;

  // By Level
  byLevel: {
    fullyCompliant: number;
    compliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
  };

  // By Category (average scores)
  byCategory: {
    riskAssessment: number;
    controlMeasures: number;
    competencies: number;
    documentation: number;
    approvals: number;
  };

  // Trends
  trend: "improving" | "stable" | "declining";
  trendPercentage: number; // Change from previous period

  // Time Period
  periodStart: Date;
  periodEnd: Date;

  // Last Updated
  lastUpdated: Date;
}

/**
 * Compliance alert configuration
 */
export interface ComplianceAlert {
  id: string;
  organizationId: string;

  // Alert Type
  type: "declining_score" | "non_compliant_tra" | "expiring_compliance" | "weekly_summary";

  // Trigger Conditions
  threshold?: number; // Score threshold
  frequency?: "daily" | "weekly" | "monthly";

  // Recipients
  recipients: string[]; // User IDs
  recipientRoles?: ("admin" | "safety_manager" | "supervisor")[];

  // Status
  isActive: boolean;
  lastTriggered?: Timestamp | Date;

  // Metadata
  createdAt: Timestamp | Date;
  createdBy: string;
}

/**
 * Compliance improvement suggestion
 */
export interface ComplianceSuggestion {
  id: string;
  category: "RISK_ASSESSMENT" | "CONTROL_MEASURES" | "COMPETENCIES" | "DOCUMENTATION" | "APPROVALS";

  // Suggestion Details
  title: string;
  description: string;
  impact: "high" | "medium" | "low"; // Expected score improvement
  effort: "easy" | "moderate" | "complex"; // Implementation effort

  // Priority (calculated from impact and effort)
  priority: number; // 1-10, higher = more important

  // Action
  actionable: boolean; // Can be applied automatically
  action?: {
    type: "add_field" | "add_hazard" | "add_control" | "add_team_member" | "add_competency";
    data?: any;
  };

  // Status
  status: "pending" | "applied" | "dismissed";
  appliedAt?: Date;
  dismissedAt?: Date;
}

/**
 * Compliance report export configuration
 */
export interface ComplianceReportConfig {
  // Report Type
  type: "single_tra" | "organization_summary" | "project_summary" | "trend_analysis";

  // Filters
  traIds?: string[];
  projectIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;

  // Options
  includeBreakdown: boolean;
  includeIssues: boolean;
  includeRecommendations: boolean;
  includeTrends: boolean;
  includeCharts: boolean;

  // Format
  format: "pdf" | "excel" | "json";

  // Branding
  includeLogo: boolean;
  companyName?: string;
}

/**
 * Compliance dashboard filter options
 */
export interface ComplianceDashboardFilters {
  // Time Range
  dateFrom?: Date;
  dateTo?: Date;
  period?: "week" | "month" | "quarter" | "year" | "all";

  // Filters
  projectIds?: string[];
  complianceLevel?: ("FULLY_COMPLIANT" | "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT")[];
  minScore?: number;
  maxScore?: number;

  // Sorting
  sortBy?: "score" | "date" | "title" | "project";
  sortOrder?: "asc" | "desc";

  // Pagination
  page?: number;
  pageSize?: number;
}

/**
 * Compliance batch check result
 */
export interface ComplianceBatchResult {
  // Summary
  totalChecked: number;
  compliant: number;
  nonCompliant: number;

  // Results by TRA
  results: Array<{
    traId: string;
    traTitle: string;
    score: number;
    level: string;
    isCompliant: boolean;
  }>;

  // Timing
  startedAt: Date;
  completedAt: Date;
  duration: number; // milliseconds

  // Errors
  errors: Array<{
    traId: string;
    error: string;
  }>;
}

/**
 * Compliance notification payload
 */
export interface ComplianceNotification {
  // Notification Type
  type: "approval_blocked" | "score_declined" | "weekly_summary" | "non_compliant_alert";

  // Recipients
  recipientEmail: string;
  recipientName?: string;

  // Content
  subject: string;
  message: string;

  // Data
  traId?: string;
  traTitle?: string;
  score?: number;
  level?: string;
  issues?: ComplianceIssue[];
  recommendations?: string[];

  // Links
  actionUrl?: string;
  dashboardUrl?: string;

  // Metadata
  sentAt?: Date;
  organizationId: string;
}

/**
 * Compliance webhook payload
 */
export interface ComplianceWebhookPayload {
  // Event
  event: "compliance_checked" | "compliance_declined" | "compliance_improved" | "approval_blocked";

  // Timestamp
  timestamp: Date;

  // Organization
  organizationId: string;

  // TRA Info
  traId: string;
  traTitle: string;
  projectId?: string;
  projectName?: string;

  // Compliance Data
  score: number;
  level: string;
  isCompliant: boolean;
  previousScore?: number;
  scoreChange?: number;

  // Issues
  issueCount: number;
  criticalIssues: number;

  // Metadata
  version: string; // API version
}

/**
 * Helper type for compliance queries
 */
export interface ComplianceQuery {
  organizationId: string;
  traIds?: string[];
  projectIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  levels?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Compliance cache entry
 */
export interface ComplianceCache {
  traId: string;
  result: VCAComplianceResult;
  cachedAt: Date;
  expiresAt: Date;
  version: number; // TRA version
}
