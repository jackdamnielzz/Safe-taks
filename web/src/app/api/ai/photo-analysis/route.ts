/**
 * AI Photo Analysis API
 * Analyzes safety photos for hazard detection using computer vision
 */

import { NextRequest, NextResponse } from "next/server";
import { photoAnalysisService } from "@/lib/ai/photo-analysis-service";

// POST /api/ai/photo-analysis
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No photo file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "File must be an image",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size must be less than 10MB",
        },
        { status: 400 }
      );
    }

    // Analyze photo for hazards
    const result = await photoAnalysisService.analyzePhoto(file);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        detectedHazards: result.detectedHazards.map((dh) => ({
          hazard: {
            id: dh.hazard.id,
            title: dh.hazard.title,
            description: dh.hazard.description,
            industry: dh.hazard.industry,
            categories: dh.hazard.categories,
            severity: dh.hazard.severity,
            keywords: dh.hazard.keywords,
          },
          confidence: dh.confidence,
          location: dh.location,
          reasoning: dh.reasoning,
          severity: dh.severity,
        })),
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        recommendations: result.recommendations,
        analysisMetadata: {
          imageSize: result.analysisMetadata.imageSize,
          processingTime: result.analysisMetadata.processingTime,
          detectionMethod: result.analysisMetadata.detectionMethod,
        },
      },
    });
  } catch (error) {
    console.error("Photo analysis API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Photo analysis failed",
      },
      { status: 500 }
    );
  }
}
