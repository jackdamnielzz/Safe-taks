# Supervisor Handleiding

Deze handleiding is bedoeld voor Supervisors die dagelijks toezicht houden op teams en werkzaamheden in het veld. Het beschrijft de belangrijkste workflows, goedkeuringsprocessen, inspecties en praktische instructies voor gebruik van de applicatie.

Belangrijke verwijzingen:
- Project logboek: [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1)
- Admin handleiding: [`docs/gebruikers/01-admin-gebruikershandleiding.md`](docs/gebruikers/01-admin-gebruikershandleiding.md:1)
- Safety Manager handleiding: [`docs/gebruikers/02-safety-manager-handleiding.md`](docs/gebruikers/02-safety-manager-handleiding.md:1)
- Backup procedures: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- API referentie: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)
- Emulator helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)

Doelgroep
- Supervisors en team leads
- Operationele managers die dagelijks werkzaamheden en goedkeuringen beheren

Hoofdtaken van een Supervisor
- Toewijzen en monitoren van taken voor field workers
- Eerste beoordeling van incidentmeldingen en rapporten
- Goedkeuren of afwijzen van workflows en acties
- Uitvoeren van inspecties en toolbox-checks
- Communiceren met Safety Managers en Owners bij escalaties

1. Toegang & rollen
- Supervisors hebben meer rechten dan field workers (bv. goedkeuren en toewijzen) maar minder dan Safety Managers en Admins.
- Rollen worden toegewezen via Admin UI of API (`/api/auth/set-claims`).
- Volg onboarding en security richtlijnen zoals beschreven in de admin-handleiding.

2. Dagelijkse workflow overzicht
- Dagelijkse checks:
  - Openstaande taken voor teamleden
  - Nieuwe incidentmeldingen die beoordeling nodig hebben
  - Overdue acties die aandacht vereisen
- Prioriteitsregels:
  - Geef prioriteit aan safety-critical items en overdue acties
  - Escaleer severity > 2 naar Safety Manager

3. Taken toewijzen en monitoren
- Toewijzen van taken:
  1. Open Tasks/Tickets in dashboard
  2. Selecteer taak en klik 'Toewijzen'
  3. Kies medewerker(s), deadline en eventuele bijlagen
  4. Voeg korte instructie of extra context toe
- Monitoren:
  - Volg voortgang via Task board of per medewerker overzicht
  - Gebruik filters: organisatie, locatie, status, priority

4. Incident intake & eerste beoordeling
- Als supervisor ontvang je vaak de eerste melding:
  1. Open incident en controleer basale gegevens (tijd, locatie, beschrijving)
  2. Voeg aanvullende context toe indien beschikbaar
  3. Zet initial severity (voor review door Safety Manager)
  4. Wijs voorlopige corrigerende actie toe indien noodzakelijk
- Documenteer beslissingen in incident comments.

5. Goedkeuringen en afwijzingen
- Workflow goedkeuring:
  - Sommige acties of documenten vereisen supervisor approval (bijv. vrijstelling, werkvergunning)
  - Procedures:
    1. Open het item
    2. Bekijk bijlagen en case notes
    3. Klik 'Approve' of 'Reject' met toelichting
    4. Bij approve: zet status en meld betrokkenen
    5. Bij reject: voeg reden, verwachte aanpassingen, en herindien instructies
- Traceer beslissingen zodat audit trail compleet is.

6. Inspecties en toolbox meetings
- Plan en voer inspecties uit:
  - Gebruik checklist templates (Admin → Templates)
  - Tijdens inspectie: vul checklist, voeg foto’s en opmerkingen toe
  - Wijs follow-up acties direct vanuit de inspectie
- Toolbox meetings:
  - Plan kort trainingsmoment en log aanwezigheid
  - Koppel meeting-notes aan team en bijbehorende acties

7. Rapportage en KPI's
- Belangrijke KPI's voor supervisors:
  - Voltooiingspercentage taken per week
  - Aantal openstaande acties per medewerker
  - Gemiddelde doorlooptijd van incident tot closure
- Exporteer rapporten via UI of API (GET /api/reports) voor management bespreking.

8. Communicatie & notificaties
- Notificaties die supervisors ontvangen:
  - Nieuwe taaktoewijzing
  - Update op toegewezen acties
  - Meldingen van teamleden (bijv. incident upload)
- Best practices:
  - Houd notificatie-instellingen per organisatie goed afgestemd (Admin → Settings)
  - Gebruik in-app comments voor traceerbare communicatie

9. Mobile/field tips
- Supervisors gebruiken vaak mobiele apparaten:
  - Gebruik offline-capable flows voor momentane field use (indien app ondersteunt)
  - Maak korte, duidelijke instructies voor field workers
  - Zorg dat foto-uploads voldoen aan limieten (grootte/resolutie)

10. Troubleshooting veelvoorkomende issues
- Taken verdwijnt uit bord:
  - Controleer filters en status
  - Verifieer autorisatie en rolclaims
- Medewerker kan taak niet accepteren:
  - Check user active status en organisatie-toekenning
  - Check network/errors in client-console and server logs
- Photo upload errors:
  - Controleer Storage rules en bucket permissies (zie [`docs/backend/04-security-rules-guide.md`](docs/backend/04-security-rules-guide.md:1))

11. Escalatie- en communicatie-procedures
- Wanneer escaleren:
  - Severity >= 2 of wanneer locatie / resources bedreigd zijn
  - Als acties overdue > configured threshold
- Escalatie flow:
  1. Informeer direct de Safety Manager (in-app + e-mail)
  2. Indien critique: informeer Owner en ops@[TODO-YOUR-COMPANY].example
  3. Documenteer in incident notes en PROJECT_MEMORY.md

12. Training & onboarding voor supervisors
- Onboarding checklist:
  - Walkthrough van task management en approval workflows
  - Practicals: create tasks, assign, approve/reject, run simple reports
  - Seeded data walkthrough using emulator exports (refer to [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1))
- Periodieke refresh training aanbevolen (quarterly)

13. Best practices
- Communiceer beslissingen via in-app comments (traceerbaar)
- Houd taken klein en duidelijk geprioriteerd
- Maak gebruik van templates voor repetitieve werkstromen
- Houd administratie up-to-date voor audits

14. FAQ
- Q: Hoe wijs ik snel taken toe aan een groep?
  - A: Gebruik bulk-assign functie in Tasks view of gebruik API endpoint om meerdere assignments te maken
- Q: Wat te doen bij inconsistent task status tussen users?
  - A: Controleer race conditions en recente updates; force a sync in client or check server logs

15. Contact & ondersteuning
- Eerste lijn support: support@[TODO-YOUR-COMPANY].example
- Ops & backups: ops@[TODO-YOUR-COMPANY].example
- Security & compliance: security@[TODO-YOUR-COMPANY].example
- Log belangrijke beslissingen en handelingen in PROJECT_MEMORY.md

16. Appendix: relevante bestanden en endpoints
- Admin user manual: [`docs/gebruikers/01-admin-gebruikershandleiding.md`](docs/gebruikers/01-admin-gebruikershandleiding.md:1)
- Safety manager manual: [`docs/gebruikers/02-safety-manager-handleiding.md`](docs/gebruikers/02-safety-manager-handleiding.md:1)
- Backup guide: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- API endpoints: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)

Einde handleiding.