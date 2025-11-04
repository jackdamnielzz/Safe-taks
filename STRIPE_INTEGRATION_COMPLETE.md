# Stripe Payment Integration - Implementation Complete

**Date**: October 31, 2025  
**Status**: ✅ Complete - Ready for Testing  
**Priority**: 🔴 CRITICAL for MVP Launch

---

## 📋 Overview

Complete Stripe payment integration for SafeWork Pro MVP with subscription management, billing portal, and webhook handling.

## ✅ Implemented Components

### 1. **Stripe SDK Configuration** ✅
**Location**: [`web/src/lib/payments/stripe-client.ts`](web/src/lib/payments/stripe-client.ts:1)

**Features**:
- Server-side Stripe instance initialization
- Price ID configuration for all tiers (monthly/yearly)
- Customer creation with organization metadata
- Checkout session creation
- Billing portal session creation
- Subscription management (get, update, cancel, reactivate)
- Payment method management
- Invoice retrieval
- Webhook signature verification

**Configuration**:
```typescript
STRIPE_CONFIG = {
  PRICE_IDS: {
    starter_monthly, starter_yearly,
    professional_monthly, professional_yearly,
    enterprise_monthly, enterprise_yearly
  },
  WEBHOOK_SECRET,
  PUBLISHABLE_KEY,
  CURRENCY: 'eur',
  TRIAL_PERIOD_DAYS: 14
}
```

### 2. **Subscription Management Service** ✅
**Location**: [`web/src/lib/payments/subscription-manager.ts`](web/src/lib/payments/subscription-manager.ts:1)

**Features**:
- Initialize subscription for new organizations
- Create checkout sessions
- Create billing portal sessions
- Activate subscriptions after payment
- Handle cancellations and reactivations
- Update subscription status from webhooks
- Get subscription limits by tier
- Check if actions are allowed based on limits
- Recommend tier based on usage
- Calculate trial expiry

**Pricing**:
- **Starter**: €49/month, €490/year (~17% discount)
- **Professional**: €149/month, €1490/year (~17% discount)
- **Enterprise**: €499/month, €4990/year (~17% discount)

### 3. **Usage Tracking & Feature Gates** ✅
**Locations**: 
- [`web/src/lib/payments/usage-tracker.ts`](web/src/lib/payments/usage-tracker.ts:1)
- [`web/src/lib/payments/feature-gates.tsx`](web/src/lib/payments/feature-gates.tsx:1)

**Features**:
- Track usage metrics (users, projects, TRAs, storage)
- Increment/decrement usage counters
- Check usage limits before actions
- Calculate usage percentages
- Feature flags by subscription tier
- React hooks for feature access
- Feature gate components
- Upgrade suggestions based on usage

**Feature Flags by Tier**:
```typescript
Trial: Basic TRA/LMRA, Basic Reports
Starter: + Advanced Reports, Audit Logs, Bulk Ops, Data Export
Professional: + Custom Branding, API Access, Priority Support, Custom Workflows, Webhooks
Enterprise: + SSO, Dedicated Support, SLA
```

### 4. **API Endpoints** ✅

#### Create Checkout Session
**Endpoint**: `POST /api/stripe/create-checkout`  
**File**: [`web/src/app/api/stripe/create-checkout/route.ts`](web/src/app/api/stripe/create-checkout/route.ts:1)

**Request**:
```json
{
  "tier": "starter" | "professional" | "enterprise",
  "interval": "monthly" | "yearly"
}
```

**Response**:
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### Create Billing Portal Session
**Endpoint**: `POST /api/stripe/create-portal`  
**File**: [`web/src/app/api/stripe/create-portal/route.ts`](web/src/app/api/stripe/create-portal/route.ts:1)

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

#### Get Subscription Status
**Endpoint**: `GET /api/stripe/subscription`  
**File**: [`web/src/app/api/stripe/subscription/route.ts`](web/src/app/api/stripe/subscription/route.ts:1)

