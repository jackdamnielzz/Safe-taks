# TRA Context Fields API Documentation

## Type Definitions

### Material Interface

```typescript
interface Material {
  id: string;                    // Unique identifier
  name: string;                  // Material name (required)
  quantity: string;              // Amount (required)
  unit: string;                  // Measurement unit (required)
  hazardous: boolean;            // Is material hazardous?
  msdsRequired: boolean;         // Requires Material Safety Data Sheet?
  storageRequirements?: string;  // Optional storage instructions
}
```

### WorkplaceConditions Interface

```typescript
interface WorkplaceConditions {
  lighting: 'adequate' | 'poor' | 'dark' | 'bright';
  ventilation: 'good' | 'moderate' | 'poor' | 'none';
  temperature: 'comfortable' | 'hot' | 'cold' | 'extreme';
  noise: 'quiet' | 'moderate' | 'loud' | 'extreme';
  spaceConstraint: 'open' | 'confined' | 'cramped' | 'restricted';
  groundCondition: 'stable' | 'uneven' | 'slippery' | 'unstable';
  weatherExposure: 'indoor' | 'sheltered' | 'exposed' | 'extreme';
  notes?: string;                // Optional additional notes
}
```

### Extended TaskStep

```typescript
interface TaskStep {
  // ... existing fields ...
  materials?: Material[];                 // Optional materials array
  workplaceConditions?: WorkplaceConditions;  // Optional conditions
}
```

## Validation Functions

### validateMaterial(material: Material)

Validates a single material entry.

**Parameters:**
- `material`: Material object to validate

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;  // Dutch error message if invalid
}
```

**Validation Rules:**
- Name must be non-empty string (no whitespace-only)
- Quantity must be non-empty string
- Unit must be non-empty string

**Example:**
```typescript
import { validateMaterial } from '@/lib/validators/tra-context-fields';

const result = validateMaterial({
  id: '1',
  name: 'Cement',
  quantity: '50',
  unit: 'kg',
  hazardous: false,
  msdsRequired: false,
});

if (!result.valid) {
  console.error(result.error); // "Materiaalnaam is verplicht"
}
```

### validateTaskStepContextFields(taskStep: TaskStep)

Validates context fields for a task step.

**Parameters:**
- `taskStep`: TaskStep with optional materials and conditions

**Returns:**
```typescript
{
  valid: boolean;
  warnings: string[];  // Non-blocking warnings
  errors: string[];    // Blocking errors
}
```

**Warning Conditions:**
- Hazardous materials without identified hazards
- MSDS materials without hazards
- Extreme workplace conditions (dark, extreme temp, unstable ground, extreme weather/noise)

**Example:**
```typescript
import { validateTaskStepContextFields } from '@/lib/validators/tra-context-fields';

const result = validateTaskStepContextFields({
  taskName: 'Welding',
  materials: [{
    id: '1',
    name: 'Welding Gas',
    quantity: '1',
    unit: 'cylinder',
    hazardous: true,
    msdsRequired: true,
  }],
  hazards: [], // Empty - will trigger warning
});

// result.warnings: ["Taakstap bevat 1 gevaarlijk materiaal maar geen geïdentificeerde gevaren"]
```

## Hazard Suggestion Functions

### suggestHazardsFromMaterials(materials: Material[])

Generate hazard suggestions based on materials.

**Parameters:**
- `materials`: Array of materials

**Returns:** `Hazard[]` - Array of suggested hazards

**Material Categories:**
- Chemicals, Hazardous Materials, Flammables
- Construction Materials, Wood, Metal
- Electrical, Paint, Insulation
- Adhesives, Heavy Items, Sharp Objects, Dust-Producing

**Example:**
```typescript
import { suggestHazardsFromMaterials } from '@/lib/utils/material-hazard-mapping';

const suggestions = suggestHazardsFromMaterials([
  {
    id: '1',
    name: 'Brandbare vloeistof',
    quantity: '10',
    unit: 'L',
    hazardous: true,
    msdsRequired: true,
  },
]);

