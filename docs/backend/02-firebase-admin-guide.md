# Firebase Admin SDK Guide

This document explains how the project initializes and uses the Firebase Admin SDK for server-side operations (token verification, custom claims, Firestore admin operations and storage). Only behaviors implemented in the repository are documented here.

Files referenced in this guide:
- Firebase Admin helper: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)
- API routes that use the helpers:
  - [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:1)
  - [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Authentication middleware that relies on admin verify: [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:1)

Initialization strategies (implemented)
- The repository implements three initialization options in [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1):
  1. Service account JSON via environment variable `FIREBASE_SERVICE_ACCOUNT_KEY`. This is the recommended production option.
     - The code parses JSON from `process.env.FIREBASE_SERVICE_ACCOUNT_KEY` and calls `initializeApp({ credential: cert(serviceAccount), ... })`.
     - See [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:32) for the parsing block.
  2. Individual environment variables `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
     - Useful when the service account is stored in CI secrets or platform variables. Private key newlines are normalized with `.replace(/\\n/g, '\n')`.
     - See [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:48).
  3. Default credentials / emulator-friendly fallback.
     - If neither of the above is present the code logs a warning and initializes with only `projectId`. This is intended for local development with the Firebase Emulator Suite.
     - See [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:62).

Practical examples (repo-accurate)
- Production (service account JSON)
  - Provide JSON in env var (CI / hosting secret):
    - FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account", ... }'
  - The helper will call:
    - admin.initializeApp({ credential: cert(serviceAccount), projectId, storageBucket })
  - Example usage (server-side):
    - import { auth } from '@/lib/firebase-admin';
    - const decoded = await auth.verifyIdToken(token);

- Alternative (client email + private key)
  - Set:
    - FIREBASE_CLIENT_EMAIL=...
    - FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  - Code will call cert with these fields.

- Local development (emulator)
  - For tests / local dev you can omit service credentials and run the emulator suite.
  - The helper will initialize with projectId; tests and emulators expect environment variables like `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`.
  - See testing guides for details: [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1)

Key helper functions implemented
- setCustomClaims(uid, claims)
  - Location: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:129)
  - Purpose: set custom claims on a Firebase user; used to store tenant (orgId) and role for RBAC.
  - Usage example:
    - await setCustomClaims('user_123', { orgId: 'org_abc', role: 'admin' });
  - Called by API routes like organization creation and role assignment:
    - Organization creation: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:120)
    - Role assignment: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:37)

- verifyIdToken(token)
  - Location: [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:137)
  - Purpose: Verify and decode Firebase ID tokens for server-side auth.
  - Returns: decoded token object containing uid, email and custom claims (orgId, role).
  - Used by authentication middleware:
    - [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:63) calls `auth.verifyIdToken(token)` directly.

Server-side authentication patterns (how API routes use the helpers)
- Organization creation endpoint (simplified flow)
  - Route: [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:40)
  - Flow:
    1. Extract Bearer token from Authorization header.
    2. Call verifyIdToken(token) to get decoded user.
    3. Create organization document then set user profile and call setCustomClaims(uid, { orgId, role: 'admin' }).
  - The route uses these helpers exactly as implemented; documentation or automation that relies on different flows should be validated against the code.

- Role assignment endpoint (admin-only)
  - Route: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:21)
  - Flow:
    1. Wrapped with requireAuth middleware (see [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:129)) which verifies the token and exposes an AuthContext.
    2. The endpoint checks permissions (canManageUsers) and organization match.
    3. Calls setCustomClaims(targetUserId, { orgId, role }) to persist role and tenant.

Best practices and caveats (per repository behavior)
- Never store raw service account files in source control. Use environment variables or hosting secrets.
- For platforms that strip newline characters from env vars, remember to rehydrate the private key with `.replace(/\\n/g, '\n')`. The code already does this at [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:57).
- When running in serverless environments (Vercel, Cloud Run), the helper avoids double-initialization by checking `getApps().length`.
- Emulators: the fallback initialization (projectId-only) is only suitable for development or CI jobs that run emulators. Do not rely on this for production.
- Custom claims propagation: when you set custom claims via `setCustomUserClaims`, existing client ID tokens are not immediately updated. Clients should re-authenticate or call getIdToken(true) to refresh tokens after claim changes.

Operational notes
- Error handling:
  - verifyIdToken errors are surfaced in [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:94-105). Calls translate common admin errors like `auth/id-token-expired` into higher-level API errors.
  - setCustomClaims errors (for example user not found) are handled in `set-claims` route and return appropriate Errors.* responses.
- Permissions & claims expectations:
  - The app expects tokens to include `orgId` and `role` custom claims. Routes and Firestore rules rely on these values (see security rules docs).
  - If a token lacks these claims, the authentication middleware returns a 403 with a descriptive log (see [`web/src/lib/api/auth.ts`](web/src/lib/api/auth.ts:72)).

Quick reference (commands & env)
- Local emulator environment variables (used in tests):
  - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
  - FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
- Example curl (organization creation) — requires a valid Firebase ID token:
  - curl -X POST https://[TODO-PRODUCTION-URL]/api/organizations -H "Authorization: Bearer <ID_TOKEN>" -H "Content-Type: application/json" -d '{"name":"Acme","slug":"acme"}'
  - The route code is at [`web/src/app/api/organizations/route.ts`](web/src/app/api/organizations/route.ts:40)

Where to update this guide
- If initialization logic changes, update [`docs/backend/02-firebase-admin-guide.md`](docs/backend/02-firebase-admin-guide.md:1) and ensure examples reference the precise lines in [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1).

Status
- This guide documents implemented helpers and patterns found in the codebase. It intentionally omits speculative or unimplemented behaviors. For DB security rules see the companion guide: [`docs/backend/04-security-rules-guide.md`](docs/backend/04-security-rules-guide.md:1).