**Response**:
```json
{
  "subscription": {
    "tier": "professional",
    "status": "active",
    "currentPeriodEnd": "2025-11-30T...",
    "cancelAtPeriodEnd": false
  },
  "usage": {
    "userCount": 15,
    "projectCount": 8,
    "traCount": 45,
    "storageGB": 2.5
  },
  "limits": {
    "maxUsers": 50,
    "maxProjects": 25,
    "maxTRAs": 500,
    "maxStorageGB": 50
  }
}
```

#### Webhook Handler
**Endpoint**: `POST /api/stripe/webhook`  
**File**: [`web/src/app/api/stripe/webhook/route.ts`](web/src/app/api/stripe/webhook/route.ts:1)

**Handled Events**:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.created` - Create subscription record
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Confirm payment
- `invoice.payment_failed` - Handle failed payment

**Features**:
- Signature verification
- Organization lookup by customer ID
- Firestore subscription updates
- Billing event audit trail
- Idempotent processing

### 5. **UI Components** ✅

#### Pricing Page
**Location**: [`web/src/app/pricing/page.tsx`](web/src/app/pricing/page.tsx:1)

**Features**:
- 3 subscription tiers with feature comparison
- Monthly/yearly billing toggle
- Yearly savings display (~17% discount)
- Popular tier highlighting (Professional)
- Feature lists with checkmarks
- Usage limits display
- FAQ section
- Direct checkout integration
- 14-day free trial messaging

**Design**:
- Responsive grid layout
- Professional card design
- Clear CTAs
- Dutch language
- Mobile-optimized

#### Billing Page
**Location**: [`web/src/app/billing/page.tsx`](web/src/app/billing/page.tsx:1)

**Features**:
- Current subscription status display
- Usage metrics with progress bars
- Billing portal access
- Trial expiry warnings
- Cancellation warnings
- Usage limit warnings (>80%)
- Quick actions (upgrade, manage billing, dashboard)
- Success/cancel redirect handling

**Metrics Displayed**:
- Users (with progress bar)
- Projects (with progress bar)
- TRAs (with progress bar)
- Storage (with progress bar)
- Next billing date
- Subscription status badge

---

## 🔧 Environment Variables Required

Add these to `.env.local`, Vercel, and GitHub Secrets:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...                    # Stripe secret key (server-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Stripe publishable key (client-side)

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 📝 Stripe Dashboard Setup

### 1. Create Products & Prices

**Starter Plan**:
- Product Name: "SafeWork Pro - Starter"
- Monthly Price: €49.00 EUR (recurring)
- Yearly Price: €490.00 EUR (recurring)
- Metadata: `tier=starter`

**Professional Plan**:
- Product Name: "SafeWork Pro - Professional"
- Monthly Price: €149.00 EUR (recurring)
- Yearly Price: €1490.00 EUR (recurring)
- Metadata: `tier=professional`

**Enterprise Plan**:
- Product Name: "SafeWork Pro - Enterprise"
- Monthly Price: €499.00 EUR (recurring)
- Yearly Price: €4990.00 EUR (recurring)
- Metadata: `tier=enterprise`

### 2. Configure Webhook Endpoint

**URL**: `https://your-app.vercel.app/api/stripe/webhook`

**Events to Subscribe**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Get Signing Secret**: Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Configure Customer Portal

**Settings** → **Customer Portal**:
- Enable subscription cancellation
- Enable subscription updates (upgrade/downgrade)
- Enable payment method updates
- Enable invoice history
- Set return URL: `https://your-app.vercel.app/billing`

### 4. Payment Methods

Enable for Netherlands:
- ✅ Card (Visa, Mastercard, Amex)
- ✅ iDEAL
- ✅ SEPA Direct Debit

---

## 🧪 Testing Locally

### 1. Install Stripe CLI

```bash
# Windows (via Scoop)
scoop install stripe

# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
# Start your dev server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the output and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Trigger Test Events

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed
```

### 5. Test Cards

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Any future expiry date, any CVC, any postal code.

---

## 🔄 User Flow

### New Organization Signup

1. User registers → Organization created in Firestore
2. Stripe customer created with `organizationId` in metadata
3. Organization gets 14-day trial (tier: `trial`, status: `trial`)
4. User can browse app with trial limits

### Subscription Purchase

