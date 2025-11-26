/**
 * VCA Compliance Analytics Service
 *
 * Handles compliance history tracking, trends analysis, and statistics
 */

import { db } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { TRA } from "@/lib/types/tra";
import type { VCAComplianceResult } from "@/lib/vca-compliance";
import type {
  ComplianceHistory,
  ComplianceTrendPoint,
  ComplianceStatistics,
  ComplianceQuery,
  ComplianceBatchResult,
} from "@/types/compliance";
import { calculateVCACompliance } from "@/lib/vca-compliance";

/**
 * Save compliance check result to history
 */
export async function saveComplianceHistory(
  organizationId: string,
  traId: string,
  complianceResult: VCAComplianceResult,
  options?: {
    traTitle?: string;
    projectId?: string;
    projectName?: string;
    checkedBy?: string;
    checkedByName?: string;
    version?: number;
  }
): Promise<string> {
  const historyRef = db.collection(`organizations/${organizationId}/compliance-history`).doc();

  const historyRecord: Omit<ComplianceHistory, "id"> = {
    traId,
    organizationId,
    score: complianceResult.score,
    level: complianceResult.level,
    isCompliant: complianceResult.isCompliant,
    breakdown: complianceResult.breakdown,
    issues: complianceResult.issues,
    recommendations: complianceResult.recommendations,
    traTitle: options?.traTitle,
    projectId: options?.projectId,
    projectName: options?.projectName,
    checkedBy: options?.checkedBy,
    checkedByName: options?.checkedByName,
    checkedAt: Timestamp.now() as any,
    version: options?.version || 1,
    isActive: true,
  };

  await historyRef.set(historyRecord);

  return historyRef.id;
}

/**
 * Get compliance history for a specific TRA
 */
export async function getComplianceHistory(
  organizationId: string,
  traId: string,
  limit: number = 10
): Promise<ComplianceHistory[]> {
  const snapshot = await db
    .collection(`organizations/${organizationId}/compliance-history`)
    .where("traId", "==", traId)
    .where("isActive", "==", true)
    .orderBy("checkedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ComplianceHistory[];
}

/**
 * Get compliance trends for an organization
 */
export async function getComplianceTrends(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date,
  groupBy: "day" | "week" | "month" = "week"
): Promise<ComplianceTrendPoint[]> {
  const snapshot = await db
    .collection(`organizations/${organizationId}/compliance-history`)
    .where("checkedAt", ">=", Timestamp.fromDate(dateFrom))
    .where("checkedAt", "<=", Timestamp.fromDate(dateTo))
    .where("isActive", "==", true)
    .orderBy("checkedAt", "asc")
    .get();

  // Group data by time period
  const grouped = new Map<string, { scores: number[]; traIds: Set<string> }>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const date = (data.checkedAt as Timestamp).toDate();
    const key = getGroupKey(date, groupBy);

    if (!grouped.has(key)) {
      grouped.set(key, { scores: [], traIds: new Set() });
    }

    const group = grouped.get(key)!;
    group.scores.push(data.score);
    group.traIds.add(data.traId);
  });

  // Convert to trend points
  const trends: ComplianceTrendPoint[] = [];
  grouped.forEach((value, key) => {
    const averageScore = value.scores.reduce((a, b) => a + b, 0) / value.scores.length;
    const level = getComplianceLevelFromScore(averageScore);

    trends.push({
      date: parseGroupKey(key, groupBy),
      score: Math.round(averageScore),
      level,
      traCount: value.traIds.size,
    });
  });

  return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get compliance statistics for an organization
 */
