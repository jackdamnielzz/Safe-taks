/**
 * Risk Calculator Library
 * Implementation of Kinney & Wiruth risk assessment methodology
 *
 * Formula: Risk Score = Effect (E) × Exposure (B) × Probability (W)
 *
 * This library provides reusable risk calculation functions for both
 * LMRA and TRA workflows.
 */

import type { RiskLevel, RiskParameters, RiskResult, RiskLevelConfig } from "@/types/risk";

/**
 * Risk level configurations with thresholds and styling
 */
export const RISK_LEVELS: Record<RiskLevel, RiskLevelConfig> = {
  trivial: {
    level: "trivial",
    label: "Triviaal",
    description: "Verwaarloosbaar risico, geen actie vereist",
    minScore: 0,
    maxScore: 20,
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    requiresAction: false,
    actionRequired: "Geen actie vereist",
  },
  acceptable: {
    level: "acceptable",
    label: "Acceptabel",
    description: "Laag risico, monitoring aanbevolen",
    minScore: 20,
    maxScore: 70,
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    requiresAction: false,
    actionRequired: "Monitoring aanbevolen",
  },
  possible: {
    level: "possible",
    label: "Mogelijk",
    description: "Matig risico, aandacht vereist",
    minScore: 70,
    maxScore: 200,
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    requiresAction: true,
    actionRequired: "Aandacht en beheersmaatregelen vereist",
  },
  substantial: {
    level: "substantial",
    label: "Aanzienlijk",
    description: "Hoog risico, actie vereist",
    minScore: 200,
    maxScore: 400,
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    requiresAction: true,
    actionRequired: "Directe actie en beheersmaatregelen vereist",
  },
  high: {
    level: "high",
    label: "Hoog",
    description: "Zeer hoog risico, onmiddellijke actie vereist",
    minScore: 400,
    maxScore: 1000,
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    requiresAction: true,
    actionRequired: "Onmiddellijke actie vereist, werk niet starten",
  },
  very_high: {
    level: "very_high",
    label: "Zeer Hoog",
    description: "Extreem risico, werk niet toegestaan",
    minScore: 1000,
    maxScore: Infinity,
    color: "red",
    bgColor: "bg-red-900",
    textColor: "text-white",
    requiresAction: true,
    actionRequired: "Werk niet toegestaan zonder ingrijpende maatregelen",
  },
};

/**
 * Calculate risk score using Kinney & Wiruth formula
 *
 * @param params - Risk parameters (effect, exposure, probability)
 * @returns Calculated risk score
 */
export function calculateRiskScore(params: RiskParameters): number {
  const { effect, exposure, probability } = params;
  return effect * exposure * probability;
}

/**
 * Determine risk level based on calculated score
 *
 * @param score - Calculated risk score
 * @returns Risk level classification
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return "trivial";
  if (score < 70) return "acceptable";
  if (score < 200) return "possible";
  if (score < 400) return "substantial";
  if (score < 1000) return "high";
  return "very_high";
}

/**
 * Get risk level configuration
 *
 * @param level - Risk level
 * @returns Risk level configuration
 */
export function getRiskLevelConfig(level: RiskLevel): RiskLevelConfig {
  return RISK_LEVELS[level];
}

/**
 * Get recommended control measures based on risk level
 *
 * @param level - Risk level
 * @returns Array of recommended control measures
 */
export function getRecommendedControls(level: RiskLevel): string[] {
  const controls: Record<RiskLevel, string[]> = {
    trivial: ["Geen specifieke maatregelen vereist", "Standaard veiligheidsprocedures volgen"],
    acceptable: [
      "Regelmatige monitoring",
      "Standaard veiligheidsprocedures handhaven",
      "Periodieke evaluatie",
    ],
    possible: [
      "Implementeer beheersmaatregelen",
      "Verhoogde monitoring",
      "Training en instructie",
      "Persoonlijke beschermingsmiddelen (PBM)",
    ],
    substantial: [
      "Directe beheersmaatregelen implementeren",
      "Technische maatregelen overwegen",
      "Strikte procedures en protocollen",
      "Verplichte PBM",
      "Regelmatige inspectie en controle",
    ],
    high: [
      "Werk niet starten zonder maatregelen",
      "Ingrijpende technische maatregelen",
      "Strikte toegangscontrole",
      "Continue monitoring",
      "Noodprocedures gereed",
      "Management goedkeuring vereist",
    ],
    very_high: [
      "Werk niet toegestaan",
      "Fundamentele herontwerp vereist",
      "Alternatieve werkwijze zoeken",
      "Externe expertise inschakelen",
      "Management en veiligheidscommissie betrekken",
    ],
  };

  return controls[level];
}

/**
 * Calculate complete risk assessment
 *
 * @param params - Risk parameters
 * @returns Complete risk result with score, level, and recommendations
 */
export function calculateRisk(params: RiskParameters): RiskResult {
  const score = calculateRiskScore(params);
  const level = getRiskLevel(score);
  const requiresAction = score >= 70; // Possible level and above
  const recommendedControls = getRecommendedControls(level);

  return {
    score,
    level,
    requiresAction,
    recommendedControls,
  };
}

