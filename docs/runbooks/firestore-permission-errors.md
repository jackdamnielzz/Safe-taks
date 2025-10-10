# Runbook: Firestore Permission Errors / Quota Issues

Scope
- This runbook covers runtime Firestore permission-denied errors, rules-related denials, and quota or billing-related failures affecting reads/writes.

Relevant files / links
- Firestore rules: [`firestore.rules`](firestore.rules:1)
- Database management guide: [`docs/backend/03-database-management.md`](docs/backend/03-database-management.md:1)
- Firebase Admin helper (server): [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)
- Auth claims setter endpoint (for troubleshooting roles/claims): [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Top incidents index: [`docs/runbooks/top-5-incidents.md`](docs/runbooks/top-5-incidents.md:1)

Severity classification
- P0: Platform-level outage caused by quota exhaustion or billing suspension preventing all reads/writes.
- P1: Widespread permission denials after a rules change or bug impacting many users.
- P2: Isolated permission errors for specific requests or edge cases.

Immediate checks (first 5–10 minutes)
1. Confirm error details
   - Check Sentry and logs for "permission-denied" or Firestore quota/billing error messages. Capture sample request payloads, uids, and timestamps.
2. Check Firestore usage / quotas
   - Firebase Console → Database → Usage & billing metrics. Look for spikes in reads/writes or rejected requests.
3. Verify recent rule deployments
   - Check git history / deployment logs for recent changes to `firestore.rules`.
4. Reproduce the failing request
   - Using the same user context (token/claims) reproduce the request in staging or locally with the emulator.
   - Use emulator to validate rules without affecting prod.
5. Verify custom claims / user roles
   - Check tokens and custom claims for affected uids. Use the custom claims endpoint logs: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)

Quick mitigations (10–30 minutes)
- If rules regression after deployment:
  - Roll back the rules to previous stable version and re-deploy.
  - If rollback isn't immediate, create a narrow temporary rule exception for a safe subset to restore service while preserving security.
- If quota/billing issue:
  - Check billing status in Google Cloud Console. If billing suspended, follow billing flow to restore (owner/admin privileges required).
  - If quota exhausted, apply throttling on clients, pause background jobs or bulk imports, and contact GCP support or raise quota increase request.
- If custom claims are incorrect:
  - Re-issue correct claims for affected users using admin API and log changes.
  - For bulk issues, run a controlled fix script from `web/src/lib/firebase-admin.ts` with caution and dry-run first.
- If isolated data causing rule rejection:
  - Sanitize or migrate offending documents (use server-side migration with admin SDK) rather than weakening rules.

Investigation (post-mitigation)
1. Collect evidence
   - Save Sentry events, Firestore logs, and example requests to the incident record.
2. Reproduce in emulator/staging
   - Run exact queries/operations under same auth claims to reproduce rule evaluation path.
3. Audit rules
   - Perform a targeted review of `firestore.rules` for unintended allow conditions or missing checks.
4. Check recent deploys and related PRs
   - Identify PRs that touched rules or auth/claims logic and review their change sets.

Communication & escalation
- For P0:
  - Page on-call immediately, notify product and security/ops leads, and open an incident channel.
  - Provide impact (percentage of requests failing, affected user groups).
- For P1:
  - Notify engineering owners for the rules and backend teams; create a hotfix ticket.
- Include remediation steps and ETA in status updates.

Post-incident actions
- Document timeline and decisions in PROJECT_MEMORY.md.
- Create a postmortem if impact criteria are met.
- Add regression/unit tests for the failing rule paths using the Firebase Rules Unit Testing library.
- Add an automated smoke test that exercises critical read/write paths after rule changes.
- Consider gating rules deployments (e.g., deploy to staging + run smoke rules test before prod).

Checklist (to close the incident)
- [ ] Affected requests succeed and error rate back to baseline for 30+ minutes
- [ ] Rules rollback or hotfix deployed and verified
- [ ] Billing/quota issues resolved with confirmation from GCP console
- [ ] Incident timeline and RCA added to PROJECT_MEMORY.md
- [ ] Follow-up tasks (tests, gating, monitoring) added to CHECKLIST.md

Author / last update
- Roo (assistant) — 2025-09-30