export async function getComplianceStatistics(
  organizationId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<ComplianceStatistics> {
  // Get all TRAs in the organization
  const trasSnapshot = await db
    .collection(`organizations/${organizationId}/tras`)
    .where("isActive", "==", true)
    .get();

  const totalTRAs = trasSnapshot.size;
  let compliantTRAs = 0;
  let nonCompliantTRAs = 0;
  let totalScore = 0;

  const byLevel = {
    fullyCompliant: 0,
    compliant: 0,
    partiallyCompliant: 0,
    nonCompliant: 0,
  };

  const categoryScores = {
    riskAssessment: [] as number[],
    controlMeasures: [] as number[],
    competencies: [] as number[],
    documentation: [] as number[],
    approvals: [] as number[],
  };

  // Calculate compliance for each TRA
  for (const doc of trasSnapshot.docs) {
    const tra = doc.data() as TRA;
    const result = calculateVCACompliance(tra);

    totalScore += result.score;

    if (result.isCompliant) {
      compliantTRAs++;
    } else {
      nonCompliantTRAs++;
    }

    // Count by level
    switch (result.level) {
      case "FULLY_COMPLIANT":
        byLevel.fullyCompliant++;
        break;
      case "COMPLIANT":
        byLevel.compliant++;
        break;
      case "PARTIALLY_COMPLIANT":
        byLevel.partiallyCompliant++;
        break;
      case "NON_COMPLIANT":
        byLevel.nonCompliant++;
        break;
    }

    // Collect category scores
    categoryScores.riskAssessment.push(result.breakdown.riskAssessment.score);
    categoryScores.controlMeasures.push(result.breakdown.controlMeasures.score);
    categoryScores.competencies.push(result.breakdown.competencies.score);
    categoryScores.documentation.push(result.breakdown.documentation.score);
    categoryScores.approvals.push(result.breakdown.approvals.score);
  }

  const averageScore = totalTRAs > 0 ? Math.round(totalScore / totalTRAs) : 0;

  // Calculate category averages
  const byCategory = {
    riskAssessment: calculateAverage(categoryScores.riskAssessment),
    controlMeasures: calculateAverage(categoryScores.controlMeasures),
    competencies: calculateAverage(categoryScores.competencies),
    documentation: calculateAverage(categoryScores.documentation),
    approvals: calculateAverage(categoryScores.approvals),
  };

  // Calculate trend (compare with previous period)
  const periodLength = dateTo.getTime() - dateFrom.getTime();
  const previousPeriodStart = new Date(dateFrom.getTime() - periodLength);
  const previousPeriodEnd = dateFrom;

  const previousStats = await getComplianceStatistics(
    organizationId,
    previousPeriodStart,
    previousPeriodEnd
  ).catch(() => null);

  let trend: "improving" | "stable" | "declining" = "stable";
  let trendPercentage = 0;

  if (previousStats && previousStats.averageScore > 0) {
    const change = averageScore - previousStats.averageScore;
    trendPercentage = Math.round((change / previousStats.averageScore) * 100);

    if (trendPercentage > 5) {
      trend = "improving";
    } else if (trendPercentage < -5) {
      trend = "declining";
    }
  }

  return {
    totalTRAs,
    compliantTRAs,
    nonCompliantTRAs,
    averageScore,
    byLevel,
    byCategory,
    trend,
    trendPercentage,
    periodStart: dateFrom,
    periodEnd: dateTo,
    lastUpdated: new Date(),
  };
}

/**
 * Query compliance history with filters
 */
export async function queryComplianceHistory(query: ComplianceQuery): Promise<ComplianceHistory[]> {
  let ref = db
    .collection(`organizations/${query.organizationId}/compliance-history`)
    .where("isActive", "==", true) as any;

  // Apply filters
  if (query.traIds && query.traIds.length > 0) {
    ref = ref.where("traId", "in", query.traIds.slice(0, 10)); // Firestore limit
  }

  if (query.projectIds && query.projectIds.length > 0) {
    ref = ref.where("projectId", "in", query.projectIds.slice(0, 10));
  }

  if (query.dateFrom) {
    ref = ref.where("checkedAt", ">=", Timestamp.fromDate(query.dateFrom));
  }

  if (query.dateTo) {
    ref = ref.where("checkedAt", "<=", Timestamp.fromDate(query.dateTo));
  }

  if (query.minScore !== undefined) {
    ref = ref.where("score", ">=", query.minScore);
  }

  if (query.maxScore !== undefined) {
    ref = ref.where("score", "<=", query.maxScore);
  }

  if (query.levels && query.levels.length > 0) {
    ref = ref.where("level", "in", query.levels);
  }

  // Apply ordering and limits
  ref = ref.orderBy("checkedAt", "desc");

  if (query.limit) {
    ref = ref.limit(query.limit);
  }

  if (query.offset) {
    ref = ref.offset(query.offset);
  }

  const snapshot = await ref.get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as ComplianceHistory[];
}

/**
 * Batch check compliance for multiple TRAs
 */
export async function batchCheckCompliance(
  organizationId: string,
  traIds: string[]
): Promise<ComplianceBatchResult> {
  const startedAt = new Date();
  const results: ComplianceBatchResult["results"] = [];
  const errors: ComplianceBatchResult["errors"] = [];
  let compliant = 0;
  let nonCompliant = 0;

  for (const traId of traIds) {
    try {
      const traDoc = await db.collection(`organizations/${organizationId}/tras`).doc(traId).get();

      if (!traDoc.exists) {
        errors.push({ traId, error: "TRA not found" });
        continue;
      }

      const tra = traDoc.data() as TRA;
      const result = calculateVCACompliance(tra);

      results.push({
        traId,
        traTitle: tra.title || "Untitled",
        score: result.score,
        level: result.level,
        isCompliant: result.isCompliant,
      });

      if (result.isCompliant) {
        compliant++;
      } else {
        nonCompliant++;
      }

      // Save to history
      await saveComplianceHistory(organizationId, traId, result, {
        traTitle: tra.title,
        projectId: tra.projectId,
        projectName: tra.projectRef?.projectName,
        version: tra.version,
      });
    } catch (error: any) {
      errors.push({ traId, error: error.message || "Unknown error" });
    }
  }

  const completedAt = new Date();

  return {
    totalChecked: traIds.length,
    compliant,
    nonCompliant,
    results,
    startedAt,
    completedAt,
    duration: completedAt.getTime() - startedAt.getTime(),
    errors,
  };
}

/**
 * Get non-compliant TRAs for an organization
 */
export async function getNonCompliantTRAs(
  organizationId: string,
  limit: number = 20
): Promise<Array<{ tra: TRA; complianceResult: VCAComplianceResult }>> {
  const trasSnapshot = await db
    .collection(`organizations/${organizationId}/tras`)
    .where("isActive", "==", true)
    .where("complianceScore", "<", 85)
    .orderBy("complianceScore", "asc")
    .limit(limit)
    .get();

  const results: Array<{ tra: TRA; complianceResult: VCAComplianceResult }> = [];

  for (const doc of trasSnapshot.docs) {
    const tra = doc.data() as TRA;
    const complianceResult = calculateVCACompliance(tra);

    if (!complianceResult.isCompliant) {
      results.push({ tra, complianceResult });
    }
  }

  return results;
}

/**
 * Delete old compliance history records (cleanup)
 */
export async function cleanupOldComplianceHistory(
  organizationId: string,
  olderThanDays: number = 365
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const snapshot = await db
    .collection(`organizations/${organizationId}/compliance-history`)
    .where("checkedAt", "<", Timestamp.fromDate(cutoffDate))
    .limit(500) // Process in batches
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return snapshot.size;
}

// Helper functions

function getGroupKey(date: Date, groupBy: "day" | "week" | "month"): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (groupBy) {
    case "day":
      return `${year}-${month + 1}-${day}`;
    case "week":
      const weekNumber = getWeekNumber(date);
      return `${year}-W${weekNumber}`;
    case "month":
      return `${year}-${month + 1}`;
  }
}

function parseGroupKey(key: string, groupBy: "day" | "week" | "month"): Date {
  const parts = key.split("-");

  switch (groupBy) {
    case "day":
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    case "week":
      const year = parseInt(parts[0]);
      const week = parseInt(parts[1].substring(1));
      return getDateFromWeek(year, week);
    case "month":
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDateFromWeek(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

function getComplianceLevelFromScore(score: number): string {
  if (score >= 95) return "FULLY_COMPLIANT";
  if (score >= 85) return "COMPLIANT";
  if (score >= 70) return "PARTIALLY_COMPLIANT";
  return "NON_COMPLIANT";
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round(sum / numbers.length);
}
