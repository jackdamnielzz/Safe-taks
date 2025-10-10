# Troubleshooting Guide

Purpose
- Short, actionable troubleshooting steps for common production issues.
- Audience: on-call engineers, support, and maintainers.

When to use
- Use this guide as the first reference for common, recurring issues before escalating to runbooks or postmortem.

1 — Quick checklist (first 10 minutes)
- Confirm alert details (source, timeframe, affected endpoints).
- Check health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Check recent deployments on Vercel and the deploy log.
- Inspect Sentry for new error spikes and owner tags.
- Check centralized logs (Vercel logs / Cloud Logging) for correlation ids.
- If relevant, run smoke curl checks:
  - curl -sSf -m 10 https://[TODO-PRODUCTION-URL]/api/health | jq

2 — Common issues & quick fixes
- High error rate (5xx)
  - Immediate: identify top error groups in Sentry; look for a recent release tag.
  - Mitigation: toggle feature-flag, scale or throttle, or roll back the last deploy.
  - Follow-up: create incident timeline and add to `PROJECT_MEMORY.md`.

- Authentication / claims failures
  - Immediate: verify Auth provider status and token payloads.
  - Check set-claims endpoint logs: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
  - Mitigation: re-issue tokens where possible; apply hotfix to claim-setting script.

- Firestore permission-denied
  - Check `firestore.rules` and recent rules deploy.
  - Verify service account IAM and quota in GCP console.
  - Use emulator to reproduce locally: see [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1)

- Missing environment variables / build failures
  - Check Vercel environment variables for the target environment.
  - Re-run CI build logs and check for truncated private keys (newline issues).
  - For private key envs, rehydrate newlines with `.replace(/\\n/g, '\n')` in server init (see [`web/src/lib/firebase-admin.ts`](web/src/lib/firebase-admin.ts:1)).

- Storage / upload errors
  - Confirm bucket permissions and storage rules: [`docs/backend/04-security-rules-guide.md`](docs/backend/04-security-rules-guide.md:1)
  - Check quota and billing in GCP; consider temporary throttling.

3 — Runbook links (when to escalate to runbook)
- Health endpoint unhealthy: [`docs/runbooks/health-endpoint-unhealthy.md`](docs/runbooks/health-endpoint-unhealthy.md:1)
- High error rate: [`docs/runbooks/high-error-rate.md`](docs/runbooks/high-error-rate.md:1)
- Firestore permission errors: [`docs/runbooks/firestore-permission-errors.md`](docs/runbooks/firestore-permission-errors.md:1)
- Top incidents index: [`docs/runbooks/top-5-incidents.md`](docs/runbooks/top-5-incidents.md:1)

4 — Communication & escalation
- For P0 incidents: page on-call (PagerDuty) and notify owners in Slack #incident.
- Post an incident summary to the incident channel with impact, actions, and owners.
- Record timeline and decisions immediately in `PROJECT_MEMORY.md` (include timestamps, Git SHAs, and CI run ids).

5 — Post-incident actions
- Create a postmortem if severity threshold met.
- Add mitigation items to `CHECKLIST.md` with owners and due dates.
- Adjust alerts to reduce noise and improve signal (Sentry or uptime thresholds).
- Add missing telemetry or logging for gaps discovered during investigation.

6 — Tools & commands
- Health check:
  - curl -sSf -m 10 https://[TODO-PRODUCTION-URL]/api/health | jq
- Export emulator data:
  - firebase emulators:export ./emulator-backups/latest --project=$FIREBASE_PROJECT
- Deploy rules / indexes:
  - firebase deploy --only firestore:rules,firestore:indexes --project=YOUR_PROJECT_ID

7 — Appendix & references
- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Instrumentation: [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1), [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1)
- Monitoring guide: [`docs/deployment/02-monitoring-guide.md`](docs/deployment/02-monitoring-guide.md:1)
- Runbooks: see `docs/runbooks/`

Author / Last update
- Roo (assistant) — 2025-09-30