/**
 * Cohort Analysis
 * User retention and cohort tracking for SafeWork Pro
 */

import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrganizationMember } from "@/lib/types/organization";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cohort period grouping
 */
export type CohortPeriod = "daily" | "weekly" | "monthly";

/**
 * Retention period (days from registration)
 */
export type RetentionPeriod = 1 | 7 | 30;

/**
 * User cohort definition
 */
export interface UserCohort {
  cohortId: string;
  cohortName: string;
  startDate: Date;
  endDate: Date;
  totalUsers: number;

  // Retention metrics
  day1Retention: number; // Percentage
  day7Retention: number;
  day30Retention: number;

  // Breakdown by role
  byRole?: {
    role: string;
    totalUsers: number;
    day1Retained: number;
    day7Retained: number;
    day30Retained: number;
  }[];

  // Activity metrics
  activeUsers?: number;
  churnedUsers?: number;
  averageDaysActive?: number;
}

/**
 * Cohort analysis result
 */
export interface CohortAnalysisResult {
  organizationId: string;
  period: CohortPeriod;
  cohorts: UserCohort[];
  overallRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  calculatedAt: Date;
}

/**
 * Cohort filter options
 */
export interface CohortFilterOptions {
  organizationId: string;
  period: CohortPeriod;
  startDate: Date;
  endDate: Date;
  role?: string;
  minCohortSize?: number; // Minimum users per cohort
}

// ============================================================================
// COHORT CALCULATION
// ============================================================================

/**
 * Calculate user cohort retention analysis
 */
export async function calculateCohortAnalysis(
  options: CohortFilterOptions
): Promise<CohortAnalysisResult> {
  const { organizationId, period, startDate, endDate, role, minCohortSize = 1 } = options;

  // Fetch all users in the organization
  const usersRef = collection(db, `organizations/${organizationId}/users`);
  let usersQuery = query(
    usersRef,
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "asc")
  );

  if (role) {
    usersQuery = query(usersQuery, where("role", "==", role));
  }

  const usersSnapshot = await getDocs(usersQuery);
  const users = usersSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as OrganizationMember
  );

  // Group users into cohorts based on period
  const cohortMap = new Map<string, OrganizationMember[]>();

  users.forEach((user) => {
    const createdAt =
      user.createdAt instanceof Date ? user.createdAt : (user.createdAt as any).toDate();
    const cohortKey = getCohortKey(createdAt, period);

    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, []);
    }
    cohortMap.get(cohortKey)!.push(user);
  });

  // Calculate retention for each cohort
  const cohorts: UserCohort[] = [];
  let totalDay1Retained = 0;
  let totalDay7Retained = 0;
  let totalDay30Retained = 0;
  let totalUsersAcrossCohorts = 0;

  for (const [cohortKey, cohortUsers] of cohortMap.entries()) {
    if (cohortUsers.length < minCohortSize) continue;

    const cohortStartDate =
      cohortUsers[0].createdAt instanceof Date
        ? cohortUsers[0].createdAt
        : (cohortUsers[0].createdAt as any).toDate();

    const cohortEndDate = getCohortEndDate(cohortStartDate, period);

    // Calculate retention for this cohort
    const retention = await calculateCohortRetention(organizationId, cohortUsers);

    // Calculate role breakdown
    const roleMap = new Map<
      string,
      {
        totalUsers: number;
        day1Retained: number;
        day7Retained: number;
        day30Retained: number;
      }
    >();

    for (const user of cohortUsers) {
      if (!roleMap.has(user.role)) {
        roleMap.set(user.role, {
          totalUsers: 0,
          day1Retained: 0,
          day7Retained: 0,
          day30Retained: 0,
        });
      }

      const roleData = roleMap.get(user.role)!;
      roleData.totalUsers++;

      const userRetention = await calculateUserRetention(organizationId, user);
      if (userRetention.day1) roleData.day1Retained++;
      if (userRetention.day7) roleData.day7Retained++;
      if (userRetention.day30) roleData.day30Retained++;
    }

    const byRole = Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      totalUsers: data.totalUsers,
      day1Retained: data.day1Retained,
      day7Retained: data.day7Retained,
      day30Retained: data.day30Retained,
    }));

    const cohort: UserCohort = {
      cohortId: cohortKey,
      cohortName: formatCohortName(cohortStartDate, period),
      startDate: cohortStartDate,
      endDate: cohortEndDate,
      totalUsers: cohortUsers.length,
      day1Retention: retention.day1Percentage,
      day7Retention: retention.day7Percentage,
      day30Retention: retention.day30Percentage,
      byRole,
      activeUsers: cohortUsers.filter((u) => u.isActive).length,
      churnedUsers: cohortUsers.filter((u) => !u.isActive).length,
    };

    cohorts.push(cohort);

    // Aggregate for overall retention
    totalDay1Retained += retention.day1Count;
    totalDay7Retained += retention.day7Count;
    totalDay30Retained += retention.day30Count;
    totalUsersAcrossCohorts += cohortUsers.length;
  }

  // Calculate overall retention rates
  const overallRetention = {
    day1: totalUsersAcrossCohorts > 0 ? (totalDay1Retained / totalUsersAcrossCohorts) * 100 : 0,
    day7: totalUsersAcrossCohorts > 0 ? (totalDay7Retained / totalUsersAcrossCohorts) * 100 : 0,
    day30: totalUsersAcrossCohorts > 0 ? (totalDay30Retained / totalUsersAcrossCohorts) * 100 : 0,
  };

  return {
    organizationId,
    period,
    cohorts: cohorts.sort((a, b) => b.startDate.getTime() - a.startDate.getTime()),
    overallRetention,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate retention for a specific cohort
 */
async function calculateCohortRetention(
  organizationId: string,
  cohortUsers: OrganizationMember[]
): Promise<{
  day1Count: number;
  day1Percentage: number;
  day7Count: number;
  day7Percentage: number;
  day30Count: number;
  day30Percentage: number;
}> {
  let day1Count = 0;
  let day7Count = 0;
  let day30Count = 0;

  for (const user of cohortUsers) {
    const retention = await calculateUserRetention(organizationId, user);
    if (retention.day1) day1Count++;
    if (retention.day7) day7Count++;
    if (retention.day30) day30Count++;
  }

  const total = cohortUsers.length;

  return {
    day1Count,
    day1Percentage: total > 0 ? (day1Count / total) * 100 : 0,
    day7Count,
    day7Percentage: total > 0 ? (day7Count / total) * 100 : 0,
    day30Count,
    day30Percentage: total > 0 ? (day30Count / total) * 100 : 0,
  };
}

/**
 * Calculate retention for a single user
 */
async function calculateUserRetention(
  organizationId: string,
  user: OrganizationMember
): Promise<{
  day1: boolean;
  day7: boolean;
  day30: boolean;
}> {
  const createdAt =
    user.createdAt instanceof Date ? user.createdAt : (user.createdAt as any).toDate();
  const now = new Date();

  // Check if user has been registered long enough for each retention period
  const daysSinceRegistration = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // User is retained if they logged in within the retention period
  const lastLoginAt = user.lastLoginAt
    ? user.lastLoginAt instanceof Date
      ? user.lastLoginAt
      : (user.lastLoginAt as any).toDate()
    : null;

  if (!lastLoginAt) {
    return { day1: false, day7: false, day30: false };
  }

  const daysSinceLastLogin = (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);

  // Check retention for each period
  const day1 = daysSinceRegistration >= 1 && daysSinceLastLogin <= 1;
  const day7 = daysSinceRegistration >= 7 && daysSinceLastLogin <= 7;
  const day30 = daysSinceRegistration >= 30 && daysSinceLastLogin <= 30;

  // Also check if user performed any actions (created TRA or executed LMRA)
  const hasActivity = await checkUserActivity(organizationId, user.id, createdAt);

  return {
    day1: day1 && hasActivity.day1,
    day7: day7 && hasActivity.day7,
    day30: day30 && hasActivity.day30,
  };
}

/**
 * Check if user has performed activities within retention periods
 */
async function checkUserActivity(
  organizationId: string,
  userId: string,
  registrationDate: Date
): Promise<{
  day1: boolean;
  day7: boolean;
  day30: boolean;
}> {
  const day1Date = new Date(registrationDate.getTime() + 1 * 24 * 60 * 60 * 1000);
  const day7Date = new Date(registrationDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const day30Date = new Date(registrationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Check TRA creation activity
  const trasRef = collection(db, `organizations/${organizationId}/tras`);

  const day1TrasQuery = query(
    trasRef,
    where("createdBy", "==", userId),
    where("createdAt", "<=", Timestamp.fromDate(day1Date))
  );
  const day1TrasSnapshot = await getDocs(day1TrasQuery);
  const hasDay1Activity = day1TrasSnapshot.size > 0;

  const day7TrasQuery = query(
    trasRef,
    where("createdBy", "==", userId),
    where("createdAt", "<=", Timestamp.fromDate(day7Date))
  );
  const day7TrasSnapshot = await getDocs(day7TrasQuery);
  const hasDay7Activity = day7TrasSnapshot.size > 0;

  const day30TrasQuery = query(
    trasRef,
    where("createdBy", "==", userId),
    where("createdAt", "<=", Timestamp.fromDate(day30Date))
  );
  const day30TrasSnapshot = await getDocs(day30TrasQuery);
  const hasDay30Activity = day30TrasSnapshot.size > 0;

  // Check LMRA execution activity
  const lmrasRef = collection(db, `organizations/${organizationId}/lmraSessions`);

  const day1LmrasQuery = query(
    lmrasRef,
    where("performedBy", "==", userId),
    where("startedAt", "<=", Timestamp.fromDate(day1Date))
  );
  const day1LmrasSnapshot = await getDocs(day1LmrasQuery);

  const day7LmrasQuery = query(
    lmrasRef,
    where("performedBy", "==", userId),
    where("startedAt", "<=", Timestamp.fromDate(day7Date))
  );
  const day7LmrasSnapshot = await getDocs(day7LmrasQuery);

  const day30LmrasQuery = query(
    lmrasRef,
    where("performedBy", "==", userId),
    where("startedAt", "<=", Timestamp.fromDate(day30Date))
  );
  const day30LmrasSnapshot = await getDocs(day30LmrasQuery);

  return {
    day1: hasDay1Activity || day1LmrasSnapshot.size > 0,
    day7: hasDay7Activity || day7LmrasSnapshot.size > 0,
    day30: hasDay30Activity || day30LmrasSnapshot.size > 0,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cohort key for grouping users
 */
function getCohortKey(date: Date, period: CohortPeriod): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (period) {
    case "daily":
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    case "weekly":
      const weekNumber = getWeekNumber(date);
      return `${year}-W${String(weekNumber).padStart(2, "0")}`;
    case "monthly":
      return `${year}-${String(month).padStart(2, "0")}`;
  }
}

/**
 * Get cohort end date based on period
 */
function getCohortEndDate(startDate: Date, period: CohortPeriod): Date {
  const endDate = new Date(startDate);

  switch (period) {
    case "daily":
      endDate.setDate(endDate.getDate() + 1);
      break;
    case "weekly":
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
  }

  return endDate;
}

/**
 * Format cohort name for display
 */
function formatCohortName(date: Date, period: CohortPeriod): string {
  const year = date.getFullYear();
  const month = date.toLocaleString("nl-NL", { month: "long" });
  const day = date.getDate();

  switch (period) {
    case "daily":
      return `${day} ${month} ${year}`;
    case "weekly":
      const weekNumber = getWeekNumber(date);
      return `Week ${weekNumber}, ${year}`;
    case "monthly":
      return `${month} ${year}`;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get retention status color
 */
export function getRetentionColor(retentionPercentage: number): string {
  if (retentionPercentage >= 80) return "#10B981"; // Excellent - Green
  if (retentionPercentage >= 60) return "#84CC16"; // Good - Light green
  if (retentionPercentage >= 40) return "#F59E0B"; // Warning - Orange
  return "#EF4444"; // Critical - Red
}

/**
 * Get retention status label
 */
export function getRetentionStatus(retentionPercentage: number): string {
  if (retentionPercentage >= 80) return "Uitstekend";
  if (retentionPercentage >= 60) return "Goed";
  if (retentionPercentage >= 40) return "Matig";
  return "Kritiek";
}

/**
 * Calculate cohort health score (0-100)
 */
export function calculateCohortHealthScore(cohort: UserCohort): number {
  // Weighted average: Day 1 (20%), Day 7 (30%), Day 30 (50%)
  return cohort.day1Retention * 0.2 + cohort.day7Retention * 0.3 + cohort.day30Retention * 0.5;
}

/**
 * Get cohort trend (comparing to previous cohort)
 */
export function getCohortTrend(
  currentCohort: UserCohort,
  previousCohort: UserCohort | undefined,
  retentionPeriod: RetentionPeriod
): "up" | "down" | "stable" {
  if (!previousCohort) return "stable";

  const currentValue =
    retentionPeriod === 1
      ? currentCohort.day1Retention
      : retentionPeriod === 7
        ? currentCohort.day7Retention
        : currentCohort.day30Retention;

  const previousValue =
    retentionPeriod === 1
      ? previousCohort.day1Retention
      : retentionPeriod === 7
        ? previousCohort.day7Retention
        : previousCohort.day30Retention;

  const threshold = 5; // 5% change threshold
  const diff = currentValue - previousValue;

  if (Math.abs(diff) < threshold) return "stable";
  return diff > 0 ? "up" : "down";
}