// Returns hazards with type: 'fire', 'explosion', etc.
```

### suggestHazardsFromConditions(conditions: WorkplaceConditions)

Generate hazard suggestions based on workplace conditions.

**Parameters:**
- `conditions`: WorkplaceConditions object

**Returns:** `Hazard[]` - Array of suggested hazards

**Extreme Conditions:**
- Dark lighting → visibility hazards
- Poor/No ventilation → health hazards
- Extreme temperature → heat stress hazards
- Extreme noise → hearing hazards
- Unstable ground → falling hazards
- Confined/cramped space → confined space hazards
- Extreme weather → exposure hazards

**Example:**
```typescript
import { suggestHazardsFromConditions } from '@/lib/utils/material-hazard-mapping';

const suggestions = suggestHazardsFromConditions({
  lighting: 'dark',
  ventilation: 'good',
  temperature: 'comfortable',
  noise: 'quiet',
  spaceConstraint: 'open',
  groundCondition: 'stable',
  weatherExposure: 'indoor',
});

// Returns visibility-related hazards
```

### suggestAllHazards(materials: Material[], conditions?: WorkplaceConditions)

Combined suggestions from materials and conditions.

**Parameters:**
- `materials`: Array of materials
- `conditions`: Optional workplace conditions

**Returns:** `Hazard[]` - Combined array of unique suggested hazards

## React Components

### MaterialsList

Display and manage materials for a task.

**Props:**
```typescript
interface MaterialsListProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  readOnly?: boolean;
  onSuggestHazards?: (hazards: Hazard[]) => void;
}
```

**Usage:**
```tsx
import { MaterialsList } from '@/components/tra/MaterialsList';

<MaterialsList
  materials={taskStep.materials || []}
  onChange={(updated) => updateTaskStep({ materials: updated })}
  onSuggestHazards={(hazards) => showHazardModal(hazards)}
/>
```

**Features:**
- CRUD operations for materials
- Validation on save
- Hazardous and MSDS badges
- Hazard suggestion button
- Read-only mode support

### WorkplaceConditionsForm

Display and edit workplace conditions.

**Props:**
```typescript
interface WorkplaceConditionsFormProps {
  conditions?: WorkplaceConditions;
  onChange: (conditions: WorkplaceConditions) => void;
  readOnly?: boolean;
}
```

**Usage:**
```tsx
import { WorkplaceConditionsForm } from '@/components/tra/WorkplaceConditionsForm';

<WorkplaceConditionsForm
  conditions={taskStep.workplaceConditions}
  onChange={(updated) => updateTaskStep({ workplaceConditions: updated })}
/>
```

**Features:**
- 7 condition dropdowns with Dutch labels
- Extreme condition warnings (visual)
- Real-time hazard suggestions
- Conditions preview
- Notes field
- Read-only mode support

## VCA Integration

Context fields automatically contribute to VCA scoring via [`web/src/lib/compliance/vca-validator.ts`](../../web/src/lib/compliance/vca-validator.ts:1):

```typescript
// No explicit API calls needed - scoring happens automatically

// Documented workplace conditions: +5 points
// Materials with MSDS: +3 points
// Maximum combined: +8 points (capped at 100% total)
```

**Access via public wrapper:**
```typescript
import { calculateVCACompliance } from '@/lib/vca-compliance';

const result = await calculateVCACompliance(tra);
// result.score includes context field bonuses
```

## LMRA Integration

Materials automatically appear in LMRA Step 5 if present in related TRA:

```typescript
// In LMRA execution
const lmraData: LMRA = {
  // ... other fields ...
  relatedTraId: tra.id,  // Link to TRA
};

// In Step 5 component
import { Step5_EquipmentVerification } from '@/components/lmra/steps/Step5_EquipmentVerification';

// Materials from TRA automatically displayed for reference
```

## Translations

All UI text via next-intl under `tra.contextFields` namespace:

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('tra.contextFields');

// Available keys:
t('materials')             // "Materialen"
t('addMaterial')          // "Materiaal toevoegen"
t('materialName')         // "Materiaalnaam"
t('workplaceConditions')  // "Werkomstandigheden"
t('lighting')             // "Verlichting"
// ... etc.
```

## Error Handling

### Validation Errors

All validation errors are in Dutch:

```typescript
{
  valid: false,
  error: 'Materiaalnaam is verplicht'
}
```

### Warnings

Warnings for hazardous materials and extreme conditions:

```typescript
{
  valid: true,
  warnings: [
    'Taakstap bevat 2 gevaarlijke materialen maar geen geïdentificeerde gevaren',
    'Extreme werkomstandigheden gedetecteerd: Donkere verlichting, Onstabiele ondergrond'
  ],
  errors: []
}
```

## Best Practices

### 1. Always Validate Before Saving

```typescript
const validation = validateTaskStepContextFields(taskStep);
if (!validation.valid || validation.errors.length > 0) {
  // Show errors to user
  return;
}
// Show warnings but allow save
if (validation.warnings.length > 0) {
  showWarnings(validation.warnings);
}
```

### 2. Use Hazard Suggestions Proactively

```typescript
// After user adds hazardous materials
const suggestions = suggestHazardsFromMaterials(materials);
if (suggestions.length > 0) {
  promptUserToReviewSuggestions(suggestions);
}
```

### 3. Handle Optional Fields Safely

```typescript
// Always check for undefined
const materials = taskStep.materials || [];
const conditions = taskStep.workplaceConditions;

// Safely access nested properties
if (conditions?.lighting === 'dark') {
  // Handle dark lighting
}
```

### 4. Maintain Backward Compatibility

```typescript
// Always treat context fields as optional
interface TaskStep {
  // Required fields
  taskName: string;
  // ...
  
  // Optional context fields
  materials?: Material[];
  workplaceConditions?: WorkplaceConditions;
}
```

## Performance Considerations

### Hazard Suggestion Caching

Hazard suggestions are computed on-demand. For large material lists:

```typescript
// Debounce suggestions in UI
const debouncedSuggest = useMemo(
  () => debounce(() => {
    const suggestions = suggestHazardsFromMaterials(materials);
    setSuggestions(suggestions);
  }, 300),
  [materials]
);
```

### Validation Frequency

Validate only on save, not on every keystroke:

```typescript
// Good: Validate on save
const handleSave = () => {
  const validation = validateMaterial(material);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  save(material);
};

// Avoid: Validating on every change
const handleChange = (value) => {
  validateMaterial({...material, name: value}); // Too frequent
};
```

## Migration Guide

### Adding Context Fields to Existing TRAs

No migration needed! All fields are optional:

```typescript
// Existing TRA without context fields
const existingTRA = {
  id: 'tra-1',
  tasks: [{
    taskName: 'Task 1',
    hazards: [],
    // No materials or workplaceConditions
  }],
};

// Still valid - no changes needed
```

### Updating TRA with Context Fields

```typescript
// Add materials to existing task
const updatedTask = {
  ...existingTask,
  materials: [{
    id: generateId(),
    name: 'Cement',
    quantity: '50',
    unit: 'kg',
    hazardous: false,
    msdsRequired: false,
  }],
};

// Add workplace conditions
const updatedTask2 = {
  ...updatedTask,
  workplaceConditions: {
    lighting: 'adequate',
    ventilation: 'good',
    temperature: 'comfortable',
    noise: 'quiet',
    spaceConstraint: 'open',
    groundCondition: 'stable',
    weatherExposure: 'indoor',
  },
};
```

## Troubleshooting

### Issue: Hazard suggestions not working

**Symptom**: No hazards suggested despite hazardous materials
**Cause**: Material name doesn't match known categories
**Solution**: Use keywords from the 13 recognized categories or mark as hazardous to get generic suggestions

### Issue: VCA bonus not applying

**Symptom**: VCA score doesn't increase with context fields
**Cause**: Fields not properly saved or validation failed
**Solution**: Verify materials and conditions are saved in Firestore; check browser console for errors

### Issue: LMRA not showing TRA materials

**Symptom**: Materials not visible in LMRA Step 5
**Cause**: LMRA not linked to TRA or materials empty
**Solution**: Verify `relatedTraId` is set and TRA has materials in task steps

## Version History

- **v1.3.0**: Initial API release
  - Material and WorkplaceConditions types
  - Validation functions
  - Hazard suggestion algorithms
  - React components
  - VCA and LMRA integration