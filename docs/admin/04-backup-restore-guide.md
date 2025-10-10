# Backup & Restore Guide

Dit document beschrijft hoe je backups en restores uitvoert voor zowel lokale ontwikkeling met de Firebase Emulators als voor productie (Firestore + Cloud Storage). Het bevat concrete commando's, best practices, beveiligingsrichtlijnen en een test-restore checklist.

## Overzicht

Scope:
- Lokale emulator exports/imports
- CI patterns voor emulator-backed tests
- Productie exports (Firestore → GCS) en imports (restore)
- Cloud Storage backups en synchronisatie
- Automatisering, retentie en IAM-vereisten
- Test-restore en emergency rollback procedures

## Emulator backups (lokale ontwikkeling)

1) Exporteren van emulator data

Gebruik de Firebase CLI om een snapshot van alle emulator-data te maken:

Voorbeeld:
firebase emulators:export ./emulator-backups/20250930 --project=hale-ripsaw-403915

Tip: gebruik een pad dat buiten de repo staat (bijv. een gedeelde artefact-map of CI-artifact). Voeg lokale backup-mappen toe aan `.gitignore`.

2) Importeren / terugzetten in emulator

Start emulators en laad een export terug in:

Voorbeeld:
firebase emulators:start --import=./emulator-backups/20250930

Dit laadt Firestore, Auth en Storage data terug zoals opgeslagen tijdens export.

Tips:
- Gebruik datum-gebaseerde mappen (YYYYMMDD) voor overzicht.
- Houd meerdere snapshots voor snelle rollback naar recente testgegevens.
- Versleutel backups wanneer je ze bewaart in gedeelde opslag.

## CI: emulator export & restore pattern

In CI workflows wil je emulators starten, tests draaien en -optioneel- exports bewaren.

Voorbeeld (GitHub Actions, pseudo-steps):
- actions/checkout@v3
- name: Install deps
  run: npm ci
- name: Start emulators
  run: firebase emulators:start --only firestore,auth,storage --project=hale-ripsaw-403915 --export-on-exit=./emulator-backups/ci
- name: Run tests
  run: npm run test:emulated
- name: Upload backup artifact
  uses: actions/upload-artifact@v4
  with:
    name: emulator-backup
    path: ./emulator-backups/ci

Gebruik `--export-on-exit` om automatisch een export te maken wanneer de emulator stopt. Upload het resultaat als CI-artifact voor debugging.

## Productie backups (Firestore → Google Cloud Storage)

Gebruik de gcloud CLI voor consistente, managed exports van Firestore naar een GCS-bucket.

1) Handmatige export (selectieve collecties)
gcloud firestore export gs://my-bucket/backups/tra-backup-20250930 --project=hale-ripsaw-403915 --collection-ids="organizations"

2) Volledige export (alle collecties)
gcloud firestore export gs://my-bucket/backups/tra-backup-20250930 --project=hale-ripsaw-403915

Opmerkingen:
- Zorg dat `gcloud` is geconfigureerd met een service account dat de juiste permissies heeft.
- Gebruik object lifecycle regels in GCS om oudere backups automatisch te verwijderen (retentie).
- Plan exports via Cloud Scheduler of een cron-job in een beheerproject.

## Productie restore

Herstellen van een export:

gcloud firestore import gs://my-bucket/backups/tra-backup-20250930 --project=hale-ripsaw-403915

Veiligheidsmaatregelen:
- Schakel, indien mogelijk, schrijfverkeer tijdelijk uit of zet de applicatie in onderhoudsmodus.
- Herstel eerst naar een staging- of testproject om integriteit te valideren.
- Monitor operationele kosten tijdens het importproces (restore kan data-/ops-kosten veroorzaken).

## Backups voor Storage (bestanden)

Cloud Storage bevat vaak foto’s en bijlagen; deze moeten apart geback-upt worden.

1) Lokale copy van een bucket-object:
gsutil -m cp -r gs://my-bucket/path ./local-backup

2) Synchronisatie tussen buckets:
gsutil -m rsync -r gs://source-bucket gs://backup-bucket

Opmerkingen:
- Gebruik `-m` (multithreaded) voor performance.
- Overweeg versiebeheer (Object Versioning) op GCS-buckets voor extra veiligheid.
- Voor GDPR-compliance: documenteer waar persoonlijke gegevens worden opgeslagen en hoe ze worden verwijderd.

## Automatisering & schema

Aanbevelingen:
- Dagelijkse exports: Cloud Scheduler → Cloud Function / Cloud Run job die `gcloud firestore export` uitvoert.
- Retentiebeleid: standaard 30 dagen (pas aan op basis van compliance).
- Bewaar langere termijn snapshots (bijv. maandelijkse) voor audits.
- Beheer opslagkosten via lifecycle rules (delete/nearline/ coldline transitions).

## IAM & security

Service accounts en permissies:
- Maak een dedicated backup service account met minimale rechten.
- Nodige rollen (voor export/import): roles/datastore.importExportAdmin (of geïnteresseerde granular roles) en storage.objectAdmin op de target bucket.
- Gebruik korte-lived credentials of Workload Identity voor Cloud Run/Functions.
- Versleutel backups (Customer-Managed Encryption Keys) als dat vereist is door compliance.

## Test-restore checklist

Voer deze checklist uit voordat je een restore in productie doet:

1. Verifieer projectId en bucket naam.
2. Schakel schrijfverkeer tijdelijk uit (of plan downtime).
3. Restore eerst naar een staging-project en voer end-to-end checks uit.
4. Vergelijk document counts en steekproef data (bijv. aantal organizations, users).
5. Valideer security rules en storage toegangsregels na restore.
6. Test kritieke user flows (login, TRA zoeken, LMRA uitvoeren).
7. Log en documenteer exacte stappen en tijdstempels in [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1).

## Emergency rollback procedure

Als een restore fout gaat of data corrupt raakt:

1. Identificeer de meest recente goede backup (timestamp).
2. Voer restore uit op staging en valideer integriteit.
3. Communiceer geplande downtime met stakeholders.
4. Perform restore in productie en voer validatiechecks uit (document counts, sanity checks).
5. Documenteer alle acties en lessons learned in PROJECT_MEMORY.md.

## Best practices

- Test restores regelmatig (bijv. maandelijks) in een staging-omgeving.
- Automatisch exporteren en bewaken (alerts op backup failures).
- Houd backups buiten hetzelfde project als extra veiligheidslaag (optioneel).
- Beperk toegang tot backup-artifact repositories en buckets.
- Bewaar metadata over elke backup: timestamp, committer, git SHA, CI run id.

## Retentie & compliance

- Aanbevolen standaardretentie: 30 dagen (aanpasbaar).
- Houd langere retentie voor compliance-rechten (archivering).
- Zorg voor GDPR-procedures: als gebruiker verwijderverzoeken nodig zijn, documenteer hoe dit in backups wordt afgehandeld.

## Monitoring & alerting

- Stel alerts in voor:
  - Mislukte exports/imports
  - GCS bucket storage growth
  - Onverwachte restore-activiteiten
- Integreer met Sentry/uptime/alerting stack en sla logs centraal op.

## Appendix: Voorbeelden & relevante bestanden

- Referenties in deze repo:
  - [`firebase.json`](firebase.json:1) — emulator configuratie en poorten
  - [`FIREBASE_EMULATOR_GUIDE.md`](FIREBASE_EMULATOR_GUIDE.md:1) — uitgebreide emulator instructies
  - [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1) — helper voor emulator connectie en seeding
  - API endpoints gerelateerd aan organisatie data: [`docs/backend/01-api-endpoints-guide.md`](docs/backend/01-api-endpoints-guide.md:1)

## Contact & verantwoordelijkheid

- Backup owner / contact: ops@[TODO-YOUR-COMPANY].example (pas aan naar juiste contact)
- Documenteer elke backup/restore gebeurtenis in [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md:1) met:
  - Datum/tijd
  - Uitgevoerd door (CI job / gebruiker)
  - Git SHA / CI run ID
  - Resultaat (success/failure)
  - Notities en follow-up acties

Einde van de handleiding.