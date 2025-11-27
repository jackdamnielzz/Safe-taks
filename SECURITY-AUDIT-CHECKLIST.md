# Security Audit Checklist - SafeWork Pro

**Last Updated**: 2025-11-09 22:28 CET
**Status**: Ready for execution
**Estimated Time**: 3-4 hours
**Priority**: HIGH (Must complete before production launch)

---

## Overview

This comprehensive security audit checklist covers all critical security aspects of SafeWork Pro, including Firebase security rules, API authentication, data encryption, GDPR compliance, and vulnerability scanning.

---

## Part 1: Firebase Security Rules Audit (1 hour)

### 1.1 Firestore Security Rules

**File to Review**: `firestore.rules` (if exists) or Firebase Console

#### Organizations Collection
- [ ] Verify only authenticated users can read their own organization
- [ ] Verify only admins can create/update/delete organizations
- [ ] Verify organization data isolation (no cross-org data access)
- [ ] Test: Try to access another organization's data (should fail)

#### Users Collection
- [ ] Verify users can only read/update their own profile
- [ ] Verify admins can read all users in their organization
- [ ] Verify email addresses are not publicly readable
- [ ] Test: Try to read another user's profile (should fail unless admin)

#### TRAs Collection
- [ ] Verify only organization members can read TRAs
- [ ] Verify proper role-based write permissions (safety_manager, admin)
- [ ] Verify TRA deletion requires admin role
- [ ] Verify archived TRAs cannot be modified
- [ ] Test: Try to modify TRA from different organization (should fail)

#### LMRAs Collection
- [ ] Verify only organization members can read LMRAs
- [ ] Verify field workers can create LMRAs
- [ ] Verify LMRA completion is immutable once signed
- [ ] Verify stop-work flag can only be set by authorized users
- [ ] Test: Try to modify completed LMRA (should fail)

#### Projects Collection
- [ ] Verify organization-scoped access
- [ ] Verify project creation respects subscription limits
- [ ] Verify project deletion requires admin role
- [ ] Test: Try to create project beyond subscription limit (should fail)

#### Approvals Collection
- [ ] Verify only assigned approvers can approve/reject
- [ ] Verify approval decisions are immutable once made
- [ ] Verify approval history is append-only
- [ ] Test: Try to approve as non-approver (should fail)

#### Subscriptions Collection
- [ ] Verify only organization admins can read subscription data
- [ ] Verify subscription modifications are server-side only
- [ ] Verify usage counters cannot be manipulated by clients
- [ ] Test: Try to modify subscription as non-admin (should fail)

### 1.2 Storage Security Rules

**File to Review**: [`storage.rules`](storage.rules:1)

#### Current Rules Analysis

✅ **Strengths**:
- Comprehensive helper functions for authentication and authorization
- Proper organization-based access control
- File size limits enforced (5MB-50MB depending on type)
- File type validation (images, PDFs, documents)
- Role-based permissions (admin, safety_manager)
- Immutability for critical files (LMRA photos, reports, exports)
- Default deny for unknown paths

⚠️ **Potential Issues to Verify**:
- [ ] Verify `request.auth.token.orgId` is properly set in custom claims
- [ ] Verify `request.auth.token.role` is properly set in custom claims
- [ ] Test file upload with invalid content type (should fail)
- [ ] Test file upload exceeding size limit (should fail)
- [ ] Test cross-organization file access (should fail)

#### Storage Rules Testing

**Test 1: Organization Branding**
```bash
# Should succeed (admin uploading logo)
# Should fail (non-admin uploading logo)
# Should fail (file > 5MB)
# Should fail (non-image file)
```

**Test 2: TRA Attachments**
```bash
# Should succeed (org member uploading document)
# Should fail (non-org member accessing)
# Should fail (document > 25MB)
# Should fail (executable file)
```

**Test 3: LMRA Photos**
```bash
# Should succeed (field worker uploading photo)
# Should fail (updating existing photo - immutable)
# Should fail (photo > 10MB)
# Should fail (non-image file)
```

**Test 4: Cross-Organization Access**
```bash
# Should fail (user from org A accessing org B's files)
# Should fail (unauthenticated access)
```

---

## Part 2: API Security Audit (1 hour)

### 2.1 Authentication & Authorization

#### API Routes to Audit

