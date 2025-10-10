# Top 5 Incidents and Runbooks

This document lists the primary production incidents and concise runbooks to triage and resolve them quickly. Each runbook includes immediate checks, mitigation steps, and post-incident actions.

## 1. Health endpoint unhealthy

Runbook steps:
1. Check the uptime/synthetic monitor (timestamp, last success).
2. Query the health endpoint directly:
   - curl -I https://[TODO-PRODUCTION-URL]/api/health
3. Check recent deployments on Vercel (did a deployment coincide with the failure?).
4. Inspect Sentry for related errors and stack traces.
5. Run smoke tests locally or with the Firebase emulator.
6. If a deployment caused regression: roll back to the last known-good deployment.
7. Notify the on-call engineer and document the incident in PROJECT_MEMORY.md.

## 2. High error rate (frontend or backend)

Runbook steps:
- Check Sentry for spikes in error occurrence and identify the top error groups.
- Confirm if the spike aligns with a release, config change, or external outage.
- If caused by a new release, consider promoting a rollback.
- Apply temporary mitigations (feature flags, rate-limiting) if possible.
- Monitor metrics for stabilization; after recovery, perform root-cause analysis and update PROJECT_MEMORY.md.

## 3. Firestore permission errors / quota issues

Runbook steps:
- Inspect Firebase Console for quota usage, error logs, and billing alerts.
- Check recent security rules changes and associated deployments.
- Reproduce failing requests with the emulator or a curl request to reproduce the exact error.
- If it's a rules change, patch rules and deploy a fix. If it's quota-related, throttle writes and contact GCP support or adjust plan.
- Add remediation steps and timeline to PROJECT_MEMORY.md.

## 4. Authentication failures (sign-in/claims)

Runbook steps:
- Verify Auth provider status and check Sentry for authentication-related errors.
- Check the custom claims setter endpoint logs: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Validate tokens and claims using local tooling or JWT inspector.
- If mass authentication failure, consider a temporary user communication and session invalidation workflow.
- Document actions and root cause in PROJECT_MEMORY.md.

## 5. Production deployment failed / rollback required

Runbook steps:
- Confirm the failed deployment in the Vercel dashboard and capture the deploy logs.
- Promote the previous successful deployment (use Vercel rollback).
- Run smoke and synthetic tests immediately after rollback.
- Monitor alerts and Sentry for 30 minutes to confirm stability.
- Record timeline, decisions, and follow-up actions in PROJECT_MEMORY.md and schedule a postmortem if severity warrants.

## Notes and links

- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Instrumentation (server): [`web/src/instrumentation.ts`](web/src/instrumentation.ts:1)
- Instrumentation (client): [`web/src/instrumentation-client.ts`](web/src/instrumentation-client.ts:1)