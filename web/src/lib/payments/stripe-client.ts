/**
 * Stripe Client Integration
 *
 * Provides Stripe SDK initialization and client-side payment methods
 * for subscription management and payment processing.
 */

import Stripe from "stripe";

// Server-side Stripe instance (use in API routes only)
let stripeInstance: Stripe | null = null;

/**
 * Get or initialize Stripe instance for server-side operations
 * @returns Stripe instance
 */
export function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Stripe configuration and constants
 */
export const STRIPE_CONFIG = {
  // Subscription price IDs (set these in your Stripe dashboard)
  PRICE_IDS: {
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
    professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || "",
    professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || "",
    enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
    enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "",
  },

  // Webhook secret for signature verification
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Public key for client-side Stripe.js
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",

  // Currency
  CURRENCY: "eur",

  // Trial period (days)
  TRIAL_PERIOD_DAYS: 14,
} as const;

/**
 * Subscription tier to price ID mapping
 */
export type BillingInterval = "monthly" | "yearly";

export function getPriceId(
  tier: "starter" | "professional" | "enterprise",
  interval: BillingInterval
): string {
  const key = `${tier}_${interval}` as keyof typeof STRIPE_CONFIG.PRICE_IDS;
  const priceId = STRIPE_CONFIG.PRICE_IDS[key];

  if (!priceId) {
    throw new Error(`Price ID not configured for ${tier} ${interval}`);
  }

  return priceId;
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(params: {
  email: string;
  name: string;
  organizationId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripeInstance();

  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      organizationId: params.organizationId,
      ...params.metadata,
    },
  });
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance();

  return await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card", "ideal", "sepa_debit"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      trial_period_days: params.trialPeriodDays,
      metadata: params.metadata,
    },
    allow_promotion_codes: true,
  });
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeInstance();

  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance();
  return await stripe.subscriptions.update(subscriptionId, params);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance();

  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance();

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripeInstance();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripeInstance();

  return stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.WEBHOOK_SECRET);
}

/**
 * Get invoice details
 */
export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const stripe = getStripeInstance();
  return await stripe.invoices.retrieve(invoiceId);
}

/**
 * List customer invoices
 */
export async function listInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const stripe = getStripeInstance();

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

/**
 * Record usage for metered billing (future enhancement)
 * Note: Usage records are created via Stripe API directly when needed
 */
export async function recordUsage(params: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
}): Promise<void> {
  const stripe = getStripeInstance();

  // Usage records in Stripe v18+ are handled differently
  // This is a placeholder for future metered billing implementation
  console.log("Usage recording:", params);

  // TODO: Implement usage recording when metered billing is needed
  // For now, we track usage in Firestore (see usage-tracker.ts)
}
