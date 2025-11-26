# Dutch Localization Strategy - SafeWork Pro TRA/LMRA Application

**Document Version**: 1.0  
**Created**: September 30, 2025  
**Target Audience**: All literacy levels in safety/construction industry  
**Primary Language**: Dutch (Nederlands)  

---

## 1. Overview & Objectives

### Primary Goals
1. **Complete Dutch Interface**: All user-facing content in clear, professional Dutch
2. **Accessibility-First Design**: Simple, understandable language for all education levels
3. **Industry-Specific Terminology**: Accurate TRA/LMRA safety terminology
4. **Maintainable System**: Scalable translation management system
5. **Professional Quality**: Business-grade Dutch suitable for B2B safety applications

### Accessibility Principles
- **Plain Language**: Avoid unnecessary jargon, use common words
- **Short Sentences**: Keep instructions concise and clear
- **Visual Support**: Icons and symbols support text comprehension
- **Consistent Terminology**: Same terms always mean the same thing
- **Logical Flow**: Information presented in logical, expected order

---

## 2. Technical Implementation

### Next.js Internationalization Setup
```bash
# Install required packages
npm install next-intl @formatjs/intl-localematcher negotiator
```

### Directory Structure
```
web/
├── src/
│   ├── i18n/
│   │   ├── locales/
│   │   │   └── nl.json           # Dutch translations
│   │   ├── config.ts             # i18n configuration
│   │   └── server.ts             # Server-side i18n
│   ├── messages/
│   │   └── nl/                   # Organized translation files
│   │       ├── common.json       # Common UI elements
│   │       ├── auth.json         # Authentication pages
│   │       ├── navigation.json   # Navigation & menus
│   │       ├── forms.json        # Form labels & validation
│   │       ├── tra.json          # TRA-specific terms
│   │       ├── lmra.json         # LMRA-specific terms
│   │       ├── errors.json       # Error messages
│   │       └── safety.json       # Safety terminology
│   └── hooks/
│       └── useTranslation.ts     # Translation hook
```

### Configuration Files
1. **next.config.ts**: Add i18n configuration
2. **middleware.ts**: Handle locale detection and routing
3. **Translation Provider**: Context provider for translations

---

## 3. Translation Key Organization System

### Naming Convention
```json
{
  "category.component.element.state": "Translation"
}
```

### Examples
```json
{
  "auth.login.title": "Inloggen",
  "auth.login.email.label": "E-mailadres",
  "auth.login.email.placeholder": "Voer uw e-mailadres in",
  "auth.login.submit.button": "Inloggen",
  "forms.validation.required": "Dit veld is verplicht",
  "navigation.main.tras": "TRA's",
  "navigation.main.mobile": "Mobiele App",
  "tra.risk.level.low": "Laag risico",
  "tra.risk.level.medium": "Gemiddeld risico",
  "tra.risk.level.high": "Hoog risico"
}
```

### Category Structure
- **common**: Universal UI elements (buttons, labels, etc.)
- **auth**: Authentication and user management
- **navigation**: Menus, breadcrumbs, navigation
- **forms**: Form labels, placeholders, validation
- **tra**: Task Risk Assessment specific
- **lmra**: Last Minute Risk Assessment specific
- **safety**: General safety terminology
- **errors**: Error messages and warnings
- **help**: Help text and tooltips

---

## 4. Dutch Content Style Guide

### Language Principles
1. **Formal Professional Tone**: Use "u" (formal you) in business contexts
2. **Clear Instructions**: Use imperatives for actions ("Klik op...", "Vul in...")
3. **Consistent Terminology**: Create and maintain terminology glossary
4. **Plain Language**: Prefer common words over technical jargon when possible
5. **Active Voice**: Use active voice over passive ("Voer in" vs "Moet ingevoerd worden")

### Writing Guidelines
- **Sentence Length**: Maximum 20 words per sentence
- **Paragraph Length**: Maximum 3 sentences per paragraph
- **Instructions**: Start with action words (verbs)
- **Error Messages**: Always provide actionable solutions
- **Success Messages**: Clear confirmation of completed actions

