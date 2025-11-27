/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle management
 */

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { verifyWebhookSignature } from "@/lib/payments/stripe-client";
import Stripe from "stripe";

// Disable body parsing for webhook signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Store billing event for audit trail
    await storeBillingEvent(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const tier = session.metadata?.tier as "starter" | "professional" | "enterprise";

  if (!organizationId || !tier) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const db = getFirestore();
  const orgRef = db.collection("organizations").doc(organizationId);

  await orgRef.update({
    "subscription.status": "active",
    "subscription.tier": tier,
    "subscription.stripeSubscriptionId": session.subscription as string,
    "subscription.startDate": Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`Subscription activated for org ${organizationId}: ${tier}`);
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error("Missing organizationId in subscription metadata");
    return;
  }

  const db = getFirestore();
  const orgRef = db.collection("organizations").doc(organizationId);

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trial",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
  };

  const status = statusMap[subscription.status] || "active";
  const currentPeriodEnd = (subscription as any).current_period_end;

  await orgRef.update({
    "subscription.status": status,
    "subscription.currentPeriodEnd": Timestamp.fromMillis(currentPeriodEnd * 1000),
    "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end || false,
    updatedAt: Timestamp.now(),
  });

  console.log(`Subscription updated for org ${organizationId}: ${status}`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error("Missing organizationId in subscription metadata");
    return;
  }

  const db = getFirestore();
  const orgRef = db.collection("organizations").doc(organizationId);

  await orgRef.update({
    "subscription.status": "canceled",
    "subscription.tier": "trial",
    updatedAt: Timestamp.now(),
  });

  console.log(`Subscription canceled for org ${organizationId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Get organizationId from customer metadata or subscription
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    console.error("Missing customer in invoice");
    return;
  }

  // We'll need to look up the organization by customer ID
  const db = getFirestore();
  const orgsSnapshot = await db
    .collection("organizations")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (orgsSnapshot.empty) {
    console.error("Organization not found for customer:", customerId);
    return;
  }

  const organizationId = orgsSnapshot.docs[0].id;
  const orgRef = db.collection("organizations").doc(organizationId);

  // Update last payment date
  await orgRef.update({
    "subscription.lastPaymentDate": Timestamp.now(),
    "subscription.status": "active",
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment succeeded for org ${organizationId}`);

  // TODO: Send payment confirmation email via Resend
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Get organizationId from customer metadata or subscription
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    console.error("Missing customer in invoice");
    return;
  }

  // We'll need to look up the organization by customer ID
  const db = getFirestore();
  const orgsSnapshot = await db
    .collection("organizations")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (orgsSnapshot.empty) {
    console.error("Organization not found for customer:", customerId);
    return;
  }

  const organizationId = orgsSnapshot.docs[0].id;
  const orgRef = db.collection("organizations").doc(organizationId);

  await orgRef.update({
    "subscription.status": "past_due",
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment failed for org ${organizationId}`);

  // TODO: Send payment failure notification email via Resend
}

/**
 * Store billing event for audit trail
 */
async function storeBillingEvent(event: Stripe.Event) {
  const db = getFirestore();

  // Extract organizationId from event metadata
  let organizationId: string | undefined;

  if (event.type.startsWith("checkout.session")) {
    const session = event.data.object as Stripe.Checkout.Session;
    organizationId = session.metadata?.organizationId;
  } else if (event.type.startsWith("customer.subscription")) {
    const subscription = event.data.object as Stripe.Subscription;
    organizationId = subscription.metadata?.organizationId;
  } else if (event.type.startsWith("invoice")) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    if (customerId) {
      // Look up organization by customer ID
      const orgsSnapshot = await db
        .collection("organizations")
        .where("subscription.stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!orgsSnapshot.empty) {
        organizationId = orgsSnapshot.docs[0].id;
      }
    }
  }

  if (!organizationId) {
    console.warn("Could not extract organizationId from event, skipping billing event storage");
    return;
  }

  const billingEventRef = db
    .collection("organizations")
    .doc(organizationId)
    .collection("billingEvents")
    .doc(event.id);

  await billingEventRef.set({
    stripeEventId: event.id,
    type: event.type,
    payload: {
      // Store minimal subset to avoid large documents
      eventType: event.type,
      objectType: (event.data.object as any).object,
    },
    processed: true,
    processedAt: Timestamp.now(),
    createdAt: Timestamp.fromMillis(event.created * 1000),
  });
}
