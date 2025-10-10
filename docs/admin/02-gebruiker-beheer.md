# Gebruiker & Rollen Beheer (User & Role Management)

This manual documents how to manage users and roles using the implemented APIs and server-side helpers. All instructions are aligned with the repository code and only describe implemented behavior.

Primary references
- Role assignment API: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Auth middleware and helpers: [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:1)
- Firebase Admin helper (setCustomClaims): [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)
- Permissions helpers: [`web/src/lib/api/permissions.ts`](web/src/lib/api/permissions.ts:1)
- Firestore rules: [`firestore.rules`](firestore.rules:1)

Overview
- Roles implemented in the system:
  - admin
  - safety_manager
  - supervisor
  - field_worker
- Role assignment is performed server-side using the Firebase Admin SDK to set custom claims (orgId and role), plus updating Firestore user profiles.
- The system expects tokens to include `orgId` and `role` custom claims for RBAC enforcement (both in Firestore rules and in API middleware).

Role assignment endpoint (implemented)
- Endpoint: POST /api/auth/set-claims
- Implemented at: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:21)
- Request schema (zod):
  - targetUserId: string (required)
  - organizationId: string (required)
  - role: enum('admin', 'safety_manager', 'supervisor', 'field_worker')

Authorization and checks (repo-accurate)
- The route is wrapped with `requireAuth` middleware (`web/src/lib/api/auth.ts`) which:
  - Verifies the caller's ID token and returns an AuthContext with userId, orgId, role, emailVerified.
  - Returns structured Errors.* responses for invalid tokens.
- Permission check:
  - The route calls `canManageUsers(auth.role)` (implemented as admin-only) from [`web/src/lib/api/permissions.ts`](web/src/lib/api/permissions.ts:160).
  - If caller is not permitted, the route returns Errors.forbidden('manage user roles').
- Organization match:
  - The route ensures `organizationId === auth.orgId` to prevent admins from one org assigning roles in another org.
- Setting custom claims:
  - If checks pass, the route calls `setCustomClaims(targetUserId, { orgId: organizationId, role })` which uses the admin SDK (`web/src/lib/firebase-admin.ts`).
  - The API also returns structured success JSON with userId, organizationId and role.

Client considerations after role change
- Custom claims are not immediately present in existing client ID tokens.
  - Clients should call `getIdToken(true)` to force refresh after role changes or sign out/sign in again.
- When testing via emulator or admin scripts, ensure token refresh is performed on client to observe new permissions.

Example curl (admin assigns role)
- Example payload:
  - {
      "targetUserId": "uid_abc123",
      "organizationId": "org_123",
      "role": "supervisor"
    }
- Example curl:
  - curl -X POST https://[TODO-PRODUCTION-URL]/api/auth/set-claims \
    -H "Authorization: Bearer <ADMIN_ID_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"targetUserId":"uid_abc123","organizationId":"org_123","role":"supervisor"}'
- Expected success response:
  - {
      "success": true,
      "message": "Successfully set role 'supervisor' for user in organization 'org_123'",
      "data": { "userId": "uid_abc123", "organizationId": "org_123", "role": "supervisor" }
    }

Edge cases & error handling (from code)
- Validation errors:
  - If request body fails zod validation, the route returns Errors.validation with details (see route).
- Organization mismatch:
  - If organizationId !== auth.orgId, the route returns Errors.organizationMismatch().
- User not found:
  - If admin SDK returns `auth/user-not-found`, route catches and returns Errors.notFound('User').
- Generic failures:
  - Any other errors return Errors.serverError(new Error('Failed to set user claims')) with logging.

Recommended admin workflows
1. Invite or create the user account (create user via client sign-up or admin process).
2. As admin, call /api/auth/set-claims to assign appropriate role within your organization.
3. Ask the user to refresh token (client: `getIdToken(true)`) to obtain updated claims.
4. Update the Firestore user profile document if needed (some operations also write to `organizations/{orgId}/users/{uid}`).

Testing recommendations
- Use Firebase Emulator Suite for safe testing:
  - Start emulators and create test users in emulator Auth.
  - Use admin helper to set claims in tests or call the set-claims endpoint with an admin token.
  - See tests in the repo for patterns: [`web/src/__tests__/auth-system.test.ts`](web/src/__tests__/auth-system.test.ts:1) and emulator helpers in [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1).

Security notes
- Only admins (canManageUsers) may assign roles. Review [`web/src/lib/api/permissions.ts`](web/src/lib/api/permissions.ts:160) to adjust role policies.
- Changing a user's orgId and role effectively moves them between tenants and modifies their permissions — ensure audit logs capture such changes. The repository reserves an `auditLogs` subcollection intended for system writes (see [`firestore.rules`](firestore.rules:202)).

Where to extend this manual
- Add UI examples for admin panels that call the endpoint.
- Add step-by-step debugging guide for "permission denied" scenarios including token introspection and claim refresh steps.
- Add an audit logging procedure: after role changes, log the change to `organizations/{orgId}/auditLogs/`.

Status
- This manual documents implemented user and role management flows. I will update CHECKLIST.md and PROJECT_MEMORY.md to reflect completion when you confirm, and then proceed to populate admin manuals for data manipulation and backup/restore if you want me to continue.