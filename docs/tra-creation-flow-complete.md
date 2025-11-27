# TRA Aanmaak Flow Documentatie

## 1. Overview

De TRA (Task Risk Analysis) aanmaak flow is een **4-stappen wizard** die gebruikers begeleidt door het complete proces van het aanmaken van een nieuwe TRA. De flow is geïmplementeerd als een client-side wizard met react-hook-form voor formulierbeheer, real-time VCA compliance checking, en een sidebar die voortdurend de naleving van veiligheidsnormen toont.

**Entry Point**: [`/tras/create`](web/src/app/tras/create/page.tsx:17)  
**Main Wizard**: [`TraWizard`](web/src/components/forms/TraWizard.tsx:33)  
**Status**: Draft autosave is **UITGESCHAKELD** (lijn 131)

## 2. Flow Diagram

```
Start (/tras/create)
    ↓
┌─────────────────────────────────────────────────────┐
│ STAP 1: Basic Info                                  │
│ - Template keuze (carousel met preview)             │
│ - Titel                                             │
│ - Beschrijving                                      │
│ - Project selectie                                  │
└─────────────────────────────────────────────────────┘
    ↓ [Volgende]
┌─────────────────────────────────────────────────────┐
│ STAP 2: Task Steps & Hazard Analysis                │
│ - Taakstappen definiëren (collapsible)             │
│ - Per stap:                                         │
│   • Gevaren selecteren uit bibliotheek              │
│   • Risk assessment (Kinney & Wiruth)              │
│   • Control measures toevoegen                      │
│   • Residual risk beoordelen                       │
└─────────────────────────────────────────────────────┘
    ↓ [Volgende]
┌─────────────────────────────────────────────────────┐
│ STAP 3: Team Members                                │
│ - Teamleden toevoegen via e-mail                   │
│ - Badge display van toegevoegde leden              │
└─────────────────────────────────────────────────────┘
    ↓ [Volgende]
┌─────────────────────────────────────────────────────┐
│ STAP 4: Review & Submit                             │
│ - Overzicht van alle ingevoerde data               │
│ - Validatie warnings                                │
│ - Submit button                                     │
└─────────────────────────────────────────────────────┘
    ↓ [Aanmaken]
TRA aangemaakt → Redirect naar `/tras/{id}`

[Sidebar tijdens alle stappen]
├─ VCA Compliance Score (real-time)
├─ Compliance level indicator
├─ Issues & recommendations
└─ Quick tips (collapsible)
```

## 3. Stap-voor-Stap Details

### Stap 1: Basic Information & Template Selection

**Component**: [`TraWizard`](web/src/components/forms/TraWizard.tsx:225-329) stap 0  
**Doel**: Template kiezen en basis TRA info invullen

#### 3.1 Template Selector

**Component**: [`TemplateSelector`](web/src/components/templates/TemplateSelector.tsx:18)

**Features**:
- **Carousel weergave**: 1 template tegelijk met volledige preview
- **Search functionaliteit**: Filter op naam/beschrijving
- **Category filter**: Filter op industrie (bouw, logistiek, etc.)
- **Navigation**: Vorige/Volgende knoppen met counter
- **"Start from Scratch" optie**: Mogelijk om zonder template te beginnen

**Template Kaart Details**:
- Template naam (grote heading)
- Industrie category badge
- VCA Compliant badge
- Beschrijving (max 4 regels)
- Statistics grid:
  - Aantal gevaren geïdentificeerd
  - Aantal werkstappen
- Selectie status indicator

**Data Ophalen**:
```typescript
GET /api/templates?organizationId={id}
→ Fallback naar bundled templates bij fout
```

**Template Selectie Effect**:
- Fetcht volledige template data: [`GET /api/templates/{templateId}`](web/src/components/forms/TraWizard.tsx:69)
- Pre-populateert velden:
  - `title` ← `template.name`
  - `description` ← `template.description`
  - `taskSteps` ← `template.taskSteps` of `template.steps`
  - `templateId` ← `template.id`

#### 3.2 Input Fields

**Titel** (verplicht):
- Type: Text input
- Validation: Required via react-hook-form
- Pre-filled indien template gekozen
- User kan aanpassen

**Beschrijving**:
- Type: Textarea (4 rijen)
- Optional field
- Pre-filled indien template gekozen

**Template Indicator**:
- Toont geselecteerde template naam
- "Reset to Template" knop om wijzigingen te herstellen
- Loading spinner tijdens template fetch
- Error message bij fetch failure

**Project Selectie** (verplicht):
- Component: [`ProjectSelector`](web/src/components/forms/TraWizard.tsx:297-310)
- Dropdown van beschikbare projecten
- Validation: Verplicht veld
- Extra: "Nieuw project aanmaken" knop → redirect naar `/projects/create`

**Validatie**: 
- Titel is required
- ProjectId is required

**Volgende Stap**: Click "Volgende" button

---

### Stap 2: Task Steps & Hazard Analysis

**Component**: [`TraStepBasic`](web/src/components/forms/TraWizardStepBasic.tsx:21)  
**Doel**: Werkstappen definiëren en per stap gevaren analyseren

#### 3.3 Introductie Section

Blauw info-paneel met:
- Titel: "Taakstappen en Risicobeoordeling"
- Uitleg over proces en Kinney & Wiruth methode

#### 3.4 Task Steps Management

**Step Card Structure** (collapsible):
- **Header (altijd zichtbaar)**:
  - Stap nummer badge (blauw, cirkel)
  - Stap beschrijving of "Stap {n}"
  - Statistieken: aantal gevaren + duur in minuten
  - Delete knop (rood, prullenbak icon)
  - Expand/Collapse chevron

- **Content (when expanded)**:
  - **Stapinformatie sectie** (grijs panel):
    - Omschrijving input (text)
    - Duur input (number, minuten)
  
  - **Risicobeoordeling sectie** (via TraHazardWithRisk):
    Zie 3.5 voor details

#### 3.5 Hazard Analysis Per Step

**Component**: [`TraHazardWithRisk`](web/src/components/tra/TraHazardWithRisk.tsx:50)

**Risk Summary Card** (top):
- Toont hoogste risiconiveau in de stap
- Badge met risico level (color-coded)
- Teller van beoordeelde gevaren
- Warnings:
  - "Werk niet toegestaan" voor VERY_HIGH
  - "Management goedkeuring vereist" voor HIGH

**Sectie 1: Selecteer Gevaren** (collapsible):

**Component**: [`HazardSelector`](web/src/components/tra/TraHazardWithRisk.tsx:414-441)

- Header toont aantal geselecteerde gevaren
- **Features**:
  - Browse hazard bibliotheek
  - Filter per categorie
  - Custom hazards toevoegen
  - Max 10 selecteerbaar
  - Multi-select met checkboxes

- **Validation Warning**:
  - Amber panel indien geen gevaren geselecteerd
  - "Selecteer minimaal één gevaar..."

**Sectie 2: Risicobeoordeling per Gevaar** (collapsible):

Voor **elk geselecteerd gevaar**:

**Collapsed View**:
- Gevaar naam + categorie
- Risk level badge (indien beoordeeld)
- "Uitklappen" button

**Expanded View - 3-stap proces**:

**STAP 1: Initiële Risicobeoordeling** (blauw panel):
- **Doel**: Beoordeel risico ZONDER beheersmaatregelen
- **Component**: [`RiskCalculator`](web/src/components/tra/TraHazardWithRisk.tsx:567-579)
- **Methode**: Kinney & Wiruth
- **Parameters**:
  - Effect (E): 1-100
  - Blootstelling (B): 0-10
  - Waarschijnlijkheid (W): 0-10
  - Formule: `Score = E × B × W`
- **Risk Levels**:
  - 0-20: Trivial (groen)
  - 21-70: Acceptable (lichtgroen)
  - 71-200: Possible (geel)
  - 201-400: Substantial (oranje)
  - 401-1000: High (rood)
  - >1000: Very High (donkerrood)
- **Output**: 
  - Risk score + level
  - Parameters summary
  - Optional notes veld

**Risk Summary Display** (altijd zichtbaar na beoordeling):
- Score met color coding
- Formule breakdown: "E × B × W = {values}"
- Opmerkingen

**STAP 2: Beheersmaatregelen** (groen panel):
- **Voorwaarde**: Alleen zichtbaar NA risk assessment
- **Component**: [`ControlMeasureManager`](web/src/components/tra/ControlMeasureManager.tsx:55)

**Hierarchy of Controls**:
1. Elimination (elimineren)
2. Substitution (vervangen)
3. Engineering (technisch)
4. Administrative (administratief)
5. PPE (persoonlijke bescherming)

**Per Control Measure**:
- **Collapsed**: Type + korte beschrijving preview
- **Expanded**:
  - Type dropdown (hierarchy selector)
  - Beschrijving textarea (min 10 chars)
  - Verantwoordelijke persoon (optional)
  - Implementation status dropdown:
    - Planned
    - In Progress
    - Completed
    - Verified
  - "Opslaan" button (groene check)
  - "Verwijderen" button (rode trash)

**Suggested Controls**:
- Tot 8 voorgestelde maatregelen getoond
- "Add" knop per suggestie
- Auto-expand bij toevoegen

**Actions**:
- "Maak eigen maatregel" button
- Minimum 1 control per gevaar required

**Warning Panel** (indien geen risk assessment):
- Amber panel met waarschuwing
- "U moet eerst het initiële risico beoordelen..."

**STAP 3: Residueel Risico** (paars panel):
- **Voorwaarde**: Alleen zichtbaar NA control measures toegevoegd
- **Doel**: Beoordeel restrisico NA maatregelen
- **Component**: Tweede `RiskCalculator` instance
- **Zelfde parameters**: E, B, W
- **Output**: 
  - Residual risk score + level
  - Vergelijking met initieel risico
  - **Warnings**:
    - Rood indien residueel risico nog HIGH/VERY_HIGH
    - "Overweeg aanvullende maatregelen..."
  - **Success**:
    - Groen indien significant verminderd (>50%)
    - "Het risico is significant verminderd..."

**Info Panel** (indien geen controls):
- Paars panel
- "Voeg eerst beheersmaatregelen toe..."

#### 3.6 Validation Summary

**Getoond onderaan alle hazards**:

Checks:
1. ❌ Niet alle gevaren hebben risicobeoordeling
2. ❌ Ten minste één beheersmaatregel per gevaar vereist
3. ❌ Hoog risico zonder beheersmaatregelen
4. ❌ Hoog risico gedetecteerd (management goedkeuring)

**Kleuren**:
- Amber: Waarschuwingen
- Rood: Kritieke issues

#### 3.7 Add New Step

- "Nieuwe stap toevoegen" button (centered, blauw)
- Voegt lege stap toe met:
  - `description: ""`
  - `duration: 0`
  - `hazards: []`

#### 3.8 Summary Panel

**Toont overzicht** (gradient grijs panel):
- Aantal stappen
- Totaal gevaren
- Totale duur (minuten)

**Volgende Stap**: Click "Volgende"

---

### Stap 3: Team Members

**Component**: [`TeamMemberSelector`](web/src/components/forms/TeamMemberSelector.tsx:15)  
**Doel**: Teamleden toevoegen die notificaties ontvangen

#### 3.9 Team Member Interface

**Current Members Display**:
- Badge list in grijs paneel
- Per badge:
  - Email address
  - × button om te verwijderen

**Add Member Section**:
- Email input field
- "+ Toevoegen" button
- Enter key support voor snelle invoer

**Validatie**:
- Email format check (regex)
- Duplicaat check
- Error messages:
  - "Voer een e-mailadres in"
  - "Ongeldig e-mailadres"
  - "Dit e-mailadres is al toegevoegd"

**Helper Text**:
"Voeg teamleden toe door hun e-mailadres in te voeren..."

**Volgende Stap**: Click "Volgende"

---

### Stap 4: Review & Submit

**Doel**: Finale review van alle data voor submit

#### 3.10 Review Sections

**Basic Info** (grijs panel):
- Titel (of "Niet ingevuld")
- Beschrijving (indien ingevuld)

**Task Steps** (grijs panel):
- Aantal stappen message
- "X stap(pen) toegevoegd" of "Geen stappen"

**Team Members** (grijs panel):
- Lijst van emails met bullet points
- Of: Amber warning "Voeg tenminste één teamlid toe"

#### 3.11 Validation Warnings

**Amber panel toont** (indien incomplete):
- ⚠️ "Let op - Vul alle verplichte velden in"
- Checklist van ontbrekende velden:
  - Titel vereist
  - Project vereist
  - Teamlid vereist

**Submit Action**: 
- "Aanmaken" button (enkel in stap 4)
- Disabled indien validatie faalt
- Bij success:
  ```typescript
  POST /api/tras
  body: {
    title, description, projectId, 
    taskSteps, teamMembers, templateId,
    requiredCompetencies, complianceFramework
  }
  ```
- Redirect: `/tras/{newId}` of fallback `/tras`

---

## 4. Template Functionaliteit

**Location**: [`TemplateSelector`](web/src/components/templates/TemplateSelector.tsx:18)

### 4.1 Template Architectuur

**Data Source**:
1. **Primary**: `GET /api/templates?organizationId={id}`
2. **Fallback**: Bundled system templates via dynamic import

**Template Structure**:
```typescript
{
  id: string
  name: string
  description: string
  industry: string
  hazards: HazardItem[]
  steps: TaskStep[]
  vcaCompliant: boolean
  version?: number
}
```

### 4.2 Template Weergave

**Carousel Mode**:
- 1 template per view (full preview)
- Carousel controls onderaan
- Counter: "1 / 15"
- Grote "Vorige"/"Volgende" buttons

**Template Card** (600px hoog):

**Header** (gradient background, 192px):
- Template naam (2xl, bold)
- Industrie badge (blauw)
- VCA badge (groen/grijs)

**Content** (452px):
- Beschrijving (4 regels, clipped)
- Stats Grid:
  - Gevaren (oranje badge met cijfer)
  - Werkstappen (groen badge met cijfer)
- Selectie status:
  - Geselecteerd: Groen panel met ✓
  - Niet: Grijs "Klik om te selecteren"

### 4.3 Filter & Search

**Search Bar**:
- Icon links (zoekglas)
- Clear button rechts (X)
- Real-time filtering op naam + beschrijving

**Category Filter**:
- "Alle categorieën" button
- Per industrie button
- Active state: Blauw met ring
- Translated labels via i18n

**Results Counter**:
- "X templates gevonden"
- "Filters resetten" link

### 4.4 Template Loading Flow

1. User kiest template in carousel
2. [`onChange(templateId)`](web/src/components/forms/TraWizard.tsx:228) fires
3. [`handleTemplateChange()`](web/src/components/forms/TraWizard.tsx:56) executes:
   - Sets loading state
   - Fetches full template data
   - Pre-populates form via `setValue()`
   - Shows template name indicator
4. User kan data aanpassen
5. "Reset to Template" button herstelt originele data

---

## 5. Hazard & Risk Management

**Centrale Component**: [`TraHazardWithRisk`](web/src/components/tra/TraHazardWithRisk.tsx:50)

### 5.1 Hazard Library

**Source**: Centralized hazard database
**Categories**: 
- Physical hazards
- Chemical hazards  
- Biological hazards
- Ergonomic hazards
- Psychosocial hazards

**Per Hazard**:
- ID (unique)
- Name
- Description
- Category
- Common controls (suggestions)

### 5.2 Risk Assessment Methodology

**Kinney & Wiruth Method**:

**Formula**: `Risk Score = Effect × Exposure × Probability`

**Effect (E) - Impact severity**:
- 100: Catastrophe (multiple fatalities)
- 40: Disaster (few fatalities)
- 15: Very serious (1 fatality)
- 7: Serious (severe injury)
- 3: Important (minor injury)
- 1: Noticeable (first aid)

**Exposure (B) - Frequency**:
- 10: Continuous
- 6: Daily
- 3: Weekly
- 2: Monthly
- 1: Yearly
- 0.5: Very rare

**Probability (W) - Likelihood**:
- 10: Very likely
- 6: Possible
- 3: Unusual but possible
- 1: Remote
- 0.5: Very remote
- 0.1: Almost impossible

### 5.3 Risk Levels & Actions

**Score Ranges**:
- **0-20 (Trivial)**: Groen, geen actie
- **21-70 (Acceptable)**: Lichtgroen, monitoring
- **71-200 (Possible)**: Geel, actie gewenst
- **201-400 (Substantial)**: Oranje, actie vereist
- **401-1000 (High)**: Rood, management goedkeuring
- **>1000 (Very High)**: Donkerrood, werk verboden

### 5.4 Control Measures Hierarchy

**Implementatie**: [`ControlMeasureManager`](web/src/components/tra/ControlMeasureManager.tsx:55)

**Preferred Order** (most effective → least):
1. **Elimination**: Verwijder het gevaar
2. **Substitution**: Vervang door veiliger alternatief
3. **Engineering**: Technische aanpassingen
4. **Administrative**: Procedures, training, signalering
5. **PPE**: Persoonlijke beschermingsmiddelen

**Per Measure Fields**:
- Type (hierarchy dropdown)
- Description (min 10 chars, required)
- Responsible person (optional)
- Status (planned → in_progress → completed → verified)

### 5.5 Residual Risk

**Purpose**: Valideren effectiviteit van controls

**Process**:
1. Initial risk assessed
2. Controls implemented
3. Residual risk assessed (same E/B/W parameters)
4. Comparison:
   - Success: Residual < Initial/2
   - Warning: Residual still HIGH/VERY_HIGH
   - Action: Add more controls or revise approach

---

## 6. Data Structuur

### 6.1 Form State

**Managed by**: `react-hook-form`

**Type**: [`CreateTRARequest`](web/src/lib/types/tra.ts:1) (partial during wizard)

```typescript
{
  title: string
  description?: string
  projectId: string
  templateId?: string
  taskSteps: TaskStep[]
  teamMembers: string[]
  requiredCompetencies?: string[]
  complianceFramework?: 'vca' | 'iso45001'
}
```

### 6.2 Task Step Structure

```typescript
{
  description: string
  duration: number  // minutes
  hazards: HazardWithRiskData[]
}
```

### 6.3 Hazard with Risk Data

```typescript
{
  // Hazard base
  id: string
  name: string
  description: string
  category: string
  
  // Initial risk
  effectScore?: number
  exposureScore?: number
  probabilityScore?: number
  riskScore?: number
  riskLevel?: RiskLevel
  riskNotes?: string
  
  // Controls
  controlMeasures?: ControlMeasure[]
  
  // Residual risk
  residualEffectScore?: number
  residualExposureScore?: number
  residualProbabilityScore?: number
  residualRiskScore?: number
  residualRiskLevel?: string
}
```

---

## 7. Draft vs. Submit

### 7.1 Autosave Status

**DISABLED**: [`AUTOSAVE_DELAY = null`](web/src/components/forms/TraWizard.tsx:131)

**Reason**: Testing/performance optimization

**Re-enable**: Set `AUTOSAVE_DELAY = 10000` (10 seconds)

### 7.2 Draft Functionality (when enabled)

**Endpoint**: `POST /api/tras/draft`
**Trigger**: Debounced form changes (10s delay)
**Behavior**:
- Saves partial TRA data
- Shows save status indicators:
  - "Opslaan..." (spinner)
  - "Opgeslagen" (2s display)
  - "Opslaan mislukt" (rood)

### 7.3 Final Submit

**Endpoint**: `POST /api/tras`
**Trigger**: "Aanmaken" button in Stap 4
**Validation**: 
- Title required
- ProjectId required
- TeamMembers required (min 1)

**Success Flow**:
1. Sets save status to "saving"
2. POST request with full form data
3. Receives TRA with ID
4. Redirects to `/tras/{id}` or `/tras`

**Error Handling**:
- Shows "saveFailed" status
- User can retry

---

## 8. Technische Implementatie

### 8.1 Core Components

**Entry Point**: [`page.tsx`](web/src/app/tras/create/page.tsx:17)
- Dynamic import van TraWizard
- Loading fallback spinner
- Suspense boundary

**Main Orchestrator**: [`TraWizard.tsx`](web/src/components/forms/TraWizard.tsx:33)
- 4 steps: BASIC, STEPS, TEAM, REVIEW
- Progress bar (percentage)
- Navigation: Terug/Volgende buttons
- Form state management (react-hook-form)
- Real-time VCA compliance

**Step Components**:
1. Step 0: [`TemplateSelector`](web/src/components/templates/TemplateSelector.tsx:18) + inline inputs
2. Step 1: [`TraStepBasic`](web/src/components/forms/TraWizardStepBasic.tsx:21)
3. Step 2: [`TeamMemberSelector`](web/src/components/forms/TeamMemberSelector.tsx:15)
4. Step 3: Inline review UI

**Supporting Components**:
- [`TraHazardWithRisk`](web/src/components/tra/TraHazardWithRisk.tsx:50): Hazard + risk management
- [`ControlMeasureManager`](web/src/components/tra/ControlMeasureManager.tsx:55): Control measures
- [`RiskCalculator`](web/src/components/tra/TraHazardWithRisk.tsx:567): Kinney & Wiruth calculator
- [`HazardSelector`](web/src/components/tra/TraHazardWithRisk.tsx:422): Hazard library browser
- [`ProjectSelector`](web/src/components/forms/TraWizard.tsx:302): Project dropdown

### 8.2 VCA Compliance Sidebar

**Component**: [`ComplianceReport`](web/src/components/forms/TraWizard.tsx:469-486)

**Real-time Calculation**:
- Triggers on form changes (useMemo)
- Calls [`calculateVCACompliance()`](web/src/lib/vca-compliance.ts:1)
- Updates every field change

**Display Modes**:
- **Compact**: Score + level + quick tips
- **Detailed**: Full issues + recommendations
- Toggle button switches modes

**Quick Tips** (shown in compact):
1. Minimaal 1 teamlid vereist
2. Alle risicobeoordelingen moeten compleet zijn
3. Hoog risico = management approval
4. Residueel risico moet acceptabel zijn
5. Documentatie is essentieel

### 8.3 State Management

**Form State**: 
- Provider: `react-hook-form`
- Validation: `onBlur` mode
- Dirty tracking: Per field

**Local State** (useState):
- `stepIndex`: Current wizard step (0-3)
- `saveStatus`: idle | saving | saved | failed
- `selectedTemplateName`: Display name
- `isTemplateLoading`: Loading indicator
- `templateLoadError`: Error message
- `complianceView`: compact | detailed
- `expandedSteps`: Set van expanded step indices
- `selectedHazards`: Per-step hazard list
- `hazardRisks`: Risk calculation results
- `expandedHazardIndex`: Currently expanded hazard

**Data Flow**:
```
User Input → Form State (react-hook-form)
          ↓
     setValue() updates
          ↓
   Parent form state synchronized
          ↓
  (Optional) Autosave to backend
          ↓
    Final Submit → POST /api/tras
```

### 8.4 Key Functions

**Template Handling**:
- [`handleTemplateChange()`](web/src/components/forms/TraWizard.tsx:56): Load & populate template
- Async fetch + error handling
- Pre-fills: title, description, taskSteps

**Navigation**:
- [`next()`](web/src/components/forms/TraWizard.tsx:172): Increment step (max 3)
- [`prev()`](web/src/components/forms/TraWizard.tsx:175): Decrement step (min 0)

**Submit**:
- [`onSubmit()`](web/src/components/forms/TraWizard.tsx:179): Final POST + redirect

**Hazard Management**:
- [`handleHazardsChange()`](web/src/components/tra/TraHazardWithRisk.tsx:149): Update hazard list
- [`handleRiskSaved()`](web/src/components/tra/TraHazardWithRisk.tsx:190): Store risk assessment
- [`handleResidualRiskSaved()`](web/src/components/tra/TraHazardWithRisk.tsx:230): Store residual risk
- [`handleControlsUpdated()`](web/src/components/tra/TraHazardWithRisk.tsx:269): Store controls

### 8.5 API Endpoints

**Template Loading**:
- `GET /api/templates?organizationId={id}` - List templates
- `GET /api/templates/{templateId}` - Single template

**TRA Operations**:
- `POST /api/tras/draft` - Save draft (DISABLED)
- `POST /api/tras` - Create final TRA

---

## Geanalyseerde Bestanden

✅ **Entry Point**:
- [`web/src/app/tras/create/page.tsx`](web/src/app/tras/create/page.tsx:17)

✅ **Core Wizard**:
- [`web/src/components/forms/TraWizard.tsx`](web/src/components/forms/TraWizard.tsx:33)
- [`web/src/components/forms/TraWizardStepBasic.tsx`](web/src/components/forms/TraWizardStepBasic.tsx:21)
- [`web/src/components/forms/TeamMemberSelector.tsx`](web/src/components/forms/TeamMemberSelector.tsx:15)

✅ **Template System**:
- [`web/src/components/templates/TemplateSelector.tsx`](web/src/components/templates/TemplateSelector.tsx:18)

✅ **Risk Management**:
- [`web/src/components/tra/TraHazardWithRisk.tsx`](web/src/components/tra/TraHazardWithRisk.tsx:50)
- [`web/src/components/tra/ControlMeasureManager.tsx`](web/src/components/tra/ControlMeasureManager.tsx:55)

✅ **Type Definitions**:
- [`web/src/lib/types/tra.ts`](web/src/lib/types/tra.ts:145)

---

**Laatste Update**: 2025-11-13  
**Versie**: 1.0  
**Status**: Complete implementatie gedocumenteerd