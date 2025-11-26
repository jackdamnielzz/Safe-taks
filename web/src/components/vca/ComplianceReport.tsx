"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { VCAComplianceResult } from "@/lib/vca-compliance";
import { ComplianceBadge, ComplianceScoreBadge } from "./ComplianceBadge";

interface ComplianceReportProps {
  /** Compliance result from VCA checker */
  result: VCAComplianceResult;
  /** Display mode */
  variant?: "compact" | "detailed";
  /** Additional CSS classes */
  className?: string;
}

/**
 * VCA Compliance Report Component - Ultra-Simplified Version
 *
 * Focuses on essentials only:
 * - Overall score and status
 * - Critical issues that must be fixed
 * - Simple category overview
 */
export function ComplianceReport({
  result,
  variant = "detailed",
  className = "",
}: ComplianceReportProps) {
  // Map issues by severity from stable contract ("critical" | "major" | "minor")
  const criticalIssues = result.issues.filter((i) => i.severity === "critical");
  const highIssues = result.issues.filter((i) => i.severity === "major");

  if (variant === "compact") {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-black">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              VCA Compliance
            </CardTitle>
            <div className="w-full">
              <ComplianceBadge result={result} size="lg" />
            </div>
            <CardDescription className="text-gray-600">
              Gecontroleerd op {new Date(result.checkedAt).toLocaleString("nl-NL")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-400 flex-shrink-0">
                Totale Score
              </span>
              <div className="flex-shrink-0 min-w-0">
                <ComplianceScoreBadge score={result.score} size="md" />
              </div>
            </div>
            <Progress value={result.score} className="h-3" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {result.isCompliant
                ? "✅ Voldoet aan VCA-eisen (≥85%)"
                : "⚠️ Voldoet nog niet aan VCA-eisen (≥85% vereist)"}
            </p>
          </div>

          {/* Critical / major issues alert (from stable issues array) */}
          {(criticalIssues.length > 0 || highIssues.length > 0) && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-700 dark:text-red-200 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black break-words">
                  {criticalIssues.length + highIssues.length}{" "}
                  {criticalIssues.length + highIssues.length === 1
                    ? "belangrijk probleem moet worden opgelost"
                    : "belangrijke problemen moeten worden opgelost"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Status Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <CardTitle className="flex items-center gap-2 text-lg flex-shrink-0 text-black">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                VCA Compliance
              </CardTitle>
            </div>
            <div className="w-full">
              <ComplianceBadge result={result} size="lg" />
            </div>
            <CardDescription className="text-gray-600">
              Gecontroleerd op {new Date(result.checkedAt).toLocaleString("nl-NL")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-400 flex-shrink-0">
                Totale Score
              </span>
              <div className="flex-shrink-0 min-w-0">
                <ComplianceScoreBadge score={result.score} size="md" />
              </div>
            </div>
            <Progress value={result.score} className="h-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {result.isCompliant
                ? "✅ Voldoet aan VCA-eisen (≥85%)"
                : "⚠️ Voldoet nog niet aan VCA-eisen (≥85% vereist)"}
            </p>
          </div>

          {/* Category Scores - Simple List (defensive: fallback to overall score when no breakdown) */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-400 mb-4">
              Categorie Scores
            </h4>
            <div className="space-y-3">
              <CategoryScoreSimple
                title="Risicobeoordeling"
                score={(result as any).breakdown?.riskAssessment?.score ?? result.score}
              />
              <CategoryScoreSimple
                title="Beheersmaatregelen"
                score={(result as any).breakdown?.controlMeasures?.score ?? result.score}
              />
              <CategoryScoreSimple
                title="Competenties"
                score={(result as any).breakdown?.competencies?.score ?? result.score}
              />
              <CategoryScoreSimple
                title="Documentatie"
                score={(result as any).breakdown?.documentation?.score ?? result.score}
              />
              <CategoryScoreSimple
                title="Goedkeuringen"
                score={(result as any).breakdown?.approvals?.score ?? result.score}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical / major issues list (from stable issues contract) */}
      {(criticalIssues.length > 0 || highIssues.length > 0) && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-black">
              <XCircle className="h-5 w-5 text-red-800 dark:text-red-800 flex-shrink-0" />
              Problemen die opgelost moeten worden ({criticalIssues.length + highIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...criticalIssues, ...highIssues].map((issue, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start gap-3">
                  {issue.severity === "critical" ? (
                    <XCircle className="h-4 w-4 text-red-800 dark:text-red-800 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-200 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black break-words">
                      [{issue.category}] {issue.description}
                    </p>
                    {issue.suggestion && (
                      <p className="text-xs text-black mt-2 break-words">
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {result.issues.length === 0 && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-900 dark:text-green-100">
                Geen problemen gevonden. Deze TRA voldoet volledig aan de VCA-eisen!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Simple Category Score Component - Minimal version
 */
function CategoryScoreSimple({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  const getScoreColor = () => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-500 dark:text-red-300";
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-800 dark:text-gray-400">{title}</span>
      <span className={`text-sm ${getScoreColor()}`}>{score}%</span>
    </div>
  );
}
