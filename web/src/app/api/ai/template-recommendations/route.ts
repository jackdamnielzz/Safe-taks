/**
 * AI Template Recommendations API
 * Provides intelligent TRA template suggestions based on context analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { templateRecommendationEngine } from "@/lib/ai/template-recommendation-engine";
import type { TemplateRecommendationContext } from "@/lib/ai/template-recommendation-engine";

// Input validation schema
const TemplateRecommendationRequestSchema = z.object({
  projectDescription: z.string().optional(),
  industry: z.string().optional(),
  taskTypes: z.array(z.string()).optional(),
  requiredHazards: z.array(z.string()).optional(),
  previousTemplates: z.array(z.string()).optional(),
  organizationId: z.string().optional(),
  complianceFramework: z.string().optional(),
  vcaRequired: z.boolean().optional(),
  maxDuration: z.number().optional(),
  teamSize: z.number().optional(),
  limit: z.number().min(1).max(10).default(5),
});

// POST /api/ai/template-recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TemplateRecommendationRequestSchema.parse(body);

    // Convert to engine context format
    const context: TemplateRecommendationContext = {
      projectDescription: validatedData.projectDescription,
      industry: validatedData.industry,
      taskTypes: validatedData.taskTypes,
      requiredHazards: validatedData.requiredHazards,
      previousTemplates: validatedData.previousTemplates,
      organizationId: validatedData.organizationId,
      complianceFramework: validatedData.complianceFramework,
      vcaRequired: validatedData.vcaRequired,
      maxDuration: validatedData.maxDuration,
      teamSize: validatedData.teamSize,
    };

    // Get recommendations from engine
    const result = await templateRecommendationEngine.recommendTemplates(context);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        recommendations: result.recommendations.map((r) => ({
          template: {
            id: r.template.id,
            name: r.template.name,
            description: r.template.description,
            industryCategory: r.template.industryCategory,
            hazardCategories: r.template.hazardCategories,
            vcaCertified: r.template.vcaCertified,
            usageCount: r.template.usageCount,
            taskStepCount: r.template.taskStepsTemplate.length,
            hazardCount: r.template.taskStepsTemplate.reduce(
              (count, step) => count + step.hazards.length,
              0
            ),
            averageRating: r.template.averageRating,
            isSystemTemplate: r.template.isSystemTemplate,
            createdByName: r.template.createdByName,
            lastUsedAt: r.template.lastUsedAt,
          },
          score: r.score,
          reasoning: r.reasoning,
          coverage: r.coverage,
          estimatedDuration: r.estimatedDuration,
          complexity: r.complexity,
        })),
        totalMatches: result.totalMatches,
        confidence: result.confidence,
        context: result.context,
      },
    });
  } catch (error) {
    console.error("Template recommendations API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/template-recommendations - Quick recommendations for common scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const scenario = searchParams.get("scenario") as
      | "electrical"
      | "construction"
      | "maintenance"
      | "office"
      | "industrial";
    const industry = searchParams.get("industry");
    const hazardIds = searchParams
      .get("hazards")
      ?.split(",")
      .map((h) => h.trim());
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);

    if (scenario) {
      // Get scenario-based quick recommendations
      const recommendations = await templateRecommendationEngine.getQuickRecommendations(scenario);

      return NextResponse.json({
        success: true,
        data: {
          recommendations: recommendations.slice(0, limit).map((r) => ({
            template: {
              id: r.template.id,
              name: r.template.name,
              description: r.template.description,
              industryCategory: r.template.industryCategory,
              hazardCategories: r.template.hazardCategories,
              vcaCertified: r.template.vcaCertified,
              usageCount: r.template.usageCount,
              taskStepCount: r.template.taskStepsTemplate.length,
              hazardCount: r.template.taskStepsTemplate.reduce(
                (count, step) => count + step.hazards.length,
                0
              ),
              averageRating: r.template.averageRating,
              isSystemTemplate: r.template.isSystemTemplate,
              createdByName: r.template.createdByName,
              lastUsedAt: r.template.lastUsedAt,
            },
            score: r.score,
            reasoning: r.reasoning,
            coverage: r.coverage,
            estimatedDuration: r.estimatedDuration,
            complexity: r.complexity,
          })),
          query: { scenario },
          count: recommendations.length,
        },
      });
    }

    if (industry) {
      // Get industry-specific templates
      const recommendations = await templateRecommendationEngine.getIndustryTemplates(
        industry as any,
        limit
      );

      return NextResponse.json({
        success: true,
        data: {
          recommendations: recommendations.map((r) => ({
            template: {
              id: r.template.id,
              name: r.template.name,
              description: r.template.description,
              industryCategory: r.template.industryCategory,
              hazardCategories: r.template.hazardCategories,
              vcaCertified: r.template.vcaCertified,
              usageCount: r.template.usageCount,
              taskStepCount: r.template.taskStepsTemplate.length,
              hazardCount: r.template.taskStepsTemplate.reduce(
                (count, step) => count + step.hazards.length,
                0
              ),
              averageRating: r.template.averageRating,
              isSystemTemplate: r.template.isSystemTemplate,
              createdByName: r.template.createdByName,
              lastUsedAt: r.template.lastUsedAt,
            },
            score: r.score,
            reasoning: r.reasoning,
            coverage: r.coverage,
            estimatedDuration: r.estimatedDuration,
            complexity: r.complexity,
          })),
          query: { industry },
          count: recommendations.length,
        },
      });
    }

    if (hazardIds && hazardIds.length > 0) {
      // Get hazard-based template recommendations
      const recommendations = await templateRecommendationEngine.getHazardBasedTemplates(
        hazardIds,
        limit
      );

      return NextResponse.json({
        success: true,
        data: {
          recommendations: recommendations.map((r) => ({
            template: {
              id: r.template.id,
              name: r.template.name,
              description: r.template.description,
              industryCategory: r.template.industryCategory,
              hazardCategories: r.template.hazardCategories,
              vcaCertified: r.template.vcaCertified,
              usageCount: r.template.usageCount,
              taskStepCount: r.template.taskStepsTemplate.length,
              hazardCount: r.template.taskStepsTemplate.reduce(
                (count, step) => count + step.hazards.length,
                0
              ),
              averageRating: r.template.averageRating,
              isSystemTemplate: r.template.isSystemTemplate,
              createdByName: r.template.createdByName,
              lastUsedAt: r.template.lastUsedAt,
            },
            score: r.score,
            reasoning: r.reasoning,
            coverage: r.coverage,
            estimatedDuration: r.estimatedDuration,
            complexity: r.complexity,
          })),
          query: { hazardIds },
          count: recommendations.length,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Either scenario, industry, or hazards parameter is required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Template recommendations GET API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