/**
 * Validate risk parameters
 *
 * @param params - Risk parameters to validate
 * @returns Validation result with errors if any
 */
export function validateRiskParameters(params: RiskParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate effect (1-100)
  if (params.effect < 1 || params.effect > 100) {
    errors.push("Effect moet tussen 1 en 100 zijn");
  }

  // Validate exposure (0.5-10)
  if (params.exposure < 0.5 || params.exposure > 10) {
    errors.push("Blootstelling moet tussen 0.5 en 10 zijn");
  }

  // Validate probability (0.1-10)
  if (params.probability < 0.1 || params.probability > 10) {
    errors.push("Waarschijnlijkheid moet tussen 0.1 en 10 zijn");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate residual risk after control measures
 *
 * @param originalParams - Original risk parameters
 * @param reductionFactors - Reduction factors for each parameter (0-1)
 * @returns Residual risk result
 */
export function calculateResidualRisk(
  originalParams: RiskParameters,
  reductionFactors: {
    effect?: number;
    exposure?: number;
    probability?: number;
  }
): RiskResult {
  const residualParams: RiskParameters = {
    effect: originalParams.effect * (1 - (reductionFactors.effect || 0)),
    exposure: originalParams.exposure * (1 - (reductionFactors.exposure || 0)),
    probability: originalParams.probability * (1 - (reductionFactors.probability || 0)),
  };

  return calculateRisk(residualParams);
}

/**
 * Compare two risk assessments
 *
 * @param risk1 - First risk result
 * @param risk2 - Second risk result
 * @returns Comparison result
 */
export function compareRisks(
  risk1: RiskResult,
  risk2: RiskResult
): {
  improved: boolean;
  scoreDifference: number;
  percentageReduction: number;
} {
  const scoreDifference = risk1.score - risk2.score;
  const percentageReduction = (scoreDifference / risk1.score) * 100;

  return {
    improved: scoreDifference > 0,
    scoreDifference,
    percentageReduction,
  };
}

/**
 * Get risk color for UI display
 *
 * @param level - Risk level
 * @returns Tailwind CSS color classes
 */
export function getRiskColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  const config = getRiskLevelConfig(level);

  const borderColors: Record<RiskLevel, string> = {
    trivial: "border-green-300",
    acceptable: "border-blue-300",
    possible: "border-yellow-300",
    substantial: "border-orange-300",
    high: "border-red-300",
    very_high: "border-red-900",
  };

  return {
    bg: config.bgColor,
    text: config.textColor,
    border: borderColors[level],
  };
}

/**
 * Format risk score for display
 *
 * @param score - Risk score
 * @returns Formatted score string
 */
export function formatRiskScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Get risk priority (1-6, where 1 is highest priority)
 *
 * @param level - Risk level
 * @returns Priority number
 */
export function getRiskPriority(level: RiskLevel): number {
  const priorities: Record<RiskLevel, number> = {
    very_high: 1,
    high: 2,
    substantial: 3,
    possible: 4,
    acceptable: 5,
    trivial: 6,
  };

  return priorities[level];
}

/**
 * Check if risk requires management approval
 *
 * @param level - Risk level
 * @returns Whether management approval is required
 */
export function requiresManagementApproval(level: RiskLevel): boolean {
  return level === "high" || level === "very_high";
}

/**
 * Check if work can proceed with given risk level
 *
 * @param level - Risk level
 * @returns Whether work can proceed
 */
export function canProceedWithWork(level: RiskLevel): boolean {
  return level !== "very_high";
}

/**
 * Get effect scale label
 *
 * @param value - Effect value
 * @returns Human-readable label
 */
export function getEffectLabel(value: number): string {
  if (value <= 1) return "Licht letsel (EHBO)";
  if (value <= 15) return "Matig letsel (medische behandeling)";
  if (value <= 40) return "Ernstig letsel (ziekenhuisopname)";
  return "Zeer ernstig letsel (blijvend/dodelijk)";
}

/**
 * Get exposure scale label
 *
 * @param value - Exposure value
 * @returns Human-readable label
 */
export function getExposureLabel(value: number): string {
  if (value <= 0.5) return "Zelden (< 1x per jaar)";
  if (value <= 1) return "Af en toe (maandelijks)";
  if (value <= 3) return "Regelmatig (wekelijks)";
  if (value <= 6) return "Frequent (dagelijks)";
  return "Continu (voortdurend)";
}

/**
 * Get probability scale label
 *
 * @param value - Probability value
 * @returns Human-readable label
 */
export function getProbabilityLabel(value: number): string {
  if (value <= 0.1) return "Vrijwel onmogelijk";
  if (value <= 0.5) return "Zeer onwaarschijnlijk";
  if (value <= 1) return "Onwaarschijnlijk";
  if (value <= 3) return "Mogelijk";
  if (value <= 6) return "Waarschijnlijk";
  return "Zeer waarschijnlijk";
}
