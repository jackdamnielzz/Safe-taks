"use client";

import React, { useMemo } from "react";
import { TRA } from "@/lib/types/tra";
import { calculateVCACompliance, VCAComplianceResult } from "@/lib/vca-compliance";
import { ComplianceBadge, ComplianceLevelIndicator } from "./ComplianceBadge";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface ComplianceCheckerProps {
  /** Current TRA data (can be partial/draft) */
  tra: Partial<TRA>;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * VCA Compliance Checker Component
 *
 * Provides real-time VCA compliance checking as users build their TRAs.
 * Shows compliance score, issues, and recommendations.
 *
 * Used in:
 * - TRA Wizard sidebar (compact mode)
 * - TRA detail page (full mode)
 * - TRA list (compact mode)
 */
export function ComplianceChecker({
  tra,
  showDetails = true,
  compact = false,
  className = "",
}: ComplianceCheckerProps) {
  // Calculate compliance (memoized to avoid recalculation on every render)
  const complianceResult = useMemo(() => {
    // Normalize partial TRA to a safe shape for compliance check
    const taskSteps = Array.isArray(tra.taskSteps) ? tra.taskSteps : [];
    const normalizedSteps = taskSteps.map((step: any) => ({
      ...step,
      hazards: Array.isArray(step?.hazards) ? step.hazards : [],
    }));

    const fullTra: TRA = {
      id: tra.id || "draft",
      title: tra.title || "",
      description: tra.description,
      organizationId: tra.organizationId || "",
      projectId: tra.projectId || "",
      taskSteps: normalizedSteps as any,
      overallRiskScore: 0,
      overallRiskLevel: "trivial",
      teamMembers: Array.isArray(tra.teamMembers) ? tra.teamMembers : [],
      requiredCompetencies: Array.isArray(tra.requiredCompetencies)
        ? tra.requiredCompetencies
        : [],
      status: (tra.status as any) || "draft",
      version: tra.version || 1,
      complianceFramework: (tra.complianceFramework as any) || "vca",
      createdBy: tra.createdBy || "",
      createdAt: tra.createdAt || new Date(),
    };

    return calculateVCACompliance(fullTra as any);
  }, [tra]);

  if (compact) {
    return <CompactView result={complianceResult} className={className} />;
  }

  return <DetailedView result={complianceResult} showDetails={showDetails} className={className} />;
}

/**
 * Compact view for sidebar/list
 */
function CompactView({ result, className }: { result: VCAComplianceResult; className: string }) {
  const criticalIssues = result.issues.filter((i) => i.severity === "critical");
  const highIssues = result.issues.filter((i) => i.severity === "major");

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">VCA Compliance</h3>
        <ComplianceBadge result={result} size="sm" showScore />
      </div>

      {/* Quick stats */}
      <div className="space-y-2">
        {criticalIssues.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <XCircle size={14} />
            <span>{criticalIssues.length} kritieke problemen</span>
          </div>
        )}
        {highIssues.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <AlertTriangle size={14} />
            <span>{highIssues.length} belangrijke problemen</span>
          </div>
        )}
        {result.isCompliant && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle size={14} />
            <span>Voldoet aan VCA-eisen</span>
          </div>
        )}
      </div>

      {/* Simple category-like visualization using only stable overall score */}
      <div className="mt-3 space-y-1">
        <CategoryBar label="Algemene VCA-score" score={result.score} compact />
      </div>
    </div>
  );
}

/**
 * Detailed view for full page
 */
function DetailedView({
  result,
  showDetails,
  className,
}: {
  result: VCAComplianceResult;
  showDetails: boolean;
  className: string;
}) {
  const criticalIssues = result.issues.filter((i) => i.severity === "critical");
  const highIssues = result.issues.filter((i) => i.severity === "major");
  const mediumIssues = result.issues.filter((i) => i.severity === "minor");
  const lowIssues: typeof result.issues = [];

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">VCA Compliance Check</h2>
          <ComplianceBadge result={result} size="lg" showScore />
        </div>

        {/* Overall status */}
        <div className="flex items-center gap-2">
          <ComplianceLevelIndicator level={result.level} size="md" />
          {result.isCompliant ? (
            <p className="text-sm text-green-700">
              Deze TRA voldoet aan de VCA-eisen en kan worden ingediend voor goedkeuring.
            </p>
          ) : (
            <p className="text-sm text-amber-700">
              Deze TRA voldoet nog niet volledig aan de VCA-eisen. Los de onderstaande problemen op.
            </p>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Compliance per Categorie</h3>
        <div className="space-y-4">
          {/* For this stabilized slice, show a simple repeated view using only the stable score */}
          <CategoryBreakdown
            title="Algemene VCA-score"
            description="Samenvattende score op basis van kernvereisten"
            score={result.score}
          />
        </div>
      </div>

      {/* Issues */}
      {showDetails && result.issues.length > 0 && (
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Gevonden Problemen ({result.issues.length})
          </h3>
          <div className="space-y-3">
            {criticalIssues.length > 0 && (
              <IssueSection title="Kritiek" issues={criticalIssues} color="red" />
            )}
            {highIssues.length > 0 && (
              <IssueSection title="Hoog" issues={highIssues} color="orange" />
            )}
            {mediumIssues.length > 0 && (
              <IssueSection title="Gemiddeld" issues={mediumIssues} color="yellow" />
            )}
            {lowIssues.length > 0 && <IssueSection title="Laag" issues={lowIssues} color="blue" />}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showDetails && result.recommendations.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Aanbevelingen</h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500">
        Laatste check: {new Date(result.checkedAt).toLocaleString("nl-NL")}
      </div>
    </div>
  );
}

/**
 * Category progress bar
 */
function CategoryBar({
  label,
  score,
  compact = false,
}: {
  label: string;
  score: number;
  compact?: boolean;
}) {
  const getColor = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`${compact ? "text-xs" : "text-sm"} text-slate-600`}>{label}</span>
        <span className={`${compact ? "text-xs" : "text-sm"} font-medium text-slate-700`}>
          {score}%
        </span>
      </div>
      <div className={`${compact ? "h-1.5" : "h-2"} bg-slate-200 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Category breakdown card
 */
function CategoryBreakdown({
  title,
  description,
  score,
}: {
  title: string;
  description: string;
  score: number;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">{score}%</div>
        </div>
      </div>
      <CategoryBar label="" score={score} />
    </div>
  );
}

/**
 * Issue section grouped by severity
 */
function IssueSection({
  title,
  issues,
  color,
}: {
  title: string;
  issues: VCAComplianceResult["issues"];
  color: "red" | "orange" | "yellow" | "blue";
}) {
  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "text-orange-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-lg p-4`}>
      <h4 className={`font-medium ${classes.text} mb-3`}>
        {title} ({issues.length})
      </h4>
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className={`${classes.icon} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm ${classes.text} font-medium`}>
                  [{issue.category}] {issue.description}
                </p>
                {issue.suggestion && (
                  <p className="text-xs text-slate-600 mt-1">💡 {issue.suggestion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
