/**
 * Photo Analysis Service - Basic AI-powered hazard detection in images
 * Analyzes uploaded safety photos for potential hazards using rule-based detection
 */

import type { Hazard } from "../types/hazard";

export interface PhotoAnalysisResult {
  detectedHazards: DetectedHazard[];
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  recommendations: string[];
  analysisMetadata: {
    imageSize: { width: number; height: number };
    processingTime: number;
    detectionMethod: "rule-based" | "ai-enhanced";
  };
}

export interface DetectedHazard {
  hazard: Hazard;
  confidence: number;
  location: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
    width: number; // Percentage width (0-100)
    height: number; // Percentage height (0-100)
  };
  reasoning: string;
  severity: "low" | "medium" | "high";
}

/**
 * Photo Analysis Service for hazard detection
 */
export class PhotoAnalysisService {
  private hazardPatterns: Map<string, HazardPattern>;

  constructor() {
    this.hazardPatterns = this.initializeHazardPatterns();
  }

  /**
   * Analyze photo for potential hazards
   */
  async analyzePhoto(imageFile: File): Promise<PhotoAnalysisResult> {
    const startTime = Date.now();

    try {
      // Basic image validation
      if (!this.isValidImageFile(imageFile)) {
        throw new Error("Invalid image file format");
      }

      // Load and process image
      const imageData = await this.loadImage(imageFile);

      // Detect hazards using pattern matching
      const detectedHazards = await this.detectHazards(imageData);

      // Calculate overall risk level
      const riskLevel = this.calculateOverallRisk(detectedHazards);

      // Generate recommendations
      const recommendations = this.generateRecommendations(detectedHazards);

      const processingTime = Date.now() - startTime;

      return {
        detectedHazards,
        riskLevel,
        confidence: this.calculateOverallConfidence(detectedHazards),
        recommendations,
        analysisMetadata: {
          imageSize: { width: imageData.width, height: imageData.height },
          processingTime,
          detectionMethod: "rule-based",
        },
      };
    } catch (error) {
      console.error("Photo analysis failed:", error);
      throw new Error(
        `Photo analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Validate image file format and size
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Load image and convert to processable format
   */
  private async loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      img.onload = () => {
        // Resize large images for faster processing (max 800px)
        const maxDimension = 800;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Detect hazards in image using pattern matching
   */
  private async detectHazards(imageData: ImageData): Promise<DetectedHazard[]> {
    const detectedHazards: DetectedHazard[] = [];

    for (const [patternId, pattern] of this.hazardPatterns) {
      const detections = await this.detectPattern(imageData, pattern);
      detectedHazards.push(...detections);
    }

    // Remove overlapping detections (keep highest confidence)
    return this.removeOverlappingDetections(detectedHazards);
  }

  /**
   * Detect specific pattern in image
   */
  private async detectPattern(
    imageData: ImageData,
    pattern: HazardPattern
  ): Promise<DetectedHazard[]> {
    const detections: DetectedHazard[] = [];
    const { width, height } = imageData;

    // Simple pattern detection based on color and shape analysis
    for (let y = 0; y < height - pattern.minHeight; y += pattern.stepY) {
      for (let x = 0; x < width - pattern.minWidth; x += pattern.stepX) {
        const confidence = this.testPatternAtLocation(imageData, x, y, pattern);

        if (confidence >= pattern.minConfidence) {
          detections.push({
            hazard: pattern.hazard,
            confidence,
            location: {
              x: (x / width) * 100,
              y: (y / height) * 100,
              width: (pattern.minWidth / width) * 100,
              height: (pattern.minHeight / height) * 100,
            },
            reasoning: `Pattern match: ${pattern.description}`,
            severity: pattern.hazard.severity,
          });
        }
      }
    }

    return detections;
  }

  /**
   * Test if pattern matches at specific location
   */
  private testPatternAtLocation(
    imageData: ImageData,
    x: number,
    y: number,
    pattern: HazardPattern
  ): number {
    let totalScore = 0;
    let testCount = 0;

    // Sample multiple points within the pattern area
    for (
      let py = 0;
      py < pattern.minHeight;
      py += Math.max(1, Math.floor(pattern.minHeight / 10))
    ) {
      for (
        let px = 0;
        px < pattern.minWidth;
        px += Math.max(1, Math.floor(pattern.minWidth / 10))
      ) {
        const imageX = x + px;
        const imageY = y + py;

        if (imageX >= imageData.width || imageY >= imageData.height) continue;

        const pixelIndex = (imageY * imageData.width + imageX) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];

        const pixelScore = this.scorePixelColor(r, g, b, pattern);
        totalScore += pixelScore;
        testCount++;
      }
    }

    return testCount > 0 ? totalScore / testCount : 0;
  }

  /**
   * Score pixel color against pattern requirements
   */
  private scorePixelColor(r: number, g: number, b: number, pattern: HazardPattern): number {
    let score = 0;

    for (const colorRange of pattern.colorRanges) {
      if (this.isColorInRange(r, g, b, colorRange)) {
        score = Math.max(score, colorRange.weight);
      }
    }

    return score;
  }

  /**
   * Check if color falls within specified range
   */
  private isColorInRange(r: number, g: number, b: number, range: ColorRange): boolean {
    const hue = this.rgbToHue(r, g, b);
    const saturation = this.rgbToSaturation(r, g, b);
    const lightness = this.rgbToLightness(r, g, b);

    return (
      hue >= range.hueRange[0] &&
      hue <= range.hueRange[1] &&
      saturation >= range.saturationRange[0] &&
      saturation <= range.saturationRange[1] &&
      lightness >= range.lightnessRange[0] &&
      lightness <= range.lightnessRange[1]
    );
  }

  /**
   * Convert RGB to HSL for color analysis
   */
  private rgbToHue(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;

    if (max !== min) {
      switch (max) {
        case r:
          hue = (g - b) / (max - min) + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / (max - min) + 2;
          break;
        case b:
          hue = (r - g) / (max - min) + 4;
          break;
      }
      hue /= 6;
    }

    return hue * 360;
  }

  private rgbToSaturation(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;

    if (max === min) return 0;

    const delta = max - min;
    return lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  }

  private rgbToLightness(r: number, g: number, b: number): number {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (max + min) / 2;
  }

  /**
   * Remove overlapping detections
   */
  private removeOverlappingDetections(detections: DetectedHazard[]): DetectedHazard[] {
    if (detections.length <= 1) return detections;

    const filtered: DetectedHazard[] = [];

    for (const detection of detections) {
      let isOverlapping = false;

      for (const existing of filtered) {
        if (this.detectionsOverlap(detection, existing)) {
          // Keep the one with higher confidence
          if (detection.confidence <= existing.confidence) {
            isOverlapping = true;
            break;
          } else {
            // Replace existing with higher confidence detection
            filtered.splice(filtered.indexOf(existing), 1);
          }
        }
      }

      if (!isOverlapping) {
        filtered.push(detection);
      }
    }

    return filtered;
  }

  /**
   * Check if two detections overlap significantly
   */
  private detectionsOverlap(d1: DetectedHazard, d2: DetectedHazard): boolean {
    const overlapThreshold = 0.3; // 30% overlap threshold

    const d1Right = d1.location.x + d1.location.width;
    const d1Bottom = d1.location.y + d1.location.height;
    const d2Right = d2.location.x + d2.location.width;
    const d2Bottom = d2.location.y + d2.location.height;

    // Check for overlap
    const overlapX = Math.max(
      0,
      Math.min(d1Right, d2Right) - Math.max(d1.location.x, d2.location.x)
    );
    const overlapY = Math.max(
      0,
      Math.min(d1Bottom, d2Bottom) - Math.max(d1.location.y, d2.location.y)
    );
    const overlapArea = overlapX * overlapY;

    const d1Area = d1.location.width * d1.location.height;
    const d2Area = d2.location.width * d2.location.height;
    const minArea = Math.min(d1Area, d2Area);

    return overlapArea / minArea >= overlapThreshold;
  }

  /**
   * Calculate overall risk level from detected hazards
   */
  private calculateOverallRisk(detections: DetectedHazard[]): "low" | "medium" | "high" {
    if (detections.length === 0) return "low";

    const highRiskCount = detections.filter((d) => d.severity === "high").length;
    const mediumRiskCount = detections.filter((d) => d.severity === "medium").length;

    if (highRiskCount > 0) return "high";
    if (mediumRiskCount > 1) return "medium";
    if (mediumRiskCount === 1) return "medium";

    return "low";
  }

  /**
   * Calculate overall confidence from detections
   */
  private calculateOverallConfidence(detections: DetectedHazard[]): number {
    if (detections.length === 0) return 0;

    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
    return Math.round(avgConfidence);
  }

  /**
   * Generate safety recommendations based on detected hazards
   */
  private generateRecommendations(detections: DetectedHazard[]): string[] {
    const recommendations = new Set<string>();

    for (const detection of detections) {
      // Generate specific recommendations based on hazard type
      const primaryCategory = detection.hazard.categories[0];
      switch (primaryCategory) {
        case "electrical":
          recommendations.add("Zorg voor lockout/tagout procedures bij elektrisch werk");
          recommendations.add("Controleer of elektrisch gereedschap gekeurd is");
          recommendations.add("Gebruik geïsoleerd gereedschap bij elektrisch werk");
          break;

        case "physical":
          if (detection.hazard.title.toLowerCase().includes("fall")) {
            recommendations.add("Gebruik valbeveiliging bij werken op hoogte");
            recommendations.add("Plaats hekwerken rond randen en openingen");
            recommendations.add("Controleer ladders en steigers voor gebruik");
          }
          if (detection.hazard.title.toLowerCase().includes("slip")) {
            recommendations.add("Maak vloeren direct droog en schoon");
            recommendations.add("Plaats waarschuwingsborden bij natte vloeren");
            recommendations.add("Gebruik antislipmatten waar nodig");
          }
          break;

        case "chemical":
          recommendations.add("Zorg voor adequate ventilatie bij chemicaliën");
          recommendations.add("Gebruik persoonlijke beschermingsmiddelen (PBM)");
          recommendations.add("Zorg voor noodspoelvoorzieningen");
          recommendations.add("Controleer opslag van chemicaliën");
          break;

        case "mechanical":
          recommendations.add("Controleer machineafscherming voor gebruik");
          recommendations.add("Gebruik machineveiligheidsvoorzieningen");
          recommendations.add("Zorg voor regelmatige machine-inspecties");
          break;
      }
    }

    return Array.from(recommendations).slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Initialize hazard detection patterns
   */
  private initializeHazardPatterns(): Map<string, HazardPattern> {
    const patterns = new Map<string, HazardPattern>();

    // This is a simplified version - in a real implementation, you would have
    // more sophisticated computer vision patterns or use an actual AI service

    // Example pattern for detecting electrical hazards (yellow/black warning signs)
    patterns.set("electrical-warning", {
      hazard: {
        id: "ai-electrical-001",
        title: "Electrical hazard detected",
        description: "Potential electrical hazard identified in image",
        industry: "construction",
        categories: ["electrical"],
        severity: "high",
        keywords: ["electrical", "warning", "danger", "voltage"],
      },
      description: "Yellow and black electrical warning patterns",
      minWidth: 50,
      minHeight: 50,
      stepX: 25,
      stepY: 25,
      minConfidence: 60,
      colorRanges: [
        {
          hueRange: [40, 60], // Yellow range
          saturationRange: [0.3, 1.0],
          lightnessRange: [0.3, 0.8],
          weight: 0.8,
        },
        {
          hueRange: [0, 30], // Red range (alternative warning color)
          saturationRange: [0.5, 1.0],
          lightnessRange: [0.2, 0.7],
          weight: 0.7,
        },
      ],
    });

    return patterns;
  }
}

// Supporting interfaces
interface HazardPattern {
  hazard: Hazard;
  description: string;
  minWidth: number;
  minHeight: number;
  stepX: number;
  stepY: number;
  minConfidence: number;
  colorRanges: ColorRange[];
}

interface ColorRange {
  hueRange: [number, number]; // Hue range in degrees (0-360)
  saturationRange: [number, number]; // Saturation range (0-1)
  lightnessRange: [number, number]; // Lightness range (0-1)
  weight: number; // Weight of this color range (0-1)
}

// Export singleton instance
export const photoAnalysisService = new PhotoAnalysisService();
