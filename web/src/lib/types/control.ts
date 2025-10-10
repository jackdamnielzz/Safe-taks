/**
 * Control measure types and recommendation result types
 * Added for Task 4.5 - control measures recommendation system
 */

export type ControlHierarchy =
  | "elimination"
  | "substitution"
  | "engineering"
  | "administrative"
  | "ppe";

/** Generic score between 0 and 1 */
export type EffectivenessScore = number;

/** Basic control measure definition */
export interface ControlMeasure {
  id: string;
  title: string;
  description: string;
  hierarchy: ControlHierarchy;
  typicalEffectiveness: EffectivenessScore; // baseline expected effectiveness 0..1
  applicableHazardCategories?: string[]; // e.g., ['chemical','physical']
  industryConstraints?: string[]; // industries where this control is commonly used
  costEstimate?: "low" | "medium" | "high";
  isRequired?: boolean;
}

/** Request payload for recommendations API */
export interface RecommendationRequest {
  hazardId: string;
  context?: {
    industry?: string;
    location?: string;
    constraints?: {
      maxCost?: "low" | "medium" | "high";
      allowPPE?: boolean;
      allowAdministrative?: boolean;
      allowEngineering?: boolean;
    };
    exposureModifiers?: {
      // context modifiers that can affect scoring (0..2 multipliers)
      exposureMultiplier?: number;
      frequencyMultiplier?: number;
    };
    customAllowed?: string[]; // whitelist of control ids user explicitly allows
    customBlocked?: string[]; // blacklist of control ids user blocks
  };
  maxResults?: number;
}

/** Explanation of factors that produced a score */
export interface ScoreExplanation {
  factors: string[]; // short sentences explaining score composition
  breakdown?: Record<string, number>; // numeric contributions per factor
}

/** Single recommendation result */
export interface RecommendationResult {
  measure: ControlMeasure;
  score: EffectivenessScore; // normalized 0..1
  explanation: ScoreExplanation;
  hierarchyRank: number; // 1 = elimination ... 5 = PPE (for ordering / grouping)
  metadata?: Record<string, any>;
}

/** Full API response */
export interface RecommendationResponse {
  hazardId: string;
  recommendations: RecommendationResult[];
  generatedAt: string; // ISO timestamp
}
