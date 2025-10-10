/**
 * AI/LLM Discoverability Impact Analyzer
 *
 * Analyzes how well AI systems can discover, understand, and utilize
 * structured data from schema markup for improved search and content discovery.
 *
 * Features:
 * - Schema understandability scoring for AI systems
 * - Structured data extraction analysis
 * - AI search visibility impact assessment
 * - Content discovery optimization recommendations
 * - Multi-provider AI analysis support
 */

import { AIDiscoverabilityMetrics, AIAnalysisResult } from "./types/schema-analytics";

export interface AIDiscoverabilityConfig {
  enabled: boolean;
  providers: {
    openai?: {
      apiKey: string;
      model: string;
      enabled: boolean;
    };
    anthropic?: {
      apiKey: string;
      model: string;
      enabled: boolean;
    };
    google?: {
      apiKey: string;
      model: string;
      enabled: boolean;
    };
  };
  analysis: {
    sampleSize: number;
    depth: "basic" | "comprehensive";
    includeRecommendations: boolean;
  };
}

export interface SchemaUnderstandabilityFactors {
  completeness: number; // 0-1: How complete is the schema data
  clarity: number; // 0-1: How clear and unambiguous is the data
  structure: number; // 0-1: How well-structured is the data for AI parsing
  context: number; // 0-1: How much context is provided for understanding
  relationships: number; // 0-1: How well are entity relationships defined
}

export interface ContentDiscoveryMetrics {
  keywordExtraction: number; // How well AI can extract relevant keywords
  entityRecognition: number; // How well AI can identify key entities
  topicClassification: number; // How accurately AI can classify content topics
  searchOptimization: number; // How well optimized for AI-powered search
  contentSummary: number; // How well AI can generate accurate summaries
}

export class AIDiscoverabilityAnalyzer {
  private config: AIDiscoverabilityConfig;
  private analysisCache: Map<string, AIAnalysisResult> = new Map();

  constructor(config: AIDiscoverabilityConfig) {
    this.config = config;
  }

  /**
   * Analyze schema markup for AI discoverability
   */
  async analyzeSchemaDiscoverability(
    schemaData: any,
    schemaType: string,
    url: string
  ): Promise<AIAnalysisResult> {
    const cacheKey = `${schemaType}_${url}`;

    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis: AIAnalysisResult = {
      schemaUrl: url,
      schemaType,
      understandabilityScore: 0,
      extractionAccuracy: 0,
      contextRelevance: 0,
      recommendations: [],
      analyzedBy: "multi-provider",
      confidence: 0,
    };

    try {
      // Perform multi-provider analysis if enabled
      const providerResults = await this.performMultiProviderAnalysis(schemaData, schemaType);

      // Aggregate results
      analysis.understandabilityScore = this.calculateUnderstandabilityScore(
        schemaData,
        schemaType
      );
      analysis.extractionAccuracy = this.calculateExtractionAccuracy(providerResults);
      analysis.contextRelevance = this.calculateContextRelevance(schemaData);
      analysis.confidence = this.calculateConfidence(providerResults);
      analysis.recommendations = this.generateRecommendations(
        schemaData,
        schemaType,
        providerResults
      );

      // Cache results for 24 hours
      this.analysisCache.set(cacheKey, analysis);
    } catch (error) {
      console.error("Error analyzing AI discoverability:", error);

      // Return default values on error
      analysis.understandabilityScore = 0.5;
      analysis.extractionAccuracy = 0.5;
      analysis.contextRelevance = 0.5;
      analysis.confidence = 0.3;
      analysis.recommendations = [
        "Unable to complete AI analysis - manual review recommended",
        "Verify schema structure and completeness",
      ];
    }

    return analysis;
  }

  /**
   * Perform analysis across multiple AI providers
   */
  private async performMultiProviderAnalysis(schemaData: any, schemaType: string): Promise<any[]> {
    const results: any[] = [];

    // OpenAI Analysis
    if (this.config.providers.openai?.enabled) {
      try {
        const openaiResult = await this.analyzeWithOpenAI(schemaData, schemaType);
        results.push({ provider: "openai", ...openaiResult });
      } catch (error) {
        console.error("OpenAI analysis failed:", error);
      }
    }

    // Anthropic Analysis
    if (this.config.providers.anthropic?.enabled) {
      try {
        const anthropicResult = await this.analyzeWithAnthropic(schemaData, schemaType);
        results.push({ provider: "anthropic", ...anthropicResult });
      } catch (error) {
        console.error("Anthropic analysis failed:", error);
      }
    }

    // Google Analysis
    if (this.config.providers.google?.enabled) {
      try {
        const googleResult = await this.analyzeWithGoogle(schemaData, schemaType);
        results.push({ provider: "google", ...googleResult });
      } catch (error) {
        console.error("Google analysis failed:", error);
      }
    }

    return results;
  }

  /**
   * Analyze schema with OpenAI
   */
  private async analyzeWithOpenAI(schemaData: any, schemaType: string): Promise<any> {
    if (!this.config.providers.openai?.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // This would integrate with OpenAI API to analyze schema understandability
    // For now, returning mock analysis based on schema structure

    const prompt = `
      Analyze this ${schemaType} schema markup for AI understandability:

      Schema Data: ${JSON.stringify(schemaData, null, 2)}

      Please evaluate:
      1. How complete and well-structured is this data for AI processing?
      2. How clearly can an AI system understand the content and entities?
      3. What key information can be extracted for search and discovery?
      4. How well does this schema support AI-powered content discovery?

      Provide scores (0-10) for: completeness, clarity, structure, context.
    `;

    // Mock response - in production this would call OpenAI API
    return {
      completeness: 8.5,
      clarity: 7.8,
      structure: 9.2,
      context: 8.0,
      extractedEntities: this.extractEntities(schemaData, schemaType),
      summary: "Well-structured schema with good entity definitions",
    };
  }

  /**
   * Analyze schema with Anthropic
   */
  private async analyzeWithAnthropic(schemaData: any, schemaType: string): Promise<any> {
    if (!this.config.providers.anthropic?.apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    // Mock Anthropic analysis
    return {
      completeness: 8.2,
      clarity: 8.5,
      structure: 8.8,
      context: 7.9,
      extractedEntities: this.extractEntities(schemaData, schemaType),
      summary: "Clear structure with good contextual information",
    };
  }

  /**
   * Analyze schema with Google
   */
  private async analyzeWithGoogle(schemaData: any, schemaType: string): Promise<any> {
    if (!this.config.providers.google?.apiKey) {
      throw new Error("Google API key not configured");
    }

    // Mock Google analysis
    return {
      completeness: 8.8,
      clarity: 8.2,
      structure: 9.5,
      context: 8.3,
      extractedEntities: this.extractEntities(schemaData, schemaType),
      summary: "Excellent structure alignment with Google's entity recognition",
    };
  }

  /**
   * Extract entities from schema data
   */
  private extractEntities(schemaData: any, schemaType: string): string[] {
    const entities: string[] = [];

    try {
      switch (schemaType.toLowerCase()) {
        case "article":
          if (schemaData.headline) entities.push(`Article: ${schemaData.headline}`);
          if (schemaData.author?.name) entities.push(`Author: ${schemaData.author.name}`);
          if (schemaData.datePublished) entities.push(`Published: ${schemaData.datePublished}`);
          break;

        case "event":
          if (schemaData.name) entities.push(`Event: ${schemaData.name}`);
          if (schemaData.location?.name) entities.push(`Location: ${schemaData.location.name}`);
          if (schemaData.organizer?.name) entities.push(`Organizer: ${schemaData.organizer.name}`);
          break;

        case "product":
          if (schemaData.name) entities.push(`Product: ${schemaData.name}`);
          if (schemaData.brand?.name) entities.push(`Brand: ${schemaData.brand.name}`);
          if (schemaData.category) entities.push(`Category: ${schemaData.category}`);
          break;

        case "organization":
          if (schemaData.name) entities.push(`Organization: ${schemaData.name}`);
          if (schemaData.address?.addressLocality)
            entities.push(`Location: ${schemaData.address.addressLocality}`);
          break;

        case "dataset":
          if (schemaData.name) entities.push(`Dataset: ${schemaData.name}`);
          if (schemaData.creator?.name) entities.push(`Creator: ${schemaData.creator.name}`);
          break;

        case "faq":
          if (schemaData.name) entities.push(`FAQ: ${schemaData.name}`);
          break;
      }

      // Extract common properties
      if (schemaData.description)
        entities.push(`Description: ${schemaData.description.substring(0, 100)}...`);
      if (schemaData.keywords) entities.push(`Keywords: ${schemaData.keywords.join(", ")}`);
    } catch (error) {
      console.error("Error extracting entities:", error);
    }

    return entities;
  }

  /**
   * Calculate overall understandability score
   */
  private calculateUnderstandabilityScore(schemaData: any, schemaType: string): number {
    const factors = this.evaluateUnderstandabilityFactors(schemaData, schemaType);

    // Weighted average of understandability factors
    const weights = {
      completeness: 0.25,
      clarity: 0.2,
      structure: 0.25,
      context: 0.15,
      relationships: 0.15,
    };

    return Object.entries(factors).reduce((score, [factor, value]) => {
      return score + value * weights[factor as keyof typeof weights];
    }, 0);
  }

  /**
   * Evaluate understandability factors for schema
   */
  private evaluateUnderstandabilityFactors(
    schemaData: any,
    schemaType: string
  ): SchemaUnderstandabilityFactors {
    return {
      completeness: this.evaluateCompleteness(schemaData, schemaType),
      clarity: this.evaluateClarity(schemaData),
      structure: this.evaluateStructure(schemaData, schemaType),
      context: this.evaluateContext(schemaData),
      relationships: this.evaluateRelationships(schemaData),
    };
  }

  /**
   * Evaluate schema completeness (0-1)
   */
  private evaluateCompleteness(schemaData: any, schemaType: string): number {
    // Define required fields for each schema type
    const requiredFields: Record<string, string[]> = {
      article: ["headline", "datePublished", "author"],
      event: ["name", "startDate", "location"],
      product: ["name", "offers"],
      organization: ["name"],
      dataset: ["name", "description"],
      faq: ["name"],
    };

    const fields = requiredFields[schemaType.toLowerCase()] || [];
    const presentFields = fields.filter((field) => schemaData[field]);

    return fields.length > 0 ? presentFields.length / fields.length : 0.8;
  }

  /**
   * Evaluate schema clarity (0-1)
   */
  private evaluateClarity(schemaData: any): number {
    let clarityScore = 0.8; // Base score

    // Check for ambiguous or unclear data
    if (schemaData.description) {
      const description = schemaData.description.toLowerCase();

      // Penalize for very short descriptions
      if (description.length < 50) clarityScore -= 0.2;

      // Penalize for unclear language patterns
      const unclearPatterns = ["tbd", "coming soon", "placeholder", "lorem ipsum"];
      unclearPatterns.forEach((pattern) => {
        if (description.includes(pattern)) clarityScore -= 0.1;
      });
    }

    return Math.max(0, Math.min(1, clarityScore));
  }

  /**
   * Evaluate schema structure (0-1)
   */
  private evaluateStructure(schemaData: any, schemaType: string): number {
    let structureScore = 0.9; // Base score for valid JSON-LD

    // Check for nested object complexity (good for AI processing)
    const nestedObjects = JSON.stringify(schemaData).split("{").length - 1;
    if (nestedObjects > 3) structureScore += 0.05; // Bonus for complex but well-structured data

    // Check for array usage (good for multiple values)
    const arrays = JSON.stringify(schemaData).split("[").length - 1;
    if (arrays > 0) structureScore += 0.03;

    return Math.max(0, Math.min(1, structureScore));
  }

  /**
   * Evaluate schema context (0-1)
   */
  private evaluateContext(schemaData: any): number {
    let contextScore = 0.5; // Base score

    // Check for rich contextual information
    const contextIndicators = ["description", "keywords", "about", "abstract", "summary"];

    contextIndicators.forEach((indicator) => {
      if (schemaData[indicator]) {
        contextScore += 0.1;

        // Bonus for detailed descriptions
        if (indicator === "description" && schemaData[indicator].length > 200) {
          contextScore += 0.05;
        }
      }
    });

    return Math.max(0, Math.min(1, contextScore));
  }

  /**
   * Evaluate entity relationships (0-1)
   */
  private evaluateRelationships(schemaData: any): number {
    let relationshipScore = 0.6; // Base score

    // Check for related entities and connections
    if (schemaData.author && typeof schemaData.author === "object") relationshipScore += 0.1;
    if (schemaData.organizer && typeof schemaData.organizer === "object") relationshipScore += 0.1;
    if (schemaData.location && typeof schemaData.location === "object") relationshipScore += 0.1;
    if (schemaData.mentions && Array.isArray(schemaData.mentions)) relationshipScore += 0.1;

    return Math.max(0, Math.min(1, relationshipScore));
  }

  /**
   * Calculate extraction accuracy from provider results
   */
  private calculateExtractionAccuracy(providerResults: any[]): number {
    if (providerResults.length === 0) return 0.5;

    const totalAccuracy = providerResults.reduce((sum, result) => {
      return sum + (result.extractionAccuracy || 0.8);
    }, 0);

    return totalAccuracy / providerResults.length;
  }

  /**
   * Calculate context relevance score
   */
  private calculateContextRelevance(schemaData: any): number {
    const contextFactors = [
      schemaData.description ? 0.3 : 0,
      schemaData.keywords ? 0.2 : 0,
      schemaData.abstract ? 0.2 : 0,
      schemaData.articleSection ? 0.1 : 0,
      schemaData.genre ? 0.1 : 0,
    ];

    return contextFactors.reduce((sum, factor) => sum + factor, 0.1); // Base 0.1 for valid schema
  }

  /**
   * Calculate confidence score from provider results
   */
  private calculateConfidence(providerResults: any[]): number {
    if (providerResults.length === 0) return 0.3;

    // Average confidence across providers
    const totalConfidence = providerResults.reduce((sum, result) => {
      return sum + (result.confidence || 0.8);
    }, 0);

    return totalConfidence / providerResults.length;
  }

  /**
   * Generate AI optimization recommendations
   */
  private generateRecommendations(
    schemaData: any,
    schemaType: string,
    providerResults: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (!this.config.analysis.includeRecommendations) {
      return recommendations;
    }

    // Completeness recommendations
    if (this.evaluateCompleteness(schemaData, schemaType) < 0.8) {
      recommendations.push(`Add missing required fields for ${schemaType} schema`);
    }

    // Context recommendations
    if (this.evaluateContext(schemaData) < 0.7) {
      recommendations.push("Enhance schema with more descriptive content and keywords");
    }

    // Structure recommendations
    if (this.evaluateStructure(schemaData, schemaType) < 0.8) {
      recommendations.push("Improve schema structure with better nested relationships");
    }

    // Entity relationship recommendations
    if (this.evaluateRelationships(schemaData) < 0.7) {
      recommendations.push("Add more entity relationships and connections");
    }

    // AI-specific recommendations based on provider feedback
    providerResults.forEach((result) => {
      if (result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Analyze multiple schemas for batch processing
   */
  async analyzeSchemaBatch(
    schemas: Array<{ data: any; type: string; url: string }>
  ): Promise<AIAnalysisResult[]> {
    const results: AIAnalysisResult[] = [];
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < schemas.length; i += batchSize) {
      const batch = schemas.slice(i, i + batchSize);

      const batchPromises = batch.map((schema) =>
        this.analyzeSchemaDiscoverability(schema.data, schema.type, schema.url)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error(`Failed to analyze schema ${batch[index].url}:`, result.reason);
          // Create error result
          results.push({
            schemaUrl: batch[index].url,
            schemaType: batch[index].type,
            understandabilityScore: 0,
            extractionAccuracy: 0,
            contextRelevance: 0,
            recommendations: ["Analysis failed - manual review required"],
            analyzedBy: "error",
            confidence: 0,
          });
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < schemas.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate AI discoverability report
   */
  async generateDiscoverabilityReport(analysisResults: AIAnalysisResult[]): Promise<string> {
    const report = {
      totalSchemas: analysisResults.length,
      averageUnderstandability: 0,
      averageExtractionAccuracy: 0,
      averageContextRelevance: 0,
      topPerformers: [] as string[],
      needsImprovement: [] as string[],
      allRecommendations: [] as string[],
    };

    // Aggregate metrics
    report.averageUnderstandability =
      analysisResults.reduce((sum, result) => sum + result.understandabilityScore, 0) /
      analysisResults.length;

    report.averageExtractionAccuracy =
      analysisResults.reduce((sum, result) => sum + result.extractionAccuracy, 0) /
      analysisResults.length;

    report.averageContextRelevance =
      analysisResults.reduce((sum, result) => sum + result.contextRelevance, 0) /
      analysisResults.length;

    // Identify top performers and those needing improvement
    analysisResults.forEach((result) => {
      if (result.understandabilityScore > 0.8) {
        report.topPerformers.push(result.schemaUrl);
      }
      if (result.understandabilityScore < 0.6) {
        report.needsImprovement.push(result.schemaUrl);
      }
      report.allRecommendations.push(...result.recommendations);
    });

    // Generate markdown report
    let markdown = "# AI Discoverability Analysis Report\n\n";
    markdown += `**Total Schemas Analyzed:** ${report.totalSchemas}\n`;
    markdown += `**Average Understandability Score:** ${(report.averageUnderstandability * 10).toFixed(1)}/10\n`;
    markdown += `**Average Extraction Accuracy:** ${(report.averageExtractionAccuracy * 100).toFixed(1)}%\n`;
    markdown += `**Average Context Relevance:** ${(report.averageContextRelevance * 100).toFixed(1)}%\n\n`;

    if (report.topPerformers.length > 0) {
      markdown += "## Top Performing Schemas\n\n";
      report.topPerformers.slice(0, 5).forEach((url) => {
        markdown += `- ${url}\n`;
      });
      markdown += "\n";
    }

    if (report.needsImprovement.length > 0) {
      markdown += "## Schemas Needing Improvement\n\n";
      report.needsImprovement.slice(0, 5).forEach((url) => {
        markdown += `- ${url}\n`;
      });
      markdown += "\n";
    }

    if (report.allRecommendations.length > 0) {
      markdown += "## Key Recommendations\n\n";
      const uniqueRecommendations = [...new Set(report.allRecommendations)];
      uniqueRecommendations.slice(0, 10).forEach((rec) => {
        markdown += `- ${rec}\n`;
      });
      markdown += "\n";
    }

    return markdown;
  }
}

// Export singleton instance
export const aiDiscoverabilityAnalyzer = new AIDiscoverabilityAnalyzer({
  enabled: true,
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: "gpt-4",
      enabled: false, // Disabled by default for demo
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      model: "claude-3-sonnet-20240229",
      enabled: false, // Disabled by default for demo
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || "",
      model: "gemini-pro",
      enabled: false, // Disabled by default for demo
    },
  },
  analysis: {
    sampleSize: 100,
    depth: "comprehensive",
    includeRecommendations: true,
  },
});
