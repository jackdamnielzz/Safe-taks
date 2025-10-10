# Integration Environment Variables

This document lists all required environment variables for the advanced integration features (Tasks 7.1-7.5).

## Stripe Payment Integration (Task 7.1)

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...                    # Stripe secret key (server-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Stripe publishable key (client-side)
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

### Setup Instructions:
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Create products and prices in Dashboard → Products
4. Set up webhook endpoint at Dashboard → Developers → Webhooks
5. Add webhook secret to environment variables

## SendGrid Email Notifications (Task 7.3)

```env
# SendGrid API
SENDGRID_API_KEY=SG....                          # SendGrid API key
SENDGRID_FROM_EMAIL=noreply@safeworkpro.com      # Verified sender email
SENDGRID_FROM_NAME=SafeWork Pro                  # Sender name
```

### Setup Instructions:
1. Create SendGrid account at https://sendgrid.com
2. Verify sender email in Settings → Sender Authentication
3. Create API key in Settings → API Keys
4. Add API key to environment variables

## Web Push Notifications (Task 7.4)

```env
# VAPID Keys for Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG...               # Public VAPID key (client-side)
VAPID_PRIVATE_KEY=...                            # Private VAPID key (server-side)
VAPID_SUBJECT=mailto:admin@safeworkpro.com       # Contact email
```

### Setup Instructions:
1. Generate VAPID keys using web-push library:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add keys to environment variables
3. Update VAPID_SUBJECT with your contact email

## Webhook System (Task 7.5)

```env
# Webhook Configuration
WEBHOOK_SECRET=...                               # Secret for webhook authentication
WEBHOOK_MAX_RETRIES=3                           # Maximum retry attempts
WEBHOOK_RETRY_DELAY=5000                        # Delay between retries (ms)
```

### Setup Instructions:
1. Generate secure webhook secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Add secret to environment variables

## Complete .env.local Example

```env
# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hale-ripsaw-403915
FIREBASE_SERVICE_ACCOUNT_KEY={"project_id":"..."}

# OpenWeather API (existing)
NEXT_PUBLIC_OPENWEATHER_API_KEY=...

# Sentry (existing)
NEXT_PUBLIC_SENTRY_DSN=...

# Upstash Redis (existing)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Stripe Payment Integration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...

# SendGrid Email
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@safeworkpro.com
SENDGRID_FROM_NAME=SafeWork Pro

# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@safeworkpro.com

# Webhook System
WEBHOOK_SECRET=...
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=5000
```

## Security Notes

1. **Never commit `.env.local` to version control**
2. Use different keys for development and production
3. Rotate secrets regularly
4. Use Vercel environment variables for production deployment
5. Restrict API key permissions to minimum required scope

## Vercel Deployment

Add environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production/Preview/Development)
3. Redeploy after adding variables

## Testing

Test each integration:
```bash
# Test Stripe connection
curl -u ${STRIPE_SECRET_KEY}: https://api.stripe.com/v1/customers

# Test SendGrid
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
  -H "Content-Type: application/json"

# Test webhook secret generation
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Stripe Issues
- Verify API keys are for correct environment (test vs live)
- Check webhook endpoint is publicly accessible
- Verify price IDs match your Stripe dashboard

### SendGrid Issues
- Verify sender email is authenticated
- Check API key has Mail Send permissions
- Review SendGrid activity log for delivery issues

### Web Push Issues
- Verify VAPID keys are correctly formatted
- Check browser supports Push API
- Ensure HTTPS is enabled (required for push)

### Webhook Issues
- Verify webhook secret matches across systems
- Check retry logic is working
- Monitor webhook delivery logs