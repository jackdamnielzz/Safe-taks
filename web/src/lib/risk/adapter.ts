/**
 * Adapter utilities to map existing hazard / template shapes to Kinney & Wiruth engine input
 *
 * This file provides a small, defensive mapper so existing hazard objects can be passed
 * into the risk engine without changing original validators or types.
 */

import type { Hazard } from "../types/tra";
import type { KinneyInput } from "./kinney-wiruth";

/**
 * Map a Hazard (from TRA model) to KinneyInput expected by calculateRiskScore().
 * - Uses hazard.effectScore -> consequence
 * - hazard.exposureScore -> exposure
 * - hazard.probabilityScore -> probability
 * - Accepts optional modifiers map to pass through for advanced adjustments
 */
export function hazardToKinneyInput(
  h: Partial<Hazard>,
  modifiers?: Record<string, number>
): KinneyInput {
  const probability = typeof h.probabilityScore === "number" ? h.probabilityScore : NaN;
  const consequence = typeof h.effectScore === "number" ? h.effectScore : NaN;
  const exposure = typeof h.exposureScore === "number" ? h.exposureScore : 1;

  return {
    probability,
    consequence,
    exposure,
    modifiers,
  };
}
