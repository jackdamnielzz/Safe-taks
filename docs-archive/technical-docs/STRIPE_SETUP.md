Stripe integration and local webhook testing

Overview
- This document describes how to configure Stripe for SafeWork Pro, add environment secrets, test webhooks locally, and the expected webhook handling flow.
- Key repo artefacts:
  - Webhook handler skeleton: [`web/src/pages/api/stripe/webhook.ts`](web/src/pages/api/stripe/webhook.ts:1)
  - Billing events location (Firestore): organizations/{orgId}/billingEvents/{eventId}
  - Subscription state stored on organization documents: organizations/{orgId}.subscription

Environment variables (local / Vercel / GitHub)
- STRIPE_SECRET_KEY
  - Value: Your Stripe secret API key (sk_test_...)
  - Usage: Used by server-side code to call the Stripe API.
- STRIPE_WEBHOOK_SIGNING_SECRET
  - Value: Signing secret for the webhook endpoint (provided by Stripe when you create a webhook endpoint)
  - Usage: Used to verify webhook signatures in the webhook handler
- (Optional) STRIPE_WEBHOOK_ENDPOINT
  - Value: Public URL of your deployed webhook endpoint (e.g. https://your-app.vercel.app/api/stripe/webhook)
  - Usage: Helpful for CI & documentation

Checklist to implement Stripe integration
1. Install Stripe SDK (local)
   - npm install stripe
   - dev: npm install -D @types/stripe (if needed for TS types)
2. Ensure raw-body buffer support
   - The Next.js API route at web/src/pages/api/stripe/webhook.ts uses micro.buffer to read the raw body.
   - Alternatively, Next's built-in raw buffer can be used; ensure bodyParser is disabled for the route.
3. Implement business logic in webhook handler
   - Parse Stripe event and route:
     - invoice.payment_succeeded / invoice.paid -> set subscription active, record billing event
     - customer.subscription.created/updated -> update organizations/{orgId}.subscription
     - invoice.payment_failed -> set subscription status to 'past_due' and create billing event
     - customer.subscription.deleted -> set subscription status to 'canceled'
   - Map Stripe Customer -> organizations/{orgId}
     - Store orgId in metadata when creating Stripe Customer (preferred), or maintain mapping table in Firestore: stripeCustomers/{stripeCustomerId} -> orgId
   - Record immutable billing events:
     - organizations/{orgId}/billingEvents/{eventId} with full Stripe payload (or essential subset), timestamp and processed boolean
4. Webhook security
   - Verify signature using stripe.webhooks.constructEvent
   - Log and alert on verification failures
   - Use retry-safe processing (idempotency) based on Stripe event id
   - Persist events even if processing fails, and have a manual reconciliation path
5. Reconciliation job
   - Nightly Cloud Function or scheduled Next.js function:
     - Iterate active Stripe subscriptions via Stripe API
     - Compare with organizations/{orgId}.subscription in Firestore
     - Write reconciliation mismatches to monitoring and create tickets/alerts
6. Entitlement enforcement
   - On subscription state change, update organization-level feature flags in organizations/{orgId}.settings.features
   - Client-side: Read org-level features via tenant context; hide/disable premium UI
   - Server-side: Enforce via API route checks (verify org subscription status before performing premium operations)
7. Testing locally with Stripe CLI
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Start a local dev server (e.g., npm run dev)
   - Forward events to local webhook:
     - stripe listen --forward-to localhost:3000/api/stripe/webhook
   - Emit test events:
     - stripe trigger invoice.payment_succeeded
     - stripe trigger customer.subscription.created
   - Verify logs, Firestore writes (using Firebase emulator or an instrumented dev Firestore)
8. CI & E2E tests
   - Add integration tests that use Stripe's test fixtures and the Stripe CLI to simulate webhooks in CI (or mock the webhook events)
9. Monitoring & Alerts
   - Use Sentry to capture webhook handler exceptions
   - Configure an alert on repeated signature verification failures or high rate of failed webhook processing
10. Recovery & manual operations
    - Provide admin UI to re-run failed webhook events (replay) and a reconciliation UI for billing mismatches

Developer notes (to implement now)
- Store Stripe secret keys in Vercel/GitHub Secrets; do not commit them.
- Ensure the webhook endpoint is reachable by Stripe (use Stripe CLI during development).
- Prefer storing orgId in Stripe Customer metadata when creating the Customer:
  - stripe.customers.create({ email, metadata: { orgId } })
- Use event.id from Stripe as an idempotency key saved alongside billing event documents to avoid duplicate processing.

Example Firestore billing event schema
organizations/{orgId}/billingEvents/{eventId} {
  stripeEventId: string,
  type: string,
  payload: object, // minimal subset of the Stripe event for auditing
  processed: boolean,
  processedAt: timestamp,
  createdAt: timestamp
}

Next steps I will perform when you confirm:
- Add dependency installation task to package.json instructions and CHECKLIST_REVISED.md
- Implement webhook business logic to update Firestore (organizations subscription & billingEvents)
- Create a scheduled reconciliation job (Cloud Function or cron on Vercel)
- Add local testing docs and CI test skeleton