1. User visits [`/pricing`](web/src/app/pricing/page.tsx:1)
2. Selects tier and billing interval
3. Clicks "Start gratis proefperiode"
4. Redirected to Stripe Checkout
5. Enters payment details
6. Stripe processes payment
7. Webhook `checkout.session.completed` received
8. Organization subscription activated in Firestore
9. User redirected to [`/billing?success=true`](web/src/app/billing/page.tsx:1)

### Subscription Management

1. User visits [`/billing`](web/src/app/billing/page.tsx:1)
2. Views current subscription and usage
3. Clicks "Beheer Abonnement"
4. Redirected to Stripe Customer Portal
5. Can update payment method, view invoices, cancel subscription
6. Changes synced via webhooks

### Usage Limit Enforcement

1. Before creating user/project/TRA:
   ```typescript
   const { allowed, reason } = await checkUsageLimit(orgId, 'add_user');
   if (!allowed) {
     throw new Error(reason); // "User limit reached (10). Please upgrade your plan."
   }
   ```

2. After successful creation:
   ```typescript
   await trackUsage(orgId, 'userCount', 1);
   ```

3. UI shows upgrade prompt when >80% of limit

---

## 📊 Firestore Schema Updates

### Organization Document

```typescript
{
  subscription: {
    tier: 'starter' | 'professional' | 'enterprise' | 'trial',
    status: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused',
    startDate: Timestamp,
    currentPeriodEnd: Timestamp,
    trialEndsAt?: Timestamp,
    cancelAtPeriodEnd?: boolean,
    lastPaymentDate?: Timestamp,
    stripeCustomerId: string,
    stripeSubscriptionId?: string
  },
  limits: {
    maxUsers: number,
    maxProjects: number,
    maxTRAs: number,
    maxStorageGB: number
  },
  usage: {
    userCount: number,
    projectCount: number,
    traCount: number,
    storageGB: number,
    lastUpdated: Timestamp
  }
}
```

### Billing Events Subcollection

**Path**: `organizations/{orgId}/billingEvents/{eventId}`

```typescript
{
  stripeEventId: string,
  type: string,  // e.g., 'invoice.payment_succeeded'
  payload: object,
  processed: boolean,
  processedAt: Timestamp,
  createdAt: Timestamp
}
```

---

## 🔐 Security Considerations

1. **Webhook Signature Verification**: All webhooks verify Stripe signature
2. **Authentication Required**: All API endpoints require Firebase Auth token
3. **Organization Isolation**: Users can only access their organization's data
4. **Idempotent Processing**: Webhook events processed only once using event ID
5. **Audit Trail**: All billing events stored for compliance
6. **Secure Keys**: All secrets stored in environment variables

---

## 📧 Email Notifications (TODO)

Integration points for Resend email service:

1. **Payment Success** ([`webhook/route.ts:189`](web/src/app/api/stripe/webhook/route.ts:189))
   - Send payment confirmation
   - Include invoice details
   - Next billing date

2. **Payment Failed** ([`webhook/route.ts:215`](web/src/app/api/stripe/webhook/route.ts:215))
   - Send payment failure notification
   - Include retry instructions
   - Link to update payment method

3. **Trial Expiring** (Add scheduled function)
   - Send 3 days before trial ends
   - Remind to choose subscription
   - Link to pricing page

4. **Subscription Canceled**
   - Send cancellation confirmation
   - Data retention policy
   - Reactivation instructions

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] Visit `/pricing` and view all tiers
- [ ] Toggle monthly/yearly billing
- [ ] Click "Start gratis proefperiode" (requires login)
- [ ] Complete Stripe Checkout with test card
- [ ] Verify redirect to `/billing?success=true`
- [ ] Check subscription status in `/billing`
- [ ] View usage metrics
- [ ] Click "Beheer Abonnement" → Stripe Portal
- [ ] Update payment method in portal
- [ ] View invoice history in portal
- [ ] Cancel subscription in portal
- [ ] Verify cancellation warning in `/billing`
- [ ] Reactivate subscription in portal

### Webhook Testing

- [ ] Trigger `checkout.session.completed`
- [ ] Verify subscription activated in Firestore
- [ ] Trigger `invoice.payment_succeeded`
- [ ] Verify payment date updated
- [ ] Trigger `invoice.payment_failed`
- [ ] Verify status changed to `past_due`
- [ ] Trigger `customer.subscription.deleted`
- [ ] Verify status changed to `canceled`

### Usage Limits Testing

- [ ] Create users until limit reached
- [ ] Verify error message shown
- [ ] Upgrade subscription
- [ ] Verify higher limits applied
- [ ] Create more users successfully

---

## 🚀 Deployment Steps

### 1. Vercel Environment Variables

Add all Stripe environment variables to Vercel:
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... add all price IDs
```

### 2. Deploy to Production

```bash
vercel --prod
```

### 3. Update Stripe Webhook URL

In Stripe Dashboard:
- Update webhook endpoint to production URL
- Copy new webhook signing secret
- Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 4. Test Production Webhooks

```bash
stripe listen --forward-to https://your-app.vercel.app/api/stripe/webhook --live
```

---

## 📈 Monitoring & Alerts

### Sentry Integration

Webhook errors are automatically captured by Sentry:
- Signature verification failures
- Firestore update errors
- Unknown event types

### Stripe Dashboard

Monitor in Stripe Dashboard:
- Failed payments
- Subscription churn
- Revenue metrics
- Webhook delivery status

### Custom Alerts (TODO)

Set up alerts for:
- High webhook failure rate (>5%)
- Payment failure spike
- Subscription cancellation spike
- Trial conversion rate drop

---

## 🎯 Success Metrics

Track these KPIs:
- **Trial Conversion Rate**: % of trials that convert to paid
- **Monthly Recurring Revenue (MRR)**: Total monthly subscription revenue
- **Churn Rate**: % of subscriptions canceled per month
- **Average Revenue Per User (ARPU)**: MRR / active subscriptions
- **Customer Lifetime Value (LTV)**: Average subscription duration × ARPU

---

## 🔄 Next Steps

1. ✅ **Complete**: Core Stripe integration
2. ✅ **Complete**: Pricing & billing pages
3. ✅ **Complete**: Webhook handling
4. 🔄 **In Progress**: Usage limit enforcement in all API routes
5. ⏳ **TODO**: Email notifications via Resend
6. ⏳ **TODO**: Analytics dashboard for subscription metrics
7. ⏳ **TODO**: Admin panel for subscription management
8. ⏳ **TODO**: Automated trial expiry handling
9. ⏳ **TODO**: Dunning management for failed payments
10. ⏳ **TODO**: Referral program integration

---

## 📚 Related Documentation

- [STRIPE_SETUP.md](STRIPE_SETUP.md:1) - Original setup guide
- [FIRESTORE_DATA_MODEL.md](FIRESTORE_DATA_MODEL.md:1) - Database schema
- [PROJECT_STATUS_RAPPORT.md](PROJECT_STATUS_RAPPORT.md:1) - Project status
- [RESEND_INTEGRATION_COMPLETE.md](RESEND_INTEGRATION_COMPLETE.md:1) - Email integration

---

## ✅ Implementation Status

**Overall Progress**: 90% Complete

| Component | Status | Notes |
|-----------|--------|-------|
| Stripe SDK Setup | ✅ Complete | All utilities implemented |
| API Endpoints | ✅ Complete | Checkout, portal, subscription, webhook |
| Webhook Handler | ✅ Complete | All events handled |
| Pricing Page | ✅ Complete | 3 tiers, Dutch language |
| Billing Page | ✅ Complete | Usage metrics, portal access |
| Usage Tracking | ✅ Complete | Increment/decrement, limits |
| Feature Gates | ✅ Complete | React hooks, components |
| Environment Vars | ✅ Complete | Documentation provided |
| Testing Guide | ✅ Complete | Local & production testing |
| Email Notifications | ⏳ TODO | Integration points marked |
| Usage Enforcement | 🔄 In Progress | Need to add to all API routes |

---

**Status**: ✅ **READY FOR TESTING**  
**Next Action**: Set up Stripe Dashboard products and test locally  
**Blocker**: None - can proceed with testing

---

**Document Generated**: October 31, 2025  
**Last Updated**: October 31, 2025