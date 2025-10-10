# Deployment Guide

This guide explains how to deploy the web application and related backend services used by the project. It covers local checks, Vercel deployment, Firebase resources (Firestore, Auth, Storage), CI/CD recommendations, environment variables, and common troubleshooting steps.

Important repo references:
- Project memory: [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1)
- Firebase config: [`firebase.json`](firebase.json:1)
- Next.js app config: [`web/next.config.ts`](web/next.config.ts:1)
- Firebase emulator helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- API endpoints reference: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)

1. Overview & prerequisites
- Accounts:
  - Vercel account (for static/SSR hosting)
  - Google Cloud project with Firestore, Auth and Storage enabled
  - Service account(s) for CI with minimal required IAM
- Local tools:
  - Node.js (LTS)
  - npm / pnpm
  - Firebase CLI (for emulators, deploys, imports/exports)
  - gcloud CLI (for production Firestore exports/imports and management)
- Branching model:
  - main (production)
  - develop / feature/* (staging / PR environments)
  - Protect main with required reviews and CI success checks

2. Local verification before deploying
- Run tests:
  - Unit tests: npm test (see [`web/jest.config.js`](web/jest.config.js:1))
  - E2E (if configured): npm run cypress
- Lint and build:
  - npm run lint
  - npm run build
- Run locally with emulators (recommended for integration checks):
  - Start Firebase emulators (Firestone/Auth/Storage):  
    firebase emulators:start --import=./emulator-backups/latest --project=YOUR_PROJECT_ID  
  - Start Next.js dev server:
    cd web && npm run dev
- Verify key flows:
  - Registration / login / role assignment
  - Organization creation (Admin flow)
  - File uploads (Storage)
  - API endpoints (protected routes)

3. Vercel deployment (frontend)
- Repo integration:
  - Connect repository to Vercel and enable Preview Deployments for branches and PRs.
- Build settings:
  - Framework Preset: Next.js
  - Build command: npm run build
  - Output directory: .next (default)
- Environment variables (set in Vercel dashboard for each environment):
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_SENTRY_DSN (optional)
  - Any other NEXT_PUBLIC_* variables required by app
- Server-side variables (Environment Variables set as "Secret" / not exposed to client):
  - FIREBASE_ADMIN_PRIVATE_KEY (or use GCP Workload Identity)
  - FIREBASE_ADMIN_CLIENT_EMAIL
  - SERVICE_ACCOUNT_JSON (if using a JSON key)
  - STRIPE_SECRET_KEY (if Stripe integration)
- Recommended: Use Vercel Environment aliases to map branches to staging/production and restrict access to production environment variables.

4. Firebase production deployment (security rules, indexes, functions)
- Deploy security rules and indexes:
  - firebase deploy --only firestore:rules,firestore:indexes --project=YOUR_PROJECT_ID
- Deploy Storage rules:
  - firebase deploy --only storage:rules --project=YOUR_PROJECT_ID
- If using Cloud Functions / Cloud Run for backend tasks:
  - Deploy via firebase deploy --only functions or gcloud / Cloud Build pipeline
- Verify:
  - Check logs in Google Cloud Console (Cloud Logging)
  - Validate security rules using emulator in staging before production

5. CI/CD recommendations
- CI pipeline responsibilities:
  - Run tests (unit + integration)
  - Lint and build
  - Run security checks (dependency scan, secret scanning)
  - Deploy to Preview (Vercel) automatically for PRs
  - On merge to main: deploy to staging, run smoke tests, then promote to production (or directly deploy production with gated rollout)
- Example GitHub Actions steps (high-level):
  - checkout
  - install node dependencies
  - run unit tests
  - start firebase emulators for integration tests (use `firebase emulators:start --only firestore,auth,storage --export-on-exit=./emulator-backups/ci`)
  - run e2e tests
  - on success: trigger Vercel deployment via Vercel Git integration or Vercel CLI (vercel --prod)
- Secrets in CI:
  - Store service account JSON in secret manager (GitHub Secrets / Actions secrets)
  - Prefer Workload Identity (short-lived credentials) for GCP jobs where possible

6. Environment variables & secret management
- Local development:
  - Use .env.local (gitignored) to store client variables; use firebase emulators and local service account if needed
- Staging/Production:
  - Use Vercel environment settings and Google Secret Manager for server secrets
  - Do NOT commit service account JSON into the repo
- Service accounts:
  - Create dedicated service accounts for CI/CD and backup operations with least privilege (see [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1))
- Example environment separation:
  - PROJECT_ID_STAGING
  - PROJECT_ID_PRODUCTION
  - FIREBASE_CONFIG_STAGING / FIREBASE_CONFIG_PRODUCTION (JSON blobs in secret manager)

7. Zero-downtime deployments & migrations
- Database migrations:
  - Prefer backward-compatible schema changes
  - Run migration jobs in staging first
  - For breaking changes: coordinate deploy + migration window and allow rollbacks
- Feature flags:
  - Use flags to toggle features and perform gradual rollouts
- Rollbacks:
  - Vercel supports quick rollbacks to previous deployments
  - For DB issues: restore from backups to staging and promote if validated (see [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1))

8. Monitoring & health checks (deployment-related)
- Health endpoints:
  - Ensure an API health-check endpoint exists (e.g. /api/health) and is exposed for uptime checks (see [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1))
- Integrations:
  - Vercel deployment hooks + webhooks for post-deploy checks
  - Synthetic uptime checks (Pingdom, UptimeRobot) hitting health endpoint
  - Error tracking (Sentry) configured with production DSN
- Logging:
  - Centralize logs to Cloud Logging and integrate alerts for high error rates

9. Post-deploy verification checklist
- Smoke tests:
  - App loads, login works, basic navigation
  - Key write flows (create organization, create incident) succeed
  - File uploads to Storage succeed
- Security:
  - Verify security rules behave as expected
  - Confirm no sensitive env vars exposed
- Observability:
  - Check logs for errors and monitor performance metrics (response times, error rates)

10. Troubleshooting common deployment issues
- Build failures:
  - Check Node version and dependency mismatch
  - Reproduce locally with npm run build
- Missing environment variables:
  - Confirm Vercel environment variables are set for the target environment
- Auth / service account errors:
  - Ensure service account has necessary IAM roles and credentials are available in CI
- Storage permission errors:
  - Validate Storage rules and service account permissions
- CI timing out on emulator start:
  - Use exported emulator data and `--export-on-exit` to speed up test runs and reduce flakiness

11. Security & compliance considerations
- Secrets:
  - Keep secrets in Secret Manager or CI secret stores; rotate regularly
- IAM:
  - Apply least privilege to service accounts
- Backups:
  - Ensure backup cadence and retention policies are in place (see [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1))
- Data residency & encryption:
  - Use CMEK if required; configure GCS lifecycle rules for archival

12. Automation suggestions
- Scheduled backups (Cloud Scheduler → Cloud Run job)
- Scheduled smoke tests after deploy (automated verification)
- Automatic promotions from staging to production after manual approval
- Post-deploy Slack notifications with deployment details and links to Vercel logs

13. Useful commands
- Deploy functions / firestore rules / indexes:
  - firebase deploy --only functions,firestore:rules,firestore:indexes --project=YOUR_PROJECT_ID
- Start emulators with import:
  - firebase emulators:start --import=./emulator-backups/latest --project=YOUR_PROJECT_ID
- Export emulator data:
  - firebase emulators:export ./emulator-backups/DATE --project=YOUR_PROJECT_ID
- Firestore production export:
  - gcloud firestore export gs://MY_BUCKET/backups/backup-YYYYMMDD --project=YOUR_PROJECT_ID

14. Appendix: repo locations & references
- Health endpoint: [`web/src/app/api/health/route.ts`](web/src/app/api/health/route.ts:1)
- Set-claims API: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1)
- Firebase emulator helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Firebase setup docs: [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md:1)
- CI examples: check `.github/workflows` or `web/cypress.config.ts` for integration patterns

15. Next steps (recommended)
- Add explicit GitHub Action workflow examples to repo (CI + deploy + smoke tests)
- Add scheduled backup job and alerting for backup failures
- Document any org-specific environment variable names and secret locations in a secure project wiki

Einde van de deployment handleiding.