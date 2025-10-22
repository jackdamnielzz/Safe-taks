[MEMORY BANK: ACTIVE]

# Administrators Gebruikershandleiding — Uitgebreide versie

Deze handleiding is bedoeld voor administrators en Owners die verantwoordelijk zijn voor organisatiebeheer, gebruikersbeheer, configuratie en operationele workflows. De inhoud is in het Nederlands en bevat praktische instructies, UI-screenshots (plaatsaanduidingen), concrete API-snippets en voorbeeld-workflows die admins dagelijks nodig hebben.

Belangrijke verwijzingen
- Project geheugen: PROJECT_MEMORY.md
- API referentie: docs/backend/01-api-endpoints-guide.md
- Onboarding gids: docs/gebruikers/05-onboarding-gids.md
- Backup & restore: docs/admin/04-backup-restore-guide.md
- Import/Export tools: web/src/lib/import-export/

Inhoudsopgave
1. Organisatie aanmaken en configureren
2. Rollen & permissies (UI + API)
3. Gebruikers aanmaken, uitnodigen en bulk-import
4. Voorbeeld-workflows (TRA lifecycle, LMRA, approvals) — inclusief API-voorbeelden
5. UI-screenshots (plaatsvervangers) en toelichting
6. Admin API en scripts — concrete curl & Node voorbeelden
7. Troubleshooting & veelvoorkomende fouten
8. Change management, auditing en release flow
9. Appendix: paden in de repo en extra bronnen

1. Organisatie aanmaken en configureren (ui + API)
UI-locatie
- Admin dashboard → Organisaties → 'Nieuwe organisatie'

UI-stappen (kort)
1. Ga naar Admin → Organisaties → 'Nieuwe organisatie'
2. Vul: Organisatienaam, Land/Regio, Tijdzone, Contact e-mail, Branding
3. Wijs Owner toe en klik Opslaan
4. Controleer: GET /api/organizations (API) of de organisatie zichtbaar is

API-check (concrete endpoints)
- Route in repo: web/src/app/api/organizations/route.ts
- Belangrijke endpoints (org-scoped):
  - GET  /api/organizations                 -> haal organisatie details (auth required)
  - POST /api/organizations                 -> maak nieuwe organisatie (admin)
  - PATCH /api/organizations                -> update organisatie (admin)
  - DELETE /api/organizations               -> soft-delete organisatie (admin)

- Voorbeeld curl (gebruik env var NEXT_PUBLIC_APP_URL of localhost):
  curl -H "Authorization: Bearer $SERVICE_TOKEN" "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/organizations"

- Voorbeeld: organisatie aanmaken (server-side)
  curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Acme Construction","country":"NL","timezone":"Europe/Amsterdam","contactEmail":"ops@acme.example"}' \
    "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/organizations"

- Tip: de server-side implementation gebruikt Firebase Admin helpers (zie web/src/lib/firebase-admin.ts) en valideert dat de aanroepende gebruiker admin-permissies heeft.

Resultaat: response bevat orgId die je moet noteren:
  {
    "id": "org_abc123",
    "name": "Acme Construction",
    "createdAt": "2025-10-21T10:00:00Z"
  }

2. Rollen & permissies — UI en toewijzing via API
Standaardrollen
- Owner, Admin, Safety Manager, Supervisor, Field Worker

UI: Rollen toewijzen
- Admin → Gebruikers → kies gebruiker → 'Wijzig rollen' → vink gewenste rollen aan → Opslaan

API: set-claims (concreet)
- Route in repo: web/src/app/api/auth/set-claims/route.ts
- Endpoint: POST /api/auth/set-claims
- Beschrijving: gebruikt door admins / service accounts om Firebase custom claims en org-scoped role claims te zetten via de Admin SDK wrapper (web/src/lib/firebase-admin.ts). Zorg dat je deze endpoint alleen vanaf een vertrouwde service-account of server-side environment aanroept.

- Payload (JSON):
  {
    "uid": "firebaseUserId123",
    "claims": { "role": "admin", "orgId": "org_abc123" }
  }

- Voorbeeld curl:
  curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
    -d '{"uid":"firebaseUserId123","claims":{"role":"admin","orgId":"org_abc123"}}' \
    "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/auth/set-claims"

- Implementatiehint: de route gebruikt internal helper setCustomClaims (web/src/lib/firebase-admin.ts). Na het zetten van claims moet de gebruiker zijn token vernieuwen (uit-/inloggen) om de nieuwe claims te zien.

Node example (server-side, gebruik service account)
- Gebruik web/src/lib/firebase-admin.ts voor referentie naar Admin SDK
  import admin from 'path-to-web/src/lib/firebase-admin';
  await admin.auth().setCustomUserClaims(uid, { role: 'admin', orgId: 'org_abc123' });

Verifiëren van claims (client)
- Vraag gebruiker token te vernieuwen. Controleer via /api/me of inspecteer JWT:

  Authorization: Bearer <idToken>
  GET /api/me
  Response bevat claims: { role: "admin", orgId: "org_abc123" }

3. Gebruikers aanmaken, uitnodigen en bulk-import
UI: enkele gebruiker uitnodigen
1. Admin → Gebruikers → 'Nieuwe gebruiker'
2. Vul naam, e-mail, telefoon (optioneel)
3. Wijs rol en organisatie toe
4. Verstuur uitnodiging

Bulk import — stappen
- Bereid CSV voor: headers: email,firstName,lastName,role,orgId,phone
- Voer dry-run via import API of Admin UI import tool
- Controleer fouten en corrigeer CSV
- Voer daadwerkelijke import uit (batch grootte 50 aanbevolen)

API: import voorbeeld (pseudo)
- POST /api/import/users
- Gebruik multipart/form-data met csv-bestand of upload naar GCS en geef file reference

Voorbeeld validatie (server-return)
  {
    "importId": "imp_2025_10_21_001",
    "rows": 120,
    "errors": [
      { "row": 5, "error": "invalid email" },
      { "row": 42, "error": "unknown role 'manager'" }
    ],
    "status": "dry-run"
  }

4. Voorbeeld-workflows — volledig uitgewerkt

Workflow A: TRA aanmaken → review → goedkeuring → archivering (Admin focus)
- Doel: laat admins zien hoe een TRA door de organisatie lifecycle beweegt en wanneer admin acties vereist zijn.

Stap-voor-stap (UI)
1. Field Worker maakt TRA aan (Mobiele UI) met trefwoorden, risico’s en controle maatregelen.
2. TRA is in status "Draft" totdat ingediend.
3. Supervisor ontvangt notificatie → bekijkt TRA → kan goedkeuren of terugsturen voor aanpassing.
4. Na goedkeuring verandert status naar "Approved" en wordt TRA zichtbaar in rapporten.
5. Admin kan TRA exporteren of verwijderen (gebruik 'deactivate' voorkeur).

API flow (concreet — endpoints in repo)
- Implementatiebestanden: web/src/app/api/tras/route.ts en gerelateerde route-bestanden (tras/draft, tras/:traId/*)
- Belangrijke endpoints:
  - POST /api/tras
    - Doel: Maak een nieuwe TRA (draft of submit afhankelijk van payload)
    - Voorbeeld curl:
      curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
        -d '{"projectId":"proj_1","title":"Werk op hoogte - reparatie dak","hazards":[{"id":"haz_1","description":"valgevaar"}],"controls":[{"description":"gebruik valbeveiliging"}]}' \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/tras"
    - Verwachte response: { "id": "<traId>", "status": "created" } of status "Draft"

  - POST /api/tras/draft
    - Doel: Sla een draft op en ontvang draftId
    - Gebruik voor autosave/ontwerp-workflows

  - POST /api/tras/{traId}/submit
    - Doel: Submit een draft-TRA voor review
    - Routebestand: web/src/app/api/tras/[traId]/submit/route.ts
    - Voorbeeld curl:
      curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/tras/<traId>/submit"

  - POST /api/tras/{traId}/approve
    - Doel: Supervisor of approver keurt TRA goed
    - Routebestand: web/src/app/api/tras/[traId]/approve/route.ts
    - Payload voorbeeld: { "approvedBy":"supervisor_uid", "notes":"OK" }
    - Voorbeeld curl:
      curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
        -d '{"approvedBy":"supervisor_uid","notes":"OK"}' \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/tras/<traId>/approve"

  - POST /api/tras/{traId}/signature
    - Doel: Voeg handtekening/acceptatie toe (mobiele flows)
    - Routebestand: web/src/app/api/tras/[traId]/signature/route.ts

  - Comments: GET/POST /api/tras/{traId}/comments and /api/tras/{traId}/comments/{commentId}
    - Routebestanden: web/src/app/api/tras/[traId]/comments/route.ts en comments/[commentId]/route.ts
    - Gebruik voor discussie, resolutie en audit-trail

  - GET /api/tras/{traId}/export?format=pdf|csv
    - Doel: Exporteer TRA als PDF/CSV voor archivering/reporting
    - Voorbeeld curl:
      curl -H "Authorization: Bearer $SERVICE_TOKEN" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/tras/<traId>/export?format=pdf" -o tra_<traId>.pdf

- Extra tips:
  - Alle tras endpoints zijn org-scoped; include orgId via auth token (requireOrgAuth in server-code).
  - Raadpleeg web/src/app/api/tras/route.ts voor filtering, pagination en query parameters.

Workflow B: LMRA uitvoering (voor admins: controleren & auditing)
- Field Worker start LMRA via mobile → voegt foto's en observaties toe → signeert
- LMRA wordt opgeslagen als completed session
- Admins kunnen LMRA-sessies zoeken via filters (project, date, user) en downloaden

API snippet: LMRA endpoints (concreet)
- Implementatiebestanden: web/src/app/api/lmra-sessions/route.ts en web/src/app/api/lmra-sessions/[id]/route.ts, [id]/complete/route.ts
- Belangrijke endpoints:
  - POST /api/lmra-sessions
    - Doel: Maak nieuwe LMRA session (field worker)
    - Payload bevat: traId, projectId, teamMembers, observations, photos (storage links)
    - Voorbeeld curl:
      curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
        -d '{"traId":"<traId>","projectId":"proj_1","teamMembers":["uid1","uid2"],"observations":[{"text":"Check valbeveiliging"}]}' \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/lmra-sessions"

  - GET /api/lmra-sessions
    - Doel: List LMRA sessions met filtering, pagination (org-scoped)
    - Query parameters: from, to, projectId, performedBy, pageSize, cursor
    - Voorbeeld curl:
      curl -H "Authorization: Bearer $SERVICE_TOKEN" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/lmra-sessions?from=2025-10-01&to=2025-10-21"

  - GET /api/lmra-sessions/{id}
    - Doel: Haal details van een specifieke session (inclusief photo storage links)
    - Voorbeeld curl:
      curl -H "Authorization: Bearer $SERVICE_TOKEN" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/lmra-sessions/<sessionId>"

  - POST /api/lmra-sessions/{id}/complete
    - Doel: Markeer session als complete (of voeg final sign-off toe)
    - Routebestand: web/src/app/api/lmra-sessions/[id]/complete/route.ts

  - PATCH /api/lmra-sessions/{id}
    - Doel: Update session (admins en safety_managers kunnen bepaalde velden aanpassen)
    - Routebestand: web/src/app/api/lmra-sessions/[id]/route.ts

Admin handelingen (concreet)
- Onderzoek een LMRA:
  curl -H "Authorization: Bearer $SERVICE_TOKEN" "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/lmra-sessions/<sessionId>"

- Open investigation / add comment:
  POST /api/lmra-sessions/{id}/investigation (gebruik de investigation flow in UI of een dedicated endpoint in de repository)

- Tips:
  - Photos worden opgeslagen in Firebase Storage; API responses bevatten storage URLs.
  - Gebruik filters (projectId/from/to) voor compliance rapportages.

5. UI-screenshots en toelichting (plaatsvervangers)
Let op: voeg daadwerkelijke screenshots toe in repo onder docs/assets/screenshots/ en update paden.

6. Extra Admin API endpoints (invitations, members, import-export)
- Invitations (bruikbare endpoints en repo-locatie)
  - Implementatie: web/src/app/api/invitations/
  - GET  /api/invitations                         -> lijst uitnodigingen (org-scoped, admin/safety_manager)
  - POST /api/invitations                         -> maak nieuwe uitnodiging (admin/safety_manager)
  - GET  /api/invitations/{id}                    -> details (public if token-based) / admin view
  - POST /api/invitations/{id}/accept             -> acceptatie flow (public route)
  - POST /api/invitations/{id}/decline            -> decline flow (public route)
  - DELETE /api/invitations/{id}                  -> cancel invitation (admin)
  - Voorbeeld curl (create invitation):
    curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
      -d '{"email":"jan@acme.example","role":"field_worker","projectAccess":"assigned"}' \
      "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/invitations"

- Organization members (organisaties/leden)
  - Implementatie: web/src/app/api/organizations/members/route.ts
  - GET  /api/organizations/members               -> lijst members (org-scoped)
  - POST /api/organizations/members               -> voeg member toe (admin/safety_manager)
  - PATCH /api/organizations/members/{id}         -> update member (admin/safety_manager)
  - DELETE /api/organizations/members/{id}        -> soft-delete / deactivate member (admin)
  - Voorbeeld curl (add member):
    curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -H "Content-Type: application/json" \
      -d '{"email":"piet@acme.example","firstName":"Piet","role":"field_worker"}' \
      "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/organizations/members"

- Import / Export (CSV / Excel)
  - Implementatie: web/src/app/api/import-export/import/route.ts en web/src/app/api/import-export/export/route.ts
  - POST /api/import-export/import                 -> upload CSV/XLSX for import (supports dry-run)
    - Gebruik multipart/form-data (file field) or upload to storage and pass reference
    - Voorbeeld (upload via curl, multipart):
      curl -X POST -H "Authorization: Bearer $SERVICE_TOKEN" -F "file=@users.csv" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/import-export/import?entity=users&dryRun=true"
  - GET /api/import-export/export?entity=users&format=csv&orgId=<org>
    - Doel: export entity data as CSV/Excel
    - Voorbeeld curl:
      curl -H "Authorization: Bearer $SERVICE_TOKEN" \
        "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/api/import-export/export?entity=tras&format=csv" -o tras_export.csv

- Notes:
  - Import endpoint supports batch processing and returns validation errors in a structured format.
  - Exports are org-scoped and may be large; use pagination or background job if needed (see web/src/lib/import-export/*).

- Screenshot: Admin dashboard (docs/assets/screenshots/admin-dashboard.png)
  Toelichting: overzicht van organisaties, actieve issues en snelle acties (create org, invite user)

- Screenshot: Organisatie aanmaken (docs/assets/screenshots/admin-new-org.png)
  Toelichting: velden en tips (gebruik korte naam, correcte timezone)

- Screenshot: Gebruikersbeheer (docs/assets/screenshots/admin-users.png)
  Toelichting: filters voor role/org, bulk actions en invite flow

- Screenshot: TRA detail & approval modal (docs/assets/screenshots/tra-detail-approval.png)
  Toelichting: waar admins supervisie en exports kunnen doen

6. Admin API en scripting — concrete voorbeelden
Algemene aanbeveling
- Gebruik service-accounts met minimale scopes
- Log alle admin-API calls (wie, wat, wanneer)
- Gebruik retry- en backoff-logica voor batch imports

Voorbeeld: Node script om meerdere gebruikers rollen toe te wijzen
const fetch = require('node-fetch');
const serviceToken = process.env.SERVICE_TOKEN;
const users = [
  { uid: 'uid1', role: 'admin' },
  { uid: 'uid2', role: 'safety_manager' }
];

async function setClaims(uid, role, orgId) {
  const res = await fetch('https://example.com/api/auth/set-claims', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${serviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, claims: { role, orgId } })
  });
  return res.json();
}

(async () => {
  for (const u of users) {
    const r = await setClaims(u.uid, u.role, 'org_abc123');
    console.log('setClaims result', r);
  }
})();

Admin export script (bash)
- Exporteer tras van afgelopen maand als CSV:
  curl -H "Authorization: Bearer $SERVICE_TOKEN" "https://example.com/api/tras/export?orgId=org_abc123&from=2025-09-01&to=2025-09-30&format=csv" -o tras_sep_2025_09.csv

7. Troubleshooting & veelvoorkomende fouten
Probleem: gebruiker ziet geen admin functies na roltoewijzing
- Oorzaken:
  - Token claims niet ververst (vraag gebruiker uit te loggen/inloggen)
  - Rol niet correct toegekend op orgId-level
  - Cache / feature flags blokkeren toegang
- Acties:
  - Controleer via GET /api/users/:id en /api/me
  - Inspecteer Firebase custom claims met Admin SDK
  - Controleer server logs en auth service account permissies

Probleem: Bulk import faalt met 'rate limit' of timeouts
- Oorzaken: grote batches > memory/time limits
- Acties:
  - Verklein batchgrootte naar 50
  - Gebruik background job queue (check import-service in web code)
  - Controleer CSV op invalid characters en missing fields

Probleem: Restore mislukt in productie
- Oorzaken: insufficient IAM of ontbrekende service-account permissies, storage bucket issues
- Acties:
  - Volg docs/admin/04-backup-restore-guide.md exact
  - Test restore in staging vóór productie

8. Change management, auditing en release flow
- Documenteer schema wijzigingen en admin-beleid in PROJECT_MEMORY.md
- Voor grote schema / rules wijzigingen: feature-flag, staging rollout, migration script met rollback
- Audit logs: log (userId, action, resource, timestamp, requestId)
- Wekelijkse access review: export lijst van admins en owners en verifieer noodzaak

9. Appendix — Relevante bestanden en locaties
- Admin organisatie beheer instructies: docs/admin/01-organisatie-beheer.md
- Admin gebruiker beheer: docs/admin/02-gebruiker-beheer.md
- Data manipulatie: docs/admin/03-data-manipulatie.md
- Backup & restore: docs/admin/04-backup-restore-guide.md
- Import/Export implementatie: web/src/lib/import-export/
- Firebase Admin helpers: web/src/lib/firebase-admin.ts
- API endpoints: docs/backend/01-api-endpoints-guide.md

Einde van handleiding.
