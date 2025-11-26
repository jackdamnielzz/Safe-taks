"use client";

import React from "react";

interface ProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Additional CSS classes */
  className?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color variant */
  variant?: "default" | "success" | "warning" | "danger";
}

/**
 * Progress Bar Component
 *
 * Displays a horizontal progress bar with optional label
 */
export function Progress({
  value,
  className = "",
  showLabel = false,
  variant = "default",
}: ProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const variantColors = {
    default: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${variantColors[variant]} transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
