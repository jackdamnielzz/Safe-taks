/**
 * TRA Context Fields Validation
 * Validates materials and workplace conditions for VCA compliance
 */

import { Material, WorkplaceConditions, TaskStep } from '../types/tra';

export interface ContextFieldsValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate materials for a task step
 * Rules:
 * - Hazardous materials must have corresponding hazards
 * - MSDS required materials must be flagged
 * - Extreme workplace conditions trigger warnings
 */
export function validateTaskStepContextFields(
  taskStep: TaskStep
): ContextFieldsValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate materials
  if (taskStep.materials && taskStep.materials.length > 0) {
    const hazardousMaterials = taskStep.materials.filter(m => m.hazardous);
    
    if (hazardousMaterials.length > 0 && (!taskStep.hazards || taskStep.hazards.length === 0)) {
      warnings.push(
        `Taakstap bevat ${hazardousMaterials.length} gevaarlijke materialen maar geen geïdentificeerde gevaren`
      );
    }

    const msdsRequired = taskStep.materials.filter(m => m.msdsRequired);
    if (msdsRequired.length > 0) {
      warnings.push(
        `${msdsRequired.length} materiaal(en) vereisen MSDS documentatie: ${msdsRequired.map(m => m.name).join(', ')}`
      );
    }
  }

  // Validate workplace conditions
  if (taskStep.workplaceConditions) {
    const extremeConditions: string[] = [];
    
    if (taskStep.workplaceConditions.temperature === 'extreme') {
      extremeConditions.push('extreme temperatuur');
    }
    if (taskStep.workplaceConditions.noise === 'extreme') {
      extremeConditions.push('extreem geluidsniveau');
    }
    if (taskStep.workplaceConditions.weatherExposure === 'extreme') {
      extremeConditions.push('extreme weersomstandigheden');
    }
    if (taskStep.workplaceConditions.groundCondition === 'unstable') {
      extremeConditions.push('onstabiele ondergrond');
    }
    if (taskStep.workplaceConditions.lighting === 'dark') {
      extremeConditions.push('donkere omstandigheden');
    }

    if (extremeConditions.length > 0) {
      warnings.push(
        `Extreme werkomstandigheden gedetecteerd: ${extremeConditions.join(', ')}. Zorg voor adequate beheersmaatregelen.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate a single material
 */
export function validateMaterial(material: Material): { valid: boolean; error?: string } {
  if (!material.name || material.name.trim().length === 0) {
    return { valid: false, error: 'Materiaalnaam is verplicht' };
  }
  
  if (!material.quantity || material.quantity.trim().length === 0) {
    return { valid: false, error: 'Hoeveelheid is verplicht' };
  }
  
  if (!material.unit || material.unit.trim().length === 0) {
    return { valid: false, error: 'Eenheid is verplicht' };
  }

  return { valid: true };
}