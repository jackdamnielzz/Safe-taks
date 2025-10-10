import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";

// IMPORTANT:
// - Set these environment variables in your .env.local / Vercel secrets:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SIGNING_SECRET
// - Use the Stripe CLI or dashboard to send test webhooks while developing.

export const config = {
  api: {
    bodyParser: false, // Stripe requires the raw body for signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-08-01",
});

async function handleEvent(event: Stripe.Event) {
  // Minimal routing for important lifecycle events.
  // Extend this with your organization's specific logic:
  // - update organizations/{orgId}.subscription
  // - write immutable billing events to organizations/{orgId}/billingEvents/{eventId}
  // - trigger entitlement changes (suspend/downgrade features)
  switch (event.type) {
    case "invoice.paid":
    case "invoice.payment_succeeded":
      // handle successful invoice -> ensure subscription active
      // payload: event.data.object as Stripe.Invoice
      break;
    case "customer.subscription.updated":
    case "customer.subscription.created":
      // handle subscription lifecycle changes
      // payload: event.data.object as Stripe.Subscription
      break;
    case "invoice.payment_failed":
    case "customer.subscription.deleted":
      // handle failed payments or cancellations
      break;
    default:
      // Unexpected/unhandled events should be logged for review
      break;
  }
}

/**
 * Webhook handler for Stripe events.
 * Verifies signature and dispatches to business logic.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const signingSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("Missing STRIPE_WEBHOOK_SIGNING_SECRET env var");
    return res.status(500).send("Webhook signing secret not configured");
  }

  try {
    // Read raw body as buffer for signature verification
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string | undefined;

    if (!sig) {
      console.warn("Missing stripe-signature header");
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, signingSecret);
    } catch (err) {
      console.error("⚠️  Webhook signature verification failed.", err);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // OPTIONAL: Log minimal event info to your monitoring system (Sentry/Cloud Logging)
    console.log(`Received Stripe event: ${event.type}`);

    // Delegate to business logic
    await handleEvent(event);

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error processing Stripe webhook:", err);
    res.status(500).send("Internal Server Error");
  }
}
