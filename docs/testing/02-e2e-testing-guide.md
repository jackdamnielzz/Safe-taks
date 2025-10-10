# End-to-end (E2E) Testing Guide — Cypress

Purpose:
This guide explains how to run and maintain end-to-end tests for this repository using Cypress, configured in the `web/` app.

Prerequisites:
- Node 18+ and npm
- Firebase emulators configured when tests depend on Auth/Firestore (see [`docs/testing/03-firebase-emulator-testing.md`](docs/testing/03-firebase-emulator-testing.md:1))
- Project dependencies installed: run `npm ci` from the `web/` folder

Quick start (local)
1. Install dependencies:
   - cd web && npm ci
2. Start the app (if needed for visual testing):
   - cd web && npm run dev
3. Start Cypress UI:
   - cd web && npm run cypress:open
4. Run all E2E tests headlessly (CI-style):
   - cd web && npm run cypress:run

Repository-specific details
- Cypress config file: [`web/cypress.config.ts`](web/cypress.config.ts:1)
- E2E tests are located in: [`web/cypress/e2e/`](web/cypress/e2e/:1)
  - Example test: [`web/cypress/e2e/homepage.cy.ts`](web/cypress/e2e/homepage.cy.ts:1)
- Fixtures (test users) are in: [`web/cypress/fixtures/users.json`](web/cypress/fixtures/users.json:1)
- Custom support commands: [`web/cypress/support/commands.ts`](web/cypress/support/commands.ts:1)

Emulator-aware test runs
When tests interact with Firebase Auth/Firestore/Storage, run the Firebase emulators before Cypress and point the app to emulator ports (the repo's emulator helper will detect this automatically in many scripts).

1. Start emulators:
   - From repo root: firebase emulators:start --only auth,firestore,storage
   - Or use npm script if available: cd web && npm run emulators:start
2. Start the app pointing at local emulators (if required) and then run Cypress:
   - cd web && npm run cypress:run

Writing reliable E2E tests (best practices)
- Use fixtures for stable test data (`web/cypress/fixtures/users.json`: sample users and roles).
- Reset emulator state between tests where possible — use emulator REST APIs or helper utilities in [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1).
- Avoid relying on third-party services in E2E tests; mock network calls where feasible.
- Use data-testids and stable selectors (prefer data attributes in components) rather than CSS classes.
- Keep tests focused: each E2E spec should validate one user journey end-to-end.

Authentication flows
- For flows requiring authentication, tests either:
  - Use the Firebase emulator with a seeded test user (recommended), or
  - Use API route helpers to mint test sessions (where implemented)
- Example test that asserts login works: see [`web/cypress/e2e/homepage.cy.ts`](web/cypress/e2e/homepage.cy.ts:1)

CI integration
- The CI pipeline runs E2E tests after starting the Firebase emulators in the build job.
- Typical CI steps:
  1. Install dependencies
  2. Start emulators in background
  3. Build the app
  4. Run headless Cypress: `cd web && npm run cypress:run`
- Ensure CI has the same emulator versions used locally to avoid flakiness.

Debugging tests
- Open Cypress in interactive mode: `cd web && npm run cypress:open` and run the failing spec.
- Capture screenshots/videos on failure (Cypress can be configured in `web/cypress.config.ts`).
- Reproduce locally with the same environment variables and emulator state.

Where to add new tests
- Add new E2E specs to `web/cypress/e2e/`.
- Add fixtures to `web/cypress/fixtures/` and support utilities in `web/cypress/support/`.

References
- Cypress config: [`web/cypress.config.ts`](web/cypress.config.ts:1)
- Example tests: [`web/cypress/e2e/homepage.cy.ts`](web/cypress/e2e/homepage.cy.ts:1)
- Firebase emulator helpers: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Unit testing guide (related): [`docs/testing/01-unit-testing-guide.md`](docs/testing/01-unit-testing-guide.md:1)

Notes / TODO
- Expand this guide with repo-specific CI examples and exact commands for the project's CI provider.
- Add a short troubleshooting section that maps common flakes to known emulator/network issues.