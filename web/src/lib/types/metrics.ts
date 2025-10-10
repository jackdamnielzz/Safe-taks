/**
 * Product Metrics (KPIs) Type Definitions
 * Core analytics and business intelligence metrics for SafeWork Pro
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// CORE ENUMS AND TYPES
// ============================================================================

/**
 * Time period for metric aggregation
 */
export type MetricPeriod = "day" | "week" | "month" | "quarter" | "year" | "all_time";

/**
 * Metric trend direction
 */
export type TrendDirection = "up" | "down" | "stable";

/**
 * Metric status relative to target
 */
export type MetricStatus =
  | "excellent" // Above target
  | "good" // At target
  | "warning" // Below target but acceptable
  | "critical"; // Significantly below target

// ============================================================================
// BASE METRIC INTERFACE
// ============================================================================

/**
 * Base metric interface with common fields
 */
export interface BaseMetric {
  value: number;
  period: MetricPeriod;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  calculatedAt: Date | Timestamp;
  organizationId: string;
}

/**
 * Base result type (for composite results like KPIDashboard)
 */
export interface BaseResult {
  period: MetricPeriod;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  calculatedAt: Date | Timestamp;
  organizationId: string;
}

/**
 * Metric with trend comparison
 */
export interface MetricWithTrend extends BaseMetric {
  previousValue?: number;
  change?: number; // Absolute change
  changePercentage?: number; // Percentage change
  trend?: TrendDirection;
}

/**
 * Metric with target and status
 */
export interface MetricWithTarget extends MetricWithTrend {
  target?: number;
  status?: MetricStatus;
  targetAchievement?: number; // Percentage of target achieved
}

// ============================================================================
// KPI 1: TRAs CREATED PER MONTH
// ============================================================================

/**
 * TRAs created metric
 * Tracks number of TRAs created in a given period
 */
export interface TRAsCreatedMetric extends MetricWithTarget {
  metricType: "tras_created";

  // Breakdown by status
  byStatus?: {
    draft: number;
    submitted: number;
    in_review: number;
    approved: number;
    rejected: number;
    active: number;
  };

  // Breakdown by project
  byProject?: {
    projectId: string;
    projectName: string;
    count: number;
  }[];

  // Breakdown by creator
  byCreator?: {
    userId: string;
    displayName: string;
    count: number;
  }[];

  // Additional insights
  averagePerDay?: number;
  peakDay?: {
    date: Date | Timestamp;
    count: number;
  };
}

// ============================================================================
// KPI 2: LMRAs EXECUTED PER MONTH
// ============================================================================

/**
 * LMRAs executed metric
 * Tracks number of LMRA sessions executed in a given period
 */
export interface LMRAsExecutedMetric extends MetricWithTarget {
  metricType: "lmras_executed";

  // Breakdown by assessment
  byAssessment?: {
    safe_to_proceed: number;
    proceed_with_caution: number;
    stop_work: number;
  };

  // Breakdown by project
  byProject?: {
    projectId: string;
    projectName: string;
    count: number;
  }[];

  // Breakdown by performer
  byPerformer?: {
    userId: string;
    displayName: string;
    count: number;
  }[];

  // Additional insights
  averagePerDay?: number;
  completionRate?: number; // Percentage of started sessions that were completed
  stopWorkRate?: number; // Percentage resulting in stop work
}

// ============================================================================
// KPI 3: AVERAGE RISK SCORE
// ============================================================================

/**
 * Average risk score metric
 * Tracks average Kinney & Wiruth risk score across all TRAs
 */
export interface AverageRiskScoreMetric extends MetricWithTrend {
  metricType: "average_risk_score";

  // Risk distribution
  riskDistribution?: {
    trivial: number; // Count of trivial risks
    acceptable: number;
    possible: number;
    substantial: number;
    high: number;
    very_high: number;
  };

  // Breakdown by project
  byProject?: {
    projectId: string;
    projectName: string;
    averageScore: number;
    riskLevel: string;
  }[];

  // Additional insights
  highestRiskScore?: number;
  lowestRiskScore?: number;
  medianRiskScore?: number;
  totalHazardsAnalyzed?: number;

  // Trend analysis
  improvementRate?: number; // Percentage improvement in risk reduction
}

// ============================================================================
// KPI 4: COMPLIANCE RATE
// ============================================================================

/**
 * Compliance rate metric
 * Tracks percentage of TRAs that meet compliance requirements
 */
export interface ComplianceRateMetric extends MetricWithTarget {
  metricType: "compliance_rate";

  // Compliance breakdown
  compliantCount: number;
  nonCompliantCount: number;
  totalTRAs: number;

  // Compliance by framework
  byFramework?: {
    vca: {
      compliant: number;
      total: number;
      rate: number;
    };
    iso45001: {
      compliant: number;
      total: number;
      rate: number;
    };
  };

  // Common non-compliance issues
  nonComplianceReasons?: {
    reason: string;
    count: number;
    percentage: number;
  }[];

  // Additional insights
  averageComplianceScore?: number; // 0-100%
  fullyCompliantRate?: number; // Percentage with 100% compliance
}

// ============================================================================
// KPI 5: TIME TO APPROVAL
// ============================================================================

/**
 * Time to approval metric
 * Tracks average time from TRA submission to approval
 */
export interface TimeToApprovalMetric extends MetricWithTarget {
  metricType: "time_to_approval";

  // Time breakdown (in hours)
  averageHours: number;
  medianHours?: number;
  minHours?: number;
  maxHours?: number;

  // Approval workflow stages
  byStage?: {
    stageName: string;
    averageHours: number;
    count: number;
  }[];

  // Breakdown by approver
  byApprover?: {
    userId: string;
    displayName: string;
    averageHours: number;
    approvalCount: number;
  }[];

  // Additional insights
  pendingApprovals?: number;
  overdueApprovals?: number; // Approvals taking longer than target
  fastestApproval?: {
    traId: string;
    hours: number;
  };
  slowestApproval?: {
    traId: string;
    hours: number;
  };
}

// ============================================================================
// KPI 6: USER ACTIVATION RATE
// ============================================================================

/**
 * User activation rate metric
 * Tracks percentage of users who have completed key activation milestones
 */
export interface UserActivationRateMetric extends MetricWithTarget {
  metricType: "user_activation_rate";

  // Activation breakdown
  totalUsers: number;
  activatedUsers: number;
  activationRate: number; // Percentage

  // Activation milestones
  milestones?: {
    completedProfile: number;
    createdFirstTRA: number;
    executedFirstLMRA: number;
    invitedTeamMember: number;
    approvedFirstTRA: number;
  };

  // Breakdown by role
  byRole?: {
    role: string;
    totalUsers: number;
    activatedUsers: number;
    activationRate: number;
  }[];

  // Time to activation
  averageDaysToActivation?: number;
  medianDaysToActivation?: number;

  // Additional insights
  newUsersThisPeriod?: number;
  churnedUsers?: number; // Users who became inactive
  retentionRate?: number; // Percentage of users still active
}

// ============================================================================
// COMPOSITE METRICS
// ============================================================================

/**
 * All KPIs for a given period
 */
export interface KPIDashboard extends BaseResult {
  // Core KPIs
  trasCreated: TRAsCreatedMetric;
  lmrasExecuted: LMRAsExecutedMetric;
  averageRiskScore: AverageRiskScoreMetric;
  complianceRate: ComplianceRateMetric;
  timeToApproval: TimeToApprovalMetric;
  userActivationRate: UserActivationRateMetric;

  // Overall health score (0-100)
  overallHealthScore?: number;
}

/**
 * Historical metric data point
 */
export interface MetricDataPoint {
  date: Date | Timestamp;
  value: number;
  label?: string;
}

/**
 * Metric time series for charting
 */
export interface MetricTimeSeries {
  metricType: string;
  period: MetricPeriod;
  dataPoints: MetricDataPoint[];
  trend?: TrendDirection;
  averageValue?: number;
}

// ============================================================================
// CALCULATION PARAMETERS
// ============================================================================

/**
 * Parameters for KPI calculation
 */
export interface KPICalculationParams {
  organizationId: string;
  period: MetricPeriod;
  startDate: Date;
  endDate: Date;

  // Optional filters
  projectId?: string;
  userId?: string;

  // Comparison period for trends
  includePreviousPeriod?: boolean;

  // Target values (optional, can be from org settings)
  targets?: {
    trasCreatedPerMonth?: number;
    lmrasExecutedPerMonth?: number;
    maxAverageRiskScore?: number;
    minComplianceRate?: number;
    maxTimeToApprovalHours?: number;
    minUserActivationRate?: number;
  };
}

/**
 * Metric calculation result
 */
export interface MetricCalculationResult<T extends BaseMetric | BaseResult> {
  success: boolean;
  metric?: T;
  error?: string;
  calculationTime?: number; // Milliseconds
  dataSourceCount?: number; // Number of records analyzed
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Metric export format
 */
export interface MetricExport {
  organizationId: string;
  organizationName: string;
  period: MetricPeriod;
  startDate: string; // ISO date string
  endDate: string;
  exportedAt: string;
  metrics: {
    [key: string]: any;
  };
}

/**
 * Metric alert configuration
 */
export interface MetricAlert {
  metricType: string;
  threshold: number;
  condition: "above" | "below";
  enabled: boolean;
  notifyRoles: string[];
  lastTriggered?: Date | Timestamp;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Default KPI targets based on industry best practices
 */
export const DEFAULT_KPI_TARGETS = {
  trasCreatedPerMonth: 10, // Minimum 10 TRAs per month for active org
  lmrasExecutedPerMonth: 20, // Minimum 20 LMRAs per month
  maxAverageRiskScore: 200, // Keep average risk in "possible" range
  minComplianceRate: 95, // 95% compliance rate target
  maxTimeToApprovalHours: 48, // Approve within 48 hours
  minUserActivationRate: 80, // 80% user activation target
};

/**
 * Get metric status based on value and target
 */
export function getMetricStatus(
  value: number,
  target: number,
  higherIsBetter: boolean = true
): MetricStatus {
  const ratio = value / target;

  if (higherIsBetter) {
    if (ratio >= 1.1) return "excellent";
    if (ratio >= 0.95) return "good";
    if (ratio >= 0.8) return "warning";
    return "critical";
  } else {
    // Lower is better (e.g., risk score, time to approval)
    if (ratio <= 0.9) return "excellent";
    if (ratio <= 1.05) return "good";
    if (ratio <= 1.2) return "warning";
    return "critical";
  }
}

/**
 * Calculate trend direction
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number,
  threshold: number = 0.05 // 5% change threshold
): TrendDirection {
  if (!previousValue || previousValue === 0) return "stable";

  const changePercentage = Math.abs((currentValue - previousValue) / previousValue);

  if (changePercentage < threshold) return "stable";
  return currentValue > previousValue ? "up" : "down";
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(currentValue: number, previousValue: number): number {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Get period date range
 */
export function getPeriodDateRange(
  period: MetricPeriod,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);

  switch (period) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarter":
      const quarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(quarter * 3 + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "all_time":
      startDate.setFullYear(2020, 0, 1); // SafeWork Pro launch date
      break;
  }

  return { startDate, endDate };
}

/**
 * Get previous period date range for comparison
 */
export function getPreviousPeriodDateRange(
  period: MetricPeriod,
  currentStartDate: Date
): { startDate: Date; endDate: Date } {
  const startDate = new Date(currentStartDate);
  const endDate = new Date(currentStartDate);
  endDate.setMilliseconds(-1); // End just before current period starts

  switch (period) {
    case "day":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "all_time":
      // No previous period for all_time
      return { startDate: new Date(0), endDate: new Date(0) };
  }

  return { startDate, endDate };
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, metricType: string, decimals: number = 1): string {
  switch (metricType) {
    case "compliance_rate":
    case "user_activation_rate":
      return `${value.toFixed(decimals)}%`;
    case "time_to_approval":
      return `${value.toFixed(decimals)}h`;
    case "average_risk_score":
      return value.toFixed(0);
    default:
      return value.toFixed(0);
  }
}

/**
 * Get metric display name
 */
export function getMetricDisplayName(metricType: string): string {
  const names: Record<string, string> = {
    tras_created: "TRAs Created",
    lmras_executed: "LMRAs Executed",
    average_risk_score: "Average Risk Score",
    compliance_rate: "Compliance Rate",
    time_to_approval: "Time to Approval",
    user_activation_rate: "User Activation Rate",
  };
  return names[metricType] || metricType;
}

/**
 * Get metric description
 */
export function getMetricDescription(metricType: string): string {
  const descriptions: Record<string, string> = {
    tras_created: "Number of Task Risk Analyses created in the period",
    lmras_executed: "Number of Last Minute Risk Analyses executed in the period",
    average_risk_score: "Average Kinney & Wiruth risk score across all TRAs",
    compliance_rate: "Percentage of TRAs meeting compliance requirements",
    time_to_approval: "Average time from TRA submission to approval",
    user_activation_rate: "Percentage of users who have completed activation milestones",
  };
  return descriptions[metricType] || "";
}

/**
 * Check if metric is healthy
 */
export function isMetricHealthy(metric: MetricWithTarget): boolean {
  if (!metric.status) return true;
  return metric.status === "excellent" || metric.status === "good";
}

/**
 * Get metric color for visualization
 */
export function getMetricColor(status: MetricStatus): string {
  const colors: Record<MetricStatus, string> = {
    excellent: "#10B981", // Green
    good: "#84CC16", // Light green
    warning: "#F59E0B", // Yellow/Orange
    critical: "#EF4444", // Red
  };
  return colors[status];
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: TrendDirection): string {
  const icons: Record<TrendDirection, string> = {
    up: "↑",
    down: "↓",
    stable: "→",
  };
  return icons[trend];
}
