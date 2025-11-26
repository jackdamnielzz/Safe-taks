"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { VCAComplianceResult } from "@/lib/vca-compliance";

interface ComplianceBadgeProps {
  /** Compliance result from VCA checker */
  result: VCAComplianceResult;
  /** Show detailed score */
  showScore?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * VCA Compliance Badge Component
 *
 * Displays a visual badge indicating VCA compliance status with color coding
 * and optional score display.
 */
export function ComplianceBadge({
  result,
  showScore = true,
  size = "md",
  className = "",
}: ComplianceBadgeProps) {
  // Determine badge styling based on compliance level
  const getBadgeConfig = () => {
    switch (result.level) {
      case "FULLY_COMPLIANT":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          label: "VCA Volledig Conform",
          bgColor: "bg-green-100 dark:bg-green-900",
          textColor: "text-green-800 dark:text-green-100",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "COMPLIANT":
        return {
          variant: "default" as const,
          icon: Shield,
          label: "VCA Conform",
          bgColor: "bg-blue-100 dark:bg-blue-900",
          textColor: "text-blue-800 dark:text-blue-100",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      case "PARTIALLY_COMPLIANT":
        return {
          variant: "secondary" as const,
          icon: AlertTriangle,
          label: "Gedeeltelijk Conform",
          bgColor: "bg-yellow-100 dark:bg-yellow-900",
          textColor: "text-yellow-800 dark:text-yellow-100",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "NON_COMPLIANT":
        return {
          variant: "secondary" as const,
          icon: null, // NO ICON for Non-Compliant status - text only
          label: "Niet Conform",
          bgColor: "bg-red-100 dark:bg-red-900",
          textColor: "text-red-800 dark:text-red-100",
          iconColor: "text-red-600 dark:text-red-400",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  // Size-based styling
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <Badge
      variant={config.variant}
      className={`
        ${config.bgColor}
        ${config.textColor}
        ${sizeClasses[size]}
        inline-flex items-center gap-1.5
        font-medium
        border-0
        flex-shrink-0
        max-w-full
        ${className}
      `}
    >
      {Icon && <Icon size={iconSizes[size]} className={`${config.iconColor} flex-shrink-0`} />}
      <span className="truncate">{config.label}</span>
      {showScore && result.level !== "NON_COMPLIANT" && <span className="ml-1 font-bold flex-shrink-0">{result.score}%</span>}
    </Badge>
  );
}

/**
 * Compact Compliance Score Badge
 * Shows only the score with color coding
 */
export function ComplianceScoreBadge({
  score,
  size = "md",
  className = "",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 95) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (score >= 85) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge
      className={`
        ${getScoreColor()}
        ${sizeClasses[size]}
        font-bold
        border-0
        ${className}
      `}
    >
      {score}%
    </Badge>
  );
}

/**
 * Compliance Level Indicator
 * Simple colored dot with label
 */
export function ComplianceLevelIndicator({
  level,
  showLabel = true,
  size = "md",
}: {
  level: VCAComplianceResult["level"];
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const getConfig = () => {
    switch (level) {
      case "FULLY_COMPLIANT":
        return {
          color: "bg-green-500",
          label: "Volledig Conform",
        };
      case "COMPLIANT":
        return {
          color: "bg-blue-500",
          label: "Conform",
        };
      case "PARTIALLY_COMPLIANT":
        return {
          color: "bg-yellow-500",
          label: "Gedeeltelijk",
        };
      case "NON_COMPLIANT":
        return {
          color: "bg-red-500",
          label: "Niet Conform",
        };
    }
  };

  const config = getConfig();

  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${dotSizes[size]} ${config.color} rounded-full`} />
      {showLabel && (
        <span className={`${textSizes[size]} text-gray-700 dark:text-gray-300`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
