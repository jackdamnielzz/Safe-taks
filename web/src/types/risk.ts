/**
 * Risk Assessment Types
 * Based on Kinney & Wiruth risk assessment methodology
 */

/**
 * Risk levels based on calculated risk score
 */
export type RiskLevel =
  | "trivial" // < 20
  | "acceptable" // 20-70
  | "possible" // 70-200
  | "substantial" // 200-400
  | "high" // 400-1000
  | "very_high"; // > 1000

/**
 * Risk calculation parameters
 */
export interface RiskParameters {
  /** Effect/Consequence severity (1-100) */
  effect: number;
  /** Exposure frequency (1-10) */
  exposure: number;
  /** Probability of occurrence (1-10) */
  probability: number;
}

/**
 * Risk calculation result
 */
export interface RiskResult {
  /** Calculated risk score (Effect × Exposure × Probability) */
  score: number;
  /** Risk level classification */
  level: RiskLevel;
  /** Whether immediate action is required */
  requiresAction: boolean;
  /** Recommended control measures based on risk level */
  recommendedControls: string[];
}

/**
 * Hazard with risk assessment
 */
export interface HazardWithRisk {
  id: string;
  description: string;
  category: HazardCategory;
  riskParameters: RiskParameters;
  riskResult: RiskResult;
  controlMeasures: string[];
  residualRisk?: RiskResult;
}

/**
 * Hazard categories
 */
export type HazardCategory =
  | "physical"
  | "chemical"
  | "biological"
  | "ergonomic"
  | "psychosocial"
  | "environmental"
  | "electrical"
  | "mechanical";

/**
 * Risk level configuration
 */
export interface RiskLevelConfig {
  level: RiskLevel;
  label: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
  bgColor: string;
  textColor: string;
  requiresAction: boolean;
  actionRequired: string;
}

/**
 * Effect/Consequence scale values
 */
export const EFFECT_SCALE = {
  MINOR: 1, // Minor injury, first aid
  MODERATE: 15, // Medical treatment required
  SERIOUS: 40, // Serious injury, hospitalization
  VERY_SERIOUS: 100, // Fatality or permanent disability
} as const;

/**
 * Exposure frequency scale values
 */
export const EXPOSURE_SCALE = {
  RARE: 0.5, // Once per year or less
  OCCASIONAL: 1, // Monthly
  FREQUENT: 3, // Weekly
  REGULAR: 6, // Daily
  CONTINUOUS: 10, // Constantly
} as const;

/**
 * Probability scale values
 */
export const PROBABILITY_SCALE = {
  ALMOST_IMPOSSIBLE: 0.1, // Practically impossible
  VERY_UNLIKELY: 0.5, // Conceivable but unlikely
  UNLIKELY: 1, // Unusual but possible
  POSSIBLE: 3, // Could occur
  LIKELY: 6, // Not surprising
  VERY_LIKELY: 10, // Expected to occur
} as const;
