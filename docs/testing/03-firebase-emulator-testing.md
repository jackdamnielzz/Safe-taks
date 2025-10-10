# Firebase Emulator Testing Guide

Purpose:
This guide explains how to run and maintain tests that use the Firebase Local Emulator Suite for Auth, Firestore and Storage. Use the emulator for both unit tests that need Firebase services and E2E tests that require realistic auth/database interactions.

Prerequisites:
- Firebase CLI installed (firebase-tools)
- Node 18+ and npm
- Project dependencies installed: run `cd web && npm ci`
- Service account credentials are NOT required for emulator runs

Quick start — local emulator
1. From the repository root start the emulator (recommended services: auth, firestore, storage):
   - firebase emulators:start --only auth,firestore,storage
   - See config: [`firebase.json`](firebase.json:1)

2. Alternatively use the project's npm script (if present) from the web folder:
   - cd web && npm run emulators:start
   - Check script definitions in [`web/package.json`](web/package.json:1)

How the repo integrates with the emulator
- Client SDK initialization (auto-detects emulator in development):
  - See [`web/src/lib/firebase.ts`](web/src/lib/firebase.ts:1)
- Admin / test helpers for emulator usage:
  - See [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Tests that rely on the emulator:
  - Unit tests: [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1)
  - E2E: configured in [`docs/testing/02-e2e-testing-guide.md`](docs/testing/02-e2e-testing-guide.md:1)

Starting the emulator in CI
- Run the emulator in background (example for a CI job):
  1. Install firebase-tools
  2. firebase emulators:start --only auth,firestore,storage --project demo-project --export-on-exit=./tmp/emulator-export &

- Ensure CI uses the same emulator versions as local development. Pin firebase-tools in CI or use a Docker image.

Seeding test data
- Two approaches:
  1. Use the Admin SDK against the emulator to create users and seed Firestore collections.
     - Example admin helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
  2. Use REST emulator APIs to import/export data (see Firebase emulator docs).

Resetting emulator state between tests
- Recommended: export/import or call REST endpoints to clear state between test suites.
- For Jest tests, use globalSetup/globalTeardown to start/stop/reset emulator state. See:
  - Jest config: [`web/jest.config.js`](web/jest.config.js:1)
  - Example test file using emulator: [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1)

Auth flows for tests
- Create test users via the Admin SDK pointing at the emulator:
  - Example API: use `admin.auth().createUser(...)` when the Admin SDK is initialized for emulator.
  - Admin SDK helper: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)
- Use customClaims when testing RBAC:
  - Example: `admin.auth().setCustomUserClaims(uid, { role: 'admin', orgId: 'org_123' })`
  - See set-claims route for production logic: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)

Environment variables and ports
- Default emulator ports can be configured in `firebase.json` — inspect file: [`firebase.json`](firebase.json:1)
- The client helpers in this repo detect emulator URIs from environment during dev/testing:
  - [`web/src/lib/firebase.ts`](web/src/lib/firebase.ts:1)

Best practices
- Keep test data deterministic: seed known documents and users before running tests.
- Use small, focused test suites when interacting with the emulator to reduce chance of cross-test contamination.
- Prefer emulator-backed tests for integration points; mock external APIs instead of relying on them.
- Use the emulator's import/export features for reproducible test data snapshots.

Debugging emulator-based tests
- Use the emulator UI: when running `firebase emulators:start` the console indicates a UI URL.
- Logs: emulator stdout/stderr provide useful errors for rules/rejections.
- Security rules: to debug rules failures, run unit tests against the rules emulator harness or use `firebase emulators:exec` with a script that triggers the failing operation.

Troubleshooting common issues
- Authentication failures:
  - Ensure tests point at emulator Auth and not production.
  - Verify test tokens are minted against emulator.
- Firestore permission denies:
  - Confirm `firestore.rules` used during tests matches expected testing rules.
  - Use the rules unit-testing helpers or run rules in the emulator and inspect console logs.
- Port conflicts:
  - Change emulator ports in `firebase.json` or stop conflicting services.

References / Links
- Client SDK helper: [`web/src/lib/firebase.ts`](web/src/lib/firebase.ts:1)
- Emulator helpers: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Example tests: [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1)
- Emulator guide (project-level): [`FIREBASE_EMULATOR_GUIDE.md`](FIREBASE_EMULATOR_GUIDE.md:1)
- Firebase CLI emulator docs: https://firebase.google.com/docs/emulator-suite

Notes / TODO
- Add CI job snippets for our CI provider with explicit emulator start/stop and export/import steps.
- Add example scripts that seed test users and Firestore data before E2E runs.