### Tone Examples
```
❌ Complex: "De gebruiker dient de betreffende gegevens in te voeren teneinde het proces te kunnen voltooien"
✅ Simple: "Vul de gegevens in om door te gaan"

❌ Passive: "Er moet een wachtwoord gekozen worden"
✅ Active: "Kies een wachtwoord"

❌ Jargon: "Implementeer de beveiligingsmaatregelen"
✅ Clear: "Voer de veiligheidsmaatregelen uit"
```

---

## 5. TRA/LMRA Terminology Glossary

### Core Safety Terms (Dutch)
| English | Dutch | Simple Alternative |
|---------|-------|-------------------|
| Task Risk Assessment | Taak Risicoanalyse | Veiligheidscheck voor taak |
| Last Minute Risk Assessment | Last Minute Risicoanalyse | Laatste veiligheidscheck |
| Hazard | Gevaar | Risico |
| Risk | Risico | Kans op ongeval |
| Control Measure | Beheersingsmaatregel | Veiligheidsmaatregel |
| Personal Protective Equipment | Persoonlijke Beschermingsmiddelen (PBM) | Veiligheidsuitrusting |
| Work Permit | Werkvergunning | Toestemming om te werken |
| Supervisor | Supervisor | Leidinggevende |
| Safety Manager | Veiligheidsmanager | Hoofd Veiligheid |
| Field Worker | Uitvoerend medewerker | Werknemer |

### Risk Levels (Kinney & Wiruth)
| Risk Level | Dutch Term | Color Code |
|------------|------------|-----------|
| Trivial | Verwaarloosbaar | Groen |
| Tolerable | Aanvaardbaar | Lichtgroen |
| Moderate | Matig | Geel |
| Substantial | Aanzienlijk | Oranje |
| Intolerable | Onaanvaardbaar | Rood |

### Common Actions
- Bekijken (View)
- Bewerken (Edit) 
- Verwijderen (Delete)
- Opslaan (Save)
- Annuleren (Cancel)
- Goedkeuren (Approve)
- Afwijzen (Reject)
- Exporteren (Export)
- Printen (Print)
- Delen (Share)

---

## 6. Form & Validation Messages

### Standard Form Elements
```json
{
  "forms.labels.firstName": "Voornaam",
  "forms.labels.lastName": "Achternaam", 
  "forms.labels.email": "E-mailadres",
  "forms.labels.password": "Wachtwoord",
  "forms.labels.confirmPassword": "Bevestig wachtwoord",
  "forms.labels.organization": "Organisatie",
  "forms.labels.role": "Functie",
  "forms.labels.phone": "Telefoonnummer",
  "forms.placeholders.email": "voorbeeld@bedrijf.nl",
  "forms.placeholders.password": "Minimaal 8 tekens",
  "forms.placeholders.search": "Zoeken..."
}
```

### Validation Messages (Clear & Actionable)
```json
{
  "validation.required": "Dit veld is verplicht",
  "validation.email.invalid": "Voer een geldig e-mailadres in",
  "validation.password.tooShort": "Wachtwoord moet minimaal 8 tekens hebben",
  "validation.password.noMatch": "Wachtwoorden komen niet overeen",
  "validation.phone.invalid": "Voer een geldig telefoonnummer in",
  "validation.date.invalid": "Voer een geldige datum in (DD-MM-JJJJ)",
  "validation.number.tooLow": "Waarde moet minimaal {min} zijn",
  "validation.number.tooHigh": "Waarde mag maximaal {max} zijn"
}
```

### Error Messages (With Solutions)
```json
{
  "errors.login.failed": "Inloggen mislukt. Controleer uw e-mailadres en wachtwoord.",
  "errors.network.offline": "Geen internetverbinding. Probeer het later opnieuw.",
  "errors.file.tooLarge": "Bestand is te groot. Kies een bestand kleiner dan 10MB.",
  "errors.permissions.insufficient": "U hebt geen toestemming voor deze actie. Neem contact op met uw beheerder."
}
```

---

## 7. Navigation & Interface Elements

