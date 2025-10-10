"use client";

/**
 * Admin Analytics Dashboard
 * Displays all KPIs with interactive charts using Recharts
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  KPIDashboard,
  MetricPeriod,
  getPeriodDateRange,
  formatMetricValue,
  getMetricColor,
  getTrendIcon,
} from "@/lib/types/metrics";
import { calculateKPIDashboard } from "@/lib/analytics/kpi-calculator";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trackDashboardViewed } from "@/lib/analytics/analytics-service";

export default function AnalyticsDashboardPage() {
  const { user, userProfile } = useAuth();
  const [dashboard, setDashboard] = useState<KPIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricPeriod>("month");
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>(
    getPeriodDateRange("month")
  );

  // Check if user is admin or safety manager
  const canViewAnalytics = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  useEffect(() => {
    if (!canViewAnalytics) return;

    // Track dashboard view
    trackDashboardViewed({ dashboardType: "executive" });

    loadDashboard();
  }, [period, canViewAnalytics]);

  const loadDashboard = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await calculateKPIDashboard({
        organizationId: userProfile.organizationId,
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includePreviousPeriod: true,
      });

      if (result.success && result.metric) {
        setDashboard(result.metric);
      } else {
        setError(result.error || "Failed to calculate KPIs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: MetricPeriod) => {
    setPeriod(newPeriod);
    setDateRange(getPeriodDateRange(newPeriod));
  };

  const handleExport = () => {
    if (!dashboard) return;

    const exportData = {
      organizationId: dashboard.organizationId,
      period: dashboard.period,
      startDate: dashboard.startDate,
      endDate: dashboard.endDate,
      exportedAt: new Date().toISOString(),
      metrics: {
        trasCreated: dashboard.trasCreated,
        lmrasExecuted: dashboard.lmrasExecuted,
        averageRiskScore: dashboard.averageRiskScore,
        complianceRate: dashboard.complianceRate,
        timeToApproval: dashboard.timeToApproval,
        userActivationRate: dashboard.userActivationRate,
        overallHealthScore: dashboard.overallHealthScore,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canViewAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Je hebt geen toegang tot deze pagina. Alleen admins en safety managers kunnen analytics
          bekijken.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          <strong>Fout bij laden van analytics:</strong> {error}
        </Alert>
        <Button onClick={loadDashboard} className="mt-4">
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="info">Geen analytics data beschikbaar voor deze periode.</Alert>
      </div>
    );
  }

  // Prepare chart data
  const riskDistributionData = dashboard.averageRiskScore.riskDistribution
    ? [
        {
          name: "Triviaal",
          value: dashboard.averageRiskScore.riskDistribution.trivial,
          color: "#10B981",
        },
        {
          name: "Acceptabel",
          value: dashboard.averageRiskScore.riskDistribution.acceptable,
          color: "#84CC16",
        },
        {
          name: "Mogelijk",
          value: dashboard.averageRiskScore.riskDistribution.possible,
          color: "#F59E0B",
        },
        {
          name: "Aanzienlijk",
          value: dashboard.averageRiskScore.riskDistribution.substantial,
          color: "#F97316",
        },
        { name: "Hoog", value: dashboard.averageRiskScore.riskDistribution.high, color: "#EF4444" },
        {
          name: "Zeer Hoog",
          value: dashboard.averageRiskScore.riskDistribution.very_high,
          color: "#DC2626",
        },
      ]
    : [];

  const lmraAssessmentData = dashboard.lmrasExecuted.byAssessment
    ? [
        {
          name: "Veilig",
          value: dashboard.lmrasExecuted.byAssessment.safe_to_proceed,
          color: "#10B981",
        },
        {
          name: "Voorzichtig",
          value: dashboard.lmrasExecuted.byAssessment.proceed_with_caution,
          color: "#F59E0B",
        },
        {
          name: "Stop Werk",
          value: dashboard.lmrasExecuted.byAssessment.stop_work,
          color: "#EF4444",
        },
      ]
    : [];

  const traStatusData = dashboard.trasCreated.byStatus
    ? [
        { name: "Concept", value: dashboard.trasCreated.byStatus.draft },
        { name: "Ingediend", value: dashboard.trasCreated.byStatus.submitted },
        { name: "In Review", value: dashboard.trasCreated.byStatus.in_review },
        { name: "Goedgekeurd", value: dashboard.trasCreated.byStatus.approved },
        { name: "Actief", value: dashboard.trasCreated.byStatus.active },
        { name: "Afgewezen", value: dashboard.trasCreated.byStatus.rejected },
      ]
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Overzicht van alle belangrijke prestatie-indicatoren (KPIs)</p>
      </div>

      {/* Period Selector and Export */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {(["day", "week", "month", "quarter", "year"] as MetricPeriod[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "primary" : "secondary"}
              size="sm"
              onClick={() => handlePeriodChange(p)}
            >
              {p === "day" && "Dag"}
              {p === "week" && "Week"}
              {p === "month" && "Maand"}
              {p === "quarter" && "Kwartaal"}
              {p === "year" && "Jaar"}
            </Button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          📊 Exporteer Data
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className="mb-6 bg-gradient-to-r from-orange-50 to-green-50">
        <div className="text-center py-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Algemene Gezondheid Score</h2>
          <div
            className="text-5xl font-bold"
            style={{
              color: getMetricColor(
                dashboard.overallHealthScore && dashboard.overallHealthScore >= 80
                  ? "excellent"
                  : dashboard.overallHealthScore && dashboard.overallHealthScore >= 70
                    ? "good"
                    : dashboard.overallHealthScore && dashboard.overallHealthScore >= 60
                      ? "warning"
                      : "critical"
              ),
            }}
          >
            {dashboard.overallHealthScore?.toFixed(0)}%
          </div>
          <p className="text-gray-600 mt-2">
            Gebaseerd op {period === "month" ? "deze maand" : `deze ${period}`}
          </p>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* TRAs Created */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">TRA's Aangemaakt</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{ color: getMetricColor(dashboard.trasCreated.status!) }}
              >
                {dashboard.trasCreated.value}
              </div>
              {dashboard.trasCreated.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.trasCreated.trend === "up"
                      ? "text-green-600"
                      : dashboard.trasCreated.trend === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.trasCreated.trend)}{" "}
                  {dashboard.trasCreated.changePercentage?.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Doel: {dashboard.trasCreated.target} / {period}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Gemiddeld {dashboard.trasCreated.averagePerDay?.toFixed(1)} per dag
            </div>
          </div>
        </Card>

        {/* LMRAs Executed */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">LMRA's Uitgevoerd</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{ color: getMetricColor(dashboard.lmrasExecuted.status!) }}
              >
                {dashboard.lmrasExecuted.value}
              </div>
              {dashboard.lmrasExecuted.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.lmrasExecuted.trend === "up"
                      ? "text-green-600"
                      : dashboard.lmrasExecuted.trend === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.lmrasExecuted.trend)}{" "}
                  {dashboard.lmrasExecuted.changePercentage?.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Doel: {dashboard.lmrasExecuted.target} / {period}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Stop werk: {dashboard.lmrasExecuted.stopWorkRate?.toFixed(1)}%
            </div>
          </div>
        </Card>

        {/* Average Risk Score */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gemiddelde Risicoscore</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{
                  color: getMetricColor(
                    dashboard.averageRiskScore.value <= 200
                      ? "excellent"
                      : dashboard.averageRiskScore.value <= 400
                        ? "good"
                        : dashboard.averageRiskScore.value <= 1000
                          ? "warning"
                          : "critical"
                  ),
                }}
              >
                {dashboard.averageRiskScore.value.toFixed(0)}
              </div>
              {dashboard.averageRiskScore.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.averageRiskScore.trend === "down"
                      ? "text-green-600"
                      : dashboard.averageRiskScore.trend === "up"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.averageRiskScore.trend)}{" "}
                  {Math.abs(dashboard.averageRiskScore.changePercentage || 0).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Mediaan: {dashboard.averageRiskScore.medianRiskScore?.toFixed(0)}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {dashboard.averageRiskScore.totalHazardsAnalyzed} gevaren geanalyseerd
            </div>
          </div>
        </Card>

        {/* Compliance Rate */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Compliance Rate</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{ color: getMetricColor(dashboard.complianceRate.status!) }}
              >
                {dashboard.complianceRate.value.toFixed(1)}%
              </div>
              {dashboard.complianceRate.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.complianceRate.trend === "up"
                      ? "text-green-600"
                      : dashboard.complianceRate.trend === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.complianceRate.trend)}{" "}
                  {dashboard.complianceRate.changePercentage?.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Doel: {dashboard.complianceRate.target}%
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {dashboard.complianceRate.compliantCount} / {dashboard.complianceRate.totalTRAs}{" "}
              compliant
            </div>
          </div>
        </Card>

        {/* Time to Approval */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Tijd tot Goedkeuring</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{ color: getMetricColor(dashboard.timeToApproval.status!) }}
              >
                {dashboard.timeToApproval.averageHours.toFixed(1)}h
              </div>
              {dashboard.timeToApproval.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.timeToApproval.trend === "down"
                      ? "text-green-600"
                      : dashboard.timeToApproval.trend === "up"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.timeToApproval.trend)}{" "}
                  {Math.abs(dashboard.timeToApproval.changePercentage || 0).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Doel: ≤{dashboard.timeToApproval.target}h
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {dashboard.timeToApproval.overdueApprovals} te laat
            </div>
          </div>
        </Card>

        {/* User Activation Rate */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gebruiker Activatie</h3>
            <div className="flex items-baseline justify-between">
              <div
                className="text-3xl font-bold"
                style={{ color: getMetricColor(dashboard.userActivationRate.status!) }}
              >
                {dashboard.userActivationRate.activationRate.toFixed(1)}%
              </div>
              {dashboard.userActivationRate.trend && (
                <div
                  className={`text-sm font-medium ${
                    dashboard.userActivationRate.trend === "up"
                      ? "text-green-600"
                      : dashboard.userActivationRate.trend === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getTrendIcon(dashboard.userActivationRate.trend)}{" "}
                  {dashboard.userActivationRate.changePercentage?.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Doel: {dashboard.userActivationRate.target}%
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {dashboard.userActivationRate.activatedUsers} /{" "}
              {dashboard.userActivationRate.totalUsers} actief
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Distribution Donut Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risico Verdeling</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* LMRA Assessment Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">LMRA Beoordelingen</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={lmraAssessmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                >
                  {lmraAssessmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* TRA Status Bar Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">TRA Status Verdeling</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={traStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Projects by TRA Count */}
        {dashboard.trasCreated.byProject && dashboard.trasCreated.byProject.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Projecten (TRA's)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.trasCreated.byProject.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Detailed Metrics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators */}
        {dashboard.trasCreated.byCreator && dashboard.trasCreated.byCreator.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top TRA Makers</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                        Naam
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Aantal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.trasCreated.byCreator.slice(0, 5).map((creator, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4 text-sm">{creator.displayName}</td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">
                          {creator.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Top LMRA Performers */}
        {dashboard.lmrasExecuted.byPerformer && dashboard.lmrasExecuted.byPerformer.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top LMRA Uitvoerders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                        Naam
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Aantal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.lmrasExecuted.byPerformer.slice(0, 5).map((performer, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4 text-sm">{performer.displayName}</td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">
                          {performer.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Non-Compliance Reasons */}
        {dashboard.complianceRate.nonComplianceReasons &&
          dashboard.complianceRate.nonComplianceReasons.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Non-Compliance Redenen</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                          Reden
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                          Aantal
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.complianceRate.nonComplianceReasons
                        .slice(0, 5)
                        .map((reason, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 px-4 text-sm">{reason.reason}</td>
                            <td className="py-2 px-4 text-sm text-right">{reason.count}</td>
                            <td className="py-2 px-4 text-sm text-right">
                              {reason.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

        {/* User Activation by Role */}
        {dashboard.userActivationRate.byRole && dashboard.userActivationRate.byRole.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activatie per Rol</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Rol</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Actief
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.userActivationRate.byRole.map((role, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4 text-sm capitalize">
                          {role.role.replace("_", " ")}
                        </td>
                        <td className="py-2 px-4 text-sm text-right">
                          {role.activatedUsers} / {role.totalUsers}
                        </td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">
                          {role.activationRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Calculation Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Laatst berekend:{" "}
        {(dashboard.calculatedAt instanceof Date
          ? dashboard.calculatedAt
          : (dashboard.calculatedAt as any).toDate()
        ).toLocaleString("nl-NL")}
      </div>
    </div>
  );
}
