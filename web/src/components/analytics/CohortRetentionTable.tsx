"use client";

/**
 * Cohort Retention Table Component
 * Displays user cohort retention metrics with visualization
 */

import { useState, useEffect } from "react";
import {
  UserCohort,
  CohortAnalysisResult,
  CohortPeriod,
  calculateCohortAnalysis,
  getRetentionColor,
  getRetentionStatus,
  calculateCohortHealthScore,
  getCohortTrend,
  RetentionPeriod,
} from "@/lib/analytics/cohort-analysis";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CohortRetentionTableProps {
  organizationId: string;
  period?: CohortPeriod;
  roleFilter?: string;
  startDate?: Date;
  endDate?: Date;
}

export function CohortRetentionTable({
  organizationId,
  period = "monthly",
  roleFilter,
  startDate,
  endDate,
}: CohortRetentionTableProps) {
  const [analysis, setAnalysis] = useState<CohortAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<CohortPeriod>(period);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(roleFilter);

  useEffect(() => {
    loadCohortAnalysis();
  }, [organizationId, selectedPeriod, selectedRole]);

  const loadCohortAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Default to last 6 months if no date range provided
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);

      const result = await calculateCohortAnalysis({
        organizationId,
        period: selectedPeriod,
        startDate: start,
        endDate: end,
        role: selectedRole,
        minCohortSize: 1,
      });

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cohort analysis");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <strong>Fout bij laden van cohort analyse:</strong> {error}
      </Alert>
    );
  }

  if (!analysis || analysis.cohorts.length === 0) {
    return <Alert variant="info">Geen cohort data beschikbaar voor deze periode.</Alert>;
  }

  // Prepare chart data for retention trends
  const retentionTrendData = analysis.cohorts
    .map((cohort) => ({
      name: cohort.cohortName,
      "Dag 1": cohort.day1Retention,
      "Dag 7": cohort.day7Retention,
      "Dag 30": cohort.day30Retention,
    }))
    .reverse(); // Reverse to show oldest to newest

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <label className="text-sm font-medium text-gray-700">Periode:</label>
          {(["daily", "weekly", "monthly"] as CohortPeriod[]).map((p) => (
            <Button
              key={p}
              variant={selectedPeriod === p ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSelectedPeriod(p)}
            >
              {p === "daily" && "Dagelijks"}
              {p === "weekly" && "Wekelijks"}
              {p === "monthly" && "Maandelijks"}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700">Rol:</label>
          <select
            value={selectedRole || "all"}
            onChange={(e) => setSelectedRole(e.target.value === "all" ? undefined : e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Alle rollen</option>
            <option value="admin">Admin</option>
            <option value="safety_manager">Safety Manager</option>
            <option value="supervisor">Supervisor</option>
            <option value="field_worker">Field Worker</option>
          </select>
        </div>
      </div>

      {/* Overall Retention Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Algemene Retentie</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: getRetentionColor(analysis.overallRetention.day1) }}
              >
                {analysis.overallRetention.day1.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Dag 1 Retentie</div>
              <div className="text-xs text-gray-500 mt-1">
                {getRetentionStatus(analysis.overallRetention.day1)}
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: getRetentionColor(analysis.overallRetention.day7) }}
              >
                {analysis.overallRetention.day7.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Dag 7 Retentie</div>
              <div className="text-xs text-gray-500 mt-1">
                {getRetentionStatus(analysis.overallRetention.day7)}
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: getRetentionColor(analysis.overallRetention.day30) }}
              >
                {analysis.overallRetention.day30.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Dag 30 Retentie</div>
              <div className="text-xs text-gray-500 mt-1">
                {getRetentionStatus(analysis.overallRetention.day30)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Retention Trend Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Retentie Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis
                domain={[0, 100]}
                label={{ value: "Retentie %", angle: -90, position: "insideLeft" }}
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="Dag 1" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="Dag 7" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="Dag 30" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cohort Retention Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cohort Retentie Tabel</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cohort
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Gebruikers
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Dag 1
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Dag 7
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Dag 30
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Gezondheid
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Actief
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.cohorts.map((cohort, idx) => {
                  const healthScore = calculateCohortHealthScore(cohort);
                  const previousCohort =
                    idx < analysis.cohorts.length - 1 ? analysis.cohorts[idx + 1] : undefined;

                  return (
                    <tr key={cohort.cohortId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{cohort.cohortName}</td>
                      <td className="py-3 px-4 text-sm text-center">{cohort.totalUsers}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <div
                          className="inline-block px-3 py-1 rounded-full text-white font-semibold"
                          style={{ backgroundColor: getRetentionColor(cohort.day1Retention) }}
                        >
                          {cohort.day1Retention.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <div
                          className="inline-block px-3 py-1 rounded-full text-white font-semibold"
                          style={{ backgroundColor: getRetentionColor(cohort.day7Retention) }}
                        >
                          {cohort.day7Retention.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <div
                          className="inline-block px-3 py-1 rounded-full text-white font-semibold"
                          style={{ backgroundColor: getRetentionColor(cohort.day30Retention) }}
                        >
                          {cohort.day30Retention.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <div
                          className="inline-block px-3 py-1 rounded-full text-white font-semibold"
                          style={{ backgroundColor: getRetentionColor(healthScore) }}
                        >
                          {healthScore.toFixed(0)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {cohort.activeUsers} / {cohort.totalUsers}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Role Breakdown (if available) */}
      {analysis.cohorts[0]?.byRole && analysis.cohorts[0].byRole.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Retentie per Rol (Laatste Cohort)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Totaal
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Dag 1
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Dag 7
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Dag 30
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.cohorts[0].byRole.map((role, idx) => {
                    const day1Rate =
                      role.totalUsers > 0 ? (role.day1Retained / role.totalUsers) * 100 : 0;
                    const day7Rate =
                      role.totalUsers > 0 ? (role.day7Retained / role.totalUsers) * 100 : 0;
                    const day30Rate =
                      role.totalUsers > 0 ? (role.day30Retained / role.totalUsers) * 100 : 0;

                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium capitalize">
                          {role.role.replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">{role.totalUsers}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span
                            style={{ color: getRetentionColor(day1Rate) }}
                            className="font-semibold"
                          >
                            {day1Rate.toFixed(1)}%
                          </span>
                          <div className="text-xs text-gray-500">
                            {role.day1Retained} / {role.totalUsers}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span
                            style={{ color: getRetentionColor(day7Rate) }}
                            className="font-semibold"
                          >
                            {day7Rate.toFixed(1)}%
                          </span>
                          <div className="text-xs text-gray-500">
                            {role.day7Retained} / {role.totalUsers}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span
                            style={{ color: getRetentionColor(day30Rate) }}
                            className="font-semibold"
                          >
                            {day30Rate.toFixed(1)}%
                          </span>
                          <div className="text-xs text-gray-500">
                            {role.day30Retained} / {role.totalUsers}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Inzichten</h3>
          <div className="space-y-3">
            {/* Best performing cohort */}
            {(() => {
              const bestCohort = analysis.cohorts.reduce((best, current) =>
                calculateCohortHealthScore(current) > calculateCohortHealthScore(best)
                  ? current
                  : best
              );
              return (
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <strong>Beste cohort:</strong> {bestCohort.cohortName} met{" "}
                    {calculateCohortHealthScore(bestCohort).toFixed(0)} gezondheid score
                  </div>
                </div>
              );
            })()}

            {/* Worst performing cohort */}
            {(() => {
              const worstCohort = analysis.cohorts.reduce((worst, current) =>
                calculateCohortHealthScore(current) < calculateCohortHealthScore(worst)
                  ? current
                  : worst
              );
              return (
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">!</span>
                  <div>
                    <strong>Zwakste cohort:</strong> {worstCohort.cohortName} met{" "}
                    {calculateCohortHealthScore(worstCohort).toFixed(0)} gezondheid score
                  </div>
                </div>
              );
            })()}

            {/* Overall retention trend */}
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">ℹ</span>
              <div>
                <strong>Algemene trend:</strong> Dag 30 retentie is{" "}
                {analysis.overallRetention.day30.toFixed(1)}% (
                {getRetentionStatus(analysis.overallRetention.day30)})
              </div>
            </div>

            {/* Total users analyzed */}
            <div className="flex items-start gap-2">
              <span className="text-gray-600 font-bold">👥</span>
              <div>
                <strong>Totaal geanalyseerd:</strong>{" "}
                {analysis.cohorts.reduce((sum, c) => sum + c.totalUsers, 0)} gebruikers in{" "}
                {analysis.cohorts.length} cohorten
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calculation timestamp */}
      <div className="text-center text-sm text-gray-500">
        Laatst berekend: {analysis.calculatedAt.toLocaleString("nl-NL")}
      </div>
    </div>
  );
}
