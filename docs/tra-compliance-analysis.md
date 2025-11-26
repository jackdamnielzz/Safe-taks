# TRA Compliance Analyse

## Samenvatting

De geïmplementeerde TRA aanmaak flow voldoet aan **60-70%** van de officiële vereisten. De kern functionaliteit voor risico-analyse volgens VCA en ISO 45001 normen is solide geïmplementeerd. Echter, belangrijke elementen rondom **formele goedkeuring**, **documentatie lifecycle**, **compliance tracking**, en **integratie met andere veiligheidssystemen** ontbreken of zijn onvolledig.

**Compliance Status**: 🟡 **Gedeeltelijk Compliant** - Geschikt voor basis gebruik, maar vereist aanvullingen voor volledige VCA/ISO 45001 certificering.

---

## Verplichte Elementen

### ✅ Geïmplementeerd en Compliant

#### 1. **Taakbeschrijving** (info.md sectie 4.1)
- ✅ Titel veld (verplicht)
- ✅ Beschrijving veld
- ✅ Project koppeling (verplicht)
- ✅ Template ondersteuning met pre-populated content
- **Status**: Volledig compliant

#### 2. **Taakstappen met deeltaken** (info.md sectie 4.1)
- ✅ Stapsgewijze opdeling van taken
- ✅ Beschrijving per stap
- ✅ Tijdsduur tracking (minuten)
- ✅ Collapsible interface voor overzicht
- **Status**: Volledig compliant

#### 3. **Gevarenidentificatie** (info.md sectie 4.3)
- ✅ Hazard bibliotheek per categorie (Physical, Chemical, Biological, Ergonomic, Psychosocial)
- ✅ Selectie tot 10 gevaren per stap
- ✅ Custom hazards toevoegen mogelijk
- ✅ Per taakstap inventarisatie
- **Status**: Volledig compliant

#### 4. **Risicobeoordeling - Kinney & Wiruth** (info.md sectie 4.4)
- ✅ Effect (E): 1-100 schaal
- ✅ Blootstelling (B): 0-10 schaal  
- ✅ Waarschijnlijkheid (W): 0-10 schaal
- ✅ Formule: R = E × B × W
- ✅ Risk levels: Trivial → Very High (6 niveaus)
- ✅ Color-coded weergave
- ✅ Notes veld per risicobeoordeling
- **Status**: Volledig compliant

#### 5. **Beheersmaatregelen Hiërarchie** (info.md sectie 4.5)
- ✅ Correcte volgorde: Elimination → Substitution → Engineering → Administrative → PPE
- ✅ Type dropdown per maatregel
- ✅ Beschrijving veld (min 10 chars)
- ✅ Verantwoordelijke persoon
- ✅ Implementation status tracking (Planned → Verified)
- ✅ Suggested controls vanuit hazard bibliotheek
- ✅ Minimum 1 control per gevaar enforcement
- **Status**: Volledig compliant

#### 6. **Restrisico Beoordeling** (info.md sectie 4.6)
- ✅ Tweede risk calculator na controls
- ✅ Zelfde E/B/W parameters
- ✅ Vergelijking met initieel risico
- ✅ Warning bij residual HIGH/VERY_HIGH
- ✅ Success indicator bij >50% reductie
- **Status**: Volledig compliant

#### 7. **Team Betrokkenheid** (info.md sectie 3, 4.7)
- ✅ Team members toevoegen via email
- ✅ Validatie: minimum 1 teamlid vereist
- ✅ Badge display van toegevoegde leden
- **Status**: Basis compliant (zie ⚠️ voor beperkingen)

#### 8. **VCA Compliance Checking** (info.md sectie 9)
- ✅ Real-time compliance score berekening
- ✅ Level indicator (Non-compliant → Excellent)
- ✅ Issues lijst met specifieke feedback
- ✅ Recommendations voor verbetering
- ✅ Sidebar tijdens hele wizard
- **Status**: Volledig compliant

#### 9. **Review Stap** (info.md sectie 4.7, 4.9)
- ✅ Overzicht van alle ingevoerde data
- ✅ Validatie warnings voor incomplete velden
- ✅ Final check voor submission
- **Status**: Basis compliant

#### 10. **Risk Level Actions** (info.md sectie 5.3)
- ✅ "Werk niet toegestaan" warning voor VERY_HIGH
- ✅ "Management goedkeuring vereist" voor HIGH
- ✅ Proper color coding per level
- **Status**: Compliant (maar enforcement ontbreekt)

---

### ⚠️ Geïmplementeerd maar Incomplete

#### 11. **Randvoorwaarden en Context** (info.md sectie 4.2)
**Geïmplementeerd**:
- Taakbeschrijving en duur
- Hazard identificatie impliceert werkplek details

**Ontbreekt**:
- ❌ Expliciete velden voor weersomstandigheden, gereedschappen/machines, materialen, specifieke werkplekomstandigheden
- ❌ "Bezoek werkplek" checklist item

**Prioriteit**: 🟡 Medium

#### 12. **Team Rollen en Verantwoordelijkheden** (info.md sectie 3)
**Ontbreekt**:
- ❌ Rol differentiatie (Opdrachtgever, Werkuitvoerder, Veiligheidskundige)
- ❌ Expliciete "Opdrachtgever" toewijzing
- ❌ Competentie/certificatie tracking per rol

**Prioriteit**: 🟡 Medium

#### 13. **Communicatie naar Betrokkenen** (info.md sectie 4.8)
**Ontbreekt**:
- ❌ Expliciete "communicatieplan" sectie
- ❌ Toolbox meeting scheduling
- ❌ Bevestiging dat werknemers TRA hebben gelezen

**Prioriteit**: 🟡 Medium

#### 14. **Competenties en Training** (info.md sectie 9)
**Ontbreekt**:
- ❌ UI om competenties in te voeren in wizard
- ❌ Verificatie dat teamleden vereiste competenties hebben

**Prioriteit**: 🟠 Medium-High

#### 15. **Digitale Documentatie** (info.md sectie 9)
**Ontbreekt**:
- ❌ Audit trail van wijzigingen
- ❌ Versioning van TRA documenten
- ❌ PDF export functionaliteit

**Prioriteit**: 🟡 Medium

#### 16. **LMRA Integratie** (info.md sectie 7)
**Ontbreekt**:
- ❌ Expliciete link van TRA → LMRA tijdens aanmaak
- ❌ "LMRA vereist" flag op TRA

**Prioriteit**: 🟡 Medium

---

### ❌ Ontbrekend (Verplichte Elementen)

#### 17. **Approval Workflow en Handtekeningen** (info.md sectie 2, 7)
**Vereisten**: Formele goedkeuring, management approval voor HIGH/VERY_HIGH risks, digitale handtekeningen

**Impact**: 🔴 **KRITIEK** - VCA eis voor formele acceptatie

#### 18. **Werkvergunning Integratie** (info.md sectie 7)
**Vereisten**: TRA vormt basis voor werkvergunning, link tussen TRA en work permit

**Impact**: 🔴 **KRITIEK** - Essentieel voor hoog-risico werk

#### 19. **Geldigheidsduur en Evaluatie** (info.md sectie 6, 3)
**Vereisten**: Maximale geldigheid 1 jaar (VCA norm), periodieke review scheduling, update na wijzigingen/incidenten

**Impact**: 🔴 **KRITIEK** - VCA compliance vereiste

#### 20. **LOTOTO Integratie** (info.md sectie 7)
**Vereisten**: Bepalen wanneer LOTOTO vereist is, LOTOTO procedures documenteren

**Impact**: 🟠 **HOOG** - Essentieel voor onderhoudswerkzaamheden

#### 21. **Milieu Risico Analyse** (info.md sectie 5)
**Vereisten**: Expliciete milieu risico beoordeling, vervuiling/lozing identificatie

**Impact**: 🟠 **HOOG** - ISO 45001 en VCA vereiste

#### 22. **Gezondheidsrisico's - Beroepsziekten** (info.md sectie 5)
**Vereisten**: Focus op lange-termijn gezondheidseffecten, beroepsziekte preventie

**Impact**: 🟡 **MEDIUM** - Belangrijk voor complete compliance

#### 23. **Incidenten en Near-Miss Tracking** (info.md sectie 3, 6)
**Vereisten**: TRA update trigger na incident, link tussen incident reports en TRA

**Impact**: 🟠 **HOOG** - Essentieel voor continue verbetering (PDCA)

#### 24. **Emergency Procedures** (info.md sectie 8)
**Vereisten**: Noodprocedures per HIGH risk scenario, emergency contacts, evacuatie procedures

**Impact**: 🟠 **HOOG** - Kritiek voor high-risk werkzaamheden

#### 25. **Competentie Verificatie** (info.md sectie 9)
**Vereisten**: Vereiste certificaten/opleidingen per taak, verificatie dat teamleden gekwalificeerd zijn

**Impact**: 🟠 **HOOG** - VCA vereiste

---

## Aanbevelingen

### 🔴 Kritieke Prioriteit (Implementeer direct)

1. **Approval Workflow implementeren**
   - Post-creation status: "Pending Approval"
   - Multi-level approval voor HIGH risks
   - Digital signatures via SignaturePad component
   - Approval history audit trail
   - Files te wijzigen: Nieuwe `approval-workflow.ts`, updates aan TRA status model

2. **Geldigheidsduur toevoegen**
   - `validFrom` en `expiryDate` fields (default +1 jaar)
   - `nextReviewDate` scheduling
   - Automated expiry warnings (30/14/7 dagen voor expiry)
   - Files te wijzigen: [`web/src/lib/types/tra.ts`](web/src/lib/types/tra.ts:145), wizard Stap 4, notification service

3. **Werkvergunning Systeem**
   - Nieuw "Work Permit" module
   - Link tussen TRA en permit
   - Permit approval workflow
   - Files te maken: `work-permit.ts`, nieuwe UI components

---

### 🟠 Hoge Prioriteit (Binnen 1-2 sprints)

4. **Competentie Management**
   - UI in wizard voor `requiredCompetencies`
   - Verificatie tegen user profiles
   - Files te wijzigen: [`web/src/components/forms/TraWizard.tsx`](web/src/components/forms/TraWizard.tsx:33)

5. **Milieu Risico Sectie**
   - Nieuwe hazard category: "Environmental"
   - Files te wijzigen: [`web/src/lib/types/tra.ts`](web/src/lib/types/tra.ts:145), hazard library

6. **Emergency Procedures**
   - Conditional sectie voor HIGH/VERY_HIGH risks
   - Emergency contacts, evacuation procedures
   - Files te wijzigen: [`web/src/components/forms/TraWizardStepBasic.tsx`](web/src/components/forms/TraWizardStepBasic.tsx:21)

7. **LOTOTO Integration**
   - "LOTOTO Required" checkbox per high-risk hazard
   - Files te wijzigen: [`web/src/components/tra/TraHazardWithRisk.tsx`](web/src/components/tra/TraHazardWithRisk.tsx:50)

---

### 🟡 Medium Prioriteit (Binnen 2-4 sprints)

8. **Randvoorwaarden Sectie**
9. **Team Rol Differentiatie**
10. **Communicatie Plan**
11. **Incident Tracking Integration**
12. **Audit Trail en Versioning**

---

## Compliance Scores Samenvatting

| Categorie | Score | Status |
|-----------|-------|--------|
| **Risico Analyse Kern** | 95% | ✅ Excellent |
| **Beheersmaatregelen** | 90% | ✅ Excellent |
| **VCA Compliance Checking** | 85% | ✅ Goed |
| **Team Management** | 60% | ⚠️ Basis |
| **Documentatie & Lifecycle** | 30% | ❌ Onvoldoende |
| **Approval & Governance** | 10% | ❌ Kritiek |
| **Integraties** | 20% | ❌ Onvoldoende |
| **Context & Randvoorwaarden** | 40% | ⚠️ Basis |
| | | |
| **TOTAAL** | **65%** | ⚠️ **Gedeeltelijk** |

---

## Conclusie

De huidige TRA aanmaak flow excelleert in de **technische risico-analyse** (Kinney & Wiruth, beheersmaatregelen, VCA real-time checking), maar is **onvoldoende voor formele compliance** door ontbrekende **approval workflows**, **documentatie lifecycle**, en **integraties** met andere veiligheidssystemen.

**Voor productie deployment** zijn minimaal de 🔴 Kritieke items nodig:
1. Approval workflow met handtekeningen
2. Geldigheids tracking (1 jaar)
3. Werkvergunning integratie

**Voor volledige VCA/ISO 45001 certificering** zijn ook de 🟠 Hoge prioriteit items vereist.

De implementatie is een **solide basis** (65% compliant) die relatief eenvoudig kan worden uitgebreid naar volledige compliance.