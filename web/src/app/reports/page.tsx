"use client";

import React from "react";
import { StatsGrid, StatsCard } from "@/components/dashboard/StatsCard";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";

export default function ReportsPage() {
  // Placeholder static data for MVP dashboard
  const totalTRAs = 124;
  const avgRisk = 72;
  const complianceRate = 88;
  const trending = 6; // +6%

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports — Analytics</h1>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Overview</h2>
          <StatsGrid columns={4}>
            <StatsCard
              title="Total TRAs"
              value={totalTRAs}
              subtitle="Total created"
              variant="info"
            />
            <StatsCard
              title="Average Risk"
              value={avgRisk}
              subtitle="Average risk score"
              variant="warning"
            />
            <StatsCard
              title="Compliance"
              value={`${complianceRate}%`}
              subtitle="Overall compliance"
              variant="success"
            />
            <StatsCard
              title="Risk Trend (30d)"
              value={`${trending}%`}
              subtitle="Change vs previous period"
              trend={{
                value: trending,
                label: "last 30 days",
                direction: trending >= 0 ? "up" : "down",
              }}
            />
          </StatsGrid>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">Risk Distribution</h2>
          <AnalyticsCharts />
        </div>
      </div>
    </div>
  );
}
