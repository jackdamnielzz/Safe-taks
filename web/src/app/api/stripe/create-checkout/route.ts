/**
 * Create Stripe Checkout Session
 *
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for subscription purchase
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  createCheckoutSession,
  getPriceId,
  type BillingInterval,
} from "@/lib/payments/stripe-client";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const orgId = decodedToken.orgId as string;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID not found in token" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { tier, interval = "monthly" } = body as {
      tier: "starter" | "professional" | "enterprise";
      interval?: BillingInterval;
    };

    if (!tier || !["starter", "professional", "enterprise"].includes(tier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    // Get organization
    const db = getFirestore();
    const orgRef = db.collection("organizations").doc(orgId);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgSnap.data();
    const customerId = org?.subscription?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "Stripe customer not initialized. Please contact support." },
        { status: 400 }
      );
    }

    // Get price ID
    const priceId = getPriceId(tier, interval);

    // Create checkout session
    const baseUrl =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
      trialPeriodDays: org?.subscription?.status === "trial" ? 14 : undefined,
      metadata: {
        organizationId: orgId,
        tier,
        interval,
        userId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
