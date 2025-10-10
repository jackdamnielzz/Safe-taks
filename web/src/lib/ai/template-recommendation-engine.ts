/**
 * Template Recommendation Engine - AI-powered TRA template suggestions
 * Analyzes project context and requirements to recommend appropriate templates
 */

import type { TRATemplate, IndustryCategory } from "../types/template";
import type { Hazard } from "../types/hazard";

export interface TemplateRecommendationContext {
  projectDescription?: string;
  industry?: string;
  taskTypes?: string[];
  requiredHazards?: string[]; // Hazard IDs that must be covered
  previousTemplates?: string[]; // Previously used template IDs
  organizationId?: string;
  complianceFramework?: string;
  vcaRequired?: boolean;
  maxDuration?: number; // Maximum expected duration in minutes
  teamSize?: number; // Expected team size
}

export interface TemplateRecommendation {
  template: TRATemplate;
  score: number; // 0-100 recommendation score
  reasoning: string[]; // Why this template was recommended
  coverage: {
    hazardCoverage: number; // Percentage of required hazards covered
    industryMatch: boolean; // Industry match
    complianceMatch: boolean; // Compliance framework match
    vcaMatch: boolean; // VCA certification match
  };
  estimatedDuration: number; // Estimated completion time in minutes
  complexity: "low" | "medium" | "high";
}

export interface TemplateRecommendationResult {
  recommendations: TemplateRecommendation[];
  totalMatches: number;
  confidence: "high" | "medium" | "low";
  context: TemplateRecommendationContext;
}

/**
 * Template Recommendation Engine
 */
export class TemplateRecommendationEngine {
  private templates: TRATemplate[];

  constructor(templates: TRATemplate[] = []) {
    this.templates = templates;
  }

  /**
   * Set available templates for recommendations
   */
  setTemplates(templates: TRATemplate[]): void {
    this.templates = templates;
  }

  /**
   * Generate template recommendations based on context
   */
  async recommendTemplates(
    context: TemplateRecommendationContext
  ): Promise<TemplateRecommendationResult> {
    const recommendations: TemplateRecommendation[] = [];

    for (const template of this.templates) {
      // Skip if template doesn't match basic requirements
      if (!this.meetsBasicRequirements(template, context)) {
        continue;
      }

      const recommendation = await this.scoreTemplate(template, context);
      if (recommendation.score >= 40) {
        // Minimum threshold
        recommendations.push(recommendation);
      }
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    // Limit to top 10 recommendations
    const topRecommendations = recommendations.slice(0, 10);

    // Determine overall confidence
    const avgScore =
      topRecommendations.length > 0
        ? topRecommendations.reduce((sum, r) => sum + r.score, 0) / topRecommendations.length
        : 0;

    let overallConfidence: "high" | "medium" | "low" = "low";
    if (avgScore >= 75) overallConfidence = "high";
    else if (avgScore >= 60) overallConfidence = "medium";

    return {
      recommendations: topRecommendations,
      totalMatches: recommendations.length,
      confidence: overallConfidence,
      context,
    };
  }

  /**
   * Check if template meets basic requirements
   */
  private meetsBasicRequirements(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): boolean {
    // Check compliance framework match
    if (
      context.complianceFramework &&
      template.complianceFramework !== context.complianceFramework
    ) {
      return false;
    }

    // Check VCA requirement
    if (context.vcaRequired && !template.vcaCertified) {
      return false;
    }

    // Check industry match (if specified)
    if (context.industry && template.industryCategory !== context.industry) {
      return false;
    }

    // Check status
    if (template.status !== "published") {
      return false;
    }

    return true;
  }

  /**
   * Score a template against the context
   */
  private async scoreTemplate(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): Promise<TemplateRecommendation> {
    let score = 0;
    const reasoning: string[] = [];

    // Industry match (25% weight)
    const industryScore = this.scoreIndustryMatch(template, context);
    score += industryScore.score;
    reasoning.push(...industryScore.reasoning);

    // Hazard coverage (30% weight)
    const coverageScore = this.scoreHazardCoverage(template, context);
    score += coverageScore.score;
    reasoning.push(...coverageScore.reasoning);

    // Task type relevance (20% weight)
    const taskScore = this.scoreTaskRelevance(template, context);
    score += taskScore.score;
    reasoning.push(...taskScore.reasoning);

    // Template quality metrics (15% weight)
    const qualityScore = this.scoreTemplateQuality(template, context);
    score += qualityScore.score;
    reasoning.push(...qualityScore.reasoning);

    // Usage patterns (10% weight)
    const usageScore = this.scoreUsagePatterns(template, context);
    score += usageScore.score;
    reasoning.push(...usageScore.reasoning);

    // Avoid recently used templates (small penalty)
    if (context.previousTemplates?.includes(template.id)) {
      score *= 0.8; // 20% penalty for recently used
      reasoning.push("Recently used template");
    }

    // Complexity adjustment based on team size and duration
    const complexityAdjustment = this.calculateComplexityAdjustment(template, context);
    score *= complexityAdjustment;

    const finalScore = Math.min(Math.round(score), 100);

    return {
      template,
      score: finalScore,
      reasoning,
      coverage: coverageScore.coverage,
      estimatedDuration: this.estimateDuration(template, context),
      complexity: this.calculateComplexity(template),
    };
  }

  /**
   * Score industry category match
   */
  private scoreIndustryMatch(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): { score: number; reasoning: string[] } {
    const reasoning: string[] = [];

    if (context.industry === template.industryCategory) {
      reasoning.push(`Perfect industry match: ${template.industryCategory}`);
      return { score: 25, reasoning };
    }

    // Related industry matches (lower score)
    const relatedIndustries = this.getRelatedIndustries(template.industryCategory);
    if (relatedIndustries.includes(context.industry as IndustryCategory)) {
      reasoning.push(`Related industry: ${template.industryCategory}`);
      return { score: 15, reasoning };
    }

    reasoning.push(`Different industry: ${template.industryCategory}`);
    return { score: 5, reasoning };
  }

  /**
   * Score hazard coverage against requirements
   */
  private scoreHazardCoverage(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): {
    score: number;
    reasoning: string[];
    coverage: TemplateRecommendation["coverage"];
  } {
    const reasoning: string[] = [];
    let coverageScore = 0;

    if (!context.requiredHazards || context.requiredHazards.length === 0) {
      // No specific hazards required - score based on template comprehensiveness
      const hazardCount = this.getTemplateHazardCount(template);
      coverageScore = Math.min(hazardCount * 2, 30); // Up to 30 points for comprehensiveness
      reasoning.push(`Comprehensive template with ${hazardCount} hazards`);
    } else {
      // Score based on coverage of required hazards
      const templateHazardIds = this.getTemplateHazardIds(template);
      const coveredHazards = context.requiredHazards.filter((id) => templateHazardIds.includes(id));
      const coveragePercentage = (coveredHazards.length / context.requiredHazards.length) * 100;

      coverageScore = (coveragePercentage / 100) * 30;
      reasoning.push(
        `${Math.round(coveragePercentage)}% hazard coverage (${coveredHazards.length}/${context.requiredHazards.length})`
      );

      if (coveragePercentage === 100) {
        reasoning.push("Complete hazard coverage");
      } else if (coveragePercentage >= 75) {
        reasoning.push("Good hazard coverage");
      } else {
        reasoning.push("Partial hazard coverage");
      }
    }

    const coverage: TemplateRecommendation["coverage"] = {
      hazardCoverage: context.requiredHazards
        ? context.requiredHazards.length > 0
          ? (this.getTemplateHazardIds(template).filter((id) =>
              context.requiredHazards!.includes(id)
            ).length /
              context.requiredHazards.length) *
            100
          : 100
        : 100,
      industryMatch: context.industry === template.industryCategory,
      complianceMatch: context.complianceFramework === template.complianceFramework,
      vcaMatch: !context.vcaRequired || template.vcaCertified,
    };

    return {
      score: coverageScore,
      reasoning,
      coverage,
    };
  }

  /**
   * Score task type relevance
   */
  private scoreTaskRelevance(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): { score: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 0;

    if (!context.taskTypes || context.taskTypes.length === 0) {
      reasoning.push("No specific task types specified");
      return { score: 10, reasoning };
    }

    // Analyze template content for task relevance
    const templateText = `${template.name} ${template.description}`.toLowerCase();

    for (const taskType of context.taskTypes) {
      const taskLower = taskType.toLowerCase();

      // Check for keyword matches in template content
      if (templateText.includes(taskLower)) {
        score += 5;
        reasoning.push(`Task relevance: ${taskType}`);
      }

      // Check for semantic similarity with template hazards
      for (const step of template.taskStepsTemplate) {
        if (step.description.toLowerCase().includes(taskLower)) {
          score += 3;
          reasoning.push(`Step relevance: ${step.description.substring(0, 50)}...`);
        }
      }
    }

    return {
      score: Math.min(score, 20),
      reasoning,
    };
  }

  /**
   * Score template quality metrics
   */
  private scoreTemplateQuality(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): { score: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 0;

    // Usage count (popular templates get higher score)
    if (template.usageCount > 50) {
      score += 5;
      reasoning.push("Highly popular template");
    } else if (template.usageCount > 10) {
      score += 3;
      reasoning.push("Popular template");
    }

    // Rating score
    if (template.averageRating && template.averageRating >= 4) {
      score += 5;
      reasoning.push(`High user rating: ${template.averageRating}/5`);
    }

    // Template completeness
    const hazardCount = this.getTemplateHazardCount(template);
    if (hazardCount >= 10) {
      score += 3;
      reasoning.push("Comprehensive hazard coverage");
    } else if (hazardCount >= 5) {
      score += 2;
      reasoning.push("Good hazard coverage");
    }

    // VCA certification bonus
    if (template.vcaCertified) {
      score += 2;
      reasoning.push("VCA certified");
    }

    return {
      score: Math.min(score, 15),
      reasoning,
    };
  }

  /**
   * Score based on usage patterns
   */
  private scoreUsagePatterns(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): { score: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 0;

    // Recent usage bonus (templates used recently are likely relevant)
    if (template.lastUsedAt) {
      const lastUsedTime =
        template.lastUsedAt instanceof Date
          ? template.lastUsedAt.getTime()
          : template.lastUsedAt.toMillis();
      const daysSinceLastUse = Math.floor((Date.now() - lastUsedTime) / (1000 * 60 * 60 * 24));

      if (daysSinceLastUse <= 7) {
        score += 5;
        reasoning.push("Recently used by others");
      } else if (daysSinceLastUse <= 30) {
        score += 3;
        reasoning.push("Used recently");
      }
    }

    // Organization-specific usage (if available)
    if (context.organizationId && template.organizationId === context.organizationId) {
      score += 5;
      reasoning.push("Organization-specific template");
    }

    return {
      score: Math.min(score, 10),
      reasoning,
    };
  }

  /**
   * Calculate complexity adjustment based on context
   */
  private calculateComplexityAdjustment(
    template: TRATemplate,
    context: TemplateRecommendationContext
  ): number {
    const estimatedDuration = this.estimateDuration(template, context);
    const hazardCount = this.getTemplateHazardCount(template);

    // Adjust based on team size and time constraints
    let adjustment = 1.0;

    if (context.teamSize && context.teamSize < 3 && estimatedDuration > 60) {
      // Small team with long duration - prefer simpler templates
      adjustment *= 0.9;
    }

    if (context.maxDuration && estimatedDuration > context.maxDuration) {
      // Template too long for time constraint
      adjustment *= 0.8;
    }

    if (hazardCount > 15 && (!context.teamSize || context.teamSize < 3)) {
      // Complex template for small team
      adjustment *= 0.85;
    }

    return Math.max(adjustment, 0.5); // Don't reduce below 50%
  }

  /**
   * Estimate duration for template completion
   */
  private estimateDuration(template: TRATemplate, context: TemplateRecommendationContext): number {
    const baseDuration = template.taskStepsTemplate.reduce((total, step) => {
      return total + (step.duration || 15); // Default 15 minutes per step
    }, 0);

    // Adjust based on team size
    const teamMultiplier =
      context.teamSize && context.teamSize > 1
        ? Math.max(0.7, 1 / Math.log(context.teamSize + 1))
        : 1.0;

    // Adjust based on hazard complexity
    const hazardCount = this.getTemplateHazardCount(template);
    const complexityMultiplier = 1 + hazardCount * 0.02; // +2% per hazard

    return Math.round(baseDuration * teamMultiplier * complexityMultiplier);
  }

  /**
   * Calculate template complexity
   */
  private calculateComplexity(template: TRATemplate): "low" | "medium" | "high" {
    const hazardCount = this.getTemplateHazardCount(template);
    const stepCount = template.taskStepsTemplate.length;

    if (hazardCount <= 5 && stepCount <= 3) return "low";
    if (hazardCount <= 12 && stepCount <= 6) return "medium";

    return "high";
  }

  /**
   * Get related industries for a given industry
   */
  private getRelatedIndustries(industry: IndustryCategory): IndustryCategory[] {
    const related: Record<IndustryCategory, IndustryCategory[]> = {
      construction: ["maintenance", "industrial"],
      electrical: ["construction", "maintenance", "industrial"],
      plumbing: ["construction", "maintenance"],
      roofing: ["construction", "maintenance"],
      groundwork: ["construction", "maintenance"],
      painting: ["construction", "maintenance"],
      industrial: ["construction", "maintenance"],
      offshore: ["construction", "industrial"],
      logistics: ["industrial"],
      maintenance: ["construction", "industrial"],
      other: [],
    };

    return related[industry] || [];
  }

  /**
   * Get total hazard count in template
   */
  private getTemplateHazardCount(template: TRATemplate): number {
    return template.taskStepsTemplate.reduce((count, step) => count + step.hazards.length, 0);
  }

  /**
   * Get all hazard IDs in template
   */
  private getTemplateHazardIds(template: TRATemplate): string[] {
    return template.taskStepsTemplate.flatMap((step) => step.hazards.map((hazard) => hazard.id));
  }

  /**
   * Get template recommendations for specific industry
   */
  async getIndustryTemplates(
    industry: IndustryCategory,
    limit: number = 5
  ): Promise<TemplateRecommendation[]> {
    const industryTemplates = this.templates.filter((t) => t.industryCategory === industry);

    return industryTemplates.slice(0, limit).map((template) => ({
      template,
      score: 80,
      reasoning: [`Industry-specific template for ${industry}`],
      coverage: {
        hazardCoverage: 100,
        industryMatch: true,
        complianceMatch: true,
        vcaMatch: template.vcaCertified,
      },
      estimatedDuration: this.estimateDuration(template, {}),
      complexity: this.calculateComplexity(template),
    }));
  }

  /**
   * Get template recommendations based on hazards
   */
  async getHazardBasedTemplates(
    hazardIds: string[],
    limit: number = 5
  ): Promise<TemplateRecommendation[]> {
    const recommendations: TemplateRecommendation[] = [];

    for (const template of this.templates) {
      const templateHazardIds = this.getTemplateHazardIds(template);
      const matchingHazards = hazardIds.filter((id) => templateHazardIds.includes(id));
      const coveragePercentage = (matchingHazards.length / hazardIds.length) * 100;

      if (coveragePercentage >= 50) {
        // At least 50% coverage
        recommendations.push({
          template,
          score: Math.round(coveragePercentage),
          reasoning: [`${Math.round(coveragePercentage)}% hazard coverage`],
          coverage: {
            hazardCoverage: coveragePercentage,
            industryMatch: false,
            complianceMatch: false,
            vcaMatch: template.vcaCertified,
          },
          estimatedDuration: this.estimateDuration(template, {}),
          complexity: this.calculateComplexity(template),
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Quick template matching for common scenarios
   */
  async getQuickRecommendations(
    scenario: "electrical" | "construction" | "maintenance" | "office" | "industrial"
  ): Promise<TemplateRecommendation[]> {
    const scenarioKeywords = {
      electrical: ["electrical", "voltage", "wiring"],
      construction: ["construction", "building", "site"],
      maintenance: ["maintenance", "repair", "service"],
      office: ["office", "administrative", "desk"],
      industrial: ["industrial", "manufacturing", "factory"],
    };

    const keywords = scenarioKeywords[scenario];
    const context: TemplateRecommendationContext = {
      taskTypes: keywords,
    };

    const result = await this.recommendTemplates(context);
    return result.recommendations.slice(0, 3);
  }
}

// Export singleton instance
export const templateRecommendationEngine = new TemplateRecommendationEngine();