**Projects API** - [`web/src/app/api/projects/route.ts`](web/src/app/api/projects/route.ts:1)
- [ ] Verify authentication required for all operations
- [ ] Verify organization ID extracted from auth token
- [ ] Verify subscription limits enforced via `canCreateProject`
- [ ] Verify no SQL injection vulnerabilities
- [ ] Test: Unauthenticated request (should return 401)
- [ ] Test: Create project beyond limit (should return 403)

**TRAs API** - `web/src/app/api/tras/route.ts`
- [ ] Verify authentication required
- [ ] Verify organization-scoped queries
- [ ] Verify role-based permissions for create/update/delete
- [ ] Verify input validation and sanitization
- [ ] Test: Access TRA from different organization (should return 403)

**LMRAs API** - `web/src/app/api/lmras/route.ts`
- [ ] Verify authentication required
- [ ] Verify field workers can create LMRAs
- [ ] Verify stop-work authorization
- [ ] Verify signature validation
- [ ] Test: Modify completed LMRA (should return 403)

**Approvals API** - `web/src/app/api/approvals/route.ts`
- [ ] Verify only assigned approvers can approve/reject
- [ ] Verify approval decisions are logged
- [ ] Verify VCA compliance checked before approval
- [ ] Test: Approve as non-approver (should return 403)

**Notifications API** - [`web/src/app/api/notifications/send/route.ts`](web/src/app/api/notifications/send/route.ts:1)
- [ ] Verify authentication required
- [ ] Verify email type validation
- [ ] Verify rate limiting (prevent email spam)
- [ ] Verify no email injection vulnerabilities
- [ ] Test: Send email with invalid type (should return 400)

**Subscriptions API** - `web/src/app/api/subscriptions/route.ts`
- [ ] Verify admin-only access
- [ ] Verify Stripe webhook signature validation
- [ ] Verify subscription status updates are atomic
- [ ] Test: Modify subscription as non-admin (should return 403)

### 2.2 Input Validation

#### Critical Inputs to Validate

**TRA Creation**
- [ ] Title: Max length, no HTML injection
- [ ] Description: Max length, sanitized HTML
- [ ] Hazards: Valid hazard IDs from library
- [ ] Control measures: Valid hierarchy of controls
- [ ] Risk scores: Within valid ranges (1-15 for Kinney & Wiruth)

**LMRA Execution**
- [ ] GPS coordinates: Valid lat/long ranges
- [ ] Weather data: Valid temperature/wind ranges
- [ ] Team members: Valid user IDs from organization
- [ ] Signatures: Valid base64 image data
- [ ] Stop-work reason: Max length, no injection

**User Registration**
- [ ] Email: Valid email format, not disposable domain
- [ ] Password: Min 8 chars, complexity requirements
- [ ] Name: Max length, no special characters
- [ ] Role: Valid role from enum

### 2.3 Rate Limiting

- [ ] Verify rate limiting on authentication endpoints (prevent brute force)
- [ ] Verify rate limiting on email sending (prevent spam)
- [ ] Verify rate limiting on file uploads (prevent abuse)
- [ ] Verify rate limiting on API calls (prevent DoS)

**Recommended Limits**:
- Authentication: 5 attempts per 15 minutes per IP
- Email sending: 100 emails per hour per organization
- File uploads: 50 uploads per hour per user
- API calls: 1000 requests per hour per user

---

## Part 3: Data Protection & Privacy (45 minutes)

### 3.1 GDPR Compliance

#### Right to Access
- [ ] Verify users can export their personal data
- [ ] Verify export includes all user-related data
- [ ] Verify export format is machine-readable (JSON/CSV)
- [ ] Test: Request data export (should succeed)

#### Right to Erasure
- [ ] Verify users can request account deletion
- [ ] Verify deletion removes all personal data
- [ ] Verify deletion preserves audit logs (anonymized)
- [ ] Verify deletion cascades to related data
- [ ] Test: Delete account (should remove all PII)

#### Right to Rectification
- [ ] Verify users can update their personal information
- [ ] Verify email change requires verification
- [ ] Verify profile updates are logged
- [ ] Test: Update profile (should succeed)

#### Data Minimization
- [ ] Verify only necessary data is collected
- [ ] Verify no excessive logging of personal data
- [ ] Verify analytics data is anonymized
- [ ] Review: All data collection points

