/**
 * TRA Template Type Definitions
 * Defines the structure for VCA-compliant TRA templates
 */

export type IndustryType = "construction" | "industrial" | "offshore";
export type HazardCategory =
  | "electrical"
  | "mechanical"
  | "chemical"
  | "biological"
  | "physical"
  | "ergonomic"
  | "psychosocial"
  | "fire_explosion"
  | "environmental"
  | "thermal"
  | "height"
  | "confined_space"
  | "hot_work"
  | "excavation";

export type ControlMeasureType =
  | "elimination"
  | "substitution"
  | "engineering"
  | "administrative"
  | "ppe";

export type CreatedByType = "system" | "organization";

/**
 * Task Step in a TRA
 */
export interface TaskStep {
  order: number;
  title: string;
  description: string;
  duration: number; // in minutes
  requiredPersonnel: number;
  location: string;
}

/**
 * Control Measure for a Hazard
 * Follows the hierarchy of controls (Elimination > Substitution > Engineering > Administrative > PPE)
 */
export interface ControlMeasure {
  description: string;
  type: ControlMeasureType;
  responsible: string; // Role or person responsible
  verificationMethod: string; // How to verify the control is in place
}

/**
 * Hazard in a TRA
 * Uses Kinney & Wiruth methodology for risk calculation
 */
export interface Hazard {
  id: string;
  name: string;
  category: HazardCategory;
  description: string;
  typicalEffect: number; // Kinney & Wiruth Effect (E) score: 1-100
  typicalExposure: number; // Kinney & Wiruth Exposure (B) score: 0.5-10
  typicalProbability: number; // Kinney & Wiruth Probability (W) score: 0.1-10
  controlMeasures: ControlMeasure[];
}

/**
 * TRA Template
 * VCA-compliant template for systematic risk analysis
 */
export interface TraTemplate {
  id: string;
  name: string;
  description: string;
  industry: IndustryType;
  category: string; // e.g., 'electrical', 'height', 'confined_space'
  vcaCompliant: boolean;
  vcaVersion: string; // e.g., 'VCA 2017 v5.1'
  validityPeriod: number; // in months (max 12 per VCA)
  createdBy: CreatedByType;
  version: number;
  lastUpdated?: number; // timestamp
  usageCount?: number;
  steps: TaskStep[];
  hazards: Hazard[];
  requiredCompetencies: string[];
  notes?: string;
}

/**
 * Risk Score Calculation (Kinney & Wiruth)
 * Risk = Effect × Exposure × Probability
 */
export interface RiskScore {
  effect: number;
  exposure: number;
  probability: number;
  score: number; // calculated: effect × exposure × probability
  level: RiskLevel;
}

export type RiskLevel = "very_high" | "high" | "substantial" | "possible" | "low";

/**
 * Risk Level Classification
 * Based on Kinney & Wiruth score
 */
export const RISK_LEVELS: Record<
  RiskLevel,
  { min: number; max: number; color: string; label: string }
> = {
  very_high: { min: 400, max: Infinity, color: "#dc2626", label: "Zeer Hoog" },
  high: { min: 200, max: 399, color: "#ea580c", label: "Hoog" },
  substantial: { min: 70, max: 199, color: "#eab308", label: "Aanzienlijk" },
  possible: { min: 20, max: 69, color: "#3b82f6", label: "Mogelijk" },
  low: { min: 0, max: 19, color: "#22c55e", label: "Laag" },
};

/**
 * Calculate risk score using Kinney & Wiruth methodology
 */
export function calculateRiskScore(
  effect: number,
  exposure: number,
  probability: number
): RiskScore {
  const score = effect * exposure * probability;
  let level: RiskLevel = "low";

  if (score >= 400) level = "very_high";
  else if (score >= 200) level = "high";
  else if (score >= 70) level = "substantial";
  else if (score >= 20) level = "possible";

  return { effect, exposure, probability, score, level };
}

/**
 * Get risk level details
 */
export function getRiskLevelDetails(level: RiskLevel) {
  return RISK_LEVELS[level];
}

/**
 * Kinney & Wiruth Scale Definitions
 */
export const KINNEY_WIRUTH_SCALES = {
  effect: {
    1: "Licht letsel, geen verzuim",
    3: "Licht letsel, eerste hulp nodig",
    7: "Ernstig letsel, verzuim",
    15: "Zeer ernstig letsel, blijvend letsel",
    40: "Dood of meerdere ernstige letsels",
    100: "Catastrofaal, meerdere doden",
  },
  exposure: {
    0.5: "Zelden (enkele keren per jaar)",
    1: "Af en toe (maandelijks)",
    2: "Soms (wekelijks)",
    3: "Regelmatig (dagelijks)",
    6: "Frequent (uurlijks)",
    10: "Continu",
  },
  probability: {
    0.1: "Praktisch onmogelijk",
    0.2: "Denkbaar maar onwaarschijnlijk",
    0.5: "Onwaarschijnlijk maar mogelijk",
    1: "Mogelijk (50/50)",
    3: "Vrij waarschijnlijk",
    6: "Waarschijnlijk",
    10: "Zeer waarschijnlijk/zeker",
  },
};
