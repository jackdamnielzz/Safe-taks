# Development Accounts Setup Guide

**Task 1.4**: Set up development accounts and services

## Account Status

### ✅ Firebase (Complete)
- Project ID: `hale-ripsaw-403915`
- Region: europe-west (Belgium)
- Services: Firestore, Auth, Storage, Functions
- Status: Configured and deployed

### Vercel Account Setup

1. **Sign up**: https://vercel.com/signup
2. **Connect GitHub**: Sign up with GitHub (recommended)
3. **Install CLI**: `npm i -g vercel`
4. **Link project**:
   ```bash
   cd web
   vercel link
   ```
5. **Add environment variables** in Vercel dashboard:
   - Copy from `web/.env.local`
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Add `FIREBASE_SERVICE_ACCOUNT_KEY` (production only)
   - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (when ready)

### GitHub Repository Setup

1. **Create repository**: https://github.com/new
2. **Repository name**: `safework-pro` (or your choice)
3. **Visibility**: Private (recommended for now)
4. **Initialize repository locally**:
   ```bash
   cd /d/Programmeren/MaasISO/saasapps/tra001
   git init
   git add .
   git commit -m "Initial commit: SafeWork Pro MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/safework-pro.git
   git push -u origin main
   ```
5. **Add .gitignore** (already exists in web/)

### Stripe Account Setup

1. **Sign up**: https://dashboard.stripe.com/register
2. **Activate account**: Complete business details
3. **Get API keys**:
   - Test keys: Dashboard → Developers → API keys
   - Copy both Publishable key and Secret key
4. **Add to .env.local**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (after webhook setup)
   ```
5. **Configure webhook** (later, Task 7.1):
   - Endpoint: https://your-domain.com/api/stripe/webhook
   - Events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`

### Upstash Redis (for Rate Limiting)

1. **Sign up**: https://upstash.com/
2. **Create database**: Free tier is sufficient for MVP
3. **Copy credentials**:
   ```env
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

## Quick Start Checklist

- [ ] Vercel account created
- [ ] Vercel project linked
- [ ] GitHub repository created
- [ ] Initial commit pushed
- [ ] Stripe account activated
- [ ] Stripe test keys obtained
- [ ] Upstash Redis database created
- [ ] All environment variables configured

## Environment Variables Summary

Required for development:
```env
# Firebase Client (web/.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hale-ripsaw-403915
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"project_id":"...","private_key":"..."}

# Stripe (Test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## Notes

- Firebase is already configured and working
- Stripe integration is Task 7.1 (Month 8) - keys needed early for testing
- Upstash Redis needed for rate limiting (lib/api/rate-limit.ts)
- All test mode keys are safe to use during development
- Switch to production keys only when deploying to production

## Next Steps After Setup

1. Push code to GitHub
2. Deploy to Vercel (automatic from GitHub)
3. Configure production environment variables in Vercel
4. Test deployment
5. Continue with Task 1.5 (Firestore data model design)