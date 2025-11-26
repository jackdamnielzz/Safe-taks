/**
 * Feature Gates Utility
 *
 * Provides:
 * - React hooks for client-side feature checks (via usage-tracker).
 * - Pure helpers for subscription/limit checks that can be used in APIs and server components.
 *
 * This file is the central place for subscription-based entitlements.
 */

/**
 * NOTE:
 * - This module exports both:
 *   - pure server-safe helpers (canCreateProject / canCreateTRA / canAddUser / canExecuteLMRA)
 *   - client-only React hooks/components for feature access
 *
 * To keep API routes/server components safe:
 * - The pure helpers MUST remain simple sync functions with no React/Browser deps.
 * - Client hooks MUST ONLY be used in Client Components.
 *
 * Implementation pattern:
 * - We define pure helpers first (server-safe).
 * - Then we define client hooks in a `"use client"` marked block that is exported
 *   separately, so importing this module for the helpers remains valid on the server.
 */

import type {
  Organization,
  SubscriptionTier,
  SubscriptionStatus,
} from "../types/organization";
import {
  isFeatureEnabled,
  getEnabledFeatures,
  getDisabledFeatures,
  type FeatureName,
} from "./usage-tracker";

/**
 * INTERNAL: Normalize subscription status to "active" flag.
 * - trial + active => allowed (subject to limits)
 * - past_due / canceled / paused => not active
 */
export function isSubscriptionActiveStatus(status: SubscriptionStatus): boolean {
  return status === "trial" || status === "active";
}

/**
 * NOTE:
 * - Historical client hooks (useFeatureAccess, useEnabledFeatures, useSubscriptionTier, FeatureGate)
 *   were previously defined in this module alongside the server-safe helpers.
 * - That caused issues when this file was imported in server environments.
 *
 * For now, we keep ONLY the pure helpers here for stability.
 * If you need client-side feature gate hooks/components:
 * - Create a dedicated `"use client"` module (e.g. feature-gates.client.tsx)
 *   that imports from this file's helpers.
 */

/**
 * Hook to get all enabled features for the current organization (client-side).
 */


/**
 * Get feature display name
 */
export function getFeatureDisplayName(feature: FeatureName): string {
  const names: Record<FeatureName, string> = {
    createTRA: "Create TRAs",
    executeLMRA: "Execute LMRAs",
    basicReports: "Basic Reports",
    advancedReports: "Advanced Reports",
    customBranding: "Custom Branding",
    apiAccess: "API Access",
    ssoIntegration: "SSO Integration",
    prioritySupport: "Priority Support",
    auditLogs: "Audit Logs",
    customWorkflows: "Custom Workflows",
    bulkOperations: "Bulk Operations",
    dataExport: "Data Export",
    webhooks: "Webhooks",
  };
  return names[feature];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    trial: "Trial",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };
  return names[tier];
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    trial: "gray",
    starter: "blue",
    professional: "purple",
    enterprise: "gold",
  };
  return colors[tier];
}

/**
 * Check if tier is higher than another
 */
export function isTierHigherThan(tier1: SubscriptionTier, tier2: SubscriptionTier): boolean {
  const hierarchy: Record<SubscriptionTier, number> = {
    trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };
  return hierarchy[tier1] > hierarchy[tier2];
}

/**
 * SERVER/SHARED HELPERS
 * These are pure and safe to use in API routes & server components.
 */

/**
 * Check if organization can create a new project based on subscription + limits.
 */
export function canCreateProject(org: Organization): boolean {
  const sub = org.subscription;
  if (!sub || !isSubscriptionActiveStatus(sub.status)) return false;

  const limits = org.limits;
  if (!limits) return true; // fail-open if not configured yet

  const current = org.usage?.projectCount ?? 0;
  return current < (limits.maxProjects ?? Infinity);
}

/**
 * Check if organization can create a new TRA based on subscription + limits.
 */
export function canCreateTRA(org: Organization): boolean {
  const sub = org.subscription;
  if (!sub || !isSubscriptionActiveStatus(sub.status)) return false;

  const limits = org.limits;
  if (!limits) return true;

  const current = org.usage?.traCount ?? 0;
  return current < (limits.maxTRAs ?? Infinity);
}

/**
 * Check if organization can add a new user based on subscription + limits.
 */
export function canAddUser(org: Organization): boolean {
  const sub = org.subscription;
  if (!sub || !isSubscriptionActiveStatus(sub.status)) return false;

  const limits = org.limits;
  if (!limits) return true;

  const current = org.usage?.userCount ?? 0;
  return current < (limits.maxUsers ?? Infinity);
}

/**
 * Check if organization can create a new LMRA session based on subscription + limits.
 *
 * NOTE:
 * - We intentionally DO NOT depend on a dedicated maxLMRASessions field yet,
 *   because OrganizationLimits/Usage do not expose it.
 * - Instead we:
 *   - Require an active/trial subscription.
 *   - Optionally enforce against maxTRAs as a soft cap for LMRA sessions.
 *   - Fail-open when limits are not configured, consistent with other helpers.
 */
export function canExecuteLMRA(org: Organization): boolean {
  const sub = org.subscription;
  if (!sub || !isSubscriptionActiveStatus(sub.status)) return false;

  const limits = org.limits;
  if (!limits) return true;

  const traLimit = limits.maxTRAs ?? Infinity;
  const currentTRAs = org.usage?.traCount ?? 0;

  // If TRA usage is already at/exceeds maxTRAs, treat LMRA execution as disallowed
  // to avoid unbounded usage on lower tiers.
  if (currentTRAs >= traLimit) return false;

  // Otherwise allow LMRA execution (no separate LMRA counter yet).
  return true;
}
