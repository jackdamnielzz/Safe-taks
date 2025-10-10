# Authentication Testing Guide

Purpose:
Document how to test authentication flows (registration, login, email verification, password reset, and RBAC) in this repository using unit tests, emulator-backed integration tests, and E2E tests.

Relevant files and tests
- Unit tests: [`web/src/__tests__/auth-system.test.ts`](web/src/__tests__/auth-system.test.ts:1)
- Auth-related pages/components:
  - [`web/src/app/auth/register/page.tsx`](web/src/app/auth/register/page.tsx:1)
  - [`web/src/app/auth/login/page.tsx`](web/src/app/auth/login/page.tsx:1)
  - [`web/src/app/auth/verify-email/page.tsx`](web/src/app/auth/verify-email/page.tsx:1)
  - [`web/src/components/AuthProvider.tsx`](web/src/components/AuthProvider.tsx:1)
- Admin API for setting claims: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Firebase Admin helpers: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)

Prerequisites
- Firebase emulators running for Auth and Firestore where tests require it (see [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1))
- Node 18+ and npm
- Dependencies installed: cd web && npm ci

Testing strategies
1. Unit tests (Jest)
   - Test local logic (form validation, component behavior) without Firebase dependencies using mocks.
   - Example: mock Firebase client SDK in tests with jest.mock and assert component behavior (see `web/__mocks__/fileMock.js` and jest.setup.js for patterns).
   - Run: cd web && npm run test

2. Integration tests (emulator-backed)
   - Use the Firebase emulator to test flows that require real Auth operations (create user, set custom claims, email verification emulation).
   - Seed users via Admin SDK against emulator, then run integration test suites that verify user creation and claim setting.
   - Example steps:
     1. Start emulator: firebase emulators:start --only auth,firestore
     2. Seed user via admin helper: call script that uses `web/src/lib/firebase-admin.ts` configured for emulator
     3. Run Jest integration tests: cd web && npm run test:integration (or use jest with a specific test regex)

3. E2E tests (Cypress)
   - Use Cypress tests that either:
     - Interact with the emulator directly (recommended), or
     - Use test-only API endpoints to create sessions
   - For session-based tests, create a test session token or use emulator-created user and sign-in via API or the UI.
   - Run: cd web && npm run cypress:run

Concrete examples
- Creating a test user via Admin SDK (emulator):
  - Use `admin.auth().createUser({ email, password })` then `admin.auth().setCustomUserClaims(uid, { role, orgId })`
  - Example helper file: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)

- Testing RBAC:
  - Unit test role-checking utilities with mocked tokens (`web/src/lib/api/permissions.ts`).
  - Integration test: seed user with claim role 'supervisor', call API routes and assert access allowed/denied based on role.

Best practices
- Keep tests deterministic: seed exact data; tear down or reset emulator state between tests.
- Mock external network requests; keep auth-related tests focused on Firebase flows only.
- For CI, ensure emulator versions match and seed data is consistent.

CI considerations
- Use job steps to:
  1. Start emulator in background with export/import paths
  2. Seed test users and data
  3. Run Jest integration tests and Cypress E2E tests
  4. Collect test artifacts (screenshots, videos, jest coverage)

Troubleshooting
- Email verification flows:
  - When using emulator, simulate verification by updating the user's emailVerified property via Admin SDK.
- Token/claim propagation:
  - After setting custom claims, force token refresh in test clients or re-authenticate; admin setCustomUserClaims doesn't update existing ID tokens.
- Flaky tests:
  - Add retries for network-dependent steps and ensure deterministic seed data.

References
- Unit tests: [`docs/testing/01-unit-testing-guide.md`](docs/testing/01-unit-testing-guide.md:1)
- E2E guide: [`docs/testing/02-e2e-testing-guide.md`](docs/testing/02-e2e-testing-guide.md:1)
- Emulator guide: [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1)

Notes / TODO
- Add example scripts to seed users and Firestore data for CI and local dev.
- Add sample Jest integration configuration (globalSetup/globalTeardown) that starts/stops emulators.