/**
 * AI Assistant Component - Integrated AI-powered safety assistance
 * Provides hazard suggestions, photo analysis, and template recommendations
 */

"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Lightbulb,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import type {
  HazardSuggestionResult,
  HazardSuggestionContext,
} from "@/lib/ai/hazard-suggestion-engine";
import type { PhotoAnalysisResult } from "@/lib/ai/photo-analysis-service";
import type {
  TemplateRecommendationResult,
  TemplateRecommendationContext,
} from "@/lib/ai/template-recommendation-engine";

interface AIAssistantProps {
  projectId?: string;
  organizationId?: string;
  industry?: string;
  onHazardSelect?: (hazardId: string) => void;
  onTemplateSelect?: (templateId: string) => void;
  className?: string;
}

export function AIAssistant({
  projectId,
  organizationId,
  industry,
  onHazardSelect,
  onTemplateSelect,
  className,
}: AIAssistantProps) {
  // Hazard suggestion state
  const [hazardContext, setHazardContext] = useState<Partial<HazardSuggestionContext>>({
    industry,
    projectId,
  });
  const [hazardSuggestions, setHazardSuggestions] = useState<HazardSuggestionResult | null>(null);
  const [hazardLoading, setHazardLoading] = useState(false);

  // Photo analysis state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisResult | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Template recommendation state
  const [templateContext, setTemplateContext] = useState<Partial<TemplateRecommendationContext>>({
    organizationId,
    industry,
  });
  const [templateRecommendations, setTemplateRecommendations] =
    useState<TemplateRecommendationResult | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  /**
   * Get hazard suggestions based on context
   */
  const getHazardSuggestions = useCallback(async () => {
    if (!hazardContext.text && !hazardContext.industry && !hazardContext.taskType) {
      return;
    }

    setHazardLoading(true);
    try {
      const response = await fetch("/api/ai/hazard-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hazardContext),
      });

      if (response.ok) {
        const result = await response.json();
        setHazardSuggestions(result.data);
      }
    } catch (error) {
      console.error("Failed to get hazard suggestions:", error);
    } finally {
      setHazardLoading(false);
    }
  }, [hazardContext]);

  /**
   * Analyze photo for hazards
   */
  const analyzePhoto = useCallback(async () => {
    if (!selectedPhoto) return;

    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedPhoto);

      const response = await fetch("/api/ai/photo-analysis", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setPhotoAnalysis(result.data);
      }
    } catch (error) {
      console.error("Failed to analyze photo:", error);
    } finally {
      setPhotoLoading(false);
    }
  }, [selectedPhoto]);

  /**
   * Get template recommendations
   */
  const getTemplateRecommendations = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const response = await fetch("/api/ai/template-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateContext),
      });

      if (response.ok) {
        const result = await response.json();
        setTemplateRecommendations(result.data);
      }
    } catch (error) {
      console.error("Failed to get template recommendations:", error);
    } finally {
      setTemplateLoading(false);
    }
  }, [templateContext]);

  /**
   * Handle photo file selection
   */
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoAnalysis(null); // Reset previous analysis
    }
  };

  /**
   * Get confidence color for display
   */
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "text-green-600";
    if (confidence >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  /**
   * Get risk level color for display
   */
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          AI Safety Assistant
        </CardTitle>
        <CardDescription>
          Get intelligent suggestions for hazards, analyze photos, and find the right templates
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="hazards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hazards" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Hazard Suggestions
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Analysis
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Hazard Suggestions Tab */}
          <TabsContent value="hazards" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={hazardContext.industry || ""}
                    onChange={(e) =>
                      setHazardContext((prev) => ({ ...prev, industry: e.target.value }))
                    }
                    placeholder="e.g., construction, manufacturing"
                  />
                </div>
                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Input
                    id="taskType"
                    value={hazardContext.taskType || ""}
                    onChange={(e) =>
                      setHazardContext((prev) => ({ ...prev, taskType: e.target.value }))
                    }
                    placeholder="e.g., electrical work, working at height"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hazardText">Describe the work or situation</Label>
                <Textarea
                  id="hazardText"
                  value={hazardContext.text || ""}
                  onChange={(e) => setHazardContext((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Describe what you're planning to do, the environment, equipment, etc."
                  rows={3}
                />
              </div>

              <Button onClick={getHazardSuggestions} disabled={hazardLoading} className="w-full">
                {hazardLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing for hazards...
                  </>
                ) : (
                  "Get Hazard Suggestions"
                )}
              </Button>
            </div>

            {hazardSuggestions && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Suggested Hazards ({hazardSuggestions.suggestions.length})
                  </h3>
                  <Badge
                    variant={
                      hazardSuggestions.confidence === "high"
                        ? "default"
                        : hazardSuggestions.confidence === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {hazardSuggestions.confidence} confidence
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {hazardSuggestions.suggestions.map((suggestion, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{suggestion.hazard.title}</h4>
                            <Badge
                              variant="outline"
                              className={getRiskLevelColor(suggestion.hazard.severity)}
                            >
                              {suggestion.hazard.severity}
                            </Badge>
                            <span
                              className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}
                            >
                              {suggestion.confidence}% match
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.hazard.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Industry: {suggestion.hazard.industry}</span>
                            <span>Categories: {suggestion.hazard.categories.join(", ")}</span>
                          </div>

                          <p className="text-xs text-blue-600 mt-2">
                            <strong>Why:</strong> {suggestion.reasoning}
                          </p>

                          {suggestion.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {suggestion.keywords.map((keyword, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onHazardSelect?.(suggestion.hazard.id)}
                          className="ml-4"
                        >
                          Add to TRA
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Photo Analysis Tab */}
          <TabsContent value="photo" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="photoUpload">Upload Safety Photo</Label>
                <Input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="mt-1"
                />
              </div>

              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <Button
                onClick={analyzePhoto}
                disabled={!selectedPhoto || photoLoading}
                className="w-full"
              >
                {photoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing photo...
                  </>
                ) : (
                  "Analyze for Hazards"
                )}
              </Button>
            </div>

            {photoAnalysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Photo Analysis Results</h3>
                  <Badge className={getRiskLevelColor(photoAnalysis.riskLevel)}>
                    {photoAnalysis.riskLevel} risk
                  </Badge>
                </div>

                {photoAnalysis.detectedHazards.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Found {photoAnalysis.detectedHazards.length} potential hazard(s) with{" "}
                      {photoAnalysis.confidence}% confidence
                    </p>

                    {photoAnalysis.detectedHazards.map((detection, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{detection.hazard.title}</h4>
                              <Badge
                                variant="outline"
                                className={getRiskLevelColor(detection.severity)}
                              >
                                {detection.severity}
                              </Badge>
                              <span
                                className={`text-sm font-medium ${getConfidenceColor(detection.confidence)}`}
                              >
                                {detection.confidence}% confidence
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              Location in image: {detection.location.x}% from left,{" "}
                              {detection.location.y}% from top
                            </p>

                            <p className="text-xs text-blue-600">{detection.reasoning}</p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onHazardSelect?.(detection.hazard.id)}
                          >
                            Add Hazard
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hazards detected in this photo. The area appears safe!
                    </AlertDescription>
                  </Alert>
                )}

                {photoAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Safety Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {photoAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Analysis took {photoAnalysis.analysisMetadata.processingTime}ms using{" "}
                  {photoAnalysis.analysisMetadata.detectionMethod} detection
                </div>
              </div>
            )}
          </TabsContent>

          {/* Template Recommendations Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={templateContext.projectDescription || ""}
                  onChange={(e) =>
                    setTemplateContext((prev) => ({ ...prev, projectDescription: e.target.value }))
                  }
                  placeholder="Describe the project or work you're planning..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateIndustry">Industry</Label>
                  <Input
                    id="templateIndustry"
                    value={templateContext.industry || ""}
                    onChange={(e) =>
                      setTemplateContext((prev) => ({ ...prev, industry: e.target.value }))
                    }
                    placeholder="e.g., construction"
                  />
                </div>
                <div>
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={templateContext.teamSize || ""}
                    onChange={(e) =>
                      setTemplateContext((prev) => ({
                        ...prev,
                        teamSize: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="Number of people"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taskTypes">Task Types (comma-separated)</Label>
                <Input
                  id="taskTypes"
                  value={templateContext.taskTypes?.join(", ") || ""}
                  onChange={(e) =>
                    setTemplateContext((prev) => ({
                      ...prev,
                      taskTypes: e.target.value
                        ? e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        : undefined,
                    }))
                  }
                  placeholder="e.g., electrical work, working at height, chemical handling"
                />
              </div>

              <Button
                onClick={getTemplateRecommendations}
                disabled={templateLoading}
                className="w-full"
              >
                {templateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding templates...
                  </>
                ) : (
                  "Get Template Recommendations"
                )}
              </Button>
            </div>

            {templateRecommendations && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Recommended Templates ({templateRecommendations.recommendations.length})
                  </h3>
                  <Badge
                    variant={
                      templateRecommendations.confidence === "high"
                        ? "default"
                        : templateRecommendations.confidence === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {templateRecommendations.confidence} confidence
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templateRecommendations.recommendations.map((rec, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.template.name}</h4>
                            <Badge
                              variant={
                                rec.complexity === "low"
                                  ? "secondary"
                                  : rec.complexity === "medium"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {rec.complexity} complexity
                            </Badge>
                            {rec.template.vcaCertified && (
                              <Badge className="bg-green-100 text-green-800">VCA Certified</Badge>
                            )}
                            <span
                              className={`text-sm font-medium ${getConfidenceColor(rec.score)}`}
                            >
                              {rec.score}% match
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{rec.template.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span>Industry: {rec.template.industryCategory}</span>
                            <span>Steps: {rec.template.taskStepCount}</span>
                            <span>Hazards: {rec.template.hazardCount}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />~{rec.estimatedDuration}min
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span>Hazard Coverage:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${rec.coverage.hazardCoverage}%` }}
                                />
                              </div>
                              <span>{Math.round(rec.coverage.hazardCoverage)}%</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {rec.reasoning.slice(0, 2).map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => onTemplateSelect?.(rec.template.id)}
                          className="ml-4"
                        >
                          Use Template
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
