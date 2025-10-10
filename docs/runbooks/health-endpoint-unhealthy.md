# Runbook: Health endpoint unhealthy

Scope
- This runbook covers the case where the health endpoint returns non-2xx responses or synthetic checks / uptime monitors report failure for the service.

Relevant files / endpoints
- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Server instrumentation / Sentry server config: [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1)
- Client instrumentation: [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1)
- Top incidents index: [`docs/runbooks/top-5-incidents.md`](docs/runbooks/top-5-incidents.md:1)

Severity classification
- P0: Global outage (all users cannot access core functionality; health endpoint down for >5 minutes and multiple monitors failing).
- P1: Degraded service (health endpoint intermittent or failing for a subset of checks; risk of escalation).
- P2: Single region or minor degradation; synthetic check failing but no clear user impact.

Immediate checks (first 5 minutes)
1. Confirm alert details
   - Open the uptime monitor (UptimeRobot / Pingdom / Vercel synthetic) and note the first failure timestamp and recent history.
2. Query health endpoint manually
   - curl -v https://<your-deploy-domain>/api/health
   - Check response status, body, and headers.
3. Check recent deployments
   - Vercel dashboard → confirm if a deployment occurred around the failure timestamp. Rollback if deployment is suspect.
4. Inspect error tracking
   - Sentry: filter issues by timeframe and search for spikes. Check traces and last-release tag. See server errors from [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1).
5. Check platform/infra status
   - Vercel status, Firebase/GCP status, or external dependency status pages.

Quick mitigations (next 10–30 minutes)
- If a recent deploy is the cause:
  - Roll back to the last known-good deployment in Vercel.
  - Re-run smoke tests and synthetic checks.
- If dependency outage (e.g., Firebase):
  - Apply graceful degradation (serve cached content, show maintenance page).
  - Throttle or queue writes to avoid cascading failures.
- If crash-loop / memory leak:
  - Restart the service (use Vercel redeploy or scale down/up) and monitor.
- If transient networking or DNS:
  - Verify DNS and certificate (Let’s Encrypt / Vercel certs) expiration and propagation.

Investigations (post-mitigation)
1. Gather logs
   - Collect server logs around the failure window (Vercel logs / Cloud Logging).
   - Include correlation ids, request ids, uid/orgId if present.
2. Reproduce locally
   - Use Firebase emulator (if needed) and run the health checks locally.
   - Run the health check curl in staging with identical environment variables.
3. Root cause analysis
   - Identify the change that introduced the issue (deploy, config, dependency).
   - Determine whether additional monitoring or alert tuning is required.

Communication & escalation
- If P0:
  - Page the on-call rotation (PagerDuty or Slack alert).
  - Post an incident message to incident channel with status, impact, and next steps.
  - Notify product/ops leads.
- If P1/P2:
  - Notify the on-call engineer and create a ticket in backlog for follow-up.

Post-incident actions
- Create a timeline and add to PROJECT_MEMORY.md (include decisions and timestamps).
- Create or update a dedicated postmortem if the incident meets the postmortem criteria.
- Add or refine alerts to reduce noise and improve signal (Sentry alert, uptime thresholds).
- Add smoke tests and a synthetic check for the exact failure case where possible.
- Add diagrams/images or screenshots to `docs/images/` referenced from the monitoring guide.

Checklist (to close the incident)
- [ ] Service returned to healthy status and synthetic checks succeed for 30 minutes
- [ ] Deploy rollback (if applied) verified and smoke tests passed
- [ ] Logs and Sentry issues recorded
- [ ] Incident timeline written to PROJECT_MEMORY.md
- [ ] Postmortem created (if required) and follow-up action items added to CHECKLIST.md

Author / last update
- Roo (assistant) — 2025-09-30