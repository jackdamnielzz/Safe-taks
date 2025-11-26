import type { TRA } from "@/lib/types/tra";
import {
  validateVCACompliance,
  type VCAComplianceResult as InternalVCAComplianceResult,
} from "@/lib/compliance/vca-validator";

/**
 * Public VCA Compliance types and helpers
 *
 * This file is the SINGLE entrypoint for VCA compliance checks in the app.
 * All UI, API routes and services MUST use this wrapper instead of rolling their own logic.
 */

/**
 * Normalized VCA compliance result exposed to the rest of the app.
 *
 * Backed by the richer validator in compliance/vca-validator, but provides:
 * - Stable `score`
 * - Stable `isCompliant`
 * - Optional `level` derived from score for simple UX
 * - `checkedAt` timestamp for display / audit hints
 * - Raw issues & recommendations from the underlying validator
 */
export interface VCAComplianceResult extends InternalVCAComplianceResult {
  /**
   * Derived compliance level for simple UI use.
   * NON_COMPLIANT: score < 70
   * PARTIALLY_COMPLIANT: 70-84
   * COMPLIANT: 85+
   */
  level: "NON_COMPLIANT" | "PARTIALLY_COMPLIANT" | "COMPLIANT";
  /**
   * Timestamp (ms since epoch) when this compliance check was produced.
   */
  checkedAt: number;
}

/**
 * Calculate VCA compliance for a given TRA using the central validator.
 *
 * Responsibilities:
 * - Delegate to validateVCACompliance (detailed scoring, issues, recommendations)
 * - Add a normalized `level` based on score
 * - Add `checkedAt` so UI components can consistently show "checked on" timestamps
 *
 * NOTE:
 * - This is intentionally minimal for Slice 1.
 * - Do NOT add domain/business side effects here.
 * - All consumers must import from "@/lib/vca-compliance" instead of the validator directly.
 */
export function calculateVCACompliance(tra: TRA): VCAComplianceResult {
  const base = validateVCACompliance(tra);

  const score = typeof base.score === "number" ? base.score : 0;

  // Derive minimal level for UX; thresholds can be tuned centrally here.
  let level: VCAComplianceResult["level"];
  if (score >= 85) {
    level = "COMPLIANT";
  } else if (score >= 70) {
    level = "PARTIALLY_COMPLIANT";
  } else {
    level = "NON_COMPLIANT";
  }

  return {
    ...base,
    score,
    level,
    checkedAt: Date.now(),
  };
}

/**
 * Convenience helper used in some places to quickly check if TRA meets baseline.
 * Prefer using the full result when you need issues/recommendations.
 */
export function isVCACompliant(tra: TRA): boolean {
  const result = calculateVCACompliance(tra);
  return result.isCompliant;
}
