/**
 * TRA Context Fields Integration Tests (Phase C)
 * Tests material-to-hazard suggestions, LMRA integration, and VCA scoring
 */

import { suggestHazardsFromMaterials, suggestHazardsFromConditions, suggestAllHazards } from '../lib/utils/material-hazard-mapping';
import { validateVCACompliance } from '../lib/compliance/vca-validator';
import type { Material, WorkplaceConditions, TRA, Hazard } from '../lib/types/tra';
import type { LMRA, LMRAStep5_EquipmentVerification } from '../lib/types/lmra';

describe('TRA Context Integration - Material Hazard Suggestions', () => {
  test('suggests hazards for chemical materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-1',
        name: 'Chemische oplosmiddel',
        quantity: '10',
        unit: 'liter',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'chemical')).toBe(true);
    expect(suggestions.some(h => h.description.toLowerCase().includes('chemisch'))).toBe(true);
    expect(suggestions.every(h => h.controlMeasures.length > 0)).toBe(true);
  });

  test('suggests hazards for hazardous materials (asbestos)', () => {
    const materials: Material[] = [
      {
        id: 'mat-2',
        name: 'Asbest platen',
        quantity: '5',
        unit: 'stuks',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'biological' || h.category === 'environmental')).toBe(true);
    expect(suggestions.some(h => h.riskLevel === 'high' || h.riskLevel === 'substantial' || h.riskLevel === 'possible')).toBe(true);
  });

  test('suggests fire hazards for flammable materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-3',
        name: 'Brandbare verf',
        quantity: '20',
        unit: 'liter',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'fire_explosion')).toBe(true);
    expect(suggestions.some(h => h.description.toLowerCase().includes('brand'))).toBe(true);
  });

  test('suggests ergonomic hazards for cement', () => {
    const materials: Material[] = [
      {
        id: 'mat-4',
        name: 'Cement zakken',
        quantity: '100',
        unit: 'kg',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'ergonomic' || h.category === 'chemical')).toBe(true);
  });

  test('suggests hazards for paint materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-5',
        name: 'Latex verf',
        quantity: '10',
        unit: 'liter',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'chemical' || h.category === 'biological')).toBe(true);
  });

  test('suggests hazards for wood materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-6',
        name: 'MDF platen',
        quantity: '50',
        unit: 'stuks',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'physical' || h.category === 'mechanical')).toBe(true);
  });

  test('suggests hazards for metal materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-7',
        name: 'Stalen buizen',
        quantity: '20',
        unit: 'meter',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'mechanical' || h.category === 'ergonomic')).toBe(true);
  });

  test('suggests hazards for electrical materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-8',
        name: 'Elektrische kabels',
        quantity: '100',
        unit: 'meter',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'electrical')).toBe(true);
  });

  test('suggests hazards for insulation materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-9',
        name: 'Glaswol isolatie',
        quantity: '10',
        unit: 'm2',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'physical' || h.category === 'biological')).toBe(true);
  });

  test('suggests generic hazards for unknown hazardous materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-10',
        name: 'Unknown hazardous substance',
        quantity: '5',
        unit: 'kg',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.description.includes('MSDS'))).toBe(true);
  });

  test('returns empty array for non-hazardous materials without matches', () => {
    const materials: Material[] = [
      {
        id: 'mat-11',
        name: 'Papier',
        quantity: '100',
        unit: 'stuks',
        hazardous: false,
        msdsRequired: false,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBe(0);
  });

  test('handles multiple materials with combined suggestions', () => {
    const materials: Material[] = [
      {
        id: 'mat-12',
        name: 'Cement',
        quantity: '50',
        unit: 'kg',
        hazardous: true,
        msdsRequired: false,
      },
      {
        id: 'mat-13',
        name: 'Verf',
        quantity: '10',
        unit: 'liter',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const suggestions = suggestHazardsFromMaterials(materials);
    
    expect(suggestions.length).toBeGreaterThan(0);
    // Should have suggestions from both materials
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });
});

describe('TRA Context Integration - Workplace Conditions Hazard Suggestions', () => {
  test('suggests hazards for dark lighting', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'dark',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.description.toLowerCase().includes('verlichting'))).toBe(true);
  });

  test('suggests hazards for poor ventilation', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'poor',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.description.toLowerCase().includes('ventilatie'))).toBe(true);
  });

  test('suggests hazards for extreme temperature', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'extreme',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'physical')).toBe(true);
    expect(suggestions.some(h => h.riskLevel === 'substantial')).toBe(true);
  });

  test('suggests hazards for extreme noise', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'extreme',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.description.toLowerCase().includes('geluid'))).toBe(true);
    expect(suggestions.some(h => h.riskLevel === 'high')).toBe(true);
  });

  test('suggests hazards for unstable ground', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'unstable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'mechanical')).toBe(true);
    expect(suggestions.some(h => h.description.toLowerCase().includes('ondergrond'))).toBe(true);
  });

  test('suggests hazards for confined space', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'confined',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.description.toLowerCase().includes('ruimte'))).toBe(true);
  });

  test('suggests hazards for extreme weather exposure', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'extreme',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(h => h.category === 'environmental')).toBe(true);
  });

  test('suggests multiple hazards for multiple extreme conditions', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'dark',
      ventilation: 'poor',
      temperature: 'extreme',
      noise: 'extreme',
      spaceConstraint: 'confined',
      groundCondition: 'unstable',
      weatherExposure: 'extreme',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBeGreaterThanOrEqual(5);
  });

  test('returns empty array for normal conditions', () => {
    const conditions: WorkplaceConditions = {
      lighting: 'adequate',
      ventilation: 'good',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestHazardsFromConditions(conditions);
    
    expect(suggestions.length).toBe(0);
  });
});