#### Consent Management
- [ ] Verify cookie consent banner is displayed
- [ ] Verify analytics opt-out is respected
- [ ] Verify marketing email opt-out is respected
- [ ] Test: Opt-out of analytics (should stop tracking)

### 3.2 Data Encryption

#### Data at Rest
- [ ] Verify Firebase Firestore encryption is enabled (default)
- [ ] Verify Firebase Storage encryption is enabled (default)
- [ ] Verify sensitive fields are encrypted (if applicable)
- [ ] Verify encryption keys are properly managed

#### Data in Transit
- [ ] Verify all API calls use HTTPS
- [ ] Verify TLS 1.2 or higher is enforced
- [ ] Verify no mixed content warnings
- [ ] Test: Try HTTP request (should redirect to HTTPS)

#### Sensitive Data Handling
- [ ] Verify passwords are hashed (Firebase Auth handles this)
- [ ] Verify API keys are not exposed in client code
- [ ] Verify environment variables are not committed to git
- [ ] Verify no sensitive data in logs
- [ ] Review: All `.env` files are in `.gitignore`

---

## Part 4: Dependency Security (30 minutes)

### 4.1 NPM Audit

```bash
# Run in web/ directory
cd web
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high

# Fix vulnerabilities (review changes first)
npm audit fix
```

**Action Items**:
- [ ] Run `npm audit` and review results
- [ ] Fix all critical and high severity vulnerabilities
- [ ] Document any vulnerabilities that cannot be fixed
- [ ] Create plan to update dependencies with breaking changes

### 4.2 Dependency Review

**Critical Dependencies to Review**:
- [ ] `next`: Check for known vulnerabilities
- [ ] `react`: Check for known vulnerabilities
- [ ] `firebase`: Check for known vulnerabilities
- [ ] `stripe`: Check for known vulnerabilities
- [ ] `resend`: Check for known vulnerabilities

