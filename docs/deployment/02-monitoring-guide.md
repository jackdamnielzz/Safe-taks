# Monitoring Guide

Purpose
- This guide describes how to observe, alert and respond to production issues for the SafeWork Pro application.
- Coverage: error tracking (Sentry), performance and RUM (Vercel Analytics / Web Vitals), uptime/synthetic checks, centralized logs, and on-call runbooks.

Audience
- DevOps engineers, maintainers, on-call engineers, and owners responsible for production availability.

Prerequisites
- Sentry project and DSN available.
- Vercel project with analytics enabled (or equivalent RUM provider).
- Uptime/synthetic monitoring account (UptimeRobot, Pingdom, or similar).
- Access to log storage/aggregation (Vercel logs, Cloud Logging, or external aggregator).
- Service account credentials for automated checks (CI/ops accounts).

1 — Overview & Objectives
- Objectives:
  - Detect and alert on production errors and outages quickly.
  - Monitor core performance metrics (Core Web Vitals + API latency).
  - Provide clear runbooks for common incidents and escalation policies.
  - Retain logs for forensic investigation and compliance.
- Key signals:
  - Error rate (5xx / JS exceptions)
  - API latency (p95 / p99)
  - Core Web Vitals regressions (LCP, FCP, CLS)
  - Uptime / health-check failures
  - Storage / backup failures and emulator export failures (CI)

2 — Instrumentation (Where to look / files)
- Client-side instrumentation:
  - See [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1) for RUM and Sentry browser tracing.
- Server-side instrumentation:
  - See [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1) for server / edge Sentry config and performance tracing.
- Health endpoint:
  - Monitor [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1) (exposes aggregated service status).
- CI & synthetic checks:
  - Use CI jobs to run smoke tests and Lighthouse audits (see `web/performance-budgets.json`).

3 — Sentry (Error Tracking)
- Setup:
  - Add SENTRY_DSN to Vercel environment variables: SENTRY_DSN=https://<public>@o0.ingest.sentry.io/<project>
  - Configure environment-specific sampling in [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1).
- Recommended alert rules:
  - Critical error rate: alert when 5xx errors increase by >200% over 5m and count > 10.
  - New release errors: alert on new-release error spike above baseline.
  - High-traffic slow transactions: alert when p95 transaction duration > threshold.
- Useful Sentry features:
  - Issue fingerprinting to reduce duplicates.
  - Attach request/trace IDs and user context (uid, orgId) for triage.
  - Use "Alerts -> Metric Alerts" for p95 latency and error-rate-based thresholds.
- Example Sentry alert rule (conceptual):
  - Condition: event.type:error AND release:production AND aggregated.count() > 10 in last 5m
  - Action: notify #ops Slack channel + email ops@[TODO-YOUR-COMPANY].example

4 — Vercel Analytics & Web Vitals
- Enable Vercel Analytics in project settings.
- Key dashboards:
  - Core Web Vitals (LCP, CLS, FCP)
  - Page load times by route (e.g., /, /tras, /dashboard)
- Performance budgets:
  - LCP < 2.5s (mobile)
  - FCP < 1.8s
  - TBT < 200ms
  - p95 API latency < 300ms for core endpoints
- CI enforcement:
  - Include Lighthouse CI job in `.github/workflows/ci.yml` to block regressions on PRs.

5 — Uptime / Synthetic Checks
- Configure synthetic uptime monitors pointing at:
  - https://[TODO-PRODUCTION-URL]/ (homepage)
  - https://[TODO-PRODUCTION-URL]/api/health (health endpoint)
  - Key API endpoints used by background jobs
- Polling frequency:
  - 1–5 minutes for critical endpoints; 5–15 minutes for less critical.
- Escalation:
  - If health endpoint returns unhealthy or 5xx for >2 checks (5–10 min), trigger PagerDuty/SMS.
- Use the Uptime monitoring to capture response time trends and traceroute-like info for network issues.

6 — Centralized Logs & Retention
- Options:
  - Use Vercel logs (streaming) + export to Cloud Logging or third-party aggregator (Datadog/Logz).
  - For serverless traces, ensure structured logs include request ID, uid, orgId, and correlation IDs.
- Log retention policy (recommended):
  - Short-term (30 days) for full logs, archived long-term (365 days) for compliance.
- Log alerts:
  - Spike in "permission denied" errors or repeated auth failures.
  - Unusually large number of Firestore write errors (could indicate broken migration or bug).

7 — Alert Severity Matrix & Escalation (summary)
- Severity P0 / Critical:
  - Symptom: System-wide outage, health endpoint down, data loss risk.
  - Response: Immediate PagerDuty + phone call to on-call owner. Start incident runbook.
- Severity P1 / High:
  - Symptom: Critical feature broken for many users (e.g., cannot create TRA).
  - Response: Slack paging to #ops, follow runbook for mitigation and rollback.
- Severity P2 / Medium:
  - Symptom: Errors affecting subset of users or degraded performance.
  - Response: Email + Slack, investigate during working hours.
- Severity P3 / Low:
  - Symptom: Minor UI errors, non-blocking issues.
  - Response: Triage in backlog.

8 — Runbooks (Examples / links)
- Keep short, actionable runbooks for:
  - "Health endpoint unhealthy" — steps: review uptime tool details, open Sentry issues, check recent deploys, run smoke tests, rollback if necessary.
  - "High error rate in /api/*" — steps: inspect Sentry issues, identify offending release, toggle feature flags, roll back deployment.
  - "Firestore permission errors" — steps: check `firestore.rules` deployment status, validate service-account IAM, verify emulator vs prod differences.
- Place runbooks near ops contacts and in project memory: see [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1) for communication log entries.

9 — Incident Triage & Postmortem
- Triage steps:
  1. Acknowledge alert and set incident severity.
  2. Capture scope (start time, affected services, user impact).
  3. Assign owner and timeline in incident ticket.
  4. Apply mitigation (rollback, feature-flag, script).
  5. Monitor metrics for improvement.
- Postmortem:
  - Create a postmortem document with timeline, root cause, remediation and owners. Link to `PROJECT_MEMORY.md`.

10 — Example Commands & CI snippets
- Health check (curl)
  - curl -sSf -m 10 https://[TODO-PRODUCTION-URL]/api/health | jq
- Export emulator data in CI (fast start)
  - firebase emulators:export ./emulator-backups/latest --project=$FIREBASE_PROJECT
- Lighthouse CI job snippet (conceptual)
  - npx lhci autorun --upload.target=temporary-public-storage

11 — Concrete next tasks (TODO)
- Add precise Sentry alert rule YAML or screenshots with threshold values used in real project.
- Document log aggregation export steps (Vercel → Cloud Logging) and sample filter queries.
- Create short runbook files in docs/runbooks/ for the top 5 incidents.
- Wire up PagerDuty escalation policy and example playbooks.

12 — Useful links & references
- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Instrumentation examples: [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1), [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1)
- Performance budgets: [`web/performance-budgets.json`](web/performance-budgets.json:1)
- Backup & restore: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- Project memory / incident log: [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1)

Status & Next steps
- This guide provides a complete operational checklist. After you confirm, I will:
  1. Add example Sentry alert definitions and a sample PagerDuty escalation policy.
  2. Create runbook documents under `docs/runbooks/` and wire them into CHECKLIST.md and PROJECT_MEMORY.md.
  3. Update `docs/README.md` to mark this guide as Completed.