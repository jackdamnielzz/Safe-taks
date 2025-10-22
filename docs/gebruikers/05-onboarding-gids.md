[MEMORY BANK: ACTIVE]

# Onboarding-gids voor nieuwe organisaties (Admin / Owner)

Doel
- Stapsgewijze handleiding voor administrators en Owners om een nieuwe organisatie live te brengen.
- Bevat technische setup, gebruikersuitnodigingen, aanbevolen instellingen, trainingschecklist en go-live checklist.
- Taal: Nederlands (zakelijke, professionele terminologie voor veiligheidsprofessionals).

Voor wie
- Owner / Organisatiebeheerder
- Admins verantwoordelijk voor setup en onboarding
- DevOps / Support bij initialisatie

Voorwaarden vóór starten
- Toegang tot een account met Owner/Admin rechten
- Gerealiseerde service-accounts en secrets opgeslagen in Secret Manager
- Staging-omgeving beschikbaar voor acceptatietests
- Backups en restore procedure bekend (zie docs/admin/04-backup-restore-guide.md)

Stap 0 — Voorbereiding (pre-checklist)
- [ ] Bevestig Owner/Admin account en MFA geconfigureerd
- [ ] Service account voor seeding/groepsscripts aangemaakt en credentials veilig opgeslagen
- [ ] Staging environment klaargezet en toegang verleend aan testgebruikers
- [ ] Backup policy en retention gevalideerd
- [ ] Documenteer gewenste organisatie-instellingen (branding, locale, timezone)

Stap 1 — Organisatie aanmaken
Locatie in UI:
- Admin dashboard → Organisaties → 'Nieuwe organisatie'

Vereiste velden:
- Organisatienaam
- Land / Regio
- Standaard tijdzone
- Standaard branding (optioneel)
- Contact e-mail voor notificaties

Stappen:
1. Navigeer naar Admin → Organisaties → 'Nieuwe organisatie'
2. Vul alle vereiste velden in
3. Wijs een Owner toe (gebruik het bestaande gebruikers-account of nodig een nieuwe Owner uit)
4. Controleer via API: GET /api/organizations om te verifiëren dat de organisatie bestaat
5. Noteer de orgId en voeg deze toe aan je onboarding-notities

Stap 2 — Basisinstellingen configureren
Aanbevolen instellingen direct instellen:
- Organisatie branding (logo, kleuren, e-mailtemplates)
- Standaard tijdzone en datumformaten
- Standaard taal (NL) en terminologie (controleer DUTCH_LOCALIZATION_STRATEGY.md)
- Meldingsvoorkeuren en e-mail templates (verzendadres, reply-to)
- Toegestane domeinen / e-mail allowlist (indien van toepassing)

Stap 3 — Gebruikers uitnodigen en rollen toewijzen
1. Admin → Gebruikers → 'Nieuwe gebruiker'
2. Vul naam en bedrijfs-e-mail in
3. Wijs rol toe: Owner / Admin / Safety Manager / Supervisor / Field Worker
4. Verstuur uitnodiging (e-mail met registratie-link)
Bulk-aanpak:
- Gebruik CSV import via Admin import tool of de import API (docs / import-export). Zet dry-run aan voor validatie.
- Voor programmatische roltoewijzing gebruik POST /api/auth/set-claims met service-account authenticatie.

Stap 4 — Seed data & initiële configuratie
- Seed projecten, locaties en teams indien relevant:
  - Gebruik seeding scripts of import CSV voor Projects/Teams
  - Controleer referentiële integriteit (project -> locations -> teams)
- Maak voorbeeld-TRA (near-miss/voorbeeld) en LMRA die als demo kan dienen tijdens training
- Activeer of configureer integraties (bijv. SSO, Slack, externe CRM) indien nodig

Stap 5 — Training en acceptatietest (staging)
Doel: bevestig dat core workflows werken zoals beschreven in handleidingen.

Aanbevolen testcases:
- Nieuwe TRA aanmaken (veldwerker) → Supervisor goedkeurt → Archivatie
- LMRA uitvoeren in veld (mobile flow) inclusief foto-upload en sign-off
- Gebruiker met beperkte rechten probeert admin-acties uit te voeren (security test)
- Import/Export CSV test met dry-run en daadwerkelijke import
- Notificatie- en e-mailflow (invite, approval notifications)

Training checklist (voor aanbieders)
- Introductie (15 min): Rollen en basisprincipes
- Admin setup demo (20–30 min): Organisatie, settings, users, branding
- Workflow demo (30–45 min): TRA-creatie, LMRA, goedkeuringen
- Hands-on sessie (60 min): deelnemers maken test-TRA/LMRA
- Q&A + FAQ doorlopen (15–30 min)

Stap 6 — Go-live checklist
- [ ] Alle admins en Owners hebben MFA ingesteld
- [ ] Essentiële gebruikers zijn uitgenodigd en geactiveerd
- [ ] Staging-testcases geslaagd (documenteer resultaten)
- [ ] Backups getest en restore-procedure gevalideerd
- [ ] Integraties gecontroleerd (SSO, e-mail, notificaties)
- [ ] Toegang tot monitoring & alerts geconfigureerd (Sentry/Logging/Alerts)
- [ ] Communicatie naar gebruikers gepland (e-mail / onboarding sessie)
- [ ] Rollout date & rollback plan gecommuniceerd

Rollback & noodprocedures
- Als kritieke fouten optreden:
  1. Schakel writes tijdelijk uit (maintenance mode) of disable ingest/ingress pipelines
  2. Notify stakeholders en zet incident op (uitgebreid runbook in docs/runbooks/)
  3. Voer restore uit in staging voor validatie vóór productie-restore
  4. Documenteer alle stappen en update PROJECT_MEMORY.md met Git SHA en logs

Tips voor Admins
- Gebruik de API voor bulk-wijzigingen en logging: altijd via service-account uitvoeren
- Deactiveer in plaats van verwijderen waar mogelijk (auditability)
- Plan regelmatige doorloop van rol-toegang (quarterly access reviews)
- Bewaar opname-instructies en video-scripts in assets/videos/scripts/ voor training

Links en referenties
- Backup & restore: docs/admin/04-backup-restore-guide.md
- API referentie: docs/backend/01-api-endpoints-guide.md
- Import/Export tools: web/src/lib/import-export/
- Lokalisatie richtlijnen: DUTCH_LOCALIZATION_STRATEGY.md
- QA / Testing flows: TESTING_STRATEGY.md

Volgende stappen (voor dit ticket)
- Schrijf complete Admin-handleiding uitbreidingen (UI screenshots, voorbeelden, API snippets)
- Maak korte one-pager 'Snelstart' voor Owners (printable)
- Schrijf en bewaar opname-instructies & video-scripts in assets/videos/scripts/

Contact & escalatie
- Support: support@[TODO-YOUR-COMPANY].example
- Ops owner: ops@[TODO-YOUR-COMPANY].example

Einde van onboarding-gids
