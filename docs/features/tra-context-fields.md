# TRA Context Fields Feature

## Overview

The Context Fields feature enhances TRA's with materials tracking and workplace conditions documentation, providing better safety management and VCA compliance.

## Features

### Materials Tracking

Track materials used in tasks with comprehensive details:

- **Material Name**: Identify the material
- **Quantity & Unit**: Specify amount and measurement unit
- **Hazardous Flag**: Mark dangerous materials
- **MSDS Requirements**: Flag materials requiring Material Safety Data Sheets
- **Storage Requirements**: Document special storage needs
- **Auto-suggest Related Hazards**: System suggests relevant hazards based on materials

### Workplace Conditions

Document 7 types of workplace conditions:

1. **Lighting**: adequate, poor, dark, bright
2. **Ventilation**: good, moderate, poor, none
3. **Temperature**: comfortable, hot, cold, extreme
4. **Noise**: quiet, moderate, loud, extreme
5. **Space Constraint**: open, confined, cramped, restricted
6. **Ground Condition**: stable, uneven, slippery, unstable
7. **Weather Exposure**: indoor, sheltered, exposed, extreme

Features include:
- Visual warnings for extreme conditions
- Real-time hazard suggestions
- Notes field for additional context

### Integration Points

#### VCA Scoring
- **+5 points** for documented workplace conditions
- **+3 points** for materials with MSDS requirements
- **Maximum combined bonus**: 8 points (capped at 100%)

#### LMRA Integration
- TRA materials automatically displayed in LMRA Step 5 (Equipment Verification)
- Read-only display for reference during work execution

#### Hazard Suggestions
- 13 material categories with automatic hazard mapping
- Condition-based hazard suggestions
- Combined suggestions from materials and conditions

## User Guide

### Adding Materials to TRA

1. Open TRA in edit mode
2. Navigate to the task step
3. Click **"Materiaal Toevoegen"** (Add Material)
4. Fill in the form:
   - Material name (required)
   - Quantity (required)
   - Unit (required)
   - Check "Gevaarlijk" if hazardous
   - Check "SDS Vereist" if MSDS required
   - Add storage requirements if needed
5. Click **"Opslaan"** (Save)

**Tip**: After adding hazardous materials, use the "Suggest Hazards" feature to automatically identify related risks.

### Documenting Workplace Conditions

1. Expand the **"Werkomstandigheden"** (Workplace Conditions) section
2. Select appropriate values for each condition type:
   - Choose from dropdown options for each category
   - System highlights extreme conditions in orange
3. Add notes in the text field if needed
4. System automatically suggests relevant hazards for extreme conditions

### Using Hazard Suggestions

#### From Materials:
1. After adding materials, look for the "Suggest Hazards" button
2. Click to view suggested hazards based on your materials
3. Review the suggestions
4. Select relevant hazards
5. Click **"Voeg toe"** (Add) to add them to your hazard list

#### From Conditions:
1. When you select extreme conditions (dark, extreme temp, unstable ground, etc.)
2. System automatically shows hazard suggestions
3. Click **"Bekijk gerelateerde gevaren"** (View Related Hazards)
4. Add suggested hazards as needed

## Technical Details

### Type Definitions

```typescript
interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  hazardous: boolean;
  msdsRequired: boolean;
  storageRequirements?: string;
}

interface WorkplaceConditions {
  lighting: 'adequate' | 'poor' | 'dark' | 'bright';
  ventilation: 'good' | 'moderate' | 'poor' | 'none';
  temperature: 'comfortable' | 'hot' | 'cold' | 'extreme';
  noise: 'quiet' | 'moderate' | 'loud' | 'extreme';
  spaceConstraint: 'open' | 'confined' | 'cramped' | 'restricted';
  groundCondition: 'stable' | 'uneven' | 'slippery' | 'unstable';
  weatherExposure: 'indoor' | 'sheltered' | 'exposed' | 'extreme';
  notes?: string;
}
```

### Validation Rules

#### Materials:
- Name, quantity, and unit are required
- All strings must be non-empty (no whitespace-only values)
- Hazardous materials without identified hazards trigger warnings
- MSDS materials without hazards trigger warnings

#### Workplace Conditions:
- Extreme conditions automatically trigger warnings:
  - Dark lighting
  - Extreme temperature
  - Extreme noise
  - Unstable ground
  - Extreme weather exposure
- Warnings include specific condition names for clarity

### VCA Scoring Impact

Context fields automatically contribute to VCA scoring:

```typescript
// Documented workplace conditions
if (hasWorkplaceConditions) {
  score += 5; // +5 points
}

// Materials with MSDS requirements
if (hasMSDSMaterials) {
  score += 3; // +3 points
}

// Combined maximum: 8 points
// Final score capped at 100%
```

### Material-Hazard Mapping

The system recognizes 13 material categories:

1. **Chemicals**: chemisch, zuur, base, oplosmiddel
2. **Hazardous Materials**: asbest, lood, kwik
3. **Flammables**: brandbaar, explosief, gas
4. **Construction Materials**: cement, beton, mortel
5. **Wood**: hout, zaag, spaanplaat
6. **Metal**: metaal, staal, ijzer, aluminium
7. **Electrical**: elektrisch, bekabeling, spanning
8. **Paint & Coatings**: verf, coating, lak
9. **Insulation**: isolatie, glaswol, steenwol
10. **Adhesives**: lijm, kit, binding
11. **Heavy Items**: zwaar, tillen (ergonomic hazards)
12. **Sharp Objects**: scherp, snijden (cutting hazards)
13. **Dust-Producing**: stof, poeder (respiratory hazards)

**Generic Fallback**: Unknown hazardous materials get generic safety hazard suggestions.

## Testing

### Test Coverage
- **21 validation tests**: Material and task step validation
- **23 UI component tests**: MaterialsList and WorkplaceConditionsForm
- **27 integration tests**: Hazard suggestions, VCA scoring, LMRA integration
- **Total**: 71 tests, 100% passing
- **Code Coverage**: >80% for all new code

### Test Files
- [`web/src/__tests__/tra-context-fields.test.ts`](../../web/src/__tests__/tra-context-fields.test.ts) - Validation logic
- [`web/src/__tests__/tra-context-ui.test.tsx`](../../web/src/__tests__/tra-context-ui.test.tsx) - UI components
- [`web/src/__tests__/tra-context-integration.test.ts`](../../web/src/__tests__/tra-context-integration.test.ts) - System integration

## Backward Compatibility

✅ **Fully backward compatible**:
- All context fields are optional (`materials?`, `workplaceConditions?`)
- Existing TRAs continue working without modifications
- No database migration required
- No breaking changes to public APIs
- Existing validation logic unaffected

## Known Limitations

1. **Material-Hazard Mapping**: Limited to 13 predefined categories
2. **Generic Fallback**: Unknown materials get generic hazard suggestions
3. **VCA Bonus Cap**: Maximum 8 points from context fields
4. **Manual Entry**: No integration with external material databases yet
5. **Single Language**: Hazard suggestions currently in Dutch only

## Future Enhancements

### Planned
- Expand material-hazard database with more categories
- Machine learning for custom material recognition
- Historical material usage analytics
- Integration with external MSDS databases
- Multi-language support for hazard suggestions

### Under Consideration
- Barcode scanning for materials
- Photo attachment for materials/conditions
- Weather API integration for automatic condition detection
- Material inventory management
- Supplier database integration

## Security & Privacy

- All material data stored in Firestore with organization-level isolation
- Standard security rules apply (same as other TRA data)
- No PII (Personally Identifiable Information) stored
- MSDS flags for regulatory compliance tracking
- Audit trail via standard Firestore timestamps

## Support & Troubleshooting

### Common Issues

**Issue**: Hazard suggestions not appearing
- **Solution**: Ensure materials are marked as hazardous or conditions are set to extreme values

**Issue**: VCA bonus not applying
- **Solution**: Verify conditions are documented and materials with MSDS are flagged correctly

**Issue**: Materials not showing in LMRA
- **Solution**: Confirm the LMRA is linked to the correct TRA and materials exist in task steps

### Getting Help

- Review the [API Documentation](../api/tra-context-fields-api.md)
- Check the [Test Report](../testing/tra-context-fields-test-report.md)
- Contact development team for technical support

## Version History

- **v1.3.0** (Phase 1): Initial release
  - Materials tracking
  - Workplace conditions
  - Hazard suggestions
  - VCA scoring integration
  - LMRA integration
  - 71 tests, 100% passing