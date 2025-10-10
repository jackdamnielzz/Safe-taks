# Firestore Database Management

This guide documents the Firestore data model, indexes, seeding, migrations and maintenance workflows as implemented in this repository. All instructions reference implemented code and repo artifacts.

Primary references (repo-accurate)
- Firestore rules: [`firestore.rules`](firestore.rules:1)
- Admin helpers (server-side): [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)
- Client Firestore initialization: [`web/src/lib/firebase.ts`](web/src/lib/firebase.ts:1)
- Example API usage: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:1)
- Indexes: [`firestore.indexes.json`](firestore.indexes.json:1)
- Tests that exercise DB flows: [`web/src/__tests__/auth-system.test.ts`](web/src/__tests__/auth-system.test.ts:1), [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1)

1 — Data model overview (implemented collections)
- organizations (top-level)
  - Document id: generated UUID (see organization creation: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:84))
  - Fields: id, name, slug, settings, subscription, createdAt, createdBy
  - Subcollections:
    - users — organization-scoped user profiles (see security rules: [`firestore.rules`](firestore.rules:54))
    - projects — organization projects
    - tras — TRAs (task risk assessments) and subcollections (comments, approvals)
    - lmraSessions — LMRA session records
    - hazards, controlMeasures, traTemplates, auditLogs, billingEvents
- users (top-level / per-project uses)
  - Global userProfiles collection exists for owner-scoped metadata: [`firestore.rules`](firestore.rules:236)
  - Organization user documents are stored under organizations/{orgId}/users/{userId} and mirrored/managed by server endpoints
- Other global collections
  - invitations — invite tokens and onboarding flow
  - audit and billing subcollections are organization-scoped (read-only for most users)

2 — Document shapes and audit fields (conventions)
- Audit fields used across collections:
  - createdAt — timestamp when resource created (rules enforce equality on updates)
  - createdBy — uid of the creator
  - updatedAt — timestamp for last update (set on update)
  - For many create/update operations, rules require createdAt/createdBy to be immutable using isValidUpdate() in [`firestore.rules`](firestore.rules:44)
- Example user profile (organization users):
  - uid, email, organizationId, role, joinedAt, lastLoginAt, profileComplete, createdAt
  - First user becomes admin at organization creation (see [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:107))

3 — Indexes
- Project includes index definitions at the repo root: [`firestore.indexes.json`](firestore.indexes.json:1)
- Before deploying complex queries to production, verify required composite indexes are in `firestore.indexes.json` and deploy them with `firebase deploy --only firestore:indexes` or via the Firebase Console.
- Use emulator for local query/index testing.

4 — Seeding and migrations (recommended, implemented helpers)
- Admin SDK usage for server-side writes
  - Use [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1) to run seed scripts with admin privileges (admin SDK bypasses security rules).
  - Example pattern (not included as an automated script in repo): create a Node script that imports the admin helper and writes documents to `organizations/{orgId}/...`.
- Recommended seeding steps
  1. Start Firebase emulators for Firestore and Auth (see testing guide: [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1)).
  2. Use admin helper to create organizations and users, then set custom claims via `setCustomClaims(uid, { orgId, role })` (see [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)).
  3. Populate library collections (hazards, controlMeasures, traTemplates) using admin writes.
- Migration strategy
  - Prefer idempotent scripts that:
    - Back up affected documents (export minimal JSON)
    - Apply transformations using admin SDK
    - Verify with emulator tests
  - Keep migration scripts under a dedicated folder (suggestion) and run them from CI with a maintenance window. This repo does not yet include automated migration tooling — use admin SDK scripts.

5 — Backups & exports
- For production backups, use `gcloud` / Firebase managed exports:
  - firestore export: gcloud firestore export gs://<bucket>/backups/<timestamp> (requires GCP permissions)
- Emulator exports for local snapshots
  - Use `firebase emulators:export <dir>` to snapshot emulator state. See emulator docs and the project's testing guides (`docs/testing/03-firebase-emulator-testing.md`:1).
- Restore strategy
  - For emulator: `firebase emulators:start --import=<dir>`
  - For production restores, follow Firebase managed import/export documentation and validate in a staging environment first.

6 — Running locally with emulator (repo-specific)
- Environment variables used by tests:
  - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
  - FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
- Project helpers:
  - Client emulator helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
  - Tests that exercise emulator flows:
    - [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1)
- Typical workflow:
  1. Start emulators: npm run emulators:dev (see project README or scripts in `web/package.json`)
  2. Run seed script using admin SDK (if available) or create test users in emulator auth UI / REST API
  3. Run Jest or Cypress tests pointing to the emulator

7 — Maintenance and operational guidance
- Avoid client-side writes that attempt to elevate roles or modify audit fields — rules prevent these.
- When changing rules:
  1. Update `firestore.rules`
  2. Run emulator tests that exercise expected reads/writes
  3. Deploy to production when confident
- Monitor unusual deletions/updates via audit logs (auditLogs subcollection is designed to be write-only for system processes — see [`firestore.rules`](firestore.rules:202)).

8 — Troubleshooting common issues
- Permission denied errors
  - Check that client ID tokens include `orgId` and `role` custom claims (server must set them via admin: `setCustomClaims`).
  - Ensure client refreshed their ID token after claim changes with `getIdToken(true)`.
- "Missing index" errors
  - Add composite index to `firestore.indexes.json` and deploy, or run query in emulator to reproduce.
- Emulators not connecting
  - Verify `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` are set; refer to [`web/src/lib/firebase.ts`](web/src/lib/firebase.ts:28) and emulator helper [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1).

9 — Next steps / suggested improvements
- Add a `scripts/db/seed.ts` using the admin helper for reproducible local seeding.
- Add a `migrations/` folder with versioned migration scripts and a simple runner that logs progress and backs up changed documents.
- Add CI jobs to run emulator-based integration tests when database-related PRs change.

References and related docs
- Firestore security rules: [`firestore.rules`](firestore.rules:1)
- Firebase Admin helper (setCustomClaims, verifyIdToken): [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)
- Emulator testing: [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1)
- Organization API: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:40)