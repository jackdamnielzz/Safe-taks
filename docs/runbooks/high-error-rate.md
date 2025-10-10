# Runbook: Sustained High Error Rate (Frontend or Backend)

Scope
- This runbook covers sustained spikes in error rates observed in Sentry, logs, or user reports that affect user experience.

Relevant files / endpoints
- Client instrumentation: [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1)
- Server instrumentation: [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1)
- Sentry configuration and issues: project Sentry dashboard
- Top incidents index: [`docs/runbooks/top-5-incidents.md`](docs/runbooks/top-5-incidents.md:1)

Severity classification
- P0: Error rate spike causing a large portion of users to be unable to use core features (e.g., 10%+ error rate sustained across requests).
- P1: Noticeable degradation impacting some flows or large user segments.
- P2: Localized or low-impact errors with limited user reach.

Immediate checks (first 5–10 minutes)
1. Confirm the alert source and timeframe in Sentry or monitoring tool.
2. Identify top error groups in Sentry by event count and frequency.
3. Check release/version tags and see if errors are associated with a recent deployment.
4. Look for correlated signals:
   - Recent deploys (Vercel)
   - Increased latency or infrastructure alerts
   - Firestore/third-party API errors
5. Retrieve sample events and stack traces; capture the first/last occurrence timestamps.

Quick mitigations (10–30 minutes)
- If a release is implicated:
  - Roll back the release in Vercel to the last known-good deployment.
  - Use feature flags to disable the offending functionality.
- If the issue is input-related (malformed requests, data migration):
  - Apply request validation or input sanitization temporarily.
  - Add defensive checks to avoid throwing (catch and return graceful error).
- If third-party API failures:
  - Add retries with exponential backoff and circuit breaker where appropriate.
  - Serve cached data or short-circuit affected features.
- If rate-related:
  - Introduce rate-limiting or queueing for the problematic endpoints.

Investigation (post-mitigation)
1. Deep-dive into top Sentry error groups:
   - Determine the root cause (code bug, unexpected data, infra).
   - Check associated user IDs, org IDs, request payloads, and exact API calls.
2. Reproduce the issue in staging or locally using the same inputs, if possible.
3. Check server logs (Vercel and centralized logs) for related warnings, stack traces, and correlation ids.
4. Identify the minimal code change required for a fix and prepare a patch or hotfix release.

Communication & escalation
- For P0/P1:
  - Page on-call and post status to incident channel with error counts, impact, and mitigation steps.
  - Notify product & engineering leads.
- For P2:
  - Create a ticket and notify the responsible engineer for follow-up.

Post-incident actions
- Create a timeline and append to PROJECT_MEMORY.md with decisions and timestamps.
- Create a postmortem if incident meets criteria (severity / customer impact).
- Add or refine alerts: adjust thresholds, add sampling, or create new Sentry filters to reduce noise but maintain signal.
- Add regression tests or unit tests covering the failure mode.
- Consider adding synthetic tests to detect recurrence.

Checklist (to close the incident)
- [ ] Error rates back to baseline for 30+ minutes
- [ ] Hotfix or rollback verified and deployed (if applied)
- [ ] Relevant Sentry issues triaged and linked to a ticket
- [ ] Incident timeline and RCA added to PROJECT_MEMORY.md
- [ ] Follow-up tasks added to CHECKLIST.md and assigned owners

Author / last update
- Roo (assistant) — 2025-09-30