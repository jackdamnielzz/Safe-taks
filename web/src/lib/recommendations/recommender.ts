import { CONTROLS, HAZARD_TO_CONTROLS } from "../data/controls";
import type {
  ControlMeasure,
  RecommendationRequest,
  RecommendationResult,
  ScoreExplanation,
} from "../types/control";
import { HAZARDS } from "../data/hazards";
import type { Hazard } from "../types/hazard";

/**
 * Recommendation engine
 *
 * - Pure functions producing ranked control suggestions based on:
 *   * control typicalEffectiveness
 *   * hierarchy preference (Elimination..PPE)
 *   * applicability to hazard categories & industry
 *   * user constraints (allow/block lists, cost limits)
 *   * simple exposure modifiers supplied in context
 *
 * - Returns normalized 0..1 scores and human-readable explanation.
 */

/** Map hierarchy to rank (lower = higher-preference) */
const HIERARCHY_RANK: Record<ControlMeasure["hierarchy"], number> = {
  elimination: 1,
  substitution: 2,
  engineering: 3,
  administrative: 4,
  ppe: 5,
};

/** Clamp helper */
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Find hazard by id (returns undefined if not found) */
export function getHazardById(hazardId: string): Hazard | undefined {
  return HAZARDS.find((h) => h.id === hazardId);
}

/**
 * Compute a score for a control measure given hazard and request context.
 * Scoring factors (weighted):
 *  - baseline effectiveness (0.6)
 *  - hierarchy preference (0.15) — higher for elimination/substitution
 *  - applicability match (0.15) — + if control targets hazard category
 *  - constraints penalty (0.1) — cost/allow flags
 *
 * Returns normalized score and explanation.
 */
export function scoreControl(
  control: ControlMeasure,
  hazard: Hazard,
  req?: RecommendationRequest
): { score: number; explanation: ScoreExplanation } {
  const baseline = clamp01(control.typicalEffectiveness);
  const hierarchyBoost = 1 - (HIERARCHY_RANK[control.hierarchy] - 1) / 4; // elimination ->1, ppe->0
  // applicability: 1 if any category matches, else 0.6
  const applicable =
    control.applicableHazardCategories &&
    control.applicableHazardCategories.some((c) => hazard.categories.includes(c))
      ? 1
      : 0.6;

  // constraint checks
  let constraintPenalty = 0;
  const factors: string[] = [];
  const breakdown: Record<string, number> = {};

  // cost constraint
  const maxCost = req?.context?.constraints?.maxCost;
  if (maxCost && control.costEstimate) {
    const costOrder = { low: 1, medium: 2, high: 3 } as const;
    if (costOrder[control.costEstimate] > costOrder[maxCost]) {
      constraintPenalty += 0.12;
      factors.push(`penalized for cost (${control.costEstimate} > ${maxCost})`);
    }
  }

  // allow/deny by type flags
  const allowPPE = req?.context?.constraints?.allowPPE ?? true;
  if (!allowPPE && control.hierarchy === "ppe") {
    constraintPenalty += 0.4;
    factors.push("PPE disallowed by constraints");
  }
  const allowAdmin = req?.context?.constraints?.allowAdministrative ?? true;
  if (!allowAdmin && control.hierarchy === "administrative") {
    constraintPenalty += 0.25;
    factors.push("administrative controls disallowed by constraints");
  }
  const allowEng = req?.context?.constraints?.allowEngineering ?? true;
  if (!allowEng && control.hierarchy === "engineering") {
    constraintPenalty += 0.25;
    factors.push("engineering controls disallowed by constraints");
  }

  // custom whitelist/blacklist
  if (req?.context?.customBlocked?.includes(control.id)) {
    constraintPenalty += 1.0;
    factors.push("explicitly blocked by user");
  }
  if (req?.context?.customAllowed && req.context.customAllowed.length > 0) {
    if (!req.context.customAllowed.includes(control.id)) {
      // soft penalty if allow-list present but control not in it
      constraintPenalty += 0.25;
      factors.push("not in explicit allow-list");
    } else {
      factors.push("explicitly allowed by user");
    }
  }

  // exposure/frequency modifiers increase importance of higher-effectiveness controls
  const exposureMultiplier = req?.context?.exposureModifiers?.exposureMultiplier ?? 1;
  const frequencyMultiplier = req?.context?.exposureModifiers?.frequencyMultiplier ?? 1;
  const exposureFactor = clamp01((exposureMultiplier + frequencyMultiplier) / 2);

  // combine weighted components
  const scoreRaw =
    baseline * 0.6 + hierarchyBoost * 0.15 + applicable * 0.15 + exposureFactor * 0.1; // increases small contribution when exposure high

  // apply constraint penalty multiplicatively
  const scoreAfterPenalty = clamp01(scoreRaw * (1 - constraintPenalty));

  // build explanation
  breakdown.baseline = Number((baseline * 0.6).toFixed(3));
  breakdown.hierarchy = Number((hierarchyBoost * 0.15).toFixed(3));
  breakdown.applicable = Number((applicable * 0.15).toFixed(3));
  breakdown.exposure = Number((exposureFactor * 0.1).toFixed(3));
  breakdown.penalty = Number(constraintPenalty.toFixed(3));
  breakdown.final = Number(scoreAfterPenalty.toFixed(3));

  if (factors.length === 0) {
    factors.push("scoring based on baseline effectiveness, hierarchy and applicability");
  }

  const explanation: ScoreExplanation = {
    factors,
    breakdown,
  };

  return {
    score: scoreAfterPenalty,
    explanation,
  };
}

/**
 * Produce recommendations given a hazard id and request.
 * Returns recommendations grouped by hierarchy order and sorted by score desc.
 */
export function recommendForHazard(req: RecommendationRequest): {
  hazardId: string;
  recommendations: RecommendationResult[];
} {
  const hazard = getHazardById(req.hazardId);
  if (!hazard) {
    return { hazardId: req.hazardId, recommendations: [] };
  }

  // gather candidate control ids from hazard categories mapping
  const candidateIds = new Set<string>();
  for (const cat of hazard.categories) {
    const mapped = HAZARD_TO_CONTROLS[cat];
    if (mapped) mapped.forEach((id) => candidateIds.add(id));
  }
  // fallback: if none found, include all controls
  if (candidateIds.size === 0) CONTROLS.forEach((c) => candidateIds.add(c.id));

  // map to control objects, filter blocked by explicit blacklist early
  let candidates = Array.from(candidateIds)
    .map((id) => CONTROLS.find((c) => c.id === id))
    .filter(Boolean) as ControlMeasure[];

  // allow user customAllowed to restrict candidates
  if (req.context?.customAllowed && req.context.customAllowed.length > 0) {
    candidates = candidates.filter((c) => req.context!.customAllowed!.includes(c.id));
  }

  const results: RecommendationResult[] = candidates.map((control) => {
    const { score, explanation } = scoreControl(control, hazard, req);
    return {
      measure: control,
      score,
      explanation,
      hierarchyRank: HIERARCHY_RANK[control.hierarchy] ?? 99,
      metadata: {
        costEstimate: control.costEstimate,
        applicableCategories: control.applicableHazardCategories ?? [],
      },
    };
  });

  // sort: primary by hierarchyRank asc, secondary by score desc
  results.sort((a, b) => {
    if (a.hierarchyRank !== b.hierarchyRank) return a.hierarchyRank - b.hierarchyRank;
    return b.score - a.score;
  });

  const max = req.maxResults && req.maxResults > 0 ? req.maxResults : results.length;
  return { hazardId: req.hazardId, recommendations: results.slice(0, max) };
}
