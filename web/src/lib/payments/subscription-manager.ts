/**
 * Subscription Management Service
 *
 * Handles subscription lifecycle, tier management, and billing operations
 * for organizations using Stripe integration.
 */

import { getFirestore, doc, updateDoc, Timestamp } from "firebase/firestore";
import type {
  Organization,
  SubscriptionTier,
  SubscriptionStatus,
  OrganizationLimits,
  SUBSCRIPTION_TIER_LIMITS,
} from "../types/organization";
import {
  createStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPriceId,
  STRIPE_CONFIG,
  type BillingInterval,
} from "./stripe-client";

/**
 * Subscription tier pricing (in EUR)
 */
export const SUBSCRIPTION_PRICING = {
  starter: {
    monthly: 49,
    yearly: 490, // ~17% discount
  },
  professional: {
    monthly: 149,
    yearly: 1490, // ~17% discount
  },
  enterprise: {
    monthly: 499,
    yearly: 4990, // ~17% discount
  },
} as const;

/**
 * Initialize subscription for a new organization
 */
export async function initializeSubscription(params: {
  organizationId: string;
  organizationName: string;
  adminEmail: string;
  adminName: string;
}): Promise<{
  customerId: string;
  trialEndsAt: Date;
}> {
  // Create Stripe customer
  const customer = await createStripeCustomer({
    email: params.adminEmail,
    name: params.organizationName,
    organizationId: params.organizationId,
    metadata: {
      adminName: params.adminName,
    },
  });

  // Calculate trial end date
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + STRIPE_CONFIG.TRIAL_PERIOD_DAYS);

  // Update organization with Stripe customer ID
  const db = getFirestore();
  const orgRef = doc(db, "organizations", params.organizationId);

  await updateDoc(orgRef, {
    "subscription.stripeCustomerId": customer.id,
    "subscription.trialEndsAt": Timestamp.fromDate(trialEndsAt),
    "subscription.status": "trial",
    "subscription.tier": "trial",
    updatedAt: Timestamp.now(),
  });

  return {
    customerId: customer.id,
    trialEndsAt,
  };
}

/**
 * Create checkout session for subscription upgrade
 */
