/**
 * Template Loading Utility
 * Loads VCA-compliant TRA templates from JSON files
 */

import { TraTemplate } from "@/types/tra-template";

// Import all templates
import electricalWorkTemplate from "@/data/tra-templates/electrical-work-construction.json";
import workingAtHeightTemplate from "@/data/tra-templates/working-at-height.json";
import confinedSpaceTemplate from "@/data/tra-templates/confined-space-entry.json";
import hotWorkTemplate from "@/data/tra-templates/hot-work.json";
import excavationTemplate from "@/data/tra-templates/excavation-trenching.json";

/**
 * All available system templates
 */
export const SYSTEM_TEMPLATES: TraTemplate[] = [
  electricalWorkTemplate as TraTemplate,
  workingAtHeightTemplate as TraTemplate,
  confinedSpaceTemplate as TraTemplate,
  hotWorkTemplate as TraTemplate,
  excavationTemplate as TraTemplate,
];

/**
 * Get all available templates
 */
export function getAllTemplates(): TraTemplate[] {
  return SYSTEM_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TraTemplate | undefined {
  return SYSTEM_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): TraTemplate[] {
  return SYSTEM_TEMPLATES.filter((template) => template.industry === industry);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TraTemplate[] {
  return SYSTEM_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get VCA-compliant templates only
 */
export function getVcaCompliantTemplates(): TraTemplate[] {
  return SYSTEM_TEMPLATES.filter((template) => template.vcaCompliant);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): TraTemplate[] {
  const lowerQuery = query.toLowerCase();
  return SYSTEM_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get template statistics
 */
export function getTemplateStats() {
  return {
    total: SYSTEM_TEMPLATES.length,
    vcaCompliant: SYSTEM_TEMPLATES.filter((t) => t.vcaCompliant).length,
    byIndustry: {
      construction: SYSTEM_TEMPLATES.filter((t) => t.industry === "construction").length,
      industrial: SYSTEM_TEMPLATES.filter((t) => t.industry === "industrial").length,
      offshore: SYSTEM_TEMPLATES.filter((t) => t.industry === "offshore").length,
    },
  };
}
