# Resend Email Configuration & Central Notification Stack

This document describes the finalized Resend integration and centralized notification architecture for SafeWork Pro.

Authoritative components:

- [`web/src/lib/notifications/resend-client.ts`](web/src/lib/notifications/resend-client.ts:1)
- [`web/src/lib/notifications/email-templates.ts`](web/src/lib/notifications/email-templates.ts:1)
- [`web/src/lib/notifications/notification-service.ts`](web/src/lib/notifications/notification-service.ts:1)
- [`web/src/app/api/notifications/send/route.ts`](web/src/app/api/notifications/send/route.ts:1)
- [`web/src/lib/notificationService.ts`](web/src/lib/notificationService.ts:1) (client-side notifications; now wired into central email stack)

## 1. Environment variables

All secrets and sender metadata are provided via environment variables. No API keys or sender details are hardcoded.

Required:

- `RESEND_API_KEY` — Resend API key (project/production specific)
- `RESEND_FROM_EMAIL` — From address, e.g. `noreply@maasiso.nl`
- `RESEND_FROM_NAME` — Display name, e.g. `SafeWork Pro`

Recommended local setup:

```bash
# web/.env.local (not committed)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@maasiso.nl
RESEND_FROM_NAME=SafeWork Pro
```

In Vercel/production, configure these as Project Environment Variables.

## 2. Resend client

[`web/src/lib/notifications/resend-client.ts`](web/src/lib/notifications/resend-client.ts:1):

- Initializes `Resend` using `process.env.RESEND_API_KEY`.
- Uses `RESEND_FROM_EMAIL` and `RESEND_FROM_NAME` for the `from` header.
- Exposes:
  - `sendEmail(options)` — single email
  - `sendBatchEmails(emails)` — batch sending
  - `verifyEmail(email)` — basic format validation

Behavior:

- If `RESEND_API_KEY` is missing:
  - Logs a warning.
  - Returns `{ success: false, error: "Resend API key not configured" }`.
- No direct API key usage outside this module.

## 3. Email templates

[`web/src/lib/notifications/email-templates.ts`](web/src/lib/notifications/email-templates.ts:1):

- Central registry for all email layouts and copy.
- Driven by `EmailType` from [`resend-client.ts`](web/src/lib/notifications/resend-client.ts:24).
- Returns `{ subject, html, text }` for each supported type.
- Uses `NEXT_PUBLIC_APP_URL` for application links (no secrets).

All new product emails must:
- Add an `EmailType` constant.
- Implement a corresponding template function in this file.
- Use via the central notification-service or `/api/notifications/send`.

## 4. Notification service (server-side email orchestration)

[`web/src/lib/notifications/notification-service.ts`](web/src/lib/notifications/notification-service.ts:1):

- High-level wrappers for core scenarios (TRA approvals, LMRA alerts, password reset, billing, etc.).
- Each helper:
  - Calls `getEmailTemplate(EmailType, data)`.
  - Calls `sendEmail({ to, subject, html, text, tags })`.
  - Adds standardized tags:
    - `app: safework-pro`
    - `type: ...`
    - Optional `priority` for critical flows (e.g. LMRA stop work).

All server and API code must use these helpers instead of talking to Resend directly.

## 5. API route: /api/notifications/send

[`web/src/app/api/notifications/send/route.ts`](web/src/app/api/notifications/send/route.ts:1):

- Single HTTP entrypoint for sending templated emails.

Contract (POST):

```json
{
  "type": "one-of-EmailType",
  "to": "string | string[]",
  "data": { "...": "template specific" },
  "userId": "optional - for tagging/audit"
}
```

Behavior:

1. Validates `type` and `to`.
2. Ensures `type` is a recognized `EmailType`.
3. Resolves template via `getEmailTemplate`.
4. Sends via `sendEmail` (Resend client).
5. Returns:
   - `200` with `{ success: true, messageId }` on success.
   - `4xx/5xx` with `{ error }` on validation or send errors.

This route is the only approved HTTP surface for sending emails from the app.

## 6. Legacy migration

### 6.1. Legacy /api/notifications/email

All legacy references to `/api/notifications/email` are removed or migrated.

Verification:

- `search_files` confirms 0 remaining `/api/notifications/email` call sites under `web/src/*.ts*`.

### 6.2. Client notification service integration

[`web/src/lib/notificationService.ts`](web/src/lib/notificationService.ts:1):

- Continues to own:
  - Push subscription and local notifications.
  - LMRA stop-work alerts.
  - Approval request/decision notifications.
- Email paths are now wired to the central stack:

1. Stop-work emails

   - Uses `/api/notifications/send` with `type: "lmra_stop_work"`.
   - Template: `EmailType.LMRA_STOP_WORK` via [`email-templates.ts`](web/src/lib/notifications/email-templates.ts:326).
   - Data includes:
     - `projectName`
     - `location`
     - `reason`
     - `executorName`
     - `lmraLink`
   - Fields are resolved defensively from `StopWorkAlert` via type-safe/`as any` access without introducing new hard dependencies on internal shapes.

2. Approval emails (request/approved/rejected)

   - Uses `/api/notifications/send` instead of `/api/notifications/email`.
   - Maps:
     - `"request"` → `"tra_approval_request"` (`EmailType.TRA_APPROVAL_REQUEST`)
     - `"approved"` → `"tra_approved"` (`EmailType.TRA_APPROVED`)
     - `"rejected"` → `"tra_rejected"` (`EmailType.TRA_REJECTED`)
   - Payload assembled from `ApprovalRequest` with safe fallbacks:
     - `traTitle`
     - `creatorName`
     - `approverName`
     - `projectName`
     - `reason`
     - `approvalLink`
     - `traLink`

No Resend or sender configuration is duplicated here; everything flows through `/api/notifications/send` + Resend client.

## 7. Implementation checklist (for auditing)

- [x] Resend client reads `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` from env.
- [x] No plain-text Resend keys in repo.
- [x] `/api/notifications/send` robustly validates `type` and `to`.
- [x] All new email flows use:
  - `notification-service.ts`
  - `email-templates.ts`
  - `resend-client.ts`
  - `/api/notifications/send`
- [x] Legacy `/api/notifications/email` call sites removed / migrated.
- [ ] Jest tests for notifications confirm behavior (add or extend when needed).
- [ ] Docs synced:
  - `/memory-bank/activeContext.md`
  - `/project-docs/04-IMPLEMENTATION-STATUS.md`
  - `/memory-bank/progress.md`

This guide is the canonical reference for configuring and using Resend + the central notification service in this project.