/**
 * TRA Context Fields Validation Tests
 * Tests for materials and workplace conditions validation
 */

import { validateTaskStepContextFields, validateMaterial } from '../lib/validators/tra-context-fields';
import { TaskStep, Material, WorkplaceConditions } from '../lib/types/tra';

describe('TRA Context Fields Validation', () => {
  describe('Material Validation', () => {
    test('valid material passes validation', () => {
      const material: Material = {
        id: '1',
        name: 'Cement',
        quantity: '50',
        unit: 'kg',
        hazardous: false,
        msdsRequired: false,
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('material without name fails validation', () => {
      const material: Material = {
        id: '1',
        name: '',
        quantity: '50',
        unit: 'kg',
        hazardous: false,
        msdsRequired: false,
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('verplicht');
    });

    test('material without quantity fails validation', () => {
      const material: Material = {
        id: '1',
        name: 'Cement',
        quantity: '',
        unit: 'kg',
        hazardous: false,
        msdsRequired: false,
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('verplicht');
    });

    test('material without unit fails validation', () => {
      const material: Material = {
        id: '1',
        name: 'Cement',
        quantity: '50',
        unit: '',
        hazardous: false,
        msdsRequired: false,
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('verplicht');
    });

    test('material with whitespace-only name fails validation', () => {
      const material: Material = {
        id: '1',
        name: '   ',
        quantity: '50',
        unit: 'kg',
        hazardous: false,
        msdsRequired: false,
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('verplicht');
    });

    test('hazardous material with MSDS passes validation', () => {
      const material: Material = {
        id: '1',
        name: 'Chemical X',
        quantity: '10',
        unit: 'L',
        hazardous: true,
        msdsRequired: true,
        storageRequirements: 'Store in cool, dry place',
      };
      
      const result = validateMaterial(material);
      expect(result.valid).toBe(true);
    });
  });

  describe('TaskStep Context Fields Validation', () => {
    test('task with hazardous materials but no hazards triggers warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Dangerous Chemical',
            quantity: '10',
            unit: 'L',
            hazardous: true,
            msdsRequired: true,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('gevaarlijke materialen');
    });

    test('task with MSDS required materials triggers warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Chemical X',
            quantity: '5',
            unit: 'L',
            hazardous: false,
            msdsRequired: true,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('MSDS documentatie')
      );
      expect(result.warnings[0]).toContain('Chemical X');
    });

    test('task with multiple MSDS required materials lists all names', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Chemical A',
            quantity: '5',
            unit: 'L',
            hazardous: false,
            msdsRequired: true,
          },
          {
            id: '2',
            name: 'Chemical B',
            quantity: '3',
            unit: 'L',
            hazardous: false,
            msdsRequired: true,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Chemical A');
      expect(result.warnings[0]).toContain('Chemical B');
    });

    test('extreme workplace conditions trigger warnings', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        workplaceConditions: {
          lighting: 'dark',
          ventilation: 'good',
          temperature: 'extreme',
          noise: 'extreme',
          spaceConstraint: 'open',
          groundCondition: 'unstable',
          weatherExposure: 'extreme',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Extreme werkomstandigheden');
    });

    test('dark lighting condition triggers warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        workplaceConditions: {
          lighting: 'dark',
          ventilation: 'good',
          temperature: 'comfortable',
          noise: 'quiet',
          spaceConstraint: 'open',
          groundCondition: 'stable',
          weatherExposure: 'indoor',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('donkere omstandigheden');
    });

    test('unstable ground condition triggers warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        workplaceConditions: {
          lighting: 'adequate',
          ventilation: 'good',
          temperature: 'comfortable',
          noise: 'quiet',
          spaceConstraint: 'open',
          groundCondition: 'unstable',
          weatherExposure: 'indoor',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('onstabiele ondergrond');
    });

    test('task without materials or conditions passes without warnings', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('backward compatibility: existing TRAs without new fields remain valid', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Old task',
        hazards: [],
        equipment: ['Ladder'],
        location: 'Building A',
        // No materials or workplaceConditions
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('task with all extreme conditions lists all of them', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
        workplaceConditions: {
          lighting: 'dark',
          ventilation: 'good',
          temperature: 'extreme',
          noise: 'extreme',
          spaceConstraint: 'open',
          groundCondition: 'unstable',
          weatherExposure: 'extreme',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      const warning = result.warnings[0];
      expect(warning).toContain('extreme temperatuur');
      expect(warning).toContain('extreem geluidsniveau');
      expect(warning).toContain('extreme weersomstandigheden');
      expect(warning).toContain('onstabiele ondergrond');
      expect(warning).toContain('donkere omstandigheden');
    });

    test('good workplace conditions do not trigger warnings', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test task',
        hazards: [],
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
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Material Hazard Correlation', () => {
    test('non-hazardous materials without hazards are valid', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Water',
            quantity: '100',
            unit: 'L',
            hazardous: false,
            msdsRequired: false,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings).toHaveLength(0);
    });

    test('hazardous materials with identified hazards do not trigger warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test',
        hazards: [
          {
            id: 'h1',
            description: 'Chemical exposure',
            category: 'chemical',
            source: 'custom',
            effectScore: 7,
            exposureScore: 3,
            probabilityScore: 1,
            riskScore: 21,
            riskLevel: 'acceptable',
            controlMeasures: [],
          },
        ],
        materials: [
          {
            id: '1',
            name: 'Dangerous Chemical',
            quantity: '10',
            unit: 'L',
            hazardous: true,
            msdsRequired: true,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      // Should only have MSDS warning, not the hazard correlation warning
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain('MSDS documentatie');
      expect(result.warnings[0]).not.toContain('geen geïdentificeerde gevaren');
    });

    test('multiple hazardous materials without hazards trigger single warning', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Test',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Chemical A',
            quantity: '10',
            unit: 'L',
            hazardous: true,
            msdsRequired: true,
          },
          {
            id: '2',
            name: 'Chemical B',
            quantity: '5',
            unit: 'L',
            hazardous: true,
            msdsRequired: true,
          },
        ],
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.warnings.length).toBeGreaterThan(0);
      // Should mention the count
      expect(result.warnings[0]).toContain('2 gevaarlijke materialen');
    });
  });

  describe('Combined Conditions', () => {
    test('task with both hazardous materials and extreme conditions triggers multiple warnings', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Complex task',
        hazards: [],
        materials: [
          {
            id: '1',
            name: 'Dangerous Chemical',
            quantity: '10',
            unit: 'L',
            hazardous: true,
            msdsRequired: true,
          },
        ],
        workplaceConditions: {
          lighting: 'dark',
          ventilation: 'poor',
          temperature: 'extreme',
          noise: 'extreme',
          spaceConstraint: 'cramped',
          groundCondition: 'unstable',
          weatherExposure: 'extreme',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(3); // hazardous materials, MSDS, extreme conditions
    });

    test('complete task step with all optional fields passes validation', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Complete task',
        hazards: [
          {
            id: 'h1',
            description: 'Test hazard',
            category: 'mechanical',
            source: 'custom',
            effectScore: 3,
            exposureScore: 2,
            probabilityScore: 1,
            riskScore: 6,
            riskLevel: 'trivial',
            controlMeasures: [],
          },
        ],
        equipment: ['Safety harness'],
        location: 'Workshop',
        materials: [
          {
            id: '1',
            name: 'Steel beam',
            quantity: '10',
            unit: 'pcs',
            hazardous: false,
            msdsRequired: false,
          },
        ],
        workplaceConditions: {
          lighting: 'adequate',
          ventilation: 'good',
          temperature: 'comfortable',
          noise: 'moderate',
          spaceConstraint: 'open',
          groundCondition: 'stable',
          weatherExposure: 'indoor',
          notes: 'Good working conditions',
        },
      };
      
      const result = validateTaskStepContextFields(taskStep);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});