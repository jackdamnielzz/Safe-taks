/**
 * Get Subscription Status
 * 
 * GET /api/stripe/subscription
 * Returns current subscription status for the organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getSubscription } from '@/lib/payments/stripe-client';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const orgId = decodedToken.orgId as string;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID not found in token' },
        { status: 400 }
      );
    }

    // Get organization
    const db = getFirestore();
    const orgRef = db.collection('organizations').doc(orgId);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const org = orgSnap.data();
    const subscription = org?.subscription;

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Get live subscription data from Stripe if available
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await getSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    return NextResponse.json({
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toDate?.() || subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt?.toDate?.() || subscription.trialEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      },
      usage: org?.usage || {
        userCount: 0,
        projectCount: 0,
        traCount: 0,
        storageGB: 0,
      },
      limits: org?.limits,
      stripeData: stripeSubscription ? {
        status: stripeSubscription.status,
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      } : null,
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}