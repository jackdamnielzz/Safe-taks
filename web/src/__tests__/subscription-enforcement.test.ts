/**
 * Subscription Enforcement Tests
 * 
 * Validates that subscription limits are properly enforced across the application:
 * - feature-gates.tsx helpers (canCreateTRA, canAddUser, canCreateProject, canExecuteLMRA)
 * - subscription-manager.ts (tier limits, usage tracking)
 * - usage-tracker.ts (feature flags, usage limits)
 */

import {
  canCreateProject,
  canCreateTRA,
  canAddUser,
  canExecuteLMRA,
  isSubscriptionActiveStatus,
} from '../lib/payments/feature-gates';
import {
  getSubscriptionLimits,
  canPerformAction,
  getRecommendedTier,
} from '../lib/payments/subscription-manager';
import {
  isFeatureEnabled,
  getEnabledFeatures,
  getDisabledFeatures,
  checkUsageLimit,
  getUsagePercentage,
  isApproachingLimit,
  hasExceededLimit,
  requireFeature,
} from '../lib/payments/usage-tracker';
import type { Organization, SubscriptionTier, SubscriptionStatus } from '../lib/types/organization';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((val) => val),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

describe('Subscription Enforcement', () => {
  describe('Subscription Status Checks', () => {
    it('should allow trial and active subscriptions', () => {
      expect(isSubscriptionActiveStatus('trial')).toBe(true);
      expect(isSubscriptionActiveStatus('active')).toBe(true);
    });

    it('should block inactive subscription statuses', () => {
      expect(isSubscriptionActiveStatus('past_due')).toBe(false);
      expect(isSubscriptionActiveStatus('canceled')).toBe(false);
      expect(isSubscriptionActiveStatus('paused')).toBe(false);
    });
  });

  describe('Project Creation Limits', () => {
    it('should allow project creation within limits', () => {
      const org: Organization = createMockOrg('starter', 'active', {
        projectCount: 3,
        maxProjects: 5,
      });

      expect(canCreateProject(org)).toBe(true);
    });

    it('should block project creation at limit', () => {
      const org: Organization = createMockOrg('starter', 'active', {
        projectCount: 5,
        maxProjects: 5,
      });

      expect(canCreateProject(org)).toBe(false);
    });

    it('should block project creation with inactive subscription', () => {
      const org: Organization = createMockOrg('starter', 'canceled', {
        projectCount: 2,
        maxProjects: 5,
      });

      expect(canCreateProject(org)).toBe(false);
    });

    it('should fail-open when limits not configured', () => {
      const org: Organization = {
        ...createMockOrg('starter', 'active'),
        limits: undefined as any,
      };

      expect(canCreateProject(org)).toBe(true);
    });
  });

  describe('TRA Creation Limits', () => {
    it('should allow TRA creation within limits', () => {
      const org: Organization = createMockOrg('trial', 'trial', {
        traCount: 5,
        maxTRAs: 10,
      });

      expect(canCreateTRA(org)).toBe(true);
    });

    it('should block TRA creation at limit', () => {
      const org: Organization = createMockOrg('trial', 'trial', {
        traCount: 10,
        maxTRAs: 10,
      });

      expect(canCreateTRA(org)).toBe(false);
    });

    it('should allow unlimited TRAs for enterprise', () => {
      const org: Organization = createMockOrg('enterprise', 'active', {
        traCount: 500000,
        maxTRAs: 999999,
      });

      expect(canCreateTRA(org)).toBe(true);
    });
  });

  describe('User Addition Limits', () => {
    it('should allow user addition within limits', () => {
      const org: Organization = createMockOrg('professional', 'active', {
        userCount: 30,
        maxUsers: 50,
      });

      expect(canAddUser(org)).toBe(true);
    });

    it('should block user addition at limit', () => {
      const org: Organization = createMockOrg('starter', 'active', {
        userCount: 10,
        maxUsers: 10,
      });

      expect(canAddUser(org)).toBe(false);
    });

    it('should enforce trial user limits strictly', () => {
      const org: Organization = createMockOrg('trial', 'trial', {
        userCount: 3,
        maxUsers: 3,
      });

      expect(canAddUser(org)).toBe(false);
    });
  });

  describe('LMRA Execution Limits', () => {
    it('should allow LMRA execution with active subscription', () => {
      const org: Organization = createMockOrg('starter', 'active', {
        traCount: 50,
        maxTRAs: 100,
      });

      expect(canExecuteLMRA(org)).toBe(true);
    });

    it('should block LMRA when TRA limit reached', () => {
      const org: Organization = createMockOrg('starter', 'active', {
        traCount: 100,
        maxTRAs: 100,
      });

      expect(canExecuteLMRA(org)).toBe(false);
    });

    it('should block LMRA with inactive subscription', () => {
      const org: Organization = createMockOrg('starter', 'past_due', {
        traCount: 10,
        maxTRAs: 100,
      });

      expect(canExecuteLMRA(org)).toBe(false);
    });
  });

  describe('Tier-Based Feature Flags', () => {
    it('should enable core features for trial tier', () => {
      expect(isFeatureEnabled('trial', 'createTRA')).toBe(true);
      expect(isFeatureEnabled('trial', 'executeLMRA')).toBe(true);
      expect(isFeatureEnabled('trial', 'basicReports')).toBe(true);
    });

    it('should disable advanced features for trial tier', () => {
      expect(isFeatureEnabled('trial', 'advancedReports')).toBe(false);
      expect(isFeatureEnabled('trial', 'customBranding')).toBe(false);
      expect(isFeatureEnabled('trial', 'apiAccess')).toBe(false);
      expect(isFeatureEnabled('trial', 'ssoIntegration')).toBe(false);
    });

    it('should enable advanced reports for starter tier', () => {
      expect(isFeatureEnabled('starter', 'advancedReports')).toBe(true);
      expect(isFeatureEnabled('starter', 'bulkOperations')).toBe(true);
      expect(isFeatureEnabled('starter', 'dataExport')).toBe(true);
    });

    it('should enable professional features for professional tier', () => {
      expect(isFeatureEnabled('professional', 'customBranding')).toBe(true);
      expect(isFeatureEnabled('professional', 'apiAccess')).toBe(true);
      expect(isFeatureEnabled('professional', 'customWorkflows')).toBe(true);
      expect(isFeatureEnabled('professional', 'webhooks')).toBe(true);
    });

    it('should enable all features for enterprise tier', () => {
      const allFeatures = getEnabledFeatures('enterprise');
      expect(allFeatures).toContain('ssoIntegration');
      expect(allFeatures).toContain('apiAccess');
      expect(allFeatures).toContain('customBranding');
      expect(allFeatures).toContain('webhooks');
      expect(getDisabledFeatures('enterprise')).toHaveLength(0);
    });
  });

  describe('Usage Limit Calculations', () => {
    it('should calculate usage percentage correctly', () => {
      expect(getUsagePercentage(5, 10)).toBe(50);
      expect(getUsagePercentage(8, 10)).toBe(80);
      expect(getUsagePercentage(10, 10)).toBe(100);
      expect(getUsagePercentage(12, 10)).toBe(100); // Capped at 100%
    });

    it('should detect approaching limits (>80%)', () => {
      expect(isApproachingLimit(8, 10)).toBe(true);
      expect(isApproachingLimit(9, 10)).toBe(true);
      expect(isApproachingLimit(7, 10)).toBe(false);
    });

    it('should detect exceeded limits', () => {
      expect(hasExceededLimit(10, 10)).toBe(true);
      expect(hasExceededLimit(11, 10)).toBe(true);
      expect(hasExceededLimit(9, 10)).toBe(false);
    });

    it('should handle unlimited tier correctly', () => {
      expect(getUsagePercentage(100000, 999999)).toBe(0);
      expect(hasExceededLimit(100000, 999999)).toBe(false);
    });
  });

  describe('Tier Limits Configuration', () => {
    it('should return correct limits for trial tier', () => {
      const limits = getSubscriptionLimits('trial');
      expect(limits.maxUsers).toBe(3);
      expect(limits.maxProjects).toBe(2);
      expect(limits.maxTRAs).toBe(10);
      expect(limits.maxStorageGB).toBe(1);
    });

    it('should return correct limits for starter tier', () => {
      const limits = getSubscriptionLimits('starter');
      expect(limits.maxUsers).toBe(10);
      expect(limits.maxProjects).toBe(5);
      expect(limits.maxTRAs).toBe(100);
      expect(limits.maxStorageGB).toBe(10);
    });

    it('should return correct limits for professional tier', () => {
      const limits = getSubscriptionLimits('professional');
      expect(limits.maxUsers).toBe(50);
      expect(limits.maxProjects).toBe(25);
      expect(limits.maxTRAs).toBe(500);
      expect(limits.maxStorageGB).toBe(50);
    });

    it('should return virtually unlimited limits for enterprise tier', () => {
      const limits = getSubscriptionLimits('enterprise');
      expect(limits.maxUsers).toBe(999999);
      expect(limits.maxProjects).toBe(999999);
      expect(limits.maxTRAs).toBe(999999);
      expect(limits.maxStorageGB).toBe(500);
    });
  });

  describe('Action Permission Checks', () => {
    it('should allow actions within limits', () => {
      const usage = { userCount: 5, projectCount: 3, traCount: 50, storageGB: 5 };
      const limits = getSubscriptionLimits('starter');

      expect(canPerformAction(usage, limits, 'add_user').allowed).toBe(true);
      expect(canPerformAction(usage, limits, 'add_project').allowed).toBe(true);
      expect(canPerformAction(usage, limits, 'add_tra').allowed).toBe(true);
      expect(canPerformAction(usage, limits, 'add_storage').allowed).toBe(true);
    });

    it('should block actions at limits with descriptive reasons', () => {
      const usage = { userCount: 10, projectCount: 5, traCount: 100, storageGB: 10 };
      const limits = getSubscriptionLimits('starter');

      const userResult = canPerformAction(usage, limits, 'add_user');
      expect(userResult.allowed).toBe(false);
      expect(userResult.reason).toContain('User limit reached');
      expect(userResult.reason).toContain('10');

      const projectResult = canPerformAction(usage, limits, 'add_project');
      expect(projectResult.allowed).toBe(false);
      expect(projectResult.reason).toContain('Project limit reached');

      const traResult = canPerformAction(usage, limits, 'add_tra');
      expect(traResult.allowed).toBe(false);
      expect(traResult.reason).toContain('TRA limit reached');

      const storageResult = canPerformAction(usage, limits, 'add_storage');
      expect(storageResult.allowed).toBe(false);
      expect(storageResult.reason).toContain('Storage limit reached');
    });
  });

  describe('Tier Recommendations', () => {
    it('should recommend trial for minimal usage', () => {
      const usage = { userCount: 2, projectCount: 1, traCount: 5, storageGB: 0.5 };
      expect(getRecommendedTier(usage)).toBe('trial');
    });

    it('should recommend starter when exceeding trial limits', () => {
      const usage = { userCount: 5, projectCount: 3, traCount: 15, storageGB: 2 };
      expect(getRecommendedTier(usage)).toBe('starter');
    });

    it('should recommend professional when exceeding starter limits', () => {
      const usage = { userCount: 15, projectCount: 8, traCount: 150, storageGB: 15 };
      expect(getRecommendedTier(usage)).toBe('professional');
    });

    it('should recommend enterprise when exceeding professional limits', () => {
      const usage = { userCount: 60, projectCount: 30, traCount: 600, storageGB: 60 };
      expect(getRecommendedTier(usage)).toBe('enterprise');
    });
  });

  describe('Cross-Tier Consistency', () => {
    it('should maintain consistent limit hierarchy across tiers', () => {
      const trial = getSubscriptionLimits('trial');
      const starter = getSubscriptionLimits('starter');
      const professional = getSubscriptionLimits('professional');
      const enterprise = getSubscriptionLimits('enterprise');

      // Users
      expect(starter.maxUsers).toBeGreaterThan(trial.maxUsers);
      expect(professional.maxUsers).toBeGreaterThan(starter.maxUsers);
      expect(enterprise.maxUsers).toBeGreaterThan(professional.maxUsers);

      // Projects
      expect(starter.maxProjects).toBeGreaterThan(trial.maxProjects);
      expect(professional.maxProjects).toBeGreaterThan(starter.maxProjects);
      expect(enterprise.maxProjects).toBeGreaterThan(professional.maxProjects);

      // TRAs
      expect(starter.maxTRAs).toBeGreaterThan(trial.maxTRAs);
      expect(professional.maxTRAs).toBeGreaterThan(starter.maxTRAs);
      expect(enterprise.maxTRAs).toBeGreaterThan(professional.maxTRAs);
    });

    it('should maintain consistent feature hierarchy across tiers', () => {
      const trialFeatures = getEnabledFeatures('trial');
      const starterFeatures = getEnabledFeatures('starter');
      const professionalFeatures = getEnabledFeatures('professional');
      const enterpriseFeatures = getEnabledFeatures('enterprise');

      // Starter should have all trial features plus more
      trialFeatures.forEach((feature) => {
        expect(starterFeatures).toContain(feature);
      });

      // Professional should have all starter features plus more
      starterFeatures.forEach((feature) => {
        expect(professionalFeatures).toContain(feature);
      });

      // Enterprise should have all professional features plus more
      professionalFeatures.forEach((feature) => {
        expect(enterpriseFeatures).toContain(feature);
      });
    });
  });
});

// Helper function to create mock organization
function createMockOrg(
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  usage?: {
    userCount?: number;
    projectCount?: number;
    traCount?: number;
    storageGB?: number;
    maxUsers?: number;
    maxProjects?: number;
    maxTRAs?: number;
    maxStorageGB?: number;
  }
): Organization {
  const limits = getSubscriptionLimits(tier);

  return {
    id: 'test-org-id',
    name: 'Test Organization',
    slug: 'test-org',
    subscription: {
      tier,
      status,
      stripeCustomerId: 'cus_test',
      currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    },
    usage: {
      userCount: usage?.userCount ?? 0,
      projectCount: usage?.projectCount ?? 0,
      traCount: usage?.traCount ?? 0,
      storageGB: usage?.storageGB ?? 0,
      lastUpdated: Timestamp.now(),
    },
    limits: {
      maxUsers: usage?.maxUsers ?? limits.maxUsers,
      maxProjects: usage?.maxProjects ?? limits.maxProjects,
      maxTRAs: usage?.maxTRAs ?? limits.maxTRAs,
      maxStorageGB: usage?.maxStorageGB ?? limits.maxStorageGB,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Organization;
}