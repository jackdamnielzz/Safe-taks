# SafeWork Pro - Documentatie & Handleidingen

**Versie**: 1.0.0  
**Laatste Update**: 30 september 2025  
**Project**: TRA/LMRA Web Applicatie

## Overzicht Documentatie

Deze documentatie bevat alle handleidingen die nodig zijn voor het effectief gebruiken, testen, onderhouden en beheren van SafeWork Pro.

## 📋 Documentatie Structuur

### 👤 Gebruikershandleidingen (Per Rol)
- [`01-admin-gebruikershandleiding.md`](gebruikers/01-admin-gebruikershandleiding.md) - Handleiding voor administrators
- [`02-safety-manager-handleiding.md`](gebruikers/02-safety-manager-handleiding.md) - Handleiding voor veiligheidsmanagers  
- [`03-supervisor-handleiding.md`](gebruikers/03-supervisor-handleiding.md) - Handleiding voor supervisors
- [`04-field-worker-handleiding.md`](gebruikers/04-field-worker-handleiding.md) - Handleiding voor veldwerkers

### 🧪 Test Handleidingen
- [`01-unit-testing-guide.md`](testing/01-unit-testing-guide.md) - Unit testing met Jest
- [`02-e2e-testing-guide.md`](testing/02-e2e-testing-guide.md) - End-to-end testing met Cypress
- [`03-firebase-emulator-testing.md`](testing/03-firebase-emulator-testing.md) - Testen met Firebase Emulators
- [`04-authentication-testing.md`](testing/04-authentication-testing.md) - Authentication systeem testen

### ⚙️ Backend & Technische Handleidingen
- [`01-api-endpoints-guide.md`](backend/01-api-endpoints-guide.md) - Overzicht alle API endpoints
- [`02-firebase-admin-guide.md`](backend/02-firebase-admin-guide.md) - Firebase Admin SDK usage
- [`03-database-management.md`](backend/03-database-management.md) - Firestore database beheer
- [`04-security-rules-guide.md`](backend/04-security-rules-guide.md) - Firebase security rules

### 🛠️ Eigenaar/Admin Handleidingen
- [`01-organisatie-beheer.md`](admin/01-organisatie-beheer.md) - Organisaties aanmaken en beheren
- [`02-gebruiker-beheer.md`](admin/02-gebruiker-beheer.md) - Gebruikers en rollen beheren
- [`03-data-manipulatie.md`](admin/03-data-manipulatie.md) - Directe database aanpassingen
- [`04-backup-restore-guide.md`](admin/04-backup-restore-guide.md) - Backup en herstel procedures

### 🚀 Deployment & Onderhoud
- [`01-deployment-guide.md`](deployment/01-deployment-guide.md) - Productie deployment
- [`02-monitoring-guide.md`](deployment/02-monitoring-guide.md) - Monitoring en logging
- [`03-performance-guide.md`](deployment/03-performance-guide.md) - Performance optimalisatie
- [`04-troubleshooting-guide.md`](deployment/04-troubleshooting-guide.md) - Probleemoplossing

## 🎯 Quick Start Guides

### Voor Nieuwe Gebruikers
1. **Administrator**: Start met [`admin-gebruikershandleiding.md`](gebruikers/01-admin-gebruikershandleiding.md)
2. **Veiligheidsmanager**: Lees [`safety-manager-handleiding.md`](gebruikers/02-safety-manager-handleiding.md)
3. **Supervisor**: Begin met [`supervisor-handleiding.md`](gebruikers/03-supervisor-handleiding.md)
4. **Veldwerker**: Check [`field-worker-handleiding.md`](gebruikers/04-field-worker-handleiding.md)

### Voor Developers
1. **Eerste Setup**: [`deployment-guide.md`](deployment/01-deployment-guide.md)
2. **Testen**: [`unit-testing-guide.md`](testing/01-unit-testing-guide.md)
3. **API Development**: [`api-endpoints-guide.md`](backend/01-api-endpoints-guide.md)

### Voor Eigenaar/Hoofdbeheerder
1. **Organisatie Setup**: [`organisatie-beheer.md`](admin/01-organisatie-beheer.md)
2. **Gebruiker Management**: [`gebruiker-beheer.md`](admin/02-gebruiker-beheer.md)
3. **Data Management**: [`data-manipulatie.md`](admin/03-data-manipulatie.md)

## 📝 Handleiding Status

### ✅ Beschikbaar
- Admin gebruikershandleiding (basis)
- Unit testing guide (basis)
- Firebase emulator testing (basis)
- Authentication testing (compleet)
- Monitoring & logging guide (complete)
- Deployment guide (basic)
- Performance guide (basic)
- Troubleshooting guide (basic)

### 🚧 In Ontwikkeling / Review
- Safety manager handleiding
- Supervisor handleiding
- Field worker handleiding
- API endpoints guide
- Database management guide
- Admin data-manipulatie guide (in review)

### 📋 Gepland / Next steps
- Final Review & QA (link-check, spell-check, stakeholder review)
- Add diagrams and screenshots to `docs/images/`
- Publish documentation site (generate static site / configure hosting)
- Prepare release PR and notify stakeholders

## 🔄 Bijdragen aan Documentatie

Deze documentatie wordt continu uitgebreid naarmate nieuwe features worden toegevoegd. Elke handleiding bevat:

- **Doel**: Wat je gaat leren
- **Vereisten**: Wat je nodig hebt
- **Stap-voor-stap instructies**: Duidelijke stappen
- **Screenshots**: Visuele ondersteuning (waar relevant)
- **Troubleshooting**: Veelvoorkomende problemen
- **Referenties**: Links naar gerelateerde documentatie

## 📞 Support

Voor vragen over deze documentatie of de applicatie:
- **Technische Issues**: Zie [`troubleshooting-guide.md`](deployment/04-troubleshooting-guide.md)
- **Feature Requests**: GitHub Issues
- **Bug Reports**: GitHub Issues met volledig probleem rapport

---

**Laatste Update**: Deze documentatie wordt regelmatig bijgewerkt. Check de datum bovenaan voor de laatste versie.
## Documentation status (auto-updated)

Completed highlights:
- Monitoring & logging guide: [`deployment/02-monitoring-guide.md`](deployment/02-monitoring-guide.md) — Completed
- Runbooks added:
  - [`runbooks/top-5-incidents.md`](runbooks/top-5-incidents.md)
  - [`runbooks/health-endpoint-unhealthy.md`](runbooks/health-endpoint-unhealthy.md)
  - [`runbooks/high-error-rate.md`](runbooks/high-error-rate.md)
  - [`runbooks/firestore-permission-errors.md`](runbooks/firestore-permission-errors.md)

Next actions:
- Final Review & QA
- Add diagrams to `docs/images/`
- Publish documentation site

(Entry added by Roo — 2025-09-30)