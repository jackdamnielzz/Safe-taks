# Safety Manager Handleiding

Deze handleiding is bedoeld voor Safety Managers binnen het systeem. Ze behandelt verantwoordelijkheden, dagelijkse workflows, incident- en rapportageprocessen, escalatieprocedures en praktische instructies voor het gebruik van de applicatie.

Referenties:
- Project logboek: [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1)
- API endpoints: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)
- Organisatie beheer: [`docs/admin/01-organisatie-beheer.md`](docs/admin/01-organisatie-beheer.md:1)
- Gebruiker beheer: [`docs/admin/02-gebruiker-beheer.md`](docs/admin/02-gebruiker-beheer.md:1)
- Backup procedures: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)

Voor wie is deze handleiding
- Safety Managers
- Incident response leads
- Health & Safety officers die het platform gebruiken voor registraties en rapportage

Belangrijkste verantwoordelijkheden
- Toezicht houden op incidenten- en near-miss rapportages
- Initiëren en opvolgen van corrigerende acties
- Goedkeuren van veiligheidsplannen en toolbox meetings
- Rapportage naar management en het beheren van veiligheidsstatistieken

1. Toegang en rollen
- Safety Managers hebben in het algemeen meer rechten dan supervisors maar minder dan Owners.
- Rollen worden toegewezen via Admin UI of programmatic API (`/api/auth/set-claims`).
- Zorg voor MFA en beperkte accounttoegang; volg de admin-handleiding voor onboarding procedures.

2. Dashboard en belangrijke schermen
- Locatie UI:
  - Navigeer naar: Dashboard → Safety → Incidenten
  - Belangrijke widgets: openstaande acties, recente incidenten, KPI grafieken (aantal incidenten per maand)
- Wat te controleren dagelijks:
  - Nieuwe incidentmeldingen (unreviewed)
  - Onvoltooide corrigerende acties
  - Trends (toename in specifieke incidenttypes)
  - Overdue inspections of toolbox-events

3. Incident melden en beoordelen
- Invoer (door field worker of supervisor):
  - Velden: datum, locatie, type incident (near-miss, injury, hazard), beschrijving, foto-upload, betrokken personen, severity score
- Intake door Safety Manager (stappen):
  1. Open incident in lijst
  2. Controleer bijgevoegde bewijsstukken (foto's, notities)
  3. Beoordeel severity en wijs prioriteit toe
  4. Maak of wijs corrigerende acties toe aan een verantwoordelijke (owner)
  5. Stel een target completion date in en voeg opvolgnotities toe
- API: Incident detail is beschikbaar via GET /api/incidents/:id (zie backend endpoints)

4. Corrigerende acties en opvolging
- Creëren van actie:
  - Voeg taakbeschrijving, eigenaar, deadline en benodigde resources toe
  - Koppel acties aan trainingsmateriaal of SOPs indien relevant
- Volgen:
  - Gebruik het “Actions” pane voor statusupdates (open, in-progress, blocked, closed)
  - Voeg bewijs toe bij voltooiing (foto, formulier)
- Escalatie:
  - Stel automatische escalaties in voor overdue acties (bijv. > 7 dagen)
  - Voor kritische incidenten: escaleren naar Owner en ops@[TODO-YOUR-COMPANY].example

5. Rapportage en exports
- Voorbeeld rapporten:
  - Incidenten per maand (CSV / PDF)
  - Openstaande acties per owner
  - Trendanalyse per locatie of activiteitstype
- Exports:
  - Gebruik UI-export of API (GET /api/reports/incidents?from=...&to=...)
  - Voor grote exports of archiefvragen: vraag ops om toegang tot GCS backups via procedures in [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)

6. Inspecties & checklists
- Maak en beheer checklists (Toolbox, Site Inspection):
  - Checklist templates kunnen worden aangemaakt via Admin → Templates
  - Tijdens inspecties: vul velden in, maak foto’s en wijs follow-ups toe
- Inspectie workflow:
  1. Plan inspectie en wijs inspecteur toe
  2. Voer inspectie uit in het veld (mobile-friendly)
  3. Bekijk automatische samenvatting en wijs acties toe
  4. Archiveer inspectie na validatie

7. Training en preventieve maatregelen
- Koppel incidenten aan trainingsbehoeften
- Maak verplicht trainingsmodules voor specifieke rollen (bijv. nieuw personeel)
- Volg trainingsstatus via Reports → Training

8. Communicatie en notificaties
- Notificatie types:
  - Nieuwe incidentmelding (email/push)
  - Toegewezen actie
  - Overdue actie / escalatie
- Configuratie:
  - Notificatie-instellingen per organisatie in Admin → Settings
  - Voor systeemkritische alerts: configureer monitoring / alerting via Sentry / uptime (zie monitoring guide)

9. Data privacy en gevoelige informatie
- Alle persoonsgegevens minimaliseren in incidentbeschrijvingen; gebruik person-ids i.p.v. volledige persoonlijke data waar mogelijk
- Volg GDPR-procedures bij opslag en retention; verwijder verzoeken behandelen volgens beleid
- Bij opslaan van medische informatie: beperk toegang en documenteer in PROJECT_MEMORY.md

10. Integraties en externe systemen
- Integraties kunnen bestaan uit:
  - E-mail notificaties via SendGrid / SMTP
  - Exports naar BI tools via CSV / GCS
- Voor integratie-implementaties, raadpleeg backend API guide en ops team

11. Best practices voor evidence collection (foto’s, tijdlijnen)
- Maak duidelijke foto’s met context (landmarks, timestamp)
- Voeg korte, feitelijke notities toe (wat gebeurde, wie, waarom bekend)
- Houd een chronologische log in incident comments

12. Verantwoordingslijnen en audits
- Audit trails:
  - Alle belangrijke wijzigingen worden gelogd (wie, wat, wanneer)
  - Bewaar audit logs in observability stack; beperk toegang tot security team
- Audit voorbereiding:
  - Voor audits: exporteer incidents en actions over de gevraagde periode en zorg voor attachments

13. Escalatie matrix (voorbeeld)
- Severity 1 (life-threatening):
  - Directe telefoontjes + notificatie Owner + ops alert
  - Mogelijke evacuatie en emergency procedures
- Severity 2 (serious injury):
  - Notificatie Owner en Safety Manager
  - Start incident investigation
- Severity 3 (near-miss / hazard):
  - Assign corrective action, monitor trends

14. Veelvoorkomende problemen en oplossingen
- Foto’s worden niet geüpload:
  - Controleer bestandsgrootte-limiet en Storage permissies
- Actie eigenaren krijgen geen notificatie:
  - Controleer notificatie-instellingen en gebruikers-e-mailvalidatie
- Onjuiste severity scoring:
  - Update scoring via incident review en documenteer rationale

15. Rollen & verantwoordelijkheden (kort overzicht)
- Safety Manager: incident review, actie-eigenaarschap, rapportage
- Supervisor: dagelijkse monitoring en eerste beoordeling
- Field Worker: incident reporting en evidence collection
- Owner: governance en final approval voor kritieke beslissingen

16. Training & onboarding voor Safety Managers
- Aanbevolen onboarding:
  - Walkthrough van dashboard en incident workflows
  - Oefen scenario’s met seeded data (gebruik emulator exports)
  - Review van rapportage templates en escalation flows
- Documenteer training in PROJECT_MEMORY.md met datum en deelnemers

17. FAQ
- Q: Hoe wijzig ik een toegewezen actie-eigenaar?
  - A: Open de actie, klik 'Wijzig eigenaar', selecteer nieuwe eigenaar en sla op
- Q: Hoe exporteer ik de incidenten van het laatste kwartaal?
  - A: Ga naar Reports → Incidents → kies datum-range → Export CSV
- Q: Hoe stel ik automatische escalaties in?
  - A: Admin → Settings → Automations → Escalation rules

18. Contact en ondersteuning
- Eerste lijn: support@[TODO-YOUR-COMPANY].example
- Ops & backups: ops@[TODO-YOUR-COMPANY].example
- Security & compliance: security@[TODO-YOUR-COMPANY].example
- Vergeet niet alle belangrijke acties en beslissingen in PROJECT_MEMORY.md te loggen.

19. Appendix: relevante bestanden
- Admin organisatie beheer: [`docs/admin/01-organisatie-beheer.md`](docs/admin/01-organisatie-beheer.md:1)
- API endpoints: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)
- Backup procedures: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- Emulator helper (voor seeded testing): [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)

Einde handleiding.