/**
 * Create Stripe Billing Portal Session
 *
 * POST /api/stripe/create-portal
 * Creates a Stripe Customer Portal session for subscription management
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createBillingPortalSession } from "@/lib/payments/stripe-client";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const orgId = decodedToken.orgId as string;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID not found in token" }, { status: 400 });
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
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // Create billing portal session
    const baseUrl =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createBillingPortalSession({
      customerId,
      returnUrl: `${baseUrl}/billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