**Tools to Use**:
- npm audit
- Snyk (https://snyk.io)
- GitHub Dependabot alerts
- OWASP Dependency-Check

### 4.3 Supply Chain Security

- [ ] Verify all dependencies are from trusted sources (npm registry)
- [ ] Verify no typosquatting packages
- [ ] Verify package lock files are committed
- [ ] Review: All `package-lock.json` files are up to date

---

## Part 5: Infrastructure Security (30 minutes)

### 5.1 Vercel Configuration

**Environment Variables**:
- [ ] Verify all secrets are stored as environment variables
- [ ] Verify no secrets in source code
- [ ] Verify environment variables are scoped to production only
- [ ] Verify sensitive variables are encrypted at rest

**Deployment Settings**:
- [ ] Verify automatic deployments are from protected branches only
- [ ] Verify preview deployments don't use production secrets
- [ ] Verify deployment logs don't expose secrets
- [ ] Review: Vercel project settings

**Domain & SSL**:
- [ ] Verify custom domain is configured
- [ ] Verify SSL certificate is valid and auto-renewing
- [ ] Verify HTTPS is enforced (no HTTP access)
- [ ] Verify HSTS header is set
- [ ] Test: Access via HTTP (should redirect to HTTPS)

### 5.2 Firebase Configuration

**Authentication**:
- [ ] Verify email/password authentication is enabled
- [ ] Verify password policy is enforced (min 8 chars)
- [ ] Verify email verification is required
- [ ] Verify account enumeration protection is enabled
- [ ] Review: Firebase Auth settings

**Firestore**:
- [ ] Verify security rules are deployed
- [ ] Verify backups are enabled
- [ ] Verify point-in-time recovery is enabled
- [ ] Review: Firestore settings

**Storage**:
- [ ] Verify security rules are deployed
- [ ] Verify CORS is properly configured
- [ ] Verify file size limits are enforced
- [ ] Review: Storage settings

---

## Part 6: Application Security (30 minutes)

### 6.1 XSS Prevention

- [ ] Verify all user input is sanitized
- [ ] Verify React's built-in XSS protection is not bypassed
- [ ] Verify no `dangerouslySetInnerHTML` without sanitization
- [ ] Verify Content Security Policy (CSP) headers are set
- [ ] Test: Try to inject `<script>` tag (should be escaped)

**CSP Headers to Set** (in `next.config.ts`):
```typescript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;"
}
```

### 6.2 CSRF Protection

- [ ] Verify Next.js CSRF protection is enabled
- [ ] Verify all state-changing operations use POST/PUT/DELETE
- [ ] Verify no sensitive operations via GET requests
- [ ] Test: Try CSRF attack (should fail)

### 6.3 Clickjacking Prevention

- [ ] Verify X-Frame-Options header is set
- [ ] Verify frame-ancestors CSP directive is set
- [ ] Test: Try to embed app in iframe (should fail)

**Headers to Set** (in `next.config.ts`):
```typescript
{
  key: 'X-Frame-Options',
  value: 'DENY'
}
```

### 6.4 Information Disclosure

- [ ] Verify error messages don't expose sensitive information
- [ ] Verify stack traces are not shown in production
- [ ] Verify API responses don't leak internal details
- [ ] Verify no sensitive data in client-side code
- [ ] Review: All error handling code

---

## Part 7: Monitoring & Incident Response (15 minutes)

### 7.1 Security Monitoring

- [ ] Setup Vercel Analytics for traffic monitoring
- [ ] Setup error tracking (Sentry or similar)
- [ ] Setup Firebase Security Rules monitoring
- [ ] Setup alerts for suspicious activity
- [ ] Document: Monitoring dashboard URLs

**Alerts to Configure**:
- Failed authentication attempts > 10 per minute
- Unusual API traffic patterns
- Storage rule violations
- Firestore rule violations
- High error rates

### 7.2 Incident Response Plan

- [ ] Document security incident response procedures
- [ ] Define roles and responsibilities
- [ ] Create communication plan
- [ ] Define escalation procedures
- [ ] Test: Run tabletop exercise

**Incident Response Steps**:
1. Detect and assess the incident
2. Contain the threat
3. Eradicate the vulnerability
4. Recover systems
5. Post-incident review
6. Update security measures

---

## Part 8: Penetration Testing (Optional - 2 hours)

### 8.1 Automated Scanning

**Tools to Use**:
- OWASP ZAP (https://www.zaproxy.org)
- Burp Suite Community Edition
- Nikto web scanner

**Scans to Run**:
- [ ] Vulnerability scan
- [ ] SQL injection scan
- [ ] XSS scan
- [ ] CSRF scan
- [ ] Authentication bypass scan

### 8.2 Manual Testing

**Test Cases**:
- [ ] Try to access admin functions as regular user
- [ ] Try to access other organization's data
- [ ] Try to bypass subscription limits
- [ ] Try to inject malicious code
- [ ] Try to brute force authentication

---

## Security Audit Report Template

After completing the audit, document findings:

### Executive Summary
- Overall security posture: [Good/Fair/Poor]
- Critical issues found: [Number]
- High priority issues: [Number]
- Medium priority issues: [Number]
- Low priority issues: [Number]

### Critical Issues
1. [Issue description]
   - Severity: Critical
   - Impact: [Description]
   - Recommendation: [Fix]
   - Timeline: Immediate

### High Priority Issues
[List issues]

### Medium Priority Issues
[List issues]

### Low Priority Issues
[List issues]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Next Steps
1. Fix critical issues immediately
2. Schedule fixes for high priority issues
3. Plan for medium/low priority issues
4. Re-audit after fixes

---

## Success Criteria

- [ ] All critical and high severity issues resolved
- [ ] Firebase security rules tested and verified
- [ ] API authentication and authorization verified
- [ ] GDPR compliance verified
- [ ] Data encryption verified
- [ ] No high/critical npm vulnerabilities
- [ ] Infrastructure security verified
- [ ] XSS/CSRF/Clickjacking prevention verified
- [ ] Security monitoring configured
- [ ] Incident response plan documented
- [ ] Security audit report completed

---

## Next Steps

After completing this security audit:

1. ✅ Mark task 6 complete in todo list
2. Fix all critical and high priority issues
3. Document all findings in security audit report
4. Schedule regular security audits (quarterly)
5. Implement continuous security monitoring

---

## Reference Links

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Firebase Security Rules: https://firebase.google.com/docs/rules
- Next.js Security: https://nextjs.org/docs/advanced-features/security-headers
- GDPR Compliance: https://gdpr.eu/
- Vercel Security: https://vercel.com/docs/security
- npm Security: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities

---

**Document Version**: 1.0
**Last Updated**: 2025-11-09 22:28 CET
**Maintained By**: SafeWork Pro Security Team