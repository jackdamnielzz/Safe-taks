# Firestore Security Rules Guide

This document explains the Firestore security rules implemented in the repository and how they relate to the server-side authentication flow and custom claims.

Primary source:
- Firestore rules file: [`firestore.rules`](firestore.rules:1)

Overview
- The rules enforce tenant (organization) isolation and role-based access control (RBAC).
- Auth tokens must include custom claims `orgId` and `role` set by the Firebase Admin helpers (see [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1) and usage in API routes like [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:120) and [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:37)).
- Default deny-all is enforced at the bottom of the rules file to prevent accidental public access.

Key helper functions in the rules (repo-accurate excerpts)
- isAuthenticated()
  - Returns true when `request.auth` is present.
  - Used as a lightweight gate for operations that require signed-in users.
- isOrgMember(orgId)
  - Ensures `request.auth.token.orgId == orgId`.
  - Central to tenant isolation: most reads are allowed if this function returns true.
- isAdmin(orgId)
  - Returns true when the user is an organization member and `request.auth.token.role == 'admin'`.
  - Grants elevated permissions (create/update/delete for administrative resources).
- isSafetyManager(orgId), isSupervisor(orgId)
  - Convenience helpers that allow checking a role hierarchy.
- isOwner(ownerId)
  - Verifies `request.auth.uid == ownerId` for owner-specific permissions.
- isValidUpdate()
  - Prevents tampering of audit fields by requiring createdAt and createdBy to remain unchanged when updating documents.

Collections and notable rules (high-level mapping)
- organizations/{orgId}
  - read: allowed for org members (isOrgMember).
  - create: allowed for authenticated users (first user creates their org).
  - update/delete: only admins (isAdmin).
- organizations/{orgId}/users/{userId}
  - read: org members can read profiles.
  - create/update/delete: admins only.
  - user self-update: owners may update limited fields but cannot elevate their role (enforced by comparing role field).
- organizations/{orgId}/projects/{projectId}
  - read: org members.
  - create/update: supervisors and above (isSupervisor) plus isValidUpdate() for audit integrity.
  - delete: admins only.
- organizations/{orgId}/tras/{traId} and subcollections
  - read: org members.
  - create/update: supervisors and above with audit checks (createdBy, createdAt).
  - approvals: immutable after creation; only create by supervisors allowed.
- Global collections
  - userProfiles/{userId}: read/create/update by owner; delete prevented.
  - invitations/{id}: guarded and mostly created by system/Cloud Functions.

Examples: Common rules patterns (from [`firestore.rules`](firestore.rules:1))
- Tenant check
  - request.auth.token.orgId == orgId
- Role check
  - request.auth.token.role == 'admin'
- Composite check
  - isOrgMember(orgId) && request.auth.token.role in ['admin','safety_manager']

How API flows and rules interact (practical guidance)
- Custom claims are authoritative for rules
  - The backend sets `orgId` and `role` via `setCustomUserClaims(...)` (see [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)).
  - After custom claims change, clients must refresh ID tokens (client: `getIdToken(true)`) to pick up changes; otherwise rules will use stale token claims.
- Server-side operations using the Admin SDK bypass security rules
  - Calls made via [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1) (admin SDK) are executed with admin privileges and are not subject to Firestore rules.
  - Use admin SDK for migrations, seeding, or server-side enforcement.
- Client-side requests must carry a valid ID token (authenticated via Firebase Auth) so that rules can evaluate `request.auth`.

Testing and debugging rules locally
- Use the Firebase Emulator Suite for local validation:
  - Start emulators and run tests that set `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`.
  - The project includes helpers for emulator initialization: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1).
  - Integration test examples are located in [`web/src/__tests__/firebase-emulator.test.ts`](web/src/__tests__/firebase-emulator.test.ts:1).
- When running emulator tests, make sure to create users in the emulator auth and set custom claims (via admin helper or emulator REST API) to simulate real access patterns.

Common pitfalls and mitigations
- Missing claims
  - If tokens lack `orgId` or `role`, server middleware will reject requests with 403 (see [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:71)). Rules relying on these claims will similarly deny access.
- Clock skew and token expiry
  - Rules and middleware may reject expired tokens. Tests should generate fresh tokens and verify expiry handling.
- Audit fields manipulated client-side
  - Rules use `isValidUpdate()` to ensure fields like `createdAt` and `createdBy` are not changed. Server-side endpoints should set audit fields using server timestamps where possible.

How to extend or modify rules safely
1. Update [`firestore.rules`](firestore.rules:1) and keep changes minimal and well-commented.
2. Write emulator tests that exercise the new rules before deploying to production.
3. If adding new roles or claims, update:
   - Admin helpers that set claims: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)
   - Server-side permission checks: [`web/src/lib/api/permissions.ts`](web/src/lib/api/permissions.ts:1)
   - Documentation in this guide and the roles/user manuals.

References
- Companion Admin SDK guide: [`docs/backend/02-firebase-admin-guide.md`](docs/backend/02-firebase-admin-guide.md:1)
- Auth middleware and API usage: [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:1)
- Example routes: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:1), [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Firestore rules source: [`firestore.rules`](firestore.rules:1)

Status
- This guide documents the implemented Firestore rules as present in the repository. If you want I will:
  - Add concrete emulator-based examples that show token creation and access checks, or
  - Produce a matrix mapping roles to allowed operations per collection for inclusion in the admin manuals.