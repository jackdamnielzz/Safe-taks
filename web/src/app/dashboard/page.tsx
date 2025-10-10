"use client";

/**
 * Executive Dashboard - Real-time Safety KPIs
 * Task 6.1: Build executive dashboard with real-time safety KPIs
 *
 * Features:
 * - Real-time LMRA session updates with Firestore listeners
 * - All 6 core KPIs with trend analysis
 * - Role-based views (admin vs safety_manager)
 * - Interactive charts and visualizations
 * - Stop work alerts with push notifications
 * - Dutch localization
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import {
  KPIDashboard,
  MetricPeriod,
  getPeriodDateRange,
  getMetricColor,
  getTrendIcon,
} from "@/lib/types/metrics";
import { calculateKPIDashboard } from "@/lib/analytics/kpi-calculator";
import { useLMRARealtimeUpdates, useLMRAStatsRealtime } from "@/hooks/useLMRARealtimeUpdates";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatsCard, StatsGrid } from "@/components/dashboard/StatsCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { trackDashboardViewed } from "@/lib/analytics/analytics-service";

export default function ExecutiveDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<KPIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricPeriod>("month");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check if user can view dashboard
  const canViewDashboard = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  // Real-time LMRA updates
  const {
    sessions: recentLMRAs,
    isLoading: lmraLoading,
    lastUpdate,
  } = useLMRARealtimeUpdates({
    orgId: userProfile?.organizationId || "",
    limit: 5,
    enableNotifications: true,
  });

  const lmraStats = useLMRAStatsRealtime(userProfile?.organizationId || "");

  useEffect(() => {
    if (!canViewDashboard) return;

    // Track dashboard view
    trackDashboardViewed({ dashboardType: "executive" });

    loadDashboard();

    // Auto-refresh every 5 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(
        () => {
          loadDashboard();
        },
        5 * 60 * 1000
      );

      return () => clearInterval(interval);
    }
  }, [period, canViewDashboard, autoRefresh]);

  const loadDashboard = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const dateRange = getPeriodDateRange(period);
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
        setError(result.error || "Fout bij laden van KPIs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: MetricPeriod) => {
    setPeriod(newPeriod);
  };

  // Redirect if not authorized
  if (!canViewDashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Je hebt geen toegang tot dit dashboard. Alleen admins en safety managers kunnen het
          executive dashboard bekijken.
        </Alert>
        <Button onClick={() => router.push("/")} className="mt-4">
          Terug naar home
        </Button>
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          <strong>Fout bij laden van dashboard:</strong> {error}
        </Alert>
        <Button onClick={loadDashboard} className="mt-4">
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  // Filter stop work sessions
  const stopWorkSessions = recentLMRAs.filter(
    (s) => s.overallAssessment === "stop_work" && !s.stopWorkAcknowledgedBy
  );

  // Prepare chart data
  const riskDistributionData = dashboard?.averageRiskScore.riskDistribution
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
            <p className="text-gray-600">Real-time veiligheidsprestaties en KPI's</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            {lastUpdate && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live
              </div>
            )}
            {/* Auto-refresh toggle */}
            <Button
              variant={autoRefresh ? "primary" : "secondary"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "🔄 Auto-refresh aan" : "⏸️ Auto-refresh uit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {stopWorkSessions.length > 0 && (
        <Alert variant="error" className="mb-6 border-2 border-red-500 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg mb-2">
                🛑 {stopWorkSessions.length} Kritieke Stop Work Alert
                {stopWorkSessions.length > 1 ? "s" : ""}
              </div>
              {stopWorkSessions.map((session) => (
                <div key={session.id} className="mt-2 text-sm">
                  <div className="font-medium">{session.performedByName}</div>
                  <div className="text-red-700">
                    {session.stopWorkReason || "Reden niet gespecificeerd"}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="danger" onClick={() => router.push("/lmra/sessions")}>
              Bekijk Details →
            </Button>
          </div>
        </Alert>
      )}

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
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

      {/* Overall Health Score */}
      {dashboard && (
        <Card className="mb-6 bg-gradient-to-r from-orange-50 via-white to-green-50">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Algemene Veiligheidsscore</h2>
            <div
              className="text-6xl font-bold mb-2"
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
            <p className="text-gray-600">
              Gebaseerd op {period === "month" ? "deze maand" : `deze ${period}`}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Laatst bijgewerkt: {lastUpdate?.toLocaleTimeString("nl-NL") || "Laden..."}
            </div>
          </div>
        </Card>
      )}

      {/* Real-time LMRA Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Real-time LMRA Status</h2>
        <StatsGrid columns={4}>
          <StatsCard
            title="Vandaag Uitgevoerd"
            value={lmraStats.todayCount}
            icon="📅"
            variant="info"
          />
          <StatsCard
            title="Veilig te Vervolgen"
            value={lmraStats.safeCount}
            icon="✅"
            variant="success"
          />
          <StatsCard
            title="Met Voorzichtigheid"
            value={lmraStats.cautionCount}
            icon="⚠️"
            variant="warning"
          />
          <StatsCard title="Stop Work" value={lmraStats.stopWorkCount} icon="🛑" variant="danger" />
        </StatsGrid>
      </div>

      {/* Core KPIs Grid */}
      {dashboard && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Kern Prestatie Indicatoren (KPIs)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TRAs Created */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">TRA's Aangemaakt</h3>
                <div className="flex items-baseline justify-between">
                  <div
                    className="text-4xl font-bold"
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
                <div className="mt-3 text-sm text-gray-600">
                  Doel: {dashboard.trasCreated.target} / {period}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Ø {dashboard.trasCreated.averagePerDay?.toFixed(1)} per dag
                </div>
              </div>
            </Card>

            {/* LMRAs Executed */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">LMRA's Uitgevoerd</h3>
                <div className="flex items-baseline justify-between">
                  <div
                    className="text-4xl font-bold"
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
                <div className="mt-3 text-sm text-gray-600">
                  Voltooiingspercentage: {dashboard.lmrasExecuted.completionRate?.toFixed(1)}%
                </div>
                <div className="mt-2 text-xs text-red-600 font-medium">
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
                    className="text-4xl font-bold"
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
                <div className="mt-3 text-sm text-gray-600">
                  Mediaan: {dashboard.averageRiskScore.medianRiskScore?.toFixed(0)}
                </div>
                <div className="mt-2 text-xs text-gray-500">
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
                    className="text-4xl font-bold"
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
                <div className="mt-3 text-sm text-gray-600">
                  Doel: ≥{dashboard.complianceRate.target}%
                </div>
                <div className="mt-2 text-xs text-gray-500">
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
                    className="text-4xl font-bold"
                    style={{ color: getMetricColor(dashboard.timeToApproval.status!) }}
                  >
                    {dashboard.timeToApproval.averageHours.toFixed(1)}
                    <span className="text-xl text-gray-500">u</span>
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
                <div className="mt-3 text-sm text-gray-600">
                  Doel: ≤{dashboard.timeToApproval.target}u
                </div>
                <div className="mt-2 text-xs text-red-600 font-medium">
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
                    className="text-4xl font-bold"
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
                <div className="mt-3 text-sm text-gray-600">
                  Doel: ≥{dashboard.userActivationRate.target}%
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dashboard.userActivationRate.activatedUsers} /{" "}
                  {dashboard.userActivationRate.totalUsers} actief
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Distribution */}
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

          {/* LMRA Trend */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">LMRA Trend</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lmraStats.safeCount}</div>
                  <div className="text-xs text-gray-600">Veilig</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{lmraStats.cautionCount}</div>
                  <div className="text-xs text-gray-600">Voorzichtig</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{lmraStats.stopWorkCount}</div>
                  <div className="text-xs text-gray-600">Stop Work</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center mt-4">
                Totaal vandaag: {lmraStats.todayCount} LMRA's
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent LMRA Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recente LMRA Sessies</h2>
          <Button variant="secondary" size="sm" onClick={() => router.push("/lmra/sessions")}>
            Bekijk Alle →
          </Button>
        </div>

        {lmraLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : recentLMRAs.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-500">
              Nog geen LMRA sessies uitgevoerd vandaag
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentLMRAs.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={
                            session.overallAssessment === "safe_to_proceed"
                              ? "bg-green-100 text-green-800"
                              : session.overallAssessment === "proceed_with_caution"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {session.overallAssessment === "safe_to_proceed"
                            ? "Veilig"
                            : session.overallAssessment === "proceed_with_caution"
                              ? "Met voorzichtigheid"
                              : "Stop work"}
                        </Badge>
                        {session.syncStatus === "pending_sync" && (
                          <Badge className="bg-blue-100 text-blue-800">Sync in behandeling</Badge>
                        )}
                      </div>

                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {session.performedByName || "Onbekend"}
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div>📍 Nauwkeurigheid: {session.location.accuracy.toFixed(1)}m</div>
                        <div>👷 Team: {session.teamMembers.length} leden</div>
                        {session.photos.length > 0 && <div>📷 Foto's: {session.photos.length}</div>}
                        <div>
                          🕐{" "}
                          {(session.startedAt instanceof Date
                            ? session.startedAt
                            : (session.startedAt as any).toDate()
                          ).toLocaleString("nl-NL")}
                        </div>
                      </div>

                      {session.stopWorkReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <strong>Stop work reden:</strong> {session.stopWorkReason}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/lmra/sessions/${session.id}`)}
                    >
                      Details →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/analytics")}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Uitgebreide Analytics</h3>
              <p className="text-sm text-gray-600">Bekijk gedetailleerde KPI's en trends</p>
            </div>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/cohorts")}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">Cohort Analyse</h3>
              <p className="text-sm text-gray-600">Bekijk gebruiker retentie en activatie</p>
            </div>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/reports")}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="font-semibold text-gray-900 mb-2">Rapporten</h3>
              <p className="text-sm text-gray-600">Genereer compliance en veiligheidsrapporten</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
