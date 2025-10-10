"use client";

import React from "react";

interface TrendData {
  value: number;
  label: string;
  direction: "up" | "down";
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "info" | "success" | "warning" | "danger";
  trend?: TrendData;
  icon?: string;
}

interface StatsGridProps {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  subtitle,
  variant = "info",
  trend,
  icon,
}: StatsCardProps) {
  const variantColors = {
    info: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
  };

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trend.direction]}`}>
            {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {trend && <p className="mt-1 text-xs text-gray-400">{trend.label}</p>}
    </div>
  );
}

export function StatsGrid({ columns = 4, children }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={`grid ${gridCols[columns]} gap-4`}>{children}</div>;
}
