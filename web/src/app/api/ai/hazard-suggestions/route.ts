/**
 * AI Hazard Suggestions API
 * Provides intelligent hazard suggestions based on context analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hazardSuggestionEngine } from "@/lib/ai/hazard-suggestion-engine";
import type { HazardSuggestionContext } from "@/lib/ai/hazard-suggestion-engine";

// Input validation schema
const HazardSuggestionRequestSchema = z.object({
  text: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  taskType: z.string().optional(),
  previousHazards: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
});

// POST /api/ai/hazard-suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = HazardSuggestionRequestSchema.parse(body);

    // Convert to engine context format
    const context: HazardSuggestionContext = {
      text: validatedData.text,
      industry: validatedData.industry,
      location: validatedData.location,
      taskType: validatedData.taskType,
      previousHazards: validatedData.previousHazards,
      projectId: validatedData.projectId,
    };

    // Get suggestions from engine
    const result = await hazardSuggestionEngine.suggestHazards(context);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        suggestions: result.suggestions.map((s) => ({
          hazard: {
            id: s.hazard.id,
            title: s.hazard.title,
            description: s.hazard.description,
            industry: s.hazard.industry,
            categories: s.hazard.categories,
            severity: s.hazard.severity,
            keywords: s.hazard.keywords,
          },
          confidence: s.confidence,
          reasoning: s.reasoning,
          keywords: s.keywords,
        })),
        totalMatches: result.totalMatches,
        confidence: result.confidence,
        context: result.context,
      },
    });
  } catch (error) {
    console.error("Hazard suggestions API error:", error);

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

// GET /api/ai/hazard-suggestions - Get industry-specific or keyword-based hazards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const industry = searchParams.get("industry");
    const keywords = searchParams
      .get("keywords")
      ?.split(",")
      .map((k) => k.trim());
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (industry) {
      // Get industry-specific hazards
      const suggestions = await hazardSuggestionEngine.getIndustryHazards(industry, limit);

      return NextResponse.json({
        success: true,
        data: {
          suggestions: suggestions.map((s) => ({
            hazard: {
              id: s.hazard.id,
              title: s.hazard.title,
              description: s.hazard.description,
              industry: s.hazard.industry,
              categories: s.hazard.categories,
              severity: s.hazard.severity,
              keywords: s.hazard.keywords,
            },
            confidence: s.confidence,
            reasoning: s.reasoning,
            keywords: s.keywords,
          })),
          query: { industry },
          count: suggestions.length,
        },
      });
    }

    if (keywords && keywords.length > 0) {
      // Get keyword-based hazards
      const suggestions = await hazardSuggestionEngine.getKeywordHazards(keywords, limit);

      return NextResponse.json({
        success: true,
        data: {
          suggestions: suggestions.map((s) => ({
            hazard: {
              id: s.hazard.id,
              title: s.hazard.title,
              description: s.hazard.description,
              industry: s.hazard.industry,
              categories: s.hazard.categories,
              severity: s.hazard.severity,
              keywords: s.hazard.keywords,
            },
            confidence: s.confidence,
            reasoning: s.reasoning,
            keywords: s.keywords,
          })),
          query: { keywords },
          count: suggestions.length,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Either industry or keywords parameter is required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Hazard suggestions GET API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
