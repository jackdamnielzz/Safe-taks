/**
 * Feature Gates Utility
 * 
 * Provides React hooks and utilities for checking feature access
 * and enforcing tier-based limitations in the UI.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import type { Organization, SubscriptionTier } from '../types/organization';
import { 
  isFeatureEnabled, 
  getEnabledFeatures, 
  getDisabledFeatures,
  type FeatureName 
} from './usage-tracker';

/**
 * Hook to check if a feature is enabled for the current organization
 */
export function useFeatureAccess(
  organizationId: string | null,
  feature: FeatureName
): {
  hasAccess: boolean;
  tier: SubscriptionTier | null;
  loading: boolean;
} {
  const [hasAccess, setHasAccess] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const orgRef = doc(db, 'organizations', organizationId);

    const unsubscribe = onSnapshot(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        const org = snapshot.data() as Organization;
        const currentTier = org.subscription.tier;
        setTier(currentTier);
        setHasAccess(isFeatureEnabled(currentTier, feature));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId, feature]);

  return { hasAccess, tier, loading };
}

/**
 * Hook to get all enabled features for the current organization
 */
export function useEnabledFeatures(
  organizationId: string | null
): {
  features: FeatureName[];
  tier: SubscriptionTier | null;
  loading: boolean;
} {
  const [features, setFeatures] = useState<FeatureName[]>([]);
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const orgRef = doc(db, 'organizations', organizationId);

    const unsubscribe = onSnapshot(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        const org = snapshot.data() as Organization;
        const currentTier = org.subscription.tier;
        setTier(currentTier);
        setFeatures(getEnabledFeatures(currentTier));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  return { features, tier, loading };
}

/**
 * Hook to get subscription tier information
 */
export function useSubscriptionTier(
  organizationId: string | null
): {
  tier: SubscriptionTier | null;
  status: string | null;
  loading: boolean;
} {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const orgRef = doc(db, 'organizations', organizationId);

    const unsubscribe = onSnapshot(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        const org = snapshot.data() as Organization;
        setTier(org.subscription.tier);
        setStatus(org.subscription.status);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  return { tier, status, loading };
}

/**
 * Component wrapper for feature-gated content
 */
export function FeatureGate({
  organizationId,
  feature,
  children,
  fallback,
}: {
  organizationId: string | null;
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasAccess, loading } = useFeatureAccess(organizationId, feature);

  if (loading) {
    return null;
  }

  if (!hasAccess) {
    return fallback || null;
  }

  return <React.Fragment>{children}</React.Fragment>;
}

/**
 * Get feature display name
 */
export function getFeatureDisplayName(feature: FeatureName): string {
  const names: Record<FeatureName, string> = {
    createTRA: 'Create TRAs',
    executeLMRA: 'Execute LMRAs',
    basicReports: 'Basic Reports',
    advancedReports: 'Advanced Reports',
    customBranding: 'Custom Branding',
    apiAccess: 'API Access',
    ssoIntegration: 'SSO Integration',
    prioritySupport: 'Priority Support',
    auditLogs: 'Audit Logs',
    customWorkflows: 'Custom Workflows',
    bulkOperations: 'Bulk Operations',
    dataExport: 'Data Export',
    webhooks: 'Webhooks',
  };
  return names[feature];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    trial: 'Trial',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return names[tier];
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    trial: 'gray',
    starter: 'blue',
    professional: 'purple',
    enterprise: 'gold',
  };
  return colors[tier];
}

/**
 * Check if tier is higher than another
 */
export function isTierHigherThan(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): boolean {
  const hierarchy: Record<SubscriptionTier, number> = {
    trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };
  return hierarchy[tier1] > hierarchy[tier2];
}