describe('TRA Context Integration - Combined Suggestions', () => {
  test('combines material and condition suggestions', () => {
    const materials: Material[] = [
      {
        id: 'mat-1',
        name: 'Cement',
        quantity: '50',
        unit: 'kg',
        hazardous: true,
        msdsRequired: false,
      },
    ];

    const conditions: WorkplaceConditions = {
      lighting: 'dark',
      ventilation: 'poor',
      temperature: 'comfortable',
      noise: 'quiet',
      spaceConstraint: 'open',
      groundCondition: 'stable',
      weatherExposure: 'indoor',
    };

    const suggestions = suggestAllHazards(materials, conditions);
    
    expect(suggestions.length).toBeGreaterThan(0);
    // Should have suggestions from both sources
    expect(suggestions.some(h => h.description.toLowerCase().includes('cement') || h.category === 'chemical')).toBe(true);
    expect(suggestions.some(h => h.description.toLowerCase().includes('verlichting'))).toBe(true);
  });
});

describe('TRA Context Integration - VCA Scoring', () => {
  test('VCA scoring adds bonus for documented workplace conditions', () => {
    const traWithConditions: TRA = {
      id: 'tra-1',
      title: 'Test TRA with conditions',
      organizationId: 'org-1',
      projectId: 'proj-1',
      taskSteps: [
        {
          stepNumber: 1,
          description: 'Test step',
          hazards: [
            {
              id: 'hazard-1',
              description: 'Test hazard',
              category: 'mechanical',
              source: 'custom',
              effectScore: 7,
              exposureScore: 3,
              probabilityScore: 1,
              riskScore: 21,
              riskLevel: 'acceptable',
              controlMeasures: [
                {
                  id: 'control-1',
                  type: 'ppe',
                  description: 'Test control',
                },
              ],
            },
          ],
          workplaceConditions: {
            lighting: 'adequate',
            ventilation: 'good',
            temperature: 'comfortable',
            noise: 'quiet',
            spaceConstraint: 'open',
            groundCondition: 'stable',
            weatherExposure: 'indoor',
          },
        },
      ],
      teamMembers: ['user-1'],
      requiredCompetencies: ['VCA'],
      status: 'draft',
      overallRiskScore: 21,
      overallRiskLevel: 'acceptable',
      version: 1,
      createdBy: 'user-1',
      createdAt: new Date(),
      complianceFramework: 'vca',
    } as TRA;

    const traWithoutConditions: TRA = {
      ...traWithConditions,
      taskSteps: [
        {
          ...traWithConditions.taskSteps[0],
          workplaceConditions: undefined,
        },
      ],
    };

    const resultWith = validateVCACompliance(traWithConditions);
    const resultWithout = validateVCACompliance(traWithoutConditions as TRA);

    expect(resultWith.score).toBeGreaterThan(resultWithout.score);
  });

  test('VCA scoring adds bonus for MSDS materials', () => {
    const traWithMsds: TRA = {
      id: 'tra-2',
      title: 'Test TRA with MSDS',
      organizationId: 'org-1',
      projectId: 'proj-1',
      taskSteps: [
        {
          stepNumber: 1,
          description: 'Test step',
          hazards: [
            {
              id: 'hazard-1',
              description: 'Test hazard',
              category: 'chemical',
              source: 'custom',
              effectScore: 7,
              exposureScore: 3,
              probabilityScore: 1,
              riskScore: 21,
              riskLevel: 'acceptable',
              controlMeasures: [
                {
                  id: 'control-1',
                  type: 'ppe',
                  description: 'Test control',
                },
              ],
            },
          ],
          materials: [
            {
              id: 'mat-1',
              name: 'Chemical substance',
              quantity: '10',
              unit: 'liter',
              hazardous: true,
              msdsRequired: true,
            },
          ],
        },
      ],
      teamMembers: ['user-1'],
      requiredCompetencies: ['VCA'],
      status: 'draft',
      overallRiskScore: 21,
      overallRiskLevel: 'acceptable',
      version: 1,
      createdBy: 'user-1',
      createdAt: new Date(),
      complianceFramework: 'vca',
    } as TRA;

    const traWithoutMsds: TRA = {
      ...traWithMsds,
      taskSteps: [
        {
          ...traWithMsds.taskSteps[0],
          materials: undefined,
        },
      ],
    };

    const resultWith = validateVCACompliance(traWithMsds);
    const resultWithout = validateVCACompliance(traWithoutMsds as TRA);

    expect(resultWith.score).toBeGreaterThan(resultWithout.score);
  });

  test('VCA scoring combines both context bonuses', () => {
    const traWithBoth: TRA = {
      id: 'tra-3',
      title: 'Test TRA with both',
      organizationId: 'org-1',
      projectId: 'proj-1',
      taskSteps: [
        {
          stepNumber: 1,
          description: 'Test step',
          hazards: [
            {
              id: 'hazard-1',
              description: 'Test hazard',
              category: 'chemical',
              source: 'custom',
              effectScore: 7,
              exposureScore: 3,
              probabilityScore: 1,
              riskScore: 21,
              riskLevel: 'acceptable',
              controlMeasures: [
                {
                  id: 'control-1',
                  type: 'ppe',
                  description: 'Test control',
                },
              ],
            },
          ],
          materials: [
            {
              id: 'mat-1',
              name: 'Chemical substance',
              quantity: '10',
              unit: 'liter',
              hazardous: true,
              msdsRequired: true,
            },
          ],
          workplaceConditions: {
            lighting: 'adequate',
            ventilation: 'good',
            temperature: 'comfortable',
            noise: 'quiet',
            spaceConstraint: 'open',
            groundCondition: 'stable',
            weatherExposure: 'indoor',
          },
        },
      ],
      teamMembers: ['user-1'],
      requiredCompetencies: ['VCA'],
      status: 'draft',
      overallRiskScore: 21,
      overallRiskLevel: 'acceptable',
      version: 1,
      createdBy: 'user-1',
      createdAt: new Date(),
      complianceFramework: 'vca',
    } as TRA;

    const result = validateVCACompliance(traWithBoth);

    // Should get both bonuses (5 + 3 = 8 points)
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('TRA Context Integration - LMRA Material References', () => {
  test('LMRA Step 5 can reference TRA materials', () => {
    const materials: Material[] = [
      {
        id: 'mat-1',
        name: 'Cement',
        quantity: '50',
        unit: 'kg',
        hazardous: true,
        msdsRequired: false,
      },
      {
        id: 'mat-2',
        name: 'Verf',
        quantity: '10',
        unit: 'liter',
        hazardous: true,
        msdsRequired: true,
      },
    ];

    const step5: LMRAStep5_EquipmentVerification = {
      equipmentList: [],
      allEquipmentAvailable: true,
      referencedTraMaterials: materials,
    };

    expect(step5.referencedTraMaterials).toBeDefined();
    expect(step5.referencedTraMaterials?.length).toBe(2);
    expect(step5.referencedTraMaterials?.[0].name).toBe('Cement');
    expect(step5.referencedTraMaterials?.[1].msdsRequired).toBe(true);
  });

  test('LMRA Step 5 works without material references', () => {
    const step5: LMRAStep5_EquipmentVerification = {
      equipmentList: [],
      allEquipmentAvailable: true,
    };

    expect(step5.referencedTraMaterials).toBeUndefined();
  });
});