# Organisatie Beheer (Organization Management)

This guide documents how organizations are created and managed in the application using implemented APIs and server-side helpers. It is intentionally aligned with the repository code and only describes implemented behavior.

Relevant code references
- Organization API route: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:1)
- Firebase Admin helper (set custom claims): [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)
- Auth middleware: [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:1)
- Firestore data model and rules: [`firestore.rules`](firestore.rules:1), [`docs/backend/03-database-management.md`](docs/backend/03-database-management.md:1)

Overview: organization creation flow (implemented)
1. Preconditions
   - A user must have an authenticated Firebase ID token (client-side).
   - The user may be newly signed up and not yet assigned to an organization.
2. Endpoint
   - POST /api/organizations
   - Implemented at: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:40)
3. Request structure
   - Headers:
     - Authorization: Bearer <FIREBASE_ID_TOKEN>
     - Content-Type: application/json
   - Body (example):
     {
       "name": "Acme Ltd",
       "slug": "acme",
       "settings": {
         "industry": "construction",
         "complianceFramework": "vca",
         "timeZone": "Europe/Amsterdam",
         "language": "nl"
       }
     }
   - Validation: handled by zod schema in the route (`createOrganizationSchema`).

What the route does (step-by-step)
1. Extracts and validates the request body.
2. Reads the Authorization header, verifies the Bearer token using `verifyIdToken(token)` imported from [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:137).
3. Ensures the token contains a valid email (decoded token must include email).
4. Checks uniqueness of the organization slug by querying `organizations` collection.
5. Verifies the user does not already belong to an organization (reads `users/{uid}`).
6. Creates a new organization document with a generated UUID (crypto.randomUUID()) and default subscription settings.
   - Document fields: id, name, slug, settings, subscription, createdAt, createdBy.
7. Writes/updates the user's profile document at `users/{uid}` with:
   - organizationId, role: 'admin', joinedAt, lastLoginAt, profileComplete: true.
8. Sets custom claims on the user via `setCustomClaims(uid, { orgId: organizationId, role: 'admin' })` so subsequent client tokens and Firestore rules reflect tenant membership and role.
9. Returns a JSON response containing organization summary and updated user info.

Notes and caveats (repo-accurate)
- Token verification
  - The route verifies raw ID token from Authorization header with `verifyIdToken` (server-side).
  - The repository also provides `requireAuth` middleware (`web/src/lib/api/auth.ts`) that API routes can use. Organization creation uses direct verification to allow simplified "first user creates org" flow.
- First user becomes admin
  - The route sets the newly created organization's initial user to role 'admin' both in Firestore user profile and via custom claims.
- Client token refresh
  - After server-side setCustomClaims, clients must refresh their ID token (`getIdToken(true)`) to pick up new custom claims.
- Error handling
  - The route returns structured Errors.* responses for validation, already-exists, token expiry (`auth/id-token-expired`), or server errors (see code).
- Auditability
  - createdAt/createdBy fields are set server-side and protected by Firestore rules (`firestore.rules`) to prevent tampering.

Example curl (requires a real Firebase ID token for a user not yet in an organization)
- curl example:
  - curl -X POST https://[TODO-PRODUCTION-URL]/api/organizations \
    -H "Authorization: Bearer <ID_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Acme Ltd","slug":"acme"}'
- Response (success):
  - {
      "success": true,
      "message": "Organization created successfully",
      "data": {
        "organization": { "id": "...", "name":"Acme Ltd", "slug":"acme", ... },
        "user": { "organizationId": "...", "role": "admin" }
      }
    }

Inviting users to an organization (implemented patterns)
- The route provides validation schemas for invite payloads (email, role, firstName, lastName) and the code contains invite flow structures. However, invitation creation and email delivery may rely on other system components (Cloud Functions or SMTP) that are not fully implemented in the repository — consult the admin manuals and invitation docs when available.

Recommended admin workflows
1. Create organization via client or API as first step for a new company.
2. Invite additional users:
   - Use invite flows (when implemented) or create accounts via admin panel and then use the Role Assignment endpoint (`/api/auth/set-claims`) to assign roles.
3. Audit and monitor:
   - Use auditLogs subcollection for system-side logs; these are intended to be written by backend functions and read by admins (see rules).
4. Backups and rollback:
   - Export Firestore snapshots using Firebase export commands and test restore in staging before production restores.

Where to look next in the repo
- Role assignment: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Security rules and tenant isolation: [`firestore.rules`](firestore.rules:1), [`docs/backend/04-security-rules-guide.md`](docs/backend/04-security-rules-guide.md:1)
- Admin user management guide: docs/admin/02-gebruiker-beheer.md (I will populate this next if you confirm)

Status
- This manual documents implemented organization creation and management behavior. If you want, I will now populate the user/role management manual (`docs/admin/02-gebruiker-beheer.md`) with repo-accurate examples and role assignment steps.