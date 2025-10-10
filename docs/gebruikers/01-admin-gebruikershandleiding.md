# Administrators Gebruikershandleiding

Deze handleiding richt zich op administrators van het systeem. Het beschrijft organisatorische setup, rollen en permissies, gebruikersbeheer, veelvoorkomende workflows in de admin-UI, en troubleshooting-tips. Waar relevant verwijzen we naar repository-bronnen en operationele procedures.

Belangrijke verwijzingen:
- Zie project geheugen voor wijzigingen en beslissingen: [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1)
- API referentie: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)
- Organisatie beheer instructies: [`docs/admin/01-organisatie-beheer.md`](docs/admin/01-organisatie-beheer.md:1)
- Gebruiker beheer instructies: [`docs/admin/02-gebruiker-beheer.md`](docs/admin/02-gebruiker-beheer.md:1)

Voor wie is deze handleiding
- System administrators
- Owners / organisatiebeheerders
- DevOps- en supportmedewerkers die administratieve taken uitvoeren

Voorwaarden en toegang
- Admin-accounts hebben elevated privileges binnen de applicatie. Zorg dat admin-accounts beveiligd zijn met:
  - Sterk wachtwoordbeleid en MFA (2FA)
  - Beperkte toegang via e-mail-allowlist of SSO waar mogelijk
  - Gebruik van dedicated admin service accounts voor scripts en CI

1. Organisatie aanmaken en configureren
- Locatie in UI:
  - Navigeer naar: Admin dashboard → Organisaties → 'Nieuwe organisatie'
- Vereiste velden:
  - Organisatienaam
  - Land / regio
  - Standaard tijdzone
  - Standaard branding (optioneel)
- Stappen:
  1. Klik 'Nieuwe organisatie'
  2. Vul de velden in en klik 'Opslaan'
  3. Wijs een eigenaar toe (rol: Owner)
  4. Controleer dat de organisatie zichtbaar is in de lijst en / of via de API:
     - GET /api/organizations (zie [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1))

2. Rollen & permissies overzicht
- Standaardrollen in het systeem:
  - Owner (volledige rechten voor organisatie)
  - Admin (beheer van gebruikers en instellingen)
  - Safety Manager (processen en incident management)
  - Supervisor (toezicht en goedkeuring)
  - Field Worker (veldactiviteiten; beperkte toegang)
- Role mapping:
  - Rollen worden toegewezen via de Admin UI of via de API (`/api/auth/set-claims/route.ts` in repo).
  - Voor programmatische toewijzing: gebruik de set-claims API of Firebase Admin SDK (zie [`docs/backend/02-firebase-admin-guide.md`](docs/backend/02-firebase-admin-guide.md:1)).

3. Gebruikers aanmaken en beheren
- Aanmaken via UI:
  1. Admin dashboard → Gebruikers → 'Nieuwe gebruiker'
  2. Vul naam, e-mail en (optioneel) telefoonnummer in
  3. Wijs rol(en) en organisatie toe
  4. Verstuur uitnodiging (e-mail met registratie-link)
- Bulk import:
  - Voor CSV import gebruik de admin CSV-import tool (indien aanwezig) of schrijf een kleine script die de Users endpoint en set-claims API gebruikt.
- Wijzigen van gebruikers:
  - Wijzig profielgegevens, rollen en organisatie-toewijzing via Admin UI of via PATCH /api/users/:id
- Verwijderen of deactiveren:
  - Prefer deactiveer i.p.v. verwijderen voor audit-doeleinden (set user.active = false)
  - Verwijder pas wanneer verzekerd is dat er geen gekoppelde kritieke records zijn; documenteer in PROJECT_MEMORY.md.

4. Authenticatie & accounts herstellen
- Wachtwoord reset:
  - Admins kunnen een password-reset link sturen vanuit de gebruikersbeheer UI.
  - Voor bulk resets: gebruik Firebase Auth console of Admin SDK.
- Multi-factor / MFA:
  - Aanbeveling om MFA verplicht te stellen voor admin-accounts.
  - Documenteer MFA policies en recovery flows in interne security docs.
- Account lockout en failover:
  - Monitor verdachte login activiteit en configureer alerts (zie monitoring guide).

5. Rollen toewijzen via UI (stap-voor-stap)
1. Open Admin dashboard → Gebruikers
2. Zoek gebruiker op e-mail of naam
3. Klik op gebruiker → 'Wijzig rollen'
4. Vink de gewenste rol(len) aan en sla op
5. Validatie: Vraag gebruiker uit te loggen en opnieuw in te loggen om claims te verversen
6. Programmatic check:
   - Controleer via API of via Firebase token claims dat rol correct is toegekend.

6. Veelvoorkomende admin-workflows
- Nieuwe organisatie onboarden:
  1. Maak organisatie aan (zie sectie 1)
  2. Maak initiele admin(s) aan en wijs Owner toe
  3. Stel standaard instellingen in (e-mail templates, branding)
  4. Seed standaard data via seeding scripts (indien beschikbaar)
  5. Documenteer onboarding stappen in PROJECT_MEMORY.md
- Gebruiker support / account issues:
  - Reset wachtwoord, controleer role claims, controleer logs en last successful login.
  - Als data ontbreekt, controleer backup (zie [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)) en volg test-restore checklist.
- Incident management:
  - Koppel support ticket aan incident en wijs eigenaar toe.
  - Schakel accounts tijdelijk uit indien security incident.

7. Admin API en scripting
- Relevante endpoints:
  - GET /api/organizations
  - POST /api/organizations
  - GET /api/users
  - PATCH /api/users/:id
  - POST /api/auth/set-claims (zie code in `web/src/app/api/auth/set-claims/route.ts`: [`web/src/app/api/auth/set-claims/route.ts`](web/src/app/api/auth/set-claims/route.ts:1))
- Voorbeelden:
  - Toewijzen rol via API (pseudo):
    - POST /api/auth/set-claims { uid: "USER_UID", claims: { role: "admin", orgId: "ORG_ID" } }
  - Gebruik altijd service accounts / server-side autorisatie voor admin operaties.

8. Auditing & logs
- Admin acties loggen:
  - Log: wie, wat, wanneer (user id, actie, timestamp, affected resources)
  - Zorg dat logs bewaard worden in een centrale log- of observability stack
- Toegangslogs:
  - Controleer regelmatig wie admin-rechten heeft en roterende toegang (least privilege)

9. Security best practices
- Least privilege: geef admins alleen de permissies die nodig zijn
- MFA verplicht voor admin accounts
- Gebruik policy-based toegang en review rollen regelmatig
- Gebruik dedicated service accounts voor CI en scripting
- Bewaar en roteer API keys en service account keys via secret manager
- Documenteer alle admin veranderingen in PROJECT_MEMORY.md

10. Backups en restores (kort overzicht)
- Raadpleeg de volledige backup & restore handleiding: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- Belangrijke punten:
  - Test restores in staging
  - Gebruik dedicated backup service account met minimaal benodigde IAM
  - Schakel writes uit tijdens production restore waar mogelijk

11. Troubleshooting veelvoorkomende problemen
- Gebruiker ziet geen admin features:
  - Controleer rol claims in token
  - Vraag gebruiker om uit-/inloggen (to force claim refresh)
  - Controleer op caching of feature-flag restricties
- API errors bij user management:
  - Controleer logs, valideer payloads, controleer permissies van service account
- Onverwachte data inconsistencies:
  - Valideer tegen laatste backups en voer test-restore in staging

12. Change management en release flow
- Documenteer schema wijzigingen of belangrijke admin changes in PROJECT_MEMORY.md
- Voor grote wijzigingen: plan rollout in staging, run migration scripts en QA flows
- Communiceer downtime met stakeholders en documenteer rollback-steps

13. Toegangsproces en onboarding van admin-accounts
- Onboarding checklist:
  - Identiteitsverificatie (KYC / bedrijfs-e-mail)
  - MFA setup
  - Introductie training (admin UI, incident response)
  - Toewijzen van opleiding materiaal en handleidingen (link naar gebruikershandleidingen)
- Offboarding checklist:
  - Deactiveer account, verwijder rollen, roteer secrets als nodig

14. Rollen matrix (voorbeeld)
- Owner: [manage org, manage users, view billing, restore backups]
- Admin: [manage users, change settings, view logs]
- Safety Manager: [manage incidents, view reports]
- Supervisor: [approve workflows, view team data]
- Field Worker: [submit reports, view assigned tasks]

15. FAQ
- Q: Hoe wijzig ik de rol van meerdere gebruikers tegelijk?
  - A: Gebruik een bulk import script of CSV importer; voer set-claims iteratief via Admin API.
- Q: Hoe test ik of set-claims werkt?
  - A: Wijs claim toe, vraag gebruiker token te verversen en inspecteer token payload (of roep /api/me aan).
- Q: Wat te doen bij per ongeluk verwijderen van data?
  - A: Stop writes, identificeer laatste goede backup en volg de test-restore checklist (zie backup handleiding).

16. Contact & escalatie
- Eerste lijn support: support@[TODO-YOUR-COMPANY].example (pas aan)
- Backup & ops owner: ops@[TODO-YOUR-COMPANY].example (pas aan)
- Documenteer elke wijziging in PROJECT_MEMORY.md met:
  - Datum/tijd, uitgevoerd door, Git SHA / CI run ID, resultaat en notities

17. Appendix
- Relevante bestanden en locaties in repo:
  - Admin organisatie beheer instructies: [`docs/admin/01-organisatie-beheer.md`](docs/admin/01-organisatie-beheer.md:1)
  - Admin gebruiker beheer: [`docs/admin/02-gebruiker-beheer.md`](docs/admin/02-gebruiker-beheer.md:1)
  - Data manipulatie: [`docs/admin/03-data-manipulatie.md`](docs/admin/03-data-manipulatie.md:1)
  - Backup & restore: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
  - API endpoints: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)

Einde van handleiding.