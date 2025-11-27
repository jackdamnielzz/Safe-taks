# TRA Template Selector & Wizard Integration

This document describes the implementation of the TRA Template Selector and its integration into the TRA Wizard, including how it interacts with the centralized VCA compliance logic.

## Overview

The TRA Wizard now supports starting a new TRA from:

- A VCA-compatibel template
- A "Start from scratch" flow (no template)

Key goals:

- Make template-based creation easy and visible
- Keep `templateId` optional but tracked
- Pre-populate fields from template while allowing full user override
- Ensure centralized, consistent VCA compliance calculation for all paths

## Components

### 1. TemplateSelector

File: [web/src/components/templates/TemplateSelector.tsx](web/src/components/templates/TemplateSelector.tsx)

Responsibilities:

- Fetch available templates from `/api/templates`
- Present templates in a responsive grid/list
- Display:
  - Template name
  - Description
  - VCA indicator (e.g. VCA-compliant)
  - Optional counts (steps/hazards) when available
- Provide a "Start from scratch" option
- Use Dutch translations via next-intl (`templates.*` namespace)
- Expose controlled selection API

Props:

- `value?: string`
  - Currently selected `templateId` (if any)
- `onChange: (templateId: string | null) => void`
  - Called with:
    - `templateId` when a template is chosen
    - `null` when "Start from scratch" is chosen
- `organizationId: string`
  - Used to scope templates for the current organization
- `onTemplateLoad?: (templateData: TemplateData) => void`
  - Optional callback when full template details are available
- `error?: string`
  - Optional error text to display from parent

Behavior:

- On mount:
  - Calls `/api/templates` to load template list
- Shows:
  - Loading state: "Templates laden..."
  - Error state when fetch fails
  - Empty state: "Geen templates beschikbaar"
- Always shows "Start from scratch" entry that calls `onChange(null)`.

### 2. TraWizard Integration

File: [web/src/components/forms/TraWizard.tsx](web/src/components/forms/TraWizard.tsx)

The wizard is a 4-step flow:

- Step 0: Basic (incl. Template Selector, title, description, project)
- Step 1: Task steps
- Step 2: Team
- Step 3: Review

Key integrations:

1) TemplateSelector in Step 0

- Rendered only when `stepIndex === 0`:

  - Uses:
    - `value={getValues().templateId}`
    - `onChange={(id) => handleTemplateChange(id)}`
    - `organizationId={userProfile?.organizationId || ""}`

2) Template selection handler

- `handleTemplateChange(templateId: string | null)`:

  - Always updates form state:

    - `setValue("templateId", templateId || undefined)`

  - When `templateId` is `null`:
    - Interpreted as "Start from scratch"
    - Clears template selection (no additional changes)

  - When `templateId` is set:
    - Fetches `/api/templates/{templateId}`
    - Safely handles:
      - `payload.template` or direct template in payload
    - Validates template shape
    - Tracks name via `selectedTemplateName`
    - Pre-populates (user can override):
      - `title` from template name (if not already set)
      - `description` from template description (if not already set)
      - `taskSteps` from:
        - `template.taskSteps` or `template.steps`
      - Persists `templateId` from template

3) Template indicator in UI

- When `templateId` is set:

  - Shows status block that:
    - Indicates template-based data ("Template geselecteerd")
    - Shows loading or error messages as needed
    - Provides "Reset naar template" button:
      - Calls `handleTemplateChange(currentTemplateId)` to re-apply template defaults

4) Start from scratch

- Always visible in TemplateSelector
- When chosen:
  - `templateId` is cleared in the form
  - User proceeds without any template constraints

### 3. VCA Compliance Integration (Wizard)

File: [web/src/components/forms/TraWizard.tsx](web/src/components/forms/TraWizard.tsx)

- Uses centralized compliance wrapper:

  - Import:
    - `import { calculateVCACompliance } from "@/lib/vca-compliance";`

- Computes compliance in `useMemo` based on current form values:

  - Builds a draft TRA object:

    - `id: "draft"`
    - `title`, `description`, `projectId` from form
    - `taskSteps` from form, ensuring `hazards` is always an array
    - `teamMembers`, `requiredCompetencies` defaulting to arrays
    - `status: "draft"`
    - `createdAt: new Date()`
    - `overallRiskScore: 0`
    - `overallRiskLevel: "trivial"`
    - `complianceFramework: form value or "vca"`

  - Passes this object to `calculateVCACompliance`

- Sidebar:

  - Renders `<ComplianceReport result={complianceResult} variant={compact|detailed} />`
  - Toggle to show more/less compliance details
  - Shows Dutch tips to help reach VCA compliance

Result:

- Both template-based and manual data flows are evaluated through the same VCA engine.
- No duplicate or legacy compliance logic in the wizard.

## API Expectations

- `/api/templates`
  - Returns a list of templates scoped to the organization where applicable.
- `/api/templates/{id}`
  - Returns full template data for a given templateId.
  - TRA Wizard uses this for pre-population.

If templates API is not fully implemented in the backend, the UI is structured so that:

- It can work with seeded/mocked data.
- Integration points are explicit and easy to adapt.

## Translations

Relevant keys are defined in `web/src/i18n/locales/nl.json`, including (non-exhaustive):

- Template Selector:
  - `templates.selector.title`
  - `templates.selector.subtitle`
  - `templates.startFromScratch`
  - `templates.loading`
  - `templates.empty`
  - `templates.selectedIndicator`
  - `templates.resetToTemplate`
  - `templates.loadError`
- Wizard:
  - `safety.tra.wizard.wizard.createTitle`
  - `safety.tra.wizard.wizard.titleLabel`
  - `safety.tra.wizard.wizard.descriptionLabel`
  - `safety.tra.wizard.wizard.projectRequired`
  - `safety.tra.wizard.compliance.*` (tips, toggle labels, etc.)

All user-facing strings for this feature are localized in Dutch via next-intl.

## Implementation Status

- TemplateSelector component:
  - Implemented and integrated.
- TraWizard:
  - Uses TemplateSelector in Step 0.
  - Loads and applies template data.
  - Supports "Start from scratch".
  - Tracks `templateId` for analytics/audit.
  - Uses centralized VCA compliance wrapper for live compliance feedback.
- Documentation:
  - This document reflects the current implementation as of this iteration.
