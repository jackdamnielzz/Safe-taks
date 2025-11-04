# TRA Template Library - Complete Implementation

## Overview
This document describes the complete implementation of the TRA Template Library system with 4 phases:
1. ✅ UI Component Development
2. ✅ Firestore Integration
3. ⏳ Hazard Library Expansion (100+ hazards)
4. ⏳ Approval Workflow

## Phase 1: UI Component Development ✅

### Components Created

#### 1. TemplateSelector (`web/src/components/templates/TemplateSelector.tsx`)
**Purpose**: Browse and select TRA templates

**Features**:
- Grid/List view toggle
- Search functionality
- Category filtering by industry
- VCA compliance badge
- Responsive design
- Real-time filtering

**Props**:
```typescript
interface TemplateSelectorProps {
  templates: TraTemplate[];
  onSelect: (template: TraTemplate) => void;
  selectedId?: string;
}
```

**Usage**:
```tsx
import { TemplateSelector } from '@/components/templates';

<TemplateSelector
  templates={templates}
  onSelect={(template) => console.log('Selected:', template)}
  selectedId={selectedTemplate?.id}
/>
```

#### 2. TemplatePreview (`web/src/components/templates/TemplatePreview.tsx`)
**Purpose**: Display detailed template information

**Features**:
- Complete template details
- Task steps with duration and personnel
- Hazards with Kinney & Wiruth risk scores
- Control measures with hierarchy levels
- Required competencies
- VCA compliance information
- Optional "Use Template" action button

**Props**:
```typescript
interface TemplatePreviewProps {
  template: TraTemplate;
  onUseTemplate?: () => void;
}
```

**Usage**:
```tsx
import { TemplatePreview } from '@/components/templates';

<TemplatePreview
  template={selectedTemplate}
  onUseTemplate={() => createTraFromTemplate(selectedTemplate)}
/>
```

#### 3. TemplateList (`web/src/components/templates/TemplateList.tsx`)
**Purpose**: Tabular list of templates with sorting and pagination

**Features**:
- Sortable columns (name, industry, hazards, steps)
- Pagination with configurable items per page
- Action buttons (view, edit, delete)
- VCA compliance indicator
- Loading and empty states

**Props**:
```typescript
interface TemplateListProps {
  templates: TraTemplate[];
  onView?: (template: TraTemplate) => void;
  onEdit?: (template: TraTemplate) => void;
  onDelete?: (template: TraTemplate) => void;
  isLoading?: boolean;
}
```

**Usage**:
```tsx
import { TemplateList } from '@/components/templates';

<TemplateList
  templates={templates}
  onView={(template) => router.push(`/templates/${template.id}`)}
  onEdit={(template) => router.push(`/templates/${template.id}/edit`)}
  onDelete={(template) => handleDelete(template)}
  isLoading={isLoading}
/>
```

### Translation Keys Added
All components are fully internationalized with Dutch translations in `web/src/messages/nl.json`:

```json
{
  "templates": {
    "selector": {
      "title": "Selecteer een TRA Template",
      "subtitle": "Kies een voorgedefinieerde template om snel aan de slag te gaan",
      "search": "Zoeken naar templates...",
      "allCategories": "Alle categorieën",
      "results": "{count} template(s) gevonden",
      "noResults": "Geen templates gevonden die aan uw criteria voldoen",
      "hazards": "gevaren",
      "steps": "stappen"
    },
    "preview": {
      "taskSteps": "Taakstappen",
      "hazards": "Gevaren",
      "controlMeasures": "Controlemaatregelen",
      "requiredCompetencies": "Vereiste competenties",
      "useTemplate": "Deze template gebruiken",
      "effect": "Effect",
      "exposure": "Blootstelling",
      "probability": "Waarschijnlijkheid",
      "riskVeryHigh": "Zeer Hoog",
      "riskHigh": "Hoog",
      "riskSubstantial": "Aanzienlijk",
      "riskPossible": "Mogelijk",
      "riskLow": "Laag",
      "notes": "Opmerkingen",
      "hierarchy": {
        "elimination": "Eliminatie",
        "substitution": "Vervanging",
        "engineering": "Technische maatregel",
        "administrative": "Administratieve maatregel",
        "ppe": "Persoonlijke beschermingsmiddelen"
      }
    },
    "list": {
      "loading": "Templates laden...",
      "empty": "Geen templates beschikbaar",
      "showing": "Toont {start} tot {end} van {total} templates",
      "itemsPerPage": "Items per pagina",
      "name": "Naam",
      "industry": "Industrie",
      "hazards": "Gevaren",
      "steps": "Stappen",
      "vca": "VCA",
      "actions": "Acties",
      "view": "Bekijken",
      "edit": "Bewerken",
      "delete": "Verwijderen",
      "previous": "Vorige",
      "next": "Volgende"
    }
  }
}
```

## Phase 2: Firestore Integration ✅

### Seed Script (`functions/src/seedTemplates.ts`)
**Purpose**: Upload TRA templates to Firestore

**Features**:
- Reads JSON templates from `web/src/data/tra-templates/`
- Uploads to Firestore with timestamps
- Supports both system-wide and organization-specific templates
- Validates template structure
- Provides detailed logging

**Usage**:
```bash
# Seed system templates
cd functions
npm run seed:templates

# Seed organization-specific templates
npm run seed:templates -- --org-id=org123
```

**Firestore Structure**:
```
System Templates:
/traTemplates/{templateId}

Organization Templates:
/organizations/{orgId}/traTemplates/{templateId}
```

**Template Document Structure**:
```typescript
{
  id: string;
  name: string;
  description: string;
  industry: 'construction' | 'industrial' | 'offshore';
  category: string;
  vcaCompliant: boolean;
  vcaVersion: string;
  validityPeriod: number;
  createdBy: 'system' | 'organization';
  organizationId: string | null;
  version: number;
  usageCount: number;
  steps: TaskStep[];
  hazards: Hazard[];
  requiredCompetencies: string[];
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### NPM Script Added
Added to `functions/package.json`:
```json
{
  "scripts": {
    "seed:templates": "npm run build && node dist/seedTemplates.js"
  }
}
```

## Phase 3: Hazard Library Expansion ⏳

### Status: IN PROGRESS
Creating comprehensive hazard library with 100+ predefined hazards.

### Planned Structure
**File**: `web/src/data/hazards/hazard-library.json`

**Categories**:
1. Electrical (10+ hazards)
2. Mechanical (10+ hazards)
3. Chemical (15+ hazards)
4. Biological (8+ hazards)
5. Physical (20+ hazards)
6. Ergonomic (10+ hazards)
7. Psychosocial (8+ hazards)
8. Fire/Explosion (10+ hazards)
9. Environmental (10+ hazards)

**Hazard Structure**:
```typescript
{
  id: string;
  name: string;
  description: string;
  category: HazardCategory;
  typical_effect: number;      // Kinney & Wiruth E score
  typical_exposure: number;    // Kinney & Wiruth B score
  typical_probability: number; // Kinney & Wiruth W score
  common_controls: string[];   // Common control measures
}
```

### Next Steps for Phase 3
1. Complete hazard library JSON file (100+ hazards)
2. Create hazard selector component
3. Create hazard search/filter functionality
4. Integrate with TRA creation workflow

## Phase 4: Approval Workflow ⏳

### Status: PLANNED

### Planned Features

#### 1. Approval Configuration
- Define multi-step approval workflows
- Role-based approvers
- Conditional approval paths
- Escalation rules

#### 2. Approval UI Components
- Approval request list
- Approval detail view
- Approve/Reject actions
- Comment system
- Approval history

#### 3. Notification System
- Email notifications
- In-app notifications
- Approval reminders
- Escalation alerts

#### 4. Rejection Handling
- Rejection reasons
- Revision workflow
- Re-submission process
- Version control

### Planned Firestore Structure
```
/tras/{traId}/approvals/{approvalId}
{
  traId: string;
  step: number;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  timestamp: Timestamp;
  notificationsSent: string[];
}
```

## Integration Guide

### Using Templates in TRA Creation

```typescript
import { TemplateSelector, TemplatePreview } from '@/components/templates';
import { loadTemplates } from '@/lib/templates/load-templates';
import { TraTemplate } from '@/types/tra-template';

function TraCreationPage() {
  const [templates, setTemplates] = useState<TraTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TraTemplate | null>(null);

  useEffect(() => {
    // Load templates from JSON files or Firestore
    const loadedTemplates = loadTemplates();
    setTemplates(loadedTemplates);
  }, []);

  const handleUseTemplate = (template: TraTemplate) => {
    // Create new TRA from template
    const newTra = {
      ...template,
      id: generateId(),
      createdAt: new Date(),
      status: 'draft',
    };
    
    // Save to Firestore and navigate
    saveTra(newTra);
    router.push(`/tras/${newTra.id}/edit`);
  };

  return (
    <div>
      <TemplateSelector
        templates={templates}
        onSelect={setSelectedTemplate}
        selectedId={selectedTemplate?.id}
      />
      
      {selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onUseTemplate={() => handleUseTemplate(selectedTemplate)}
        />
      )}
    </div>
  );
}
```

### Loading Templates from Firestore

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function loadTemplatesFromFirestore(organizationId?: string) {
  const templates: TraTemplate[] = [];
  
  // Load system templates
  const systemQuery = query(collection(db, 'traTemplates'));
  const systemSnapshot = await getDocs(systemQuery);
  systemSnapshot.forEach((doc) => {
    templates.push({ id: doc.id, ...doc.data() } as TraTemplate);
  });
  
  // Load organization-specific templates if orgId provided
  if (organizationId) {
    const orgQuery = query(
      collection(db, `organizations/${organizationId}/traTemplates`)
    );
    const orgSnapshot = await getDocs(orgQuery);
    orgSnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as TraTemplate);
    });
  }
  
  return templates;
}
```

## Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from '@/components/templates';

describe('TemplateSelector', () => {
  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Test Template',
      description: 'Test Description',
      industry: 'construction',
      vcaCompliant: true,
      hazards: [],
      steps: [],
    },
  ];

  it('renders templates', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });

  it('filters templates by search', () => {
    render(
      <TemplateSelector
        templates={mockTemplates}
        onSelect={jest.fn()}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/zoeken/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });
});
```

## Deployment Checklist

- [x] UI Components created and tested
- [x] Translation keys added
- [x] Firestore seed script created
- [x] NPM scripts configured
- [ ] Hazard library completed (100+ hazards)
- [ ] Approval workflow implemented
- [ ] Integration tests written
- [ ] Documentation updated
- [ ] User acceptance testing completed

## Next Steps

1. **Complete Phase 3**: Finish hazard library with 100+ predefined hazards
2. **Implement Phase 4**: Build approval workflow system
3. **Integration**: Connect components to TRA creation workflow
4. **Testing**: Write comprehensive tests for all components
5. **Documentation**: Create user guides and API documentation

## Support

For questions or issues, contact the development team or refer to:
- Type definitions: `web/src/types/tra-template.ts`
- Existing templates: `web/src/data/tra-templates/`
- Component examples: `web/src/components/templates/`
