"use client";

import React from "react";

/**
 * Lightweight SVG-based charts for MVP analytics.
 * Exports a default component that renders:
 * - Donut showing risk distribution (static sample)
 * - Bar chart for compliance by project (static sample)
 * - Sparkline for trend (static sample)
 *
 * Replace with Recharts / Chart.js later if needed.
 */

export default function AnalyticsCharts() {
  // Static sample data for MVP
  const distribution = [
    { label: "trivial", value: 40, color: "#10B981" },
    { label: "acceptable", value: 25, color: "#84CC16" },
    { label: "possible", value: 15, color: "#F59E0B" },
    { label: "substantial", value: 10, color: "#F97316" },
    { label: "high", value: 7, color: "#EF4444" },
    { label: "very_high", value: 3, color: "#DC2626" },
  ];

  const complianceByProject = [
    { name: "Project A", value: 92 },
    { name: "Project B", value: 85 },
    { name: "Project C", value: 78 },
    { name: "Project D", value: 66 },
  ];

  const trend = [60, 62, 58, 64, 70, 72, 78];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Donut - risk distribution */}
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">Risk distribution</h3>
        <svg viewBox="0 0 32 32" className="w-full h-48">
          <circle r="10" cx="16" cy="16" fill="#f3f4f6" />
          {(() => {
            const total = distribution.reduce((s, d) => s + d.value, 0);
            let start = 0;
            return distribution.map((d, i) => {
              const portion = (d.value / total) * Math.PI * 2;
              const x1 = 16 + 10 * Math.cos(start);
              const y1 = 16 + 10 * Math.sin(start);
              start += portion;
              const x2 = 16 + 10 * Math.cos(start);
              const y2 = 16 + 10 * Math.sin(start);
              const large = portion > Math.PI ? 1 : 0;
              const path = `M16 16 L ${x1} ${y1} A 10 10 0 ${large} 1 ${x2} ${y2} Z`;
              return <path key={d.label} d={path} fill={d.color} opacity={0.95} />;
            });
          })()}
        </svg>
      </div>

      {/* Bar chart - compliance by project */}
      <div className="p-4 md:col-span-1">
        <h3 className="text-sm font-medium mb-2">Compliance by project</h3>
        <div className="space-y-3">
          {complianceByProject.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-sm mb-1">
                <div className="text-gray-700">{p.name}</div>
                <div className="text-gray-500">{p.value}%</div>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded">
                <div
                  className="h-3 rounded"
                  style={{
                    width: `${p.value}%`,
                    background: p.value >= 85 ? "#10B981" : "#F59E0B",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sparkline - trend */}
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">30d risk trend</h3>
        <svg viewBox="0 0 100 30" className="w-full h-24">
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            points={trend
              .map((v, i) => {
                const x = (i / (trend.length - 1)) * 100;
                const y = 30 - (v / 100) * 30;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>
      </div>
    </div>
  );
}
