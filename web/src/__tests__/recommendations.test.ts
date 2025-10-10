import {
  recommendForHazard,
  scoreControl,
  getHazardById,
} from "../lib/recommendations/recommender";
import { CONTROLS } from "../lib/data/controls";
import type { RecommendationRequest } from "../lib/types/control";

test("recommendForHazard returns ranked recommendations with scores for known hazard", () => {
  const req: RecommendationRequest = { hazardId: "hz-001", maxResults: 10 };
  const res = recommendForHazard(req);
  if (!res.recommendations || res.recommendations.length === 0) {
    throw new Error("Expected at least one recommendation");
  }

  // scores in 0..1, sorted by hierarchy rank then score
  let prevRank = 0;
  let prevScore = 2;
  for (const r of res.recommendations) {
    if (r.score < 0 || r.score > 1) throw new Error("Score out of range 0..1");
    if (r.hierarchyRank < prevRank) throw new Error("Hierarchy order violated");
    if (r.hierarchyRank === prevRank && r.score > prevScore + 1e-6)
      throw new Error("Score ordering within same hierarchy violated");
    prevRank = r.hierarchyRank;
    prevScore = r.score;
  }
});

test("scoreControl penalizes blocked controls and respects exposure modifiers", () => {
  const hazard = getHazardById("hz-001");
  if (!hazard) throw new Error("hazard not found");
  const control = CONTROLS.find((c) => c.id === "ctl-ppe-standard");
  if (!control) throw new Error("control not found");

  // provide minimal valid RecommendationRequest where required
  const reqBase: RecommendationRequest = { hazardId: "hz-001" };

  const base = scoreControl(control, hazard, reqBase as any);
  const blockedReq: RecommendationRequest = {
    hazardId: "hz-001",
    context: { customBlocked: ["ctl-ppe-standard"] },
  };
  const blocked = scoreControl(control, hazard, blockedReq as any);
  if (!(blocked.score < base.score)) throw new Error("Blocked control should have lower score");

  const highExposureReq: RecommendationRequest = {
    hazardId: "hz-001",
    context: { exposureModifiers: { exposureMultiplier: 2, frequencyMultiplier: 2 } },
  };
  const highExposure = scoreControl(control, hazard, highExposureReq as any);
  if (!(highExposure.score >= base.score))
    throw new Error("Higher exposure should not reduce score");
});