export async function createSubscriptionCheckout(params: {
  organizationId: string;
  customerId: string;
  tier: "starter" | "professional" | "enterprise";
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const priceId = getPriceId(params.tier, params.interval);

  const session = await createCheckoutSession({
    customerId: params.customerId,
    priceId,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    metadata: {
      organizationId: params.organizationId,
      tier: params.tier,
      interval: params.interval,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Create billing portal session for subscription management
 */
export async function createBillingSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const session = await createBillingPortalSession({
    customerId: params.customerId,
    returnUrl: params.returnUrl,
  });

  return {
    url: session.url,
  };
}

/**
 * Update organization subscription after successful payment
 */
export async function activateSubscription(params: {
  organizationId: string;
  subscriptionId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
}): Promise<void> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", params.organizationId);

  await updateDoc(orgRef, {
    "subscription.stripeSubscriptionId": params.subscriptionId,
    "subscription.tier": params.tier,
    "subscription.status": params.status,
    "subscription.currentPeriodEnd": Timestamp.fromDate(params.currentPeriodEnd),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCancellation(params: {
  organizationId: string;
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  // Cancel in Stripe
  await cancelSubscription(params.subscriptionId, params.cancelAtPeriodEnd);

  // Update organization
  const db = getFirestore();
  const orgRef = doc(db, "organizations", params.organizationId);

  if (params.cancelAtPeriodEnd) {
    await updateDoc(orgRef, {
      "subscription.status": "active", // Still active until period end
      "subscription.cancelAtPeriodEnd": true,
      updatedAt: Timestamp.now(),
    });
  } else {
    await updateDoc(orgRef, {
      "subscription.status": "canceled",
      "subscription.tier": "trial",
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function handleSubscriptionReactivation(params: {
  organizationId: string;
  subscriptionId: string;
}): Promise<void> {
  // Reactivate in Stripe
  await reactivateSubscription(params.subscriptionId);

  // Update organization
  const db = getFirestore();
  const orgRef = doc(db, "organizations", params.organizationId);

  await updateDoc(orgRef, {
    "subscription.status": "active",
    "subscription.cancelAtPeriodEnd": false,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update subscription status from webhook
 */
export async function updateSubscriptionStatus(params: {
  organizationId: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
}): Promise<void> {
  const db = getFirestore();
  const orgRef = doc(db, "organizations", params.organizationId);

  const updates: any = {
    "subscription.status": params.status,
    updatedAt: Timestamp.now(),
  };

  if (params.currentPeriodEnd) {
    updates["subscription.currentPeriodEnd"] = Timestamp.fromDate(params.currentPeriodEnd);
  }

  await updateDoc(orgRef, updates);
}

/**
 * Get subscription limits for a tier
 */
export function getSubscriptionLimits(tier: SubscriptionTier): OrganizationLimits {
  // Import the limits from organization types
  const limits = {
    trial: {
      maxUsers: 3,
      maxProjects: 2,
      maxTRAs: 10,
      maxStorageGB: 1,
    },
    starter: {
      maxUsers: 10,
      maxProjects: 5,
      maxTRAs: 100,
      maxStorageGB: 10,
    },
    professional: {
      maxUsers: 50,
      maxProjects: 25,
      maxTRAs: 500,
      maxStorageGB: 50,
    },
    enterprise: {
      maxUsers: 999999,
      maxProjects: 999999,
      maxTRAs: 999999,
      maxStorageGB: 500,
    },
  };

  return limits[tier];
}

/**
 * Check if organization can perform action based on limits
 */
export function canPerformAction(
  currentUsage: { userCount: number; projectCount: number; traCount: number; storageGB: number },
  limits: OrganizationLimits,
  action: "add_user" | "add_project" | "add_tra" | "add_storage"
): { allowed: boolean; reason?: string } {
  switch (action) {
    case "add_user":
      if (currentUsage.userCount >= limits.maxUsers) {
        return {
          allowed: false,
          reason: `User limit reached (${limits.maxUsers}). Please upgrade your plan.`,
        };
      }
      break;
    case "add_project":
      if (currentUsage.projectCount >= limits.maxProjects) {
        return {
          allowed: false,
          reason: `Project limit reached (${limits.maxProjects}). Please upgrade your plan.`,
        };
      }
      break;
    case "add_tra":
      if (currentUsage.traCount >= limits.maxTRAs) {
        return {
          allowed: false,
          reason: `TRA limit reached (${limits.maxTRAs}). Please upgrade your plan.`,
        };
      }
      break;
    case "add_storage":
      if (currentUsage.storageGB >= limits.maxStorageGB) {
        return {
          allowed: false,
          reason: `Storage limit reached (${limits.maxStorageGB}GB). Please upgrade your plan.`,
        };
      }
      break;
  }

  return { allowed: true };
}

/**
 * Get recommended tier based on usage
 */
export function getRecommendedTier(usage: {
  userCount: number;
  projectCount: number;
  traCount: number;
  storageGB: number;
}): SubscriptionTier {
  // Check if usage exceeds professional limits
  if (
    usage.userCount > 50 ||
    usage.projectCount > 25 ||
    usage.traCount > 500 ||
    usage.storageGB > 50
  ) {
    return "enterprise";
  }

  // Check if usage exceeds starter limits
  if (
    usage.userCount > 10 ||
    usage.projectCount > 5 ||
    usage.traCount > 100 ||
    usage.storageGB > 10
  ) {
    return "professional";
  }

  // Check if usage exceeds trial limits
  if (usage.userCount > 3 || usage.projectCount > 2 || usage.traCount > 10 || usage.storageGB > 1) {
    return "starter";
  }

  return "trial";
}

/**
 * Calculate days until trial expires
 */
export function getDaysUntilTrialExpires(trialEndsAt: Date): number {
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if trial is expiring soon (within 3 days)
 */
export function isTrialExpiringSoon(trialEndsAt: Date): boolean {
  const daysLeft = getDaysUntilTrialExpires(trialEndsAt);
  return daysLeft <= 3 && daysLeft > 0;
}

/**
 * Check if trial has expired
 */
export function hasTrialExpired(trialEndsAt: Date): boolean {
  return getDaysUntilTrialExpires(trialEndsAt) <= 0;
}
