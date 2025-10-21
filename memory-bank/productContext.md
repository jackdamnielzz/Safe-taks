# Product Context - SafeWork Pro

## Why This Project Exists

SafeWork Pro is een Nederlandse B2B SaaS-applicatie voor digitaal veiligheidsmanagement in de bouw-, industrie- en offshore-sector. Het project lost kritieke problemen op rond:

### Huidige Problemen in de Markt
1. **Papieren TRA's (Taak Risicoanalyse)**: Bedrijven gebruiken nog steeds papieren formulieren die:
   - Verloren raken of beschadigen
   - Moeilijk doorzoekbaar zijn
   - Geen real-time updates ondersteunen
   - Handmatige goedkeuringsprocessen vereisen

2. **LMRA Uitdagingen (Last Minute Risicoanalyse)**: Veldwerkers hebben geen:
   - Mobiele toegang tot TRA's on-site
   - GPS verificatie voor locatie
   - Offline mogelijkheden op bouwplaatsen
   - Automatische sync van gegevens

3. **Compliance & Rapportage**: Organisaties worstelen met:
   - VCA 2017 v5.1 compliance tracking
   - ISO 45001 certificering vereisten
   - Handmatige rapportage voor audits
   - Geen inzicht in veiligheidstrends

## Wat Het Project Oplost

### Core Value Proposition
**"Digitaliseer uw TRA's en LMRA's. Verhoog veiligheid, verlaag risico's"**

### Belangrijkste Oplossingen
1. **Digitale TRA Management**
   - Template-based TRA creatie (6+ VCA-compliant templates)
   - Kinney & Wiruth risicocalculatie automatisch
   - Real-time samenwerking met teamleden
   - Digitale goedkeuringen met handtekeningen

2. **Mobiele LMRA Uitvoering**
   - Offline-capable PWA voor veldwerkers
   - 8-stappen workflow met GPS verificatie
   - Weersomstandigheden integratie (OpenWeather API)
   - QR code scanning voor equipment verificatie
   - Automatische sync bij netwerkverbinding

3. **Professional Rapportage**
   - PDF/Excel export met custom branding
   - VCA compliance validatie
   - Real-time analytics dashboards
   - Comprehensive audit trails (7 jaar retention)

4. **Enterprise Features**
   - Multi-tenant architectuur met complete isolatie
   - 4-tier RBAC (admin, safety_manager, supervisor, field_worker)
   - Webhook systeem voor ERP integraties
   - GDPR-compliant data management

## Hoe Het Zou Moeten Werken

### Gebruikers Workflow

#### Safety Manager (Kantoor)
1. **TRA Creatie**
   - Kiest sector-specifieke template (Bouw, Elektra, etc.)
   - Voegt taakstappen toe met gevaren
   - Systeem berekent automatisch risiconiveau
   - Krijgt beheersmaatregelen aanbevelingen
   - Stuurt naar supervisor voor goedkeuring

2. **Dashboard Monitoring**
   - Ziet real-time LMRA uitvoeringen
   - Ontvangt stop work alerts onmiddellijk
   - Analyseert risico trends per project
   - Genereert compliance rapporten

#### Field Worker (Bouwplaats)
1. **LMRA Uitvoering**
   - Opent mobiele app (PWA, werkt offline)
   - Selecteert relevante TRA
   - Voert 8-stappen checklist uit:
     * Locatie verificatie (GPS)
     * Weersomstandigheden check
     * Team competenties verificatie
     * Equipment QR scanning
     * Gevaren assessment
     * Risicobeslissing (veilig/voorzichtig/stop werk)
     * Foto documentatie
     * Digitale handtekening
   - Data synct automatisch bij netwerk

2. **Stop Werk Autoriteit**
   - Bij onveilige situatie: direct stop werk beslissing
   - Automatische alerts naar management
   - Photo evidence upload
   - Real-time dashboard update

### Technische Flow

```
User Login (Firebase Auth)
    ↓
Organization Context (Multi-tenant)
    ↓
Role-Based Interface (RBAC)
    ↓
┌─────────────┬──────────────┬─────────────┐
│  TRA System │ LMRA System  │  Analytics  │
└─────────────┴──────────────┴─────────────┘
         ↓              ↓              ↓
   [Firestore]   [IndexedDB]   [Firebase Analytics]
         ↓              ↓              ↓
   [Real-time]   [Offline Sync]  [Dashboards]
```

## Target Market

### Primaire Doelgroep
- **Bouwbedrijven**: 50-500 medewerkers
- **Industriële Bedrijven**: Met meerdere projecten
- **Offshore Sector**: Met strenge veiligheidseisen
- **Geografisch**: Nederland (VCA focus), België (uitbreiding)

### Subscription Tiers
1. **Starter** (€49/maand): 5 users, 50 TRAs, basis features
2. **Professional** (€149/maand): 25 users, unlimited TRAs, advanced features
3. **Enterprise** (€499/maand): Unlimited, custom workflows, dedicated support

## Success Metrics

### Business KPIs
- Klant retentie rate >90%
- MRR groei 15%+ per maand
- CAC payback <6 maanden
- NPS score >50

### Product KPIs (Gemeten in App)
1. **TRAs Created per Month**: Productiviteit indicator
2. **LMRAs Executed per Month**: Field worker adoption
3. **Average Risk Score**: Safety improvement trend
4. **Compliance Rate**: VCA/ISO45001 adherence
5. **Time to Approval**: Efficiency metric
6. **User Activation Rate**: Onboarding success

## Competitive Advantages

1. **Offline-First Mobile**: Uniek voor Nederlandse markt
2. **VCA 2017 v5.1 Compliance**: Gebouwd voor Nederlandse standaarden
3. **Nederlandse Taal**: Alle UI in professioneel Nederlands
4. **Zero Setup Complexity**: 5 minuten naar eerste TRA
5. **Betaalbaar**: €49-€499 vs concurrenten €200-€1000+

## Regulatory Compliance

### Vereisten
- **VCA 2017 v5.1**: Volledige compliance met 85%+ score
- **ISO 45001**: Arbeidsveiligheid management systeem
- **GDPR**: Volledige data privacy compliance
- **ARBO Wet**: Nederlandse arbeidswetgeving

### Compliance Features
- 7 jaar data retentie voor veiligheidsrecords
- Immutable audit logs voor alle acties
- Data export/deletion rechten
- Encrypted at rest (Firebase AES-256)
- Encrypted in transit (TLS 1.3)
