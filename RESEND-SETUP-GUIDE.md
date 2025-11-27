# Resend Email Setup & Deliverability Testing Guide

**Last Updated**: 2025-11-09 22:27 CET
**Status**: Ready for execution
**Estimated Time**: 2 hours

---

## Overview

This guide walks through setting up Resend for production email delivery, verifying domain ownership, configuring DNS records, and testing email deliverability across all 12 email types used in SafeWork Pro.

---

## Prerequisites

- [ ] Access to maasiso.nl DNS management (for SPF/DKIM records)
- [ ] Credit card for Resend account (free tier available)
- [ ] Access to test email accounts (Gmail, Outlook, Yahoo for testing)
- [ ] Vercel project created (for environment variables)

---

## Part 1: Resend Account Setup (30 minutes)

### Step 1.1: Create Resend Account

1. Go to https://resend.com/signup
2. Sign up with your work email (e.g., admin@maasiso.nl)
3. Verify your email address
4. Complete account setup

### Step 1.2: Add Domain

1. Navigate to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter: `maasiso.nl`
4. Click **Add Domain**

### Step 1.3: Configure DNS Records

Resend will provide three DNS records to add:

#### SPF Record (TXT)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend - copy exactly]
TTL: 3600
```

#### DMARC Record (TXT) - Optional but recommended
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@maasiso.nl
TTL: 3600
```

**Action Required**:
1. Log into your DNS provider (e.g., TransIP, Cloudflare, etc.)
2. Add all three DNS records
3. Wait 5-10 minutes for DNS propagation
4. Return to Resend dashboard and click **Verify Domain**

### Step 1.4: Generate API Key

1. Navigate to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name: `SafeWork Pro Production`
4. Permission: **Full Access** (or **Sending Access** for production)
5. Click **Create**
6. **IMPORTANT**: Copy the API key immediately (it won't be shown again)
7. Store securely in password manager

**API Key Format**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Part 2: Environment Configuration (15 minutes)

### Step 2.1: Update Local Environment

1. Open `web/.env.local` (create if doesn't exist)
2. Add Resend configuration:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@maasiso.nl
RESEND_FROM_NAME=SafeWork Pro
```

3. Save file
4. Restart development server: `npm run dev`

### Step 2.2: Configure Vercel Production

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select your SafeWork Pro project
3. Navigate to **Settings** > **Environment Variables**
4. Add three variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_your_actual_api_key` | Production |
| `RESEND_FROM_EMAIL` | `noreply@maasiso.nl` | Production |
| `RESEND_FROM_NAME` | `SafeWork Pro` | Production |

5. Click **Save** for each variable

---

## Part 3: Email Deliverability Testing (1 hour)

### Step 3.1: Test Email Types

SafeWork Pro uses 12 email types. Test each one:

#### 3.1.1 Welcome Email
```bash
# Test via API route
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "your-test-email@gmail.com",
    "data": {
      "userName": "Test User",
      "organizationName": "Test Organization"
    }
  }'
```

**Expected Result**: Email received within 1 minute

#### 3.1.2 TRA Approval Request
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tra_approval_request",
    "to": "your-test-email@gmail.com",
    "data": {
      "traTitle": "Test TRA - Hoogwerken",
      "traId": "test-tra-123",
      "requesterName": "Jan de Vries",
      "riskLevel": "HIGH",
      "approvalUrl": "http://localhost:3000/approvals/test-tra-123"
    }
  }'
```

#### 3.1.3 TRA Approved
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tra_approved",
    "to": "your-test-email@gmail.com",
    "data": {
      "traTitle": "Test TRA - Hoogwerken",
      "traId": "test-tra-123",
      "approverName": "Piet Jansen",
      "approvedAt": "2025-11-09T22:00:00Z",
      "traUrl": "http://localhost:3000/tras/test-tra-123"
    }
  }'
```

#### 3.1.4 TRA Rejected
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tra_rejected",
    "to": "your-test-email@gmail.com",
    "data": {
      "traTitle": "Test TRA - Hoogwerken",
      "traId": "test-tra-123",
      "rejectorName": "Piet Jansen",
      "rejectionReason": "Onvoldoende beheersmaatregelen voor hoogwerken",
      "traUrl": "http://localhost:3000/tras/test-tra-123"
    }
  }'
```

#### 3.1.5 LMRA Stop Work Alert (CRITICAL)
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lmra_stop_work",
    "to": "your-test-email@gmail.com",
    "data": {
      "lmraId": "test-lmra-123",
      "traTitle": "Test TRA - Hoogwerken",
      "location": "Bouwplaats Amsterdam Noord",
      "reason": "Onveilige werkomstandigheden gedetecteerd",
      "reportedBy": "Kees van der Berg",
      "reportedAt": "2025-11-09T22:00:00Z",
      "dashboardUrl": "http://localhost:3000/dashboard"
    }
  }'
```

#### 3.1.6 High-Risk TRA Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "high_risk_tra",
    "to": "your-test-email@gmail.com",
    "data": {
      "traTitle": "Test TRA - Hoogwerken",
      "traId": "test-tra-123",
      "riskScore": 450,
      "riskLevel": "HIGH",
      "hazardCount": 8,
      "createdBy": "Jan de Vries",
      "traUrl": "http://localhost:3000/tras/test-tra-123"
    }
  }'
```

#### 3.1.7 Supervisor Acknowledgment Request
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "supervisor_acknowledgment",
    "to": "your-test-email@gmail.com",
    "data": {
      "eventType": "stop_work",
      "eventDescription": "LMRA stop-work geactiveerd op bouwplaats",
      "location": "Bouwplaats Amsterdam Noord",
      "reportedBy": "Kees van der Berg",
      "reportedAt": "2025-11-09T22:00:00Z",
      "acknowledgmentUrl": "http://localhost:3000/approvals/ack-123"
    }
  }'
```

#### 3.1.8 Subscription Created
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_created",
    "to": "your-test-email@gmail.com",
    "data": {
      "planName": "Professional",
      "billingInterval": "monthly",
      "amount": "€99",
      "nextBillingDate": "2025-12-09",
      "billingUrl": "http://localhost:3000/settings/billing"
    }
  }'
```

#### 3.1.9 Payment Failed
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_failed",
    "to": "your-test-email@gmail.com",
    "data": {
      "amount": "€99",
      "attemptedAt": "2025-11-09T22:00:00Z",
      "reason": "Insufficient funds",
      "retryDate": "2025-11-12",
      "updatePaymentUrl": "http://localhost:3000/settings/billing"
    }
  }'
```

#### 3.1.10 Competency Expiry Warning
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "competency_expiry",
    "to": "your-test-email@gmail.com",
    "data": {
      "competencyName": "VCA Basis",
      "expiryDate": "2025-12-01",
      "daysUntilExpiry": 22,
      "teamMemberName": "Jan de Vries",
      "renewalUrl": "http://localhost:3000/team/jan-de-vries/competencies"
    }
  }'
```

#### 3.1.11 Password Reset
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password_reset",
    "to": "your-test-email@gmail.com",
    "data": {
      "resetUrl": "http://localhost:3000/auth/reset-password?token=test-token-123",
      "expiresIn": "1 hour"
    }
  }'
```

#### 3.1.12 Team Invitation
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invitation",
    "to": "your-test-email@gmail.com",
    "data": {
      "inviterName": "Piet Jansen",
      "organizationName": "Test Organization",
      "role": "Safety Manager",
      "invitationUrl": "http://localhost:3000/auth/accept-invitation?token=test-token-123",
      "expiresIn": "7 days"
    }
  }'
```

### Step 3.2: Deliverability Checklist

For each email type, verify:

- [ ] Email received within 1 minute
- [ ] Email not in spam folder
- [ ] Sender shows as "SafeWork Pro <noreply@maasiso.nl>"
- [ ] Subject line is in Dutch and clear
- [ ] Email body renders correctly (HTML)
- [ ] All links are clickable and work
- [ ] Unsubscribe link present (if applicable)
- [ ] Email displays correctly on mobile

### Step 3.3: Cross-Provider Testing

Test at least 3 email providers:

1. **Gmail** (test-gmail@gmail.com)
   - Check inbox, spam, promotions tabs
   - Verify sender authentication (green checkmark)

2. **Outlook/Hotmail** (test-outlook@outlook.com)
   - Check inbox and junk folder
   - Verify sender reputation

3. **Yahoo Mail** (test-yahoo@yahoo.com)
   - Check inbox and spam folder
   - Verify DKIM signature

### Step 3.4: Spam Score Testing

Use mail-tester.com to check spam score:

1. Send test email to address provided by mail-tester.com
2. Check your score (target: 8/10 or higher)
3. Review any issues flagged
4. Fix DNS records if needed

---

## Part 4: Production Verification (15 minutes)

### Step 4.1: Deploy to Production

1. Push changes to main branch
2. Verify Vercel deployment succeeds
3. Check environment variables are set

### Step 4.2: Production Email Test

1. Use production URL in curl commands
2. Test at least 3 critical email types:
   - Welcome email
   - LMRA stop-work alert
   - TRA approval request

3. Verify emails are sent from production

### Step 4.3: Monitor Resend Dashboard

1. Go to Resend dashboard > **Emails**
2. Verify emails appear in sent list
3. Check delivery status (should be "delivered")
4. Review any bounces or complaints

---

## Part 5: Monitoring Setup (10 minutes)

### Step 5.1: Configure Webhooks (Optional)

1. In Resend dashboard, go to **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/resend`
3. Select events:
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
   - `email.opened` (optional)
   - `email.clicked` (optional)

### Step 5.2: Set Up Alerts

1. Configure email alerts for:
   - Bounce rate > 5%
   - Complaint rate > 0.1%
   - Daily send limit approaching

2. Add alert recipients (admin emails)

---

## Troubleshooting

### Issue: Domain Not Verified

**Solution**:
1. Check DNS records are correct (no typos)
2. Wait 10-15 minutes for DNS propagation
3. Use `dig` or `nslookup` to verify records:
   ```bash
   dig TXT maasiso.nl
   dig TXT resend._domainkey.maasiso.nl
   ```
4. Contact DNS provider if records don't propagate

### Issue: Emails Going to Spam

**Solution**:
1. Verify SPF, DKIM, DMARC records are correct
2. Check spam score at mail-tester.com
3. Warm up domain by sending gradually increasing volumes
4. Ensure email content is not spammy (avoid ALL CAPS, excessive links)
5. Add unsubscribe link to all marketing emails

### Issue: API Key Not Working

**Solution**:
1. Verify API key is copied correctly (no extra spaces)
2. Check API key has correct permissions
3. Regenerate API key if needed
4. Update environment variables in Vercel

### Issue: Rate Limit Exceeded

**Solution**:
1. Check Resend plan limits (free tier: 100 emails/day)
2. Upgrade to paid plan if needed
3. Implement email queuing for high-volume scenarios

---

## Success Criteria

- [x] Resend account created and verified
- [x] Domain maasiso.nl verified with SPF/DKIM
- [x] API key generated and stored securely
- [x] Environment variables configured (local + Vercel)
- [ ] All 12 email types tested and delivered successfully
- [ ] Emails not landing in spam (tested across 3 providers)
- [ ] Spam score 8/10 or higher on mail-tester.com
- [ ] Production emails sending successfully
- [ ] Monitoring dashboard accessible
- [ ] Webhook configured (optional)

---

## Next Steps

After completing this guide:

1. ✅ Mark task 2 complete in todo list
2. Move to task 3: Monitor production performance
3. Document any issues encountered
4. Update team on email deliverability status

---

## Reference Links

- Resend Dashboard: https://resend.com/dashboard
- Resend Documentation: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference
- Mail Tester: https://www.mail-tester.com
- SPF Record Checker: https://mxtoolbox.com/spf.aspx
- DKIM Record Checker: https://mxtoolbox.com/dkim.aspx

---

**Document Version**: 1.0
**Last Updated**: 2025-11-09 22:27 CET
**Maintained By**: SafeWork Pro Development Team