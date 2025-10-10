/**
 * Hazard Suggestion Engine - AI-powered hazard identification assistance
 * Analyzes context (text, location, industry) to suggest relevant hazards from the hazard library
 */

import { HAZARDS } from "../data/hazards";
import type { Hazard } from "../types/hazard";

export interface HazardSuggestionContext {
  text?: string; // Description or notes from user
  industry?: string; // Industry context (construction, manufacturing, etc.)
  location?: string; // Location or environment description
  taskType?: string; // Type of work being performed
  previousHazards?: string[]; // IDs of previously identified hazards
  projectId?: string; // Project context for learning
}

export interface HazardSuggestion {
  hazard: Hazard;
  confidence: number; // 0-100 confidence score
  reasoning: string; // Why this hazard was suggested
  keywords: string[]; // Matching keywords
}

export interface HazardSuggestionResult {
  suggestions: HazardSuggestion[];
  totalMatches: number;
  confidence: "high" | "medium" | "low";
  context: HazardSuggestionContext;
}

/**
 * Main hazard suggestion engine
 */
export class HazardSuggestionEngine {
  private hazards: Hazard[];

  constructor(hazards: Hazard[] = HAZARDS) {
    this.hazards = hazards;
  }

  /**
   * Generate hazard suggestions based on context
   */
  async suggestHazards(context: HazardSuggestionContext): Promise<HazardSuggestionResult> {
    const suggestions: HazardSuggestion[] = [];

    for (const hazard of this.hazards) {
      const suggestion = await this.scoreHazard(hazard, context);
      if (suggestion.confidence >= 30) {
        // Minimum threshold
        suggestions.push(suggestion);
      }
    }

    // Sort by confidence score (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Limit to top 20 suggestions
    const topSuggestions = suggestions.slice(0, 20);

    // Determine overall confidence
    const avgConfidence =
      topSuggestions.length > 0
        ? topSuggestions.reduce((sum, s) => sum + s.confidence, 0) / topSuggestions.length
        : 0;

    let overallConfidence: "high" | "medium" | "low" = "low";
    if (avgConfidence >= 70) overallConfidence = "high";
    else if (avgConfidence >= 50) overallConfidence = "medium";

    return {
      suggestions: topSuggestions,
      totalMatches: suggestions.length,
      confidence: overallConfidence,
      context,
    };
  }

  /**
   * Score a single hazard against the context
   */
  private async scoreHazard(
    hazard: Hazard,
    context: HazardSuggestionContext
  ): Promise<HazardSuggestion> {
    let score = 0;
    const matchingKeywords: string[] = [];
    const reasoning: string[] = [];

    // Industry matching (30% weight)
    if (context.industry && hazard.industry === context.industry) {
      score += 30;
      reasoning.push(`Matches industry: ${context.industry}`);
    }

    // Text analysis (40% weight)
    if (context.text) {
      const textScore = this.analyzeText(hazard, context.text);
      score += textScore.score * 0.4;
      matchingKeywords.push(...textScore.keywords);
      reasoning.push(...textScore.reasoning);
    }

    // Location/environment analysis (20% weight)
    if (context.location) {
      const locationScore = this.analyzeLocation(hazard, context.location);
      score += locationScore.score * 0.2;
      if (locationScore.matchingKeywords.length > 0) {
        matchingKeywords.push(...locationScore.matchingKeywords);
        reasoning.push(...locationScore.reasoning);
      }
    }

    // Task type analysis (10% weight)
    if (context.taskType) {
      const taskScore = this.analyzeTaskType(hazard, context.taskType);
      score += taskScore.score * 0.1;
      if (taskScore.keywords.length > 0) {
        matchingKeywords.push(...taskScore.keywords);
        reasoning.push(...taskScore.reasoning);
      }
    }

    // Avoid duplicate suggestions (small penalty for already identified hazards)
    if (context.previousHazards?.includes(hazard.id)) {
      score *= 0.7; // 30% penalty for duplicates
      reasoning.push("Previously identified hazard");
    }

    return {
      hazard,
      confidence: Math.min(Math.round(score), 100),
      reasoning: reasoning.join("; "),
      keywords: [...new Set(matchingKeywords)], // Remove duplicates
    };
  }

  /**
   * Analyze text content for hazard relevance
   */
  private analyzeText(
    hazard: Hazard,
    text: string
  ): { score: number; keywords: string[]; reasoning: string[] } {
    const textLower = text.toLowerCase();
    let score = 0;
    const matchingKeywords: string[] = [];
    const reasoning: string[] = [];

    // Check for keyword matches
    for (const keyword of hazard.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        score += 15; // Each keyword match adds points
        matchingKeywords.push(keyword);
        reasoning.push(`Keyword match: "${keyword}"`);
      }
    }

    // Check for semantic similarity in title/description
    const hazardText = `${hazard.title} ${hazard.description}`.toLowerCase();
    const words = textLower.split(/\s+/);

    for (const word of words) {
      if (word.length > 3 && hazardText.includes(word)) {
        score += 5; // Semantic match
        reasoning.push(`Semantic match: "${word}"`);
      }
    }

    // Boost score for exact phrase matches
    if (textLower.includes(hazard.title.toLowerCase())) {
      score += 20;
      reasoning.push(`Title match: "${hazard.title}"`);
    }

    return {
      score: Math.min(score, 100),
      keywords: matchingKeywords,
      reasoning,
    };
  }

  /**
   * Analyze location for hazard relevance
   */
  private analyzeLocation(
    hazard: Hazard,
    location: string
  ): { score: number; matchingKeywords: string[]; reasoning: string[] } {
    const locationLower = location.toLowerCase();
    let score = 0;
    const matchingKeywords: string[] = [];
    const reasoning: string[] = [];

    // Location-based keyword matches
    for (const keyword of hazard.keywords) {
      if (this.isLocationKeyword(keyword) && locationLower.includes(keyword.toLowerCase())) {
        score += 10;
        matchingKeywords.push(keyword);
        reasoning.push(`Location keyword: "${keyword}"`);
      }
    }

    // Environment-specific analysis
    if (
      locationLower.includes("height") ||
      locationLower.includes("hoogte") ||
      locationLower.includes("roof") ||
      locationLower.includes("dak")
    ) {
      if (hazard.categories.includes("physical") || hazard.title.toLowerCase().includes("fall")) {
        score += 15;
        reasoning.push("Height-related location detected");
      }
    }

    if (
      locationLower.includes("water") ||
      locationLower.includes("wet") ||
      locationLower.includes("natte")
    ) {
      if (
        hazard.title.toLowerCase().includes("slip") ||
        hazard.title.toLowerCase().includes("electric")
      ) {
        score += 15;
        reasoning.push("Wet environment detected");
      }
    }

    return {
      score: Math.min(score, 100),
      matchingKeywords,
      reasoning,
    };
  }

  /**
   * Analyze task type for hazard relevance
   */
  private analyzeTaskType(
    hazard: Hazard,
    taskType: string
  ): { score: number; keywords: string[]; reasoning: string[] } {
    const taskLower = taskType.toLowerCase();
    let score = 0;
    const keywords: string[] = [];
    const reasoning: string[] = [];

    // Task-specific keyword matches
    for (const keyword of hazard.keywords) {
      if (taskLower.includes(keyword.toLowerCase())) {
        score += 8;
        keywords.push(keyword);
        reasoning.push(`Task keyword: "${keyword}"`);
      }
    }

    // Task type patterns
    const electricalTasks = ["electrical", "wiring", "power", "voltage", "elektro", "bekabeling"];
    const heightTasks = ["roof", "climb", "ladder", "scaffold", "dak", "klimmen", "ladder"];
    const chemicalTasks = ["chemical", "paint", "clean", "chemisch", "verf", "schoonmaak"];

    if (
      electricalTasks.some((task) => taskLower.includes(task)) &&
      hazard.categories.includes("electrical")
    ) {
      score += 12;
      reasoning.push("Electrical task with electrical hazard");
    }

    if (
      heightTasks.some((task) => taskLower.includes(task)) &&
      hazard.title.toLowerCase().includes("fall")
    ) {
      score += 12;
      reasoning.push("Height task with fall hazard");
    }

    if (
      chemicalTasks.some((task) => taskLower.includes(task)) &&
      hazard.categories.includes("chemical")
    ) {
      score += 12;
      reasoning.push("Chemical task with chemical hazard");
    }

    return {
      score: Math.min(score, 100),
      keywords,
      reasoning,
    };
  }

  /**
   * Check if a keyword is location-related
   */
  private isLocationKeyword(keyword: string): boolean {
    const locationKeywords = [
      "roof",
      "dak",
      "height",
      "hoogte",
      "floor",
      "vloer",
      "ground",
      "grond",
      "water",
      "wet",
      "natte",
      "outdoor",
      "buiten",
      "indoor",
      "binnen",
      "confined",
      "beperkt",
      "space",
      "ruimte",
      "traffic",
      "verkeer",
      "weather",
      "weer",
      "temperature",
      "temperatuur",
    ];
    return locationKeywords.includes(keyword.toLowerCase());
  }

  /**
   * Get suggestions for a specific industry
   */
  async getIndustryHazards(industry: string, limit: number = 10): Promise<HazardSuggestion[]> {
    const industryHazards = this.hazards.filter((h) => h.industry === industry);

    return industryHazards.slice(0, limit).map((hazard) => ({
      hazard,
      confidence: 80, // High confidence for direct industry matches
      reasoning: `Industry-specific hazard for ${industry}`,
      keywords: hazard.keywords,
    }));
  }

  /**
   * Get suggestions based on keywords only
   */
  async getKeywordHazards(keywords: string[], limit: number = 10): Promise<HazardSuggestion[]> {
    const suggestions: HazardSuggestion[] = [];

    for (const hazard of this.hazards) {
      let score = 0;
      const matchingKeywords: string[] = [];

      for (const keyword of keywords) {
        if (hazard.keywords.some((hk) => hk.toLowerCase().includes(keyword.toLowerCase()))) {
          score += 20;
          matchingKeywords.push(keyword);
        }
      }

      if (score > 0) {
        suggestions.push({
          hazard,
          confidence: Math.min(score, 100),
          reasoning: `Keyword matches: ${matchingKeywords.join(", ")}`,
          keywords: matchingKeywords,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  /**
   * Learn from user feedback (future enhancement)
   */
  async recordFeedback(
    hazardId: string,
    context: HazardSuggestionContext,
    wasRelevant: boolean
  ): Promise<void> {
    // In a real implementation, this would store feedback for model improvement
    // For now, just log the feedback
    console.log(
      `Feedback recorded: Hazard ${hazardId} was ${wasRelevant ? "relevant" : "not relevant"} in context:`,
      context
    );
  }
}

// Export singleton instance
export const hazardSuggestionEngine = new HazardSuggestionEngine();
