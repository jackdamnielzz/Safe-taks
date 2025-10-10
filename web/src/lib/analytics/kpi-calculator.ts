/**
 * KPI Calculator
 * Calculates core product metrics (KPIs) for SafeWork Pro analytics
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  KPICalculationParams,
  MetricCalculationResult,
  TRAsCreatedMetric,
  LMRAsExecutedMetric,
  AverageRiskScoreMetric,
  ComplianceRateMetric,
  TimeToApprovalMetric,
  UserActivationRateMetric,
  KPIDashboard,
  MetricPeriod,
  MetricWithTarget,
  getPeriodDateRange,
  getPreviousPeriodDateRange,
  calculateTrend,
  calculatePercentageChange,
  getMetricStatus,
  DEFAULT_KPI_TARGETS,
  formatMetricValue,
  getTrendIcon,
  getMetricColor,
} from "@/lib/types/metrics";
import { TRA, TRAStatus } from "@/lib/types/tra";
import { LMRASession, LMRAAssessment } from "@/lib/types/lmra";
import { OrganizationMember } from "@/lib/types/organization";

// ============================================================================
// KPI 1: TRAs CREATED PER MONTH
// ============================================================================

/**
 * Calculate TRAs created metric
 */
export async function calculateTRAsCreated(
  params: KPICalculationParams
): Promise<MetricCalculationResult<TRAsCreatedMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, projectId, targets } = params;

    // Query TRAs created in period
    const trasRef = collection(db, `organizations/${organizationId}/tras`);
    let q = query(
      trasRef,
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate))
    );

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    const tras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TRA);

    // Calculate breakdown by status
    const byStatus = tras.reduce(
      (acc, tra) => {
        acc[tra.status] = (acc[tra.status] || 0) + 1;
        return acc;
      },
      {} as Record<TRAStatus, number>
    );

    // Calculate breakdown by project
    const projectMap = new Map<string, { projectId: string; projectName: string; count: number }>();
    tras.forEach((tra) => {
      const key = tra.projectId;
      if (!projectMap.has(key)) {
        projectMap.set(key, {
          projectId: tra.projectId,
          projectName: tra.projectRef?.projectName || "Unknown",
          count: 0,
        });
      }
      projectMap.get(key)!.count++;
    });

    // Calculate breakdown by creator
    const creatorMap = new Map<string, { userId: string; displayName: string; count: number }>();
    tras.forEach((tra) => {
      const key = tra.createdBy;
      if (!creatorMap.has(key)) {
        creatorMap.set(key, {
          userId: tra.createdBy,
          displayName: tra.createdByName || "Unknown",
          count: 0,
        });
      }
      creatorMap.get(key)!.count++;
    });

    // Calculate daily average
    const daysDiff = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const averagePerDay = tras.length / daysDiff;

    // Find peak day
    const dayMap = new Map<string, number>();
    tras.forEach((tra) => {
      const date = tra.createdAt instanceof Date ? tra.createdAt : (tra.createdAt as any).toDate();
      const dayKey = date.toISOString().split("T")[0];
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    });

    let peakDay: { date: Date; count: number } | undefined;
    dayMap.forEach((count, dateStr) => {
      if (!peakDay || count > peakDay.count) {
        peakDay = { date: new Date(dateStr), count };
      }
    });

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevQuery = query(
        trasRef,
        where("createdAt", ">=", Timestamp.fromDate(prevRange.startDate)),
        where("createdAt", "<=", Timestamp.fromDate(prevRange.endDate))
      );
      const prevSnapshot = await getDocs(prevQuery);
      previousValue = prevSnapshot.size;
    }

    const value = tras.length;
    const target = targets?.trasCreatedPerMonth || DEFAULT_KPI_TARGETS.trasCreatedPerMonth;

    const metric: TRAsCreatedMetric = {
      metricType: "tras_created",
      value,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? value - previousValue : undefined,
      changePercentage:
        previousValue !== undefined ? calculatePercentageChange(value, previousValue) : undefined,
      trend: previousValue !== undefined ? calculateTrend(value, previousValue) : undefined,
      target,
      status: getMetricStatus(value, target, true),
      targetAchievement: (value / target) * 100,
      byStatus: {
        draft: byStatus.draft || 0,
        submitted: byStatus.submitted || 0,
        in_review: byStatus.in_review || 0,
        approved: byStatus.approved || 0,
        rejected: byStatus.rejected || 0,
        active: byStatus.active || 0,
      },
      byProject: Array.from(projectMap.values()).sort((a, b) => b.count - a.count),
      byCreator: Array.from(creatorMap.values()).sort((a, b) => b.count - a.count),
      averagePerDay,
      peakDay,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: tras.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calculating TRAs created",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// KPI 2: LMRAs EXECUTED PER MONTH
// ============================================================================

/**
 * Calculate LMRAs executed metric
 */
export async function calculateLMRAsExecuted(
  params: KPICalculationParams
): Promise<MetricCalculationResult<LMRAsExecutedMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, projectId, targets } = params;

    // Query LMRA sessions in period
    const lmrasRef = collection(db, `organizations/${organizationId}/lmraSessions`);
    let q = query(
      lmrasRef,
      where("startedAt", ">=", Timestamp.fromDate(startDate)),
      where("startedAt", "<=", Timestamp.fromDate(endDate))
    );

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LMRASession);

    // Calculate breakdown by assessment
    const byAssessment = sessions.reduce(
      (acc, session) => {
        if (session.overallAssessment) {
          acc[session.overallAssessment] = (acc[session.overallAssessment] || 0) + 1;
        }
        return acc;
      },
      {} as Record<LMRAAssessment, number>
    );

    // Calculate breakdown by project
    const projectMap = new Map<string, { projectId: string; projectName: string; count: number }>();
    sessions.forEach((session) => {
      const key = session.projectId;
      if (!projectMap.has(key)) {
        projectMap.set(key, {
          projectId: session.projectId,
          projectName: "Unknown", // Would need to fetch from project data
          count: 0,
        });
      }
      projectMap.get(key)!.count++;
    });

    // Calculate breakdown by performer
    const performerMap = new Map<string, { userId: string; displayName: string; count: number }>();
    sessions.forEach((session) => {
      const key = session.performedBy;
      if (!performerMap.has(key)) {
        performerMap.set(key, {
          userId: session.performedBy,
          displayName: session.performedByName || "Unknown",
          count: 0,
        });
      }
      performerMap.get(key)!.count++;
    });

    // Calculate completion rate
    const completedSessions = sessions.filter((s) => !!s.completedAt);
    const completionRate =
      sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

    // Calculate stop work rate
    const stopWorkSessions = sessions.filter((s) => s.overallAssessment === "stop_work");
    const stopWorkRate =
      sessions.length > 0 ? (stopWorkSessions.length / sessions.length) * 100 : 0;

    // Calculate daily average
    const daysDiff = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const averagePerDay = sessions.length / daysDiff;

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevQuery = query(
        lmrasRef,
        where("startedAt", ">=", Timestamp.fromDate(prevRange.startDate)),
        where("startedAt", "<=", Timestamp.fromDate(prevRange.endDate))
      );
      const prevSnapshot = await getDocs(prevQuery);
      previousValue = prevSnapshot.size;
    }

    const value = sessions.length;
    const target = targets?.lmrasExecutedPerMonth || DEFAULT_KPI_TARGETS.lmrasExecutedPerMonth;

    const metric: LMRAsExecutedMetric = {
      metricType: "lmras_executed",
      value,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? value - previousValue : undefined,
      changePercentage:
        previousValue !== undefined ? calculatePercentageChange(value, previousValue) : undefined,
      trend: previousValue !== undefined ? calculateTrend(value, previousValue) : undefined,
      target,
      status: getMetricStatus(value, target, true),
      targetAchievement: (value / target) * 100,
      byAssessment: {
        safe_to_proceed: byAssessment.safe_to_proceed || 0,
        proceed_with_caution: byAssessment.proceed_with_caution || 0,
        stop_work: byAssessment.stop_work || 0,
      },
      byProject: Array.from(projectMap.values()).sort((a, b) => b.count - a.count),
      byPerformer: Array.from(performerMap.values()).sort((a, b) => b.count - a.count),
      averagePerDay,
      completionRate,
      stopWorkRate,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: sessions.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calculating LMRAs executed",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// KPI 3: AVERAGE RISK SCORE
// ============================================================================

/**
 * Calculate average risk score metric
 */
export async function calculateAverageRiskScore(
  params: KPICalculationParams
): Promise<MetricCalculationResult<AverageRiskScoreMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, projectId } = params;

    // Query active TRAs (not drafts or archived)
    const trasRef = collection(db, `organizations/${organizationId}/tras`);
    let q = query(
      trasRef,
      where("isActive", "==", true),
      where("status", "in", ["approved", "active"])
    );

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    const tras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TRA);

    // Calculate risk distribution
    const riskDistribution = {
      trivial: 0,
      acceptable: 0,
      possible: 0,
      substantial: 0,
      high: 0,
      very_high: 0,
    };

    let totalRiskScore = 0;
    let totalHazards = 0;
    let highestRiskScore = 0;
    let lowestRiskScore = Infinity;
    const riskScores: number[] = [];

    tras.forEach((tra) => {
      totalRiskScore += tra.overallRiskScore;
      riskScores.push(tra.overallRiskScore);

      if (tra.overallRiskScore > highestRiskScore) {
        highestRiskScore = tra.overallRiskScore;
      }
      if (tra.overallRiskScore < lowestRiskScore) {
        lowestRiskScore = tra.overallRiskScore;
      }

      riskDistribution[tra.overallRiskLevel]++;

      // Count total hazards
      tra.taskSteps.forEach((step) => {
        totalHazards += step.hazards.length;
      });
    });

    const averageRiskScore = tras.length > 0 ? totalRiskScore / tras.length : 0;

    // Calculate median
    riskScores.sort((a, b) => a - b);
    const medianRiskScore =
      riskScores.length > 0
        ? riskScores.length % 2 === 0
          ? (riskScores[riskScores.length / 2 - 1] + riskScores[riskScores.length / 2]) / 2
          : riskScores[Math.floor(riskScores.length / 2)]
        : 0;

    // Calculate breakdown by project
    const projectMap = new Map<
      string,
      { projectId: string; projectName: string; totalScore: number; count: number }
    >();
    tras.forEach((tra) => {
      const key = tra.projectId;
      if (!projectMap.has(key)) {
        projectMap.set(key, {
          projectId: tra.projectId,
          projectName: tra.projectRef?.projectName || "Unknown",
          totalScore: 0,
          count: 0,
        });
      }
      const project = projectMap.get(key)!;
      project.totalScore += tra.overallRiskScore;
      project.count++;
    });

    const byProject = Array.from(projectMap.values()).map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      averageScore: p.count > 0 ? p.totalScore / p.count : 0,
      riskLevel: "", // Would calculate based on average
    }));

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevQuery = query(
        trasRef,
        where("isActive", "==", true),
        where("status", "in", ["approved", "active"]),
        where("createdAt", ">=", Timestamp.fromDate(prevRange.startDate)),
        where("createdAt", "<=", Timestamp.fromDate(prevRange.endDate))
      );
      const prevSnapshot = await getDocs(prevQuery);
      const prevTras = prevSnapshot.docs.map((doc) => doc.data() as TRA);
      const prevTotal = prevTras.reduce((sum, tra) => sum + tra.overallRiskScore, 0);
      previousValue = prevTras.length > 0 ? prevTotal / prevTras.length : 0;
    }

    const metric: AverageRiskScoreMetric = {
      metricType: "average_risk_score",
      value: averageRiskScore,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? averageRiskScore - previousValue : undefined,
      changePercentage:
        previousValue !== undefined
          ? calculatePercentageChange(averageRiskScore, previousValue)
          : undefined,
      trend:
        previousValue !== undefined ? calculateTrend(averageRiskScore, previousValue) : undefined,
      riskDistribution,
      byProject,
      highestRiskScore: highestRiskScore > 0 ? highestRiskScore : undefined,
      lowestRiskScore: lowestRiskScore < Infinity ? lowestRiskScore : undefined,
      medianRiskScore,
      totalHazardsAnalyzed: totalHazards,
      improvementRate:
        previousValue && previousValue > 0
          ? ((previousValue - averageRiskScore) / previousValue) * 100
          : undefined,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: tras.length,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error calculating average risk score",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// KPI 4: COMPLIANCE RATE
// ============================================================================

/**
 * Calculate compliance rate metric
 */
export async function calculateComplianceRate(
  params: KPICalculationParams
): Promise<MetricCalculationResult<ComplianceRateMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, projectId, targets } = params;

    // Query TRAs in period
    const trasRef = collection(db, `organizations/${organizationId}/tras`);
    let q = query(
      trasRef,
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate)),
      where("isActive", "==", true)
    );

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    const tras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TRA);

    // Calculate compliance
    // A TRA is compliant if:
    // 1. Has approval workflow completed
    // 2. All hazards have control measures
    // 3. Validity period is within VCA limits (12 months)
    // 4. Has required team members and competencies

    let compliantCount = 0;
    let totalComplianceScore = 0;
    const nonComplianceReasons: Map<string, number> = new Map();

    const vcaCompliant = { compliant: 0, total: 0 };
    const iso45001Compliant = { compliant: 0, total: 0 };

    tras.forEach((tra) => {
      let isCompliant = true;
      let complianceScore = 0;
      const maxScore = 5; // 5 compliance criteria

      // Check 1: Approval workflow
      if (tra.status === "approved" || tra.status === "active") {
        complianceScore++;
      } else {
        isCompliant = false;
        nonComplianceReasons.set(
          "Not approved",
          (nonComplianceReasons.get("Not approved") || 0) + 1
        );
      }

      // Check 2: All hazards have control measures
      let hasAllControls = true;
      tra.taskSteps.forEach((step) => {
        step.hazards.forEach((hazard) => {
          if (!hazard.controlMeasures || hazard.controlMeasures.length === 0) {
            hasAllControls = false;
          }
        });
      });
      if (hasAllControls) {
        complianceScore++;
      } else {
        isCompliant = false;
        nonComplianceReasons.set(
          "Missing control measures",
          (nonComplianceReasons.get("Missing control measures") || 0) + 1
        );
      }

      // Check 3: Validity period within limits
      if (tra.validFrom && tra.validUntil) {
        const validFrom =
          tra.validFrom instanceof Date ? tra.validFrom : (tra.validFrom as any).toDate();
        const validUntil =
          tra.validUntil instanceof Date ? tra.validUntil : (tra.validUntil as any).toDate();
        const monthsDiff =
          (validUntil.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if (monthsDiff <= 12) {
          complianceScore++;
        } else {
          isCompliant = false;
          nonComplianceReasons.set(
            "Validity period exceeds 12 months",
            (nonComplianceReasons.get("Validity period exceeds 12 months") || 0) + 1
          );
        }
      } else {
        isCompliant = false;
        nonComplianceReasons.set(
          "Missing validity period",
          (nonComplianceReasons.get("Missing validity period") || 0) + 1
        );
      }

      // Check 4: Has team members
      if (tra.teamMembers && tra.teamMembers.length > 0) {
        complianceScore++;
      } else {
        isCompliant = false;
        nonComplianceReasons.set(
          "No team members assigned",
          (nonComplianceReasons.get("No team members assigned") || 0) + 1
        );
      }

      // Check 5: Has required competencies
      if (tra.requiredCompetencies && tra.requiredCompetencies.length > 0) {
        complianceScore++;
      } else {
        isCompliant = false;
        nonComplianceReasons.set(
          "No required competencies defined",
          (nonComplianceReasons.get("No required competencies defined") || 0) + 1
        );
      }

      if (isCompliant) {
        compliantCount++;
      }

      totalComplianceScore += (complianceScore / maxScore) * 100;

      // Track by framework
      if (tra.complianceFramework === "vca" || tra.complianceFramework === "both") {
        vcaCompliant.total++;
        if (isCompliant) vcaCompliant.compliant++;
      }
      if (tra.complianceFramework === "iso45001" || tra.complianceFramework === "both") {
        iso45001Compliant.total++;
        if (isCompliant) iso45001Compliant.compliant++;
      }
    });

    const complianceRate = tras.length > 0 ? (compliantCount / tras.length) * 100 : 0;
    const averageComplianceScore = tras.length > 0 ? totalComplianceScore / tras.length : 0;

    // Format non-compliance reasons
    const nonComplianceReasonsArray = Array.from(nonComplianceReasons.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: tras.length > 0 ? (count / tras.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevResult = await calculateComplianceRate({
        ...params,
        startDate: prevRange.startDate,
        endDate: prevRange.endDate,
        includePreviousPeriod: false,
      });
      previousValue = prevResult.metric?.value;
    }

    const target = targets?.minComplianceRate || DEFAULT_KPI_TARGETS.minComplianceRate;

    const metric: ComplianceRateMetric = {
      metricType: "compliance_rate",
      value: complianceRate,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? complianceRate - previousValue : undefined,
      changePercentage:
        previousValue !== undefined
          ? calculatePercentageChange(complianceRate, previousValue)
          : undefined,
      trend:
        previousValue !== undefined ? calculateTrend(complianceRate, previousValue) : undefined,
      target,
      status: getMetricStatus(complianceRate, target, true),
      targetAchievement: (complianceRate / target) * 100,
      compliantCount,
      nonCompliantCount: tras.length - compliantCount,
      totalTRAs: tras.length,
      byFramework: {
        vca: {
          compliant: vcaCompliant.compliant,
          total: vcaCompliant.total,
          rate: vcaCompliant.total > 0 ? (vcaCompliant.compliant / vcaCompliant.total) * 100 : 0,
        },
        iso45001: {
          compliant: iso45001Compliant.compliant,
          total: iso45001Compliant.total,
          rate:
            iso45001Compliant.total > 0
              ? (iso45001Compliant.compliant / iso45001Compliant.total) * 100
              : 0,
        },
      },
      nonComplianceReasons: nonComplianceReasonsArray,
      averageComplianceScore,
      fullyCompliantRate: tras.length > 0 ? (compliantCount / tras.length) * 100 : 0,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: tras.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calculating compliance rate",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// KPI 5: TIME TO APPROVAL
// ============================================================================

/**
 * Calculate time to approval metric
 */
export async function calculateTimeToApproval(
  params: KPICalculationParams
): Promise<MetricCalculationResult<TimeToApprovalMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, projectId, targets } = params;

    // Query approved TRAs in period
    const trasRef = collection(db, `organizations/${organizationId}/tras`);
    let q = query(
      trasRef,
      where("approvedAt", ">=", Timestamp.fromDate(startDate)),
      where("approvedAt", "<=", Timestamp.fromDate(endDate)),
      where("status", "==", "approved")
    );

    if (projectId) {
      q = query(q, where("projectId", "==", projectId));
    }

    const snapshot = await getDocs(q);
    const tras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TRA);

    // Calculate approval times
    const approvalTimes: number[] = [];
    let totalHours = 0;
    let minHours = Infinity;
    let maxHours = 0;
    let fastestApproval: { traId: string; hours: number } | undefined;
    let slowestApproval: { traId: string; hours: number } | undefined;

    tras.forEach((tra) => {
      if (tra.submittedAt && tra.approvedAt) {
        const submitted =
          tra.submittedAt instanceof Date ? tra.submittedAt : (tra.submittedAt as any).toDate();
        const approved =
          tra.approvedAt instanceof Date ? tra.approvedAt : (tra.approvedAt as any).toDate();
        const hours = (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60);

        approvalTimes.push(hours);
        totalHours += hours;

        if (hours < minHours) {
          minHours = hours;
          fastestApproval = { traId: tra.id, hours };
        }
        if (hours > maxHours) {
          maxHours = hours;
          slowestApproval = { traId: tra.id, hours };
        }
      }
    });

    const averageHours = approvalTimes.length > 0 ? totalHours / approvalTimes.length : 0;

    // Calculate median
    approvalTimes.sort((a, b) => a - b);
    const medianHours =
      approvalTimes.length > 0
        ? approvalTimes.length % 2 === 0
          ? (approvalTimes[approvalTimes.length / 2 - 1] +
              approvalTimes[approvalTimes.length / 2]) /
            2
          : approvalTimes[Math.floor(approvalTimes.length / 2)]
        : 0;

    // Query pending approvals
    const pendingQuery = query(
      trasRef,
      where("status", "in", ["submitted", "in_review"]),
      where("isActive", "==", true)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingApprovals = pendingSnapshot.size;

    // Calculate overdue approvals (submitted more than target hours ago)
    const targetHours =
      targets?.maxTimeToApprovalHours || DEFAULT_KPI_TARGETS.maxTimeToApprovalHours;
    const now = new Date();
    let overdueApprovals = 0;

    const pendingTras = pendingSnapshot.docs.map((doc) => doc.data() as TRA);
    pendingTras.forEach((tra) => {
      if (tra.submittedAt) {
        const submitted =
          tra.submittedAt instanceof Date ? tra.submittedAt : (tra.submittedAt as any).toDate();
        const hoursSinceSubmission = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSubmission > targetHours) {
          overdueApprovals++;
        }
      }
    });

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevResult = await calculateTimeToApproval({
        ...params,
        startDate: prevRange.startDate,
        endDate: prevRange.endDate,
        includePreviousPeriod: false,
      });
      previousValue = prevResult.metric?.averageHours;
    }

    const target = targetHours;

    const metric: TimeToApprovalMetric = {
      metricType: "time_to_approval",
      value: averageHours,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? averageHours - previousValue : undefined,
      changePercentage:
        previousValue !== undefined
          ? calculatePercentageChange(averageHours, previousValue)
          : undefined,
      trend: previousValue !== undefined ? calculateTrend(averageHours, previousValue) : undefined,
      target,
      status: getMetricStatus(averageHours, target, false), // Lower is better
      targetAchievement: target > 0 ? (target / averageHours) * 100 : 0,
      averageHours,
      medianHours,
      minHours: minHours < Infinity ? minHours : undefined,
      maxHours: maxHours > 0 ? maxHours : undefined,
      pendingApprovals,
      overdueApprovals,
      fastestApproval,
      slowestApproval,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: tras.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calculating time to approval",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// KPI 6: USER ACTIVATION RATE
// ============================================================================

/**
 * Calculate user activation rate metric
 */
export async function calculateUserActivationRate(
  params: KPICalculationParams
): Promise<MetricCalculationResult<UserActivationRateMetric>> {
  const startTime = Date.now();

  try {
    const { organizationId, startDate, endDate, targets } = params;

    // Query all organization members
    const membersRef = collection(db, `organizations/${organizationId}/users`);
    const membersSnapshot = await getDocs(membersRef);
    const members = membersSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as OrganizationMember
    );

    // Filter members created in period for new user tracking
    const newMembers = members.filter((member) => {
      const createdAt =
        member.createdAt instanceof Date ? member.createdAt : (member.createdAt as any).toDate();
      return createdAt >= startDate && createdAt <= endDate;
    });

    // Define activation criteria:
    // A user is "activated" if they have:
    // 1. Completed their profile (has firstName, lastName)
    // 2. Logged in at least once (has lastLoginAt)
    // 3. Performed at least one key action based on role

    let activatedUsers = 0;
    const milestones = {
      completedProfile: 0,
      createdFirstTRA: 0,
      executedFirstLMRA: 0,
      invitedTeamMember: 0,
      approvedFirstTRA: 0,
    };

    const roleBreakdown = new Map<string, { totalUsers: number; activatedUsers: number }>();
    const activationTimes: number[] = [];

    for (const member of members) {
      let isActivated = false;

      // Check profile completion
      const hasCompletedProfile = !!(member.firstName && member.lastName);
      if (hasCompletedProfile) {
        milestones.completedProfile++;
      }

      // Check if logged in
      const hasLoggedIn = !!member.lastLoginAt;

      // Check role-specific actions
      let hasPerformedAction = false;

      // Query user's TRAs
      const userTrasQuery = query(
        collection(db, `organizations/${organizationId}/tras`),
        where("createdBy", "==", member.id),
        firestoreLimit(1)
      );
      const userTrasSnapshot = await getDocs(userTrasQuery);
      if (userTrasSnapshot.size > 0) {
        milestones.createdFirstTRA++;
        hasPerformedAction = true;
      }

      // Query user's LMRAs
      const userLmrasQuery = query(
        collection(db, `organizations/${organizationId}/lmraSessions`),
        where("performedBy", "==", member.id),
        firestoreLimit(1)
      );
      const userLmrasSnapshot = await getDocs(userLmrasQuery);
      if (userLmrasSnapshot.size > 0) {
        milestones.executedFirstLMRA++;
        hasPerformedAction = true;
      }

      // User is activated if they have completed profile, logged in, and performed an action
      isActivated = hasCompletedProfile && hasLoggedIn && hasPerformedAction;

      if (isActivated) {
        activatedUsers++;

        // Calculate time to activation
        if (member.createdAt && member.lastLoginAt) {
          const created =
            member.createdAt instanceof Date
              ? member.createdAt
              : (member.createdAt as any).toDate();
          const lastLogin =
            member.lastLoginAt instanceof Date
              ? member.lastLoginAt
              : (member.lastLoginAt as any).toDate();
          const daysToActivation =
            (lastLogin.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          activationTimes.push(daysToActivation);
        }
      }

      // Track by role
      const role = member.role;
      if (!roleBreakdown.has(role)) {
        roleBreakdown.set(role, { totalUsers: 0, activatedUsers: 0 });
      }
      const roleData = roleBreakdown.get(role)!;
      roleData.totalUsers++;
      if (isActivated) {
        roleData.activatedUsers++;
      }
    }

    const totalUsers = members.length;
    const activationRate = totalUsers > 0 ? (activatedUsers / totalUsers) * 100 : 0;

    // Calculate average and median time to activation
    const averageDaysToActivation =
      activationTimes.length > 0
        ? activationTimes.reduce((sum, days) => sum + days, 0) / activationTimes.length
        : undefined;

    activationTimes.sort((a, b) => a - b);
    const medianDaysToActivation =
      activationTimes.length > 0
        ? activationTimes.length % 2 === 0
          ? (activationTimes[activationTimes.length / 2 - 1] +
              activationTimes[activationTimes.length / 2]) /
            2
          : activationTimes[Math.floor(activationTimes.length / 2)]
        : undefined;

    // Calculate retention rate (users still active)
    const activeUsers = members.filter((m) => m.isActive).length;
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Calculate churned users
    const churnedUsers = totalUsers - activeUsers;

    // Format role breakdown
    const byRole = Array.from(roleBreakdown.entries()).map(([role, data]) => ({
      role,
      totalUsers: data.totalUsers,
      activatedUsers: data.activatedUsers,
      activationRate: data.totalUsers > 0 ? (data.activatedUsers / data.totalUsers) * 100 : 0,
    }));

    // Calculate previous period for trend
    let previousValue: number | undefined;
    if (params.includePreviousPeriod) {
      const prevRange = getPreviousPeriodDateRange(params.period, startDate);
      const prevResult = await calculateUserActivationRate({
        ...params,
        startDate: prevRange.startDate,
        endDate: prevRange.endDate,
        includePreviousPeriod: false,
      });
      previousValue = prevResult.metric?.activationRate;
    }

    const target = targets?.minUserActivationRate || DEFAULT_KPI_TARGETS.minUserActivationRate;

    const metric: UserActivationRateMetric = {
      metricType: "user_activation_rate",
      value: activationRate,
      period: params.period,
      startDate,
      endDate,
      calculatedAt: new Date(),
      organizationId,
      previousValue,
      change: previousValue !== undefined ? activationRate - previousValue : undefined,
      changePercentage:
        previousValue !== undefined
          ? calculatePercentageChange(activationRate, previousValue)
          : undefined,
      trend:
        previousValue !== undefined ? calculateTrend(activationRate, previousValue) : undefined,
      target,
      status: getMetricStatus(activationRate, target, true),
      targetAchievement: (activationRate / target) * 100,
      totalUsers,
      activatedUsers,
      activationRate,
      milestones,
      byRole,
      averageDaysToActivation,
      medianDaysToActivation,
      newUsersThisPeriod: newMembers.length,
      churnedUsers,
      retentionRate,
    };

    return {
      success: true,
      metric,
      calculationTime: Date.now() - startTime,
      dataSourceCount: members.length,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error calculating user activation rate",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// COMPOSITE KPI DASHBOARD
// ============================================================================

/**
 * Calculate all KPIs for a dashboard
 */
export async function calculateKPIDashboard(
  params: KPICalculationParams
): Promise<MetricCalculationResult<KPIDashboard>> {
  const startTime = Date.now();

  try {
    // Calculate all metrics in parallel
    const [
      trasCreatedResult,
      lmrasExecutedResult,
      averageRiskScoreResult,
      complianceRateResult,
      timeToApprovalResult,
      userActivationRateResult,
    ] = await Promise.all([
      calculateTRAsCreated(params),
      calculateLMRAsExecuted(params),
      calculateAverageRiskScore(params),
      calculateComplianceRate(params),
      calculateTimeToApproval(params),
      calculateUserActivationRate(params),
    ]);

    // Check if any calculation failed
    const failures = [
      trasCreatedResult,
      lmrasExecutedResult,
      averageRiskScoreResult,
      complianceRateResult,
      timeToApprovalResult,
      userActivationRateResult,
    ].filter((r) => !r.success);

    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to calculate ${failures.length} metric(s): ${failures.map((f) => f.error).join(", ")}`,
        calculationTime: Date.now() - startTime,
      };
    }

    // Calculate overall health score (0-100)
    // Based on how many metrics meet their targets
    const metrics = [
      trasCreatedResult.metric!,
      lmrasExecutedResult.metric!,
      complianceRateResult.metric!,
      timeToApprovalResult.metric!,
      userActivationRateResult.metric!,
    ];

    const healthyMetrics = metrics.filter(
      (m) => m.status === "excellent" || m.status === "good"
    ).length;
    const overallHealthScore = (healthyMetrics / metrics.length) * 100;

    const dashboard: KPIDashboard = {
      organizationId: params.organizationId,
      period: params.period,
      startDate: params.startDate,
      endDate: params.endDate,
      calculatedAt: new Date(),
      trasCreated: trasCreatedResult.metric!,
      lmrasExecuted: lmrasExecutedResult.metric!,
      averageRiskScore: averageRiskScoreResult.metric!,
      complianceRate: complianceRateResult.metric!,
      timeToApproval: timeToApprovalResult.metric!,
      userActivationRate: userActivationRateResult.metric!,
      overallHealthScore,
    };

    return {
      success: true,
      metric: dashboard,
      calculationTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calculating KPI dashboard",
      calculationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Calculate KPIs for current month
 */
export async function calculateCurrentMonthKPIs(
  organizationId: string,
  includePreviousPeriod: boolean = true
): Promise<MetricCalculationResult<KPIDashboard>> {
  const { startDate, endDate } = getPeriodDateRange("month");

  return calculateKPIDashboard({
    organizationId,
    period: "month",
    startDate,
    endDate,
    includePreviousPeriod,
  });
}

/**
 * Calculate KPIs for a specific project
 */
export async function calculateProjectKPIs(
  organizationId: string,
  projectId: string,
  period: MetricPeriod = "month"
): Promise<MetricCalculationResult<KPIDashboard>> {
  const { startDate, endDate } = getPeriodDateRange(period);

  return calculateKPIDashboard({
    organizationId,
    projectId,
    period,
    startDate,
    endDate,
    includePreviousPeriod: true,
  });
}

/**
 * Get metric summary for quick display
 */
export function getMetricSummary(metric: MetricWithTarget): {
  value: string;
  status: string;
  trend: string;
  color: string;
} {
  const metricType = (metric as any).metricType || "unknown";

  return {
    value: formatMetricValue(metric.value, metricType),
    status: metric.status || "good",
    trend: metric.trend ? getTrendIcon(metric.trend) : "→",
    color: metric.status ? getMetricColor(metric.status) : "#84CC16",
  };
}
