/**
 * Kinney & Wiruth risk calculation engine
 *
 * Assumptions / notes:
 * - Kinney & Wiruth base formula: RiskScore = Effect (E) × Exposure (B) × Probability (W)
 * - This module accepts numeric E, B, W values (common discrete sets are defined elsewhere in the codebase).
 * - Input shape: { probability, consequence, exposure?, modifiers? }
 *   - probability === W, consequence === E, exposure === B (named for domain alignment)
 * - Modifiers (optional): multipliers to adjust final score (e.g. control effectiveness)
 *   - All modifier values are multiplicative and default to 1 if missing.
 * - Edge cases handled:
 *   - Non-finite or NaN inputs -> treated as invalid (calculateRiskScore returns NaN)
 *   - Negative inputs -> treated as invalid (calculateRiskScore returns NaN)
 *   - exposure is optional and defaults to 1 when omitted
 * - Valid score range (practical): 0.05 - 10000 (driven by typical discrete values). validateScore enforces reasonable bounds.
 *
 * JSDoc and types included for clarity.
 */

/**
 * Input shape for calculateRiskScore
 */
export interface KinneyInput {
  probability: number; // W
  consequence: number; // E (consequence/effect)
  exposure?: number; // B (exposure/frequency) - optional, defaults to 1
  modifiers?: Record<string, number>; // multiplicative modifiers (optional)
}

/**
 * Public exports:
 * - calculateRiskScore(input): number
 * - validateScore(score): boolean
 * - determineRiskLevel(score): 'Low' | 'Moderate' | 'High' | 'Extreme'
 */

/**
 * Calculate Kinney & Wiruth risk score.
 * Returns NaN for invalid inputs (non-finite or negative numbers).
 */
export function calculateRiskScore(input: KinneyInput): number {
  const { probability, consequence, exposure = 1, modifiers } = input;

  // Basic input validation
  if (
    typeof probability !== "number" ||
    typeof consequence !== "number" ||
    typeof exposure !== "number"
  ) {
    return NaN;
  }

  if (
    !Number.isFinite(probability) ||
    !Number.isFinite(consequence) ||
    !Number.isFinite(exposure)
  ) {
    return NaN;
  }

  if (probability < 0 || consequence < 0 || exposure < 0) {
    return NaN;
  }

  // Base calculation
  let score = consequence * exposure * probability;

  // Apply multiplicative modifiers if provided (skip invalid modifier values)
  if (modifiers && typeof modifiers === "object") {
    for (const k of Object.keys(modifiers)) {
      const v = Number(modifiers[k]);
      if (Number.isFinite(v) && v > 0) {
        score *= v;
      }
    }
  }

  // Normalize extremely small floating rounding errors to 0 where appropriate
  if (Math.abs(score) < Number.EPSILON) return 0;

  return score;
}

/**
 * Validate that a risk score is within acceptable numeric bounds.
 * Returns true when score is a finite non-negative number within a practical Kinney range.
 */
export function validateScore(score: number): boolean {
  if (typeof score !== "number" || !Number.isFinite(score)) return false;
  if (Number.isNaN(score)) return false;
  if (score < 0) return false;

  // Practical bounds: Kinney scores with E in [1..100], B in [0.5..10], W in [0.1..10]
  // -> theoretical min 0.05, max 100*10*10 = 10000. Allow a small tolerance.
  const MIN = 0.0001;
  const MAX = 20000; // allow room for modifiers
  return score >= MIN && score <= MAX;
}

/**
 * Determine risk level (human-friendly 4-level scale) from numeric score.
 *
 * Mapping rationale:
 * - Use a compact 4-level mapping to meet requested return types:
 *   Low       -> score <= 70        (covers trivial + acceptable)
 *   Moderate  -> 71 .. 200           (aligns with 'possible' band)
 *   High      -> 201 .. 1000         (aligns with 'substantial' / 'high' bands)
 *   Extreme   -> > 1000
 *
 * These thresholds are chosen to be compatible with the project's internal Kinney bands
 * while returning the requested labels ('Low'|'Moderate'|'High'|'Extreme').
 */
export function determineRiskLevel(score: number): "Low" | "Moderate" | "High" | "Extreme" {
  if (typeof score !== "number" || !Number.isFinite(score) || Number.isNaN(score) || score < 0) {
    // Treat invalid as Extreme to force human review (defensive choice)
    return "Extreme";
  }

  if (score <= 70) return "Low";
  if (score <= 200) return "Moderate";
  if (score <= 1000) return "High";
  return "Extreme";
}
