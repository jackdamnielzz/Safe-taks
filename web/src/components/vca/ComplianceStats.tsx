/**
 * ComplianceStats Component
 *
 * Displays compliance statistics cards
 */

"use client";

import { useEffect, useState } from "react";
import type { ComplianceStatistics } from "@/types/compliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComplianceStatsProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function ComplianceStats({ dateFrom, dateTo }: ComplianceStatsProps) {
  const [stats, setStats] = useState<ComplianceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
        if (dateTo) params.append("dateTo", dateTo.toISOString());

        const response = await fetch(`/api/compliance/statistics?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch compliance statistics");
        }

        const data = await response.json();
        setStats(data.statistics);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-red-600 text-center">
            Fout bij laden: {error || "Geen data beschikbaar"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const compliancePercentage =
    stats.totalTRAs > 0 ? Math.round((stats.compliantTRAs / stats.totalTRAs) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total TRAs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Totaal TRA's</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalTRAs}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.compliantTRAs} compliant, {stats.nonCompliantTRAs} niet-compliant
          </p>
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Gemiddelde Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            {stats.trend !== "stable" && (
              <div className="flex items-center gap-1">
                {stats.trend === "improving" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm ${
                    stats.trend === "improving" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(stats.trendPercentage)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Trend: {getTrendLabel(stats.trend)}</p>
        </CardContent>
      </Card>

      {/* Compliance Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Compliance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{compliancePercentage}%</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${compliancePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* By Level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Per Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Volledig:</span>
              <span className="font-medium">{stats.byLevel.fullyCompliant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Compliant:</span>
              <span className="font-medium">{stats.byLevel.compliant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gedeeltelijk:</span>
              <span className="font-medium">{stats.byLevel.partiallyCompliant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Niet:</span>
              <span className="font-medium text-red-600">{stats.byLevel.nonCompliant}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Categorie Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <CategoryScore label="Risico Beoordeling" score={stats.byCategory.riskAssessment} />
            <CategoryScore label="Beheersmaatregelen" score={stats.byCategory.controlMeasures} />
            <CategoryScore label="Competenties" score={stats.byCategory.competencies} />
            <CategoryScore label="Documentatie" score={stats.byCategory.documentation} />
            <CategoryScore label="Goedkeuringen" score={stats.byCategory.approvals} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryScore({ label, score }: { label: string; score: number }) {
  const color = score >= 85 ? "text-green-600" : score >= 70 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{score}%</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            score >= 85 ? "bg-green-600" : score >= 70 ? "bg-yellow-600" : "bg-red-600"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case "improving":
      return "Verbeterend";
    case "declining":
      return "Dalend";
    case "stable":
      return "Stabiel";
    default:
      return trend;
  }
}