### Main Navigation
```json
{
  "nav.main.dashboard": "Overzicht",
  "nav.main.tras": "TRA's",
  "nav.main.lmras": "LMRA's", 
  "nav.main.projects": "Projecten",
  "nav.main.team": "Team",
  "nav.main.reports": "Rapporten",
  "nav.main.settings": "Instellingen",
  "nav.main.help": "Help"
}
```

### Common UI Elements
```json
{
  "ui.buttons.save": "Opslaan",
  "ui.buttons.cancel": "Annuleren",
  "ui.buttons.delete": "Verwijderen",
  "ui.buttons.edit": "Bewerken",
  "ui.buttons.view": "Bekijken",
  "ui.buttons.download": "Downloaden",
  "ui.buttons.upload": "Uploaden",
  "ui.buttons.previous": "Vorige",
  "ui.buttons.next": "Volgende",
  "ui.buttons.finish": "Voltooien",
  "ui.status.loading": "Laden...",
  "ui.status.saving": "Opslaan...",
  "ui.status.saved": "Opgeslagen",
  "ui.status.error": "Fout opgetreden"
}
```

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Install and configure Next.js i18n
- [ ] Set up translation file structure
- [ ] Create useTranslation hook
- [ ] Implement translation provider
- [ ] Create initial common translations

### Phase 2: Authentication & Navigation (Week 1-2)  
- [ ] Translate authentication pages
- [ ] Update navigation components
- [ ] Translate form validation messages
- [ ] Update error handling messages

### Phase 3: Core UI Components (Week 2)
- [ ] Update all UI components with Dutch text
- [ ] Translate button labels and status messages  
- [ ] Update modal and alert content
- [ ] Implement loading and success states

### Phase 4: TRA/LMRA Specific Content (Week 3)
- [ ] Create TRA terminology translations
- [ ] Create LMRA workflow translations
- [ ] Translate risk assessment content
- [ ] Update safety-specific terminology

### Phase 5: Testing & Refinement (Week 3-4)
- [ ] Native speaker review
- [ ] User testing with target audience
- [ ] Accessibility compliance check
- [ ] Performance optimization
- [ ] Documentation completion

---

## 9. Quality Assurance

### Review Process
1. **Technical Review**: Verify translation keys work correctly
2. **Language Review**: Native Dutch speaker checks accuracy
3. **Accessibility Review**: Test with target user groups
4. **Industry Review**: Verify safety terminology accuracy
5. **User Testing**: Test with actual construction/safety workers

### Testing Checklist
- [ ] All text displays in Dutch
- [ ] No missing translation keys
- [ ] Proper text wrapping and layout
- [ ] Form validation in Dutch
- [ ] Error messages clear and actionable
- [ ] Navigation intuitive for Dutch users
- [ ] Mobile interface works well with Dutch text
- [ ] Accessibility standards met (WCAG 2.1 AA)

### Success Metrics
- 100% Dutch content coverage
- No English fallback text visible
- User comprehension rate >90% in testing
- Task completion rate maintains current levels
- Accessibility compliance verified

---

## 10. Maintenance & Updates

### Translation Management
- **Centralized Keys**: All translations in organized JSON files
- **Consistent Updates**: Update translations when adding features
- **Version Control**: Track translation changes in git
- **Documentation**: Maintain glossary and style guide

### Future Considerations
- **Multi-language Support**: Framework supports adding other languages
- **Regional Variations**: Can accommodate Belgian Dutch if needed
- **Content Management**: Consider translation management tools for large scale
- **Automated Testing**: Add translation key testing to CI/CD

---

## 11. Implementation Checklist

### Technical Setup
- [ ] Install next-intl packages
- [ ] Configure Next.js i18n settings
- [ ] Set up middleware for locale handling
- [ ] Create translation file structure
- [ ] Implement useTranslation hook

### Content Creation
- [ ] Create Dutch terminology glossary
- [ ] Write all base translations
- [ ] Review and refine language
- [ ] Test with native speakers
- [ ] Validate accessibility compliance

### Component Updates
- [ ] Update all existing components
- [ ] Add translation keys to new components
- [ ] Test all user flows in Dutch
- [ ] Verify mobile responsiveness
- [ ] Check form validation messages

This strategy ensures a professional, accessible, and user-friendly Dutch interface that serves all education and literacy levels within the construction and safety industry.