import type { ControlMeasure } from "../types/control";

/**
 * Seed library of common control measures and mappings to hazard categories.
 * Kept intentionally small for unit tests and demonstration.
 */

export const CONTROLS: ControlMeasure[] = [
  {
    id: "ctl-elim-001",
    title: "Remove hazardous substance from process",
    description: "Eliminate the hazardous substance from the process entirely.",
    hierarchy: "elimination",
    typicalEffectiveness: 0.95,
    applicableHazardCategories: ["chemical", "environmental"],
    costEstimate: "high",
    isRequired: false,
  },
  {
    id: "ctl-sub-001",
    title: "Substitute with less hazardous material",
    description: "Replace with a less harmful chemical or material.",
    hierarchy: "substitution",
    typicalEffectiveness: 0.85,
    applicableHazardCategories: ["chemical"],
    costEstimate: "medium",
  },
  {
    id: "ctl-eng-guarding",
    title: "Machine guarding / physical barriers",
    description: "Install fixed guards or barriers to prevent contact with moving parts.",
    hierarchy: "engineering",
    typicalEffectiveness: 0.8,
    applicableHazardCategories: ["mechanical", "physical"],
    costEstimate: "medium",
  },
  {
    id: "ctl-eng-vent",
    title: "Local exhaust ventilation",
    description: "Install LEV to capture fumes and airborne contaminants at source.",
    hierarchy: "engineering",
    typicalEffectiveness: 0.75,
    applicableHazardCategories: ["chemical", "biological"],
    costEstimate: "high",
  },
  {
    id: "ctl-admin-proc",
    title: "Safe work procedures & training",
    description: "Documented procedures, training, and signage to reduce exposure.",
    hierarchy: "administrative",
    typicalEffectiveness: 0.5,
    applicableHazardCategories: ["ergonomic", "physical", "psychosocial", "chemical"],
    costEstimate: "low",
  },
  {
    id: "ctl-ppe-standard",
    title: "Use appropriate personal protective equipment (PPE)",
    description: "Provide PPE (gloves, goggles, respirators) and enforce use.",
    hierarchy: "ppe",
    typicalEffectiveness: 0.4,
    applicableHazardCategories: ["chemical", "biological", "physical"],
    costEstimate: "low",
  },
];

export const HAZARD_TO_CONTROLS: Record<string, string[]> = {
  // map hazard categories to typical control ids (used by recommender)
  chemical: ["ctl-elim-001", "ctl-sub-001", "ctl-eng-vent", "ctl-admin-proc", "ctl-ppe-standard"],
  physical: ["ctl-eng-guarding", "ctl-admin-proc", "ctl-ppe-standard"],
  mechanical: ["ctl-eng-guarding", "ctl-admin-proc", "ctl-ppe-standard"],
  ergonomic: ["ctl-admin-proc"],
  biological: ["ctl-eng-vent", "ctl-admin-proc", "ctl-ppe-standard"],
  environmental: ["ctl-elim-001", "ctl-eng-vent", "ctl-admin-proc"],
};
