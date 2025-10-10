# Field Worker Handleiding

Deze handleiding is bedoeld voor veldmedewerkers (field workers). Het beschrijft dagelijkse workflows, het melden van incidenten en observaties, het invullen van formulieren en checklists, en praktische tips voor mobiel gebruik.

Belangrijke verwijzingen:
- Admin procedures: [`docs/gebruikers/01-admin-gebruikershandleiding.md`](docs/gebruikers/01-admin-gebruikershandleiding.md:1)
- Safety Manager handleiding: [`docs/gebruikers/02-safety-manager-handleiding.md`](docs/gebruikers/02-safety-manager-handleiding.md:1)
- Supervisor handleiding: [`docs/gebruikers/03-supervisor-handleiding.md`](docs/gebruikers/03-supervisor-handleiding.md:1)
- Backup procedures: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)
- Emulator helper (for seeded testing): [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)

Voor wie is deze handleiding
- Veldmedewerkers die inspecties uitvoeren, incidenten melden en taken voltooien.
- Nieuwe medewerkers tijdens onboarding voor praktijkinstructies.

1. Toegang en eerste stappen
- Ontvangst van uitnodiging:
  - Je ontvangt een e-mail met registratie-link. Volg de instructies om account aan te maken.
- Eerste login:
  - Stel een sterk wachtwoord in en configureer MFA indien gevraagd.
  - Controleer dat je aan de juiste organisatie is gekoppeld.
- Profiel:
  - Vul naam, telefoonnummer en prefered contactmethodes in.

2. Mobiele interface & basisnavigatie
- Belangrijke schermen:
  - Dashboard: overzicht toegewezen taken en meldingen
  - Tasks/Tickets: openstaande en toegewezen taken
  - Report / Incident: formulier voor melden van incidenten of near-misses
  - Inspecties / Checklists: kies template en start inspectie
- Offline overwegingen:
  - App zal lokale data cachen (indien ondersteund). Zorg dat je app synchroniseert zodra er netwerk is.
  - Bewaar foto’s tijdelijk en upload ze in gebieden met netwerk.

3. Incidenten en near-miss melden (stap-voor-stap)
- Wanneer te melden:
  - Ongevallen, verwondingen, near-misses, gevaarlijke situaties of observaties die risico's laten zien.
- Melding formulier: verplichte velden
  - Datum & tijd (automatisch)
  - Locatie (GPS of handmatig)
  - Type: near-miss / injury / hazard
  - Korte beschrijving (wat gebeurde)
  - Foto(s) (optioneel maar aanbevolen)
  - Betrokken personen (gebruik user lookup)
- Stappen:
  1. Navigeer naar Report → New Incident
  2. Vul velden in en voeg foto’s toe
  3. Voeg eventuele eerste maatregelen toe (immediate actions)
  4. Klik Submit
- Na submit:
  - Supervisor of Safety Manager ontvangt melding voor review
  - Bewaar het incident ID voor follow-up

4. Foto’s en bewijs uploaden
- Tips voor goede foto’s:
  - Zorg voor context (landmarks) en close-ups van schade
  - Voeg meerdere hoeken toe indien relevant
  - Vermijd persoonsgegevens in foto’s tenzij essentieel (privacy)
- Technische tips:
  - Compress large photos client-side if needed
  - Retry upload bij netwerkfouten
  - Controleer opslag-limieten (max file size)

5. Inspecties & checklists (veldgebruik)
- Starten van een inspectie:
  1. Ga naar Inspecties → Nieuwe inspectie
  2. Kies template (bv. Toolbox, Site Inspection)
  3. Vul elk checklist-item in (OK / Not OK / N/A)
  4. Voeg foto’s of opmerkingen toe bij items die niet in orde zijn
  5. Voltooi en verstuur de inspectie
- Acties na inspectie:
  - Wijs follow-up acties toe of markeer items als resolved
  - Supervisor of Safety Manager zal acties reviewen

6. Taken uitvoeren en status updaten
- Taken overzicht:
  - Bekijk “My tasks” of “Assigned to team”
  - Filter op locatie, deadline of priority
- Werkstatus bijwerken:
  - Open taak → Update status (in progress / blocked / completed)
  - Voeg commentaar en bewijs toe bij voltooiing
- Voltooien:
  - Mark task as complete en upload bewijs (foto, formulier)

7. Forms en formulier-invoer beste praktijken
- Houd beschrijvingen kort en feitelijk
- Gebruik systemen van timestamps en locaties waar mogelijk
- Voeg referenties of ticket-nummers toe bij follow-ups

8. Notifications & communicatie
- Ontvangen notificaties:
  - Nieuwe taak toegewezen
  - Opmerking of vraag van supervisor
  - Herinneringen voor overdue tasks
- Reageren:
  - Gebruik in-app comments om discussie traceerbaar te houden
  - Voor urgente zaken: bel of gebruik directe kanalen die org policy voorschrijft

9. Privacy & veiligheid in veld
- Deel geen onnodige persoonsgegevens in meldingen
- Draag passende PPE en documenteer compliance in inspecties
- Als er medische informatie is, markeer als gevoelig en beperk toegang (volg org policy)

10. Veelvoorkomende problemen en oplossingen
- App synchroniseert niet:
  - Controleer netwerk, force sync of logout/login
  - Bij persistent failure, maak screenshot van console errors en file a support ticket
- Foto upload fails:
  - Herstart app en probeer opnieuw; controleer bestandsgrootte
- Kan geen locatie selecteren:
  - Check device permissions for location access

11. Offline & sync details
- Werk offline en synchroniseer later:
  - Data wordt lokaal opgeslagen; zorg dat je synchroniseert bij netwerkherstel
  - Conflicts: de server wint meestal; controleer recent updates en meld conflicts aan supervisor
- Data limits:
  - Beperk grote attachments; gebruik WiFi voor uploads waar mogelijk

12. Training & onboarding
- Oefen met seeded data in staging/emulator:
  - Gebruik emulator exports to seed exercises (refer to emulator guide)
- Practical exercises:
  - Maak 3 test reports, voer 1 inspectie uit en voltooi 2 taken
- Documenteer training sessie in PROJECT_MEMORY.md

13. Security & acceptable use
- Meld verdachte activiteit aan supervisor of security team
- Gebruik alleen toegewezen accounts en deel geen wachtwoorden
- Volg OTP / MFA policies strikt

14. FAQ
- Q: Hoe voeg ik een foto toe aan een incident?
  - A: Tijdens incident formulier, klik 'Add photo' en selecteer camera of gallery. Wacht op upload indicator.
- Q: Waarom is mijn taak niet zichtbaar?
  - A: Controleer filters, organisatie-toewijzing en user.active flag; vraag supervisor om status-check.
- Q: Hoe kan ik eerdere incidenten terugvinden?
  - A: Gebruik Reports → Search by ID / date / location

15. Contact & support
- Support: support@[TODO-YOUR-COMPANY].example
- Supervisor: zie organisatie dashboard voor contactinformatie
- Ops (bij technische issues of data restore): ops@[TODO-YOUR-COMPANY].example

16. Appendix: relevante bestanden en implementatie-locaties
- Emulator helper: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- API endpoints: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)
- Backup & restore: [`docs/admin/04-backup-restore-guide.md`](docs/admin/04-backup-restore-guide.md:1)

Einde handleiding.