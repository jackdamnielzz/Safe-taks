/**
 * Usage Tracking and Feature Gates
 *
 * Tracks organization usage metrics and enforces tier-based feature limitations.
 * Integrates with Firestore for real-time usage monitoring.
 */

import { getFirestore, doc, getDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import type {
  Organization,
  SubscriptionTier,
  OrganizationUsage,
  OrganizationLimits,
} from "../types/organization";
import { getSubscriptionLimits, canPerformAction } from "./subscription-manager";

/**
 * Feature flags by subscription tier
 */
export const FEATURE_FLAGS = {
  trial: {
    // Core features
    createTRA: true,
    executeLMRA: true,
    basicReports: true,

    // Limited features
    advancedReports: false,
    customBranding: false,
    apiAccess: false,
    ssoIntegration: false,
    prioritySupport: false,
    auditLogs: false,
    customWorkflows: false,
    bulkOperations: false,
    dataExport: false,
    webhooks: false,
  },
  starter: {
    // Core features
    createTRA: true,
    executeLMRA: true,
    basicReports: true,

    // Starter features
    advancedReports: true,
    customBranding: false,
    apiAccess: false,
    ssoIntegration: false,
    prioritySupport: false,
    auditLogs: true,
    customWorkflows: false,
    bulkOperations: true,
    dataExport: true,
    webhooks: false,
  },
  professional: {
    // All starter features
    createTRA: true,
    executeLMRA: true,
    basicReports: true,
    advancedReports: true,
    auditLogs: true,
    bulkOperations: true,
    dataExport: true,

    // Professional features
    customBranding: true,
    apiAccess: true,
    ssoIntegration: false,
    prioritySupport: true,
    customWorkflows: true,
    webhooks: true,
  },
  enterprise: {
    // All features enabled
    createTRA: true,
    executeLMRA: true,
    basicReports: true,
    advancedReports: true,
    customBranding: true,
    apiAccess: true,
    ssoIntegration: true,
    prioritySupport: true,
    auditLogs: true,
    customWorkflows: true,
    bulkOperations: true,
    dataExport: true,
    webhooks: true,
  },
} as const;

export type FeatureName = keyof typeof FEATURE_FLAGS.trial;

/**
 * Check if a feature is enabled for a subscription tier
 */
export function isFeatureEnabled(tier: SubscriptionTier, feature: FeatureName): boolean {
  return FEATURE_FLAGS[tier][feature];
}

/**
 * Get all enabled features for a tier
 */
export function getEnabledFeatures(tier: SubscriptionTier): FeatureName[] {
  const features = FEATURE_FLAGS[tier];
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureName);
}

/**
 * Get all disabled features for a tier
 */
export function getDisabledFeatures(tier: SubscriptionTier): FeatureName[] {
  const features = FEATURE_FLAGS[tier];
  return Object.entries(features)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature as FeatureName);
}

/**
 * Track usage increment
 */
export async function trackUsage(
  organizationId: string,
  metric: "userCount" | "projectCount" | "traCount" | "storageGB",
  amount: number = 1
): Promise<void> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", organizationId);

  await updateDoc(orgRef, {
    [`usage.${metric}`]: increment(amount),
    "usage.lastUpdated": Timestamp.now(),
  });
}

/**
 * Track usage decrement (e.g., when deleting resources)
 */
export async function decrementUsage(
  organizationId: string,
  metric: "userCount" | "projectCount" | "traCount" | "storageGB",
  amount: number = 1
): Promise<void> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", organizationId);

  await updateDoc(orgRef, {
    [`usage.${metric}`]: increment(-amount),
    "usage.lastUpdated": Timestamp.now(),
  });
}

/**
 * Get current usage for an organization
 */
export async function getCurrentUsage(organizationId: string): Promise<OrganizationUsage> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", organizationId);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    throw new Error("Organization not found");
  }

  const org = orgSnap.data() as Organization;
  return (
    org.usage || {
      userCount: 0,
      projectCount: 0,
      traCount: 0,
      storageGB: 0,
      lastUpdated: Timestamp.now(),
    }
  );
}

/**
 * Check if organization can perform an action
 */
export async function checkUsageLimit(
  organizationId: string,
  action: "add_user" | "add_project" | "add_tra" | "add_storage"
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", organizationId);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    return { allowed: false, reason: "Organization not found" };
  }

  const org = orgSnap.data() as Organization;
  const usage = org.usage || {
    userCount: 0,
    projectCount: 0,
    traCount: 0,
    storageGB: 0,
    lastUpdated: Timestamp.now(),
  };

  const limits = getSubscriptionLimits(org.subscription.tier);
  const result = canPerformAction(usage, limits, action);

  return {
    ...result,
    upgradeRequired: !result.allowed,
  };
}

/**
 * Get usage percentage for a metric
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === 999999) return 0; // Unlimited
  return Math.min(Math.round((current / limit) * 100), 100);
}

/**
 * Check if usage is approaching limit (>80%)
 */
export function isApproachingLimit(current: number, limit: number): boolean {
  return getUsagePercentage(current, limit) >= 80;
}

/**
 * Check if usage has exceeded limit
 */
export function hasExceededLimit(current: number, limit: number): boolean {
  if (limit === 999999) return false; // Unlimited
  return current >= limit;
}

/**
 * Get usage summary with warnings
 */
export function getUsageSummary(
  usage: OrganizationUsage,
  limits: OrganizationLimits
): {
  users: { current: number; limit: number; percentage: number; warning: boolean };
  projects: { current: number; limit: number; percentage: number; warning: boolean };
  tras: { current: number; limit: number; percentage: number; warning: boolean };
  storage: { current: number; limit: number; percentage: number; warning: boolean };
  overallHealth: "good" | "warning" | "critical";
} {
  const users = {
    current: usage.userCount,
    limit: limits.maxUsers,
    percentage: getUsagePercentage(usage.userCount, limits.maxUsers),
    warning: isApproachingLimit(usage.userCount, limits.maxUsers),
  };

  const projects = {
    current: usage.projectCount,
    limit: limits.maxProjects,
    percentage: getUsagePercentage(usage.projectCount, limits.maxProjects),
    warning: isApproachingLimit(usage.projectCount, limits.maxProjects),
  };

  const tras = {
    current: usage.traCount,
    limit: limits.maxTRAs,
    percentage: getUsagePercentage(usage.traCount, limits.maxTRAs),
    warning: isApproachingLimit(usage.traCount, limits.maxTRAs),
  };

  const storage = {
    current: usage.storageGB,
    limit: limits.maxStorageGB,
    percentage: getUsagePercentage(usage.storageGB, limits.maxStorageGB),
    warning: isApproachingLimit(usage.storageGB, limits.maxStorageGB),
  };

  // Determine overall health
  let overallHealth: "good" | "warning" | "critical" = "good";

  const anyExceeded = [users, projects, tras, storage].some((metric) => metric.percentage >= 100);
  const anyWarning = [users, projects, tras, storage].some((metric) => metric.warning);

  if (anyExceeded) {
    overallHealth = "critical";
  } else if (anyWarning) {
    overallHealth = "warning";
  }

  return {
    users,
    projects,
    tras,
    storage,
    overallHealth,
  };
}

/**
 * Feature gate middleware for API routes
 */
export async function requireFeature(
  organizationId: string,
  feature: FeatureName
): Promise<{ allowed: boolean; tier: SubscriptionTier; reason?: string }> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", organizationId);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    return {
      allowed: false,
      tier: "trial",
      reason: "Organization not found",
    };
  }

  const org = orgSnap.data() as Organization;
  const tier = org.subscription.tier;
  const allowed = isFeatureEnabled(tier, feature);

  return {
    allowed,
    tier,
    reason: allowed
      ? undefined
      : `This feature requires ${getRequiredTierForFeature(feature)} plan or higher`,
  };
}

/**
 * Get the minimum tier required for a feature
 */
export function getRequiredTierForFeature(feature: FeatureName): SubscriptionTier {
  const tiers: SubscriptionTier[] = ["trial", "starter", "professional", "enterprise"];

  for (const tier of tiers) {
    if (FEATURE_FLAGS[tier][feature]) {
      return tier;
    }
  }

  return "enterprise";
}

/**
 * Get upgrade suggestions based on usage
 */
export function getUpgradeSuggestions(
  currentTier: SubscriptionTier,
  usage: OrganizationUsage,
  limits: OrganizationLimits
): {
  shouldUpgrade: boolean;
  reasons: string[];
  recommendedTier: SubscriptionTier;
} {
  const reasons: string[] = [];

  if (hasExceededLimit(usage.userCount, limits.maxUsers)) {
    reasons.push(`User limit reached (${usage.userCount}/${limits.maxUsers})`);
  }

  if (hasExceededLimit(usage.projectCount, limits.maxProjects)) {
    reasons.push(`Project limit reached (${usage.projectCount}/${limits.maxProjects})`);
  }

  if (hasExceededLimit(usage.traCount, limits.maxTRAs)) {
    reasons.push(`TRA limit reached (${usage.traCount}/${limits.maxTRAs})`);
  }

  if (hasExceededLimit(usage.storageGB, limits.maxStorageGB)) {
    reasons.push(`Storage limit reached (${usage.storageGB}GB/${limits.maxStorageGB}GB)`);
  }

  // Determine recommended tier
  let recommendedTier: SubscriptionTier = currentTier;

  if (currentTier === "trial" && reasons.length > 0) {
    recommendedTier = "starter";
  } else if (currentTier === "starter" && reasons.length > 0) {
    recommendedTier = "professional";
  } else if (currentTier === "professional" && reasons.length > 0) {
    recommendedTier = "enterprise";
  }

  return {
    shouldUpgrade: reasons.length > 0,
    reasons,
    recommendedTier,
  };
}
