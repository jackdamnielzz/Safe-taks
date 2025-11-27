# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Non-obvious, project-specific rules (only):

1. Always treat `web/` as the authoritative app for tests and builds:
   - Run Jest from `web/` using the existing `jest.config.js` + `jest.setup.js` stack; these files define critical mocks (Firebase, next-intl, analytics, location, etc.) that tests rely on.
   - Never recreate ad-hoc mocks for Firebase/Next/i18n if an equivalent exists under `web/src/__mocks__` or `web/__mocks__`; re-use those.

2. VCA and compliance:
   - All VCA checks MUST go through [`web/src/lib/vca-compliance.ts`](web/src/lib/vca-compliance.ts:1) (public wrapper).
   - Do NOT couple to internals of [`web/src/lib/compliance/vca-validator.ts`](web/src/lib/compliance/vca-validator.ts:1); tests and UIs must assert only on wrapper fields: `score`, `isCompliant`, `level`, `issues`, `recommendations`, `checkedAt`.

3. TRA hazards, risk, and controls:
   - Hazard/control structure is canonical in [`web/src/lib/types/tra.ts`](web/src/lib/types/tra.ts:145); follow it exactly.
   - UI integration MUST use [`web/src/components/tra/TraHazardWithRisk.tsx`](web/src/components/tra/TraHazardWithRisk.tsx:30), which normalizes `controlMeasures` arrays and risk fields. Do not bypass this with custom shapes that break VCA or reporting.

4. LMRA 8-step workflow:
   - The single source of truth is [`web/src/lib/types/lmra.ts`](web/src/lib/types/lmra.ts:1) + [`web/src/components/lmra/LMRAWizard.tsx`](web/src/components/lmra/LMRAWizard.tsx:1).
   - When changing LMRA logic, update both contract and wizard together; do not introduce alternate step flows.

5. Location and GPS:
   - Use [`web/src/lib/locationService.ts`](web/src/lib/locationService.ts:50) and `useLocationVerification` hooks; do not call `navigator.geolocation` directly in new code.
   - Respect its consent + caching contract; tests are strict about error codes and consent behavior.

6. Subscription and feature limits:
   - Centralize all subscription logic via:
     - [`web/src/lib/payments/feature-gates.tsx`](web/src/lib/payments/feature-gates.tsx:1) (client hooks + `canCreateProject/TRA/AddUser`, `isSubscriptionActiveStatus`).
     - [`web/src/lib/payments/subscription-manager.ts`](web/src/lib/payments/subscription-manager.ts:94) for Stripe/limits.
   - API routes and server components must use these helpers instead of hand-rolled tier/status checks.

7. Notifications and email:
   - All product emails must go through:
     - [`web/src/lib/notifications/notification-service.ts`](web/src/lib/notifications/notification-service.ts:1) + [`web/src/lib/notifications/email-templates.ts`](web/src/lib/notifications/email-templates.ts:10).
     - [`web/src/lib/notifications/resend-client.ts`](web/src/lib/notifications/resend-client.ts:1) or `sendgrid-client.ts` as the only transport layers.
   - Do NOT call Resend or SendGrid directly from features; use the service + templates so tags and audit behavior stay consistent.

8. Testing gotchas:
   - Jest environment is heavily customized in [`web/jest.setup.js`](web/jest.setup.js:1); importing order and global mocks matter.
   - When adding tests, import modules after relevant `jest.mock` calls (see [`web/src/__tests__/analytics-service.test.ts`](web/src/__tests__/analytics-service.test.ts:1) as pattern).
   - For anything touching Firestore/Auth/Firebase, prefer existing in-memory mocks in `web/src/__mocks__` instead of new ones.

9. VCA/TRA/LMRA coupling:
   - Any change in hazards, controls, or LMRA step structure must be checked against:
     - VCA wrapper usage,
     - TRA validation in [`web/src/lib/api/tras.ts`](web/src/lib/api/tras.ts:558),
     - LMRA completion rules in `lmra.ts`.
   - Breaking this triangle is the fastest way to introduce subtle production bugs.

Use this file as the minimal, enforced rule set. If a change conflicts with these constraints, update the relevant canonical module and this file together.