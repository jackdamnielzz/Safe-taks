"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { StatsGrid, StatsCard } from "@/components/dashboard/StatsCard";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";

export default function ReportsPage() {
  const t = useTranslations("reports");
  // Placeholder static data for MVP dashboard
  const totalTRAs = 124;
  const avgRisk = 72;
  const complianceRate = 88;
  const trending = 6; // +6%

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">{t("overview")}</h2>
          <StatsGrid columns={4}>
            <StatsCard
              title={t("totalTRAs")}
              value={totalTRAs}
              subtitle={t("totalCreated")}
              variant="info"
            />
            <StatsCard
              title={t("averageRisk")}
              value={avgRisk}
              subtitle={t("averageRiskScore")}
              variant="warning"
            />
            <StatsCard
              title={t("compliance")}
              value={`${complianceRate}%`}
              subtitle={t("overallCompliance")}
              variant="success"
            />
            <StatsCard
              title={t("riskTrend")}
              value={`${trending}%`}
              subtitle={t("changeVsPrevious")}
              trend={{
                value: trending,
                label: t("last30Days"),
                direction: trending >= 0 ? "up" : "down",
              }}
            />
          </StatsGrid>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">{t("riskDistribution")}</h2>
          <AnalyticsCharts />
        </div>
      </div>
    </div>
  );
}
