# Data Manipulatie (Direct Database Operations)

This guide explains how administrators can perform direct data operations against Firestore using the repository's implemented tools and recommended safe practices. It focuses on server-side operations (admin SDK) and how to perform common tasks while respecting security and audit requirements.

Primary references
- Admin SDK helper: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)
- Firestore rules and audit model: [`firestore.rules`](firestore.rules:1), [`docs/backend/03-database-management.md`](docs/backend/03-database-management.md:1)
- Example API routes: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:1)
- Permissions helpers: [`web/src/lib/api/permissions.ts`](web/src/lib/api/permissions.ts:1)

When to use direct database manipulation
- Seeding initial data (libraries: hazards, controlMeasures, traTemplates)
- Emergency fixes (data corruption, urgent corrections)
- Migrations that require transformative changes across many documents
- Creating or repairing audit logs, subscriptions, or billing records that cannot be done via the client UI

Preferred approach
1. Use Admin SDK (server-side) — the codebase provides a reusable initializer:
   - [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:21) exports `db`, `auth`, and `storage` for administrative operations.
   - Admin SDK bypasses Firestore rules — use it for operations that require elevated privileges.
2. Create idempotent scripts:
   - Scripts should be safe to run multiple times without producing duplicate or inconsistent results.
   - Prefer non-destructive updates where possible (e.g., merge updates instead of deletes).
3. Run changes against the emulator first:
   - Start emulators and run the script locally to validate results.
   - Use `firebase emulators:export` to snapshot emulator state before and after a change if needed.

Example seed script pattern (pseudo-code)
- File: scripts/seed/hazards.ts (not yet present in repo — recommended)
- Pattern:
  - import { db } from '@/lib/firebase-admin';
  - const hazards = [ { id: 'haz1', name: 'Falling objects', controls: [...] }, ... ];
  - for each hazard: await db.collection('organizations').doc(orgId).collection('hazards').doc(id).set(hazard, { merge: true });
  - Log results and errors; exit non-zero on failure.

Example migration script pattern (pseudo-code)
- File: migrations/2025-09-30-normalize-user-emails.ts
  - Query affected documents using admin `db`.
  - For each doc, transform fields in-memory and write back using transactions or batched writes.
  - Write an audit record to `organizations/{orgId}/auditLogs/{uuid}` describing the change.
  - Optionally export changed document IDs to a CSV for verification.

Safety and auditability
- Always write an audit log for destructive operations:
  - Use `organizations/{orgId}/auditLogs/{logId}` with fields:
    - id, action (e.g., 'migration:update-user-emails'), performedBy, performedAt, details (old/new).
  - Firestore rules mark auditLogs as system-only for creation in the repository (see `firestore.rules`).
- Prefer to set `createdBy`/`updatedBy` fields to a service account identifier for scripted changes.
- Use batched writes or transactions for multi-document consistency.

Testing and rollback
- Test on emulator and staging before production.
- Create backups:
  - For emulator: `firebase emulators:export <dir>`
  - For production: use Firestore export to GCS (gcloud firestore export)
- Rollback plan:
  - If changes were small, use a revert script that applies the inverse transform.
  - For large changes, restore from the export snapshot into a staging environment and re-apply fixes there to validate.

Common operations mapped to repo helpers
- Set custom claims (users)
  - Use `setCustomClaims(uid, { orgId, role })` from [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129).
  - After setting claims, if testing from client, refresh tokens with `getIdToken(true)`.
- Update user profiles
  - Write to `users/{uid}` or `organizations/{orgId}/users/{uid}` using admin `db`.
- Create or update organization-level libraries
  - Write to `organizations/{orgId}/hazards`, `controlMeasures`, `traTemplates`.

Practical checklist before running a script
- [ ] Review and understand the exact change scope.
- [ ] Run the script in emulator and inspect results.
- [ ] Export emulator snapshot before change (emulator only).
- [ ] Create a production backup if running against production.
- [ ] Run script with reduced batch sizes and monitor progress.
- [ ] Verify results and write audit logs.
- [ ] Communicate with stakeholders after completion.

Where to add scripts in this repo (suggested)
- /scripts/seed/
- /scripts/migrations/
- /scripts/maintenance/
- Add simple README for each script explaining usage and environment variables required.

Status
- This document describes the implemented admin data-manipulation patterns and best practices. If you'd like, I will:
  - Create a sample seed script scaffold under /scripts and a README, or
  - Populate `docs/admin/04-backup-restore-guide.md` next with concrete commands to export/import Firestore and emulator snapshots.