"use client";

/**
 * Risk Analysis & Trend Reporting Page
 * Detailed risk analysis with trend charts, project comparisons, and drill-down capabilities
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TRA } from "@/lib/types/tra";
import { trackDashboardViewed } from "@/lib/analytics/analytics-service";

interface RiskTrendDataPoint {
  date: string;
  averageRisk: number;
  traCount: number;
  highRiskCount: number;
  month: string;
}

interface ProjectRiskComparison {
  projectId: string;
  projectName: string;
  averageRisk: number;
  traCount: number;
  riskLevel: string;
  trend: "up" | "down" | "stable";
  riskDistribution: {
    trivial: number;
    acceptable: number;
    possible: number;
    substantial: number;
    high: number;
    very_high: number;
  };
}

interface RiskCategory {
  category: string;
  count: number;
  averageRisk: number;
  percentage: number;
}

export default function RiskAnalysisPage() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"3m" | "6m" | "12m" | "all">("6m");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Data states
  const [trendData, setTrendData] = useState<RiskTrendDataPoint[]>([]);
  const [projectComparisons, setProjectComparisons] = useState<ProjectRiskComparison[]>([]);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTRAs: 0,
    averageRisk: 0,
    highRiskPercentage: 0,
    improvementRate: 0,
  });

  const canViewAnalytics = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  useEffect(() => {
    if (!canViewAnalytics) return;
    trackDashboardViewed({ dashboardType: "executive" }); // Using existing dashboard type
    loadRiskAnalysis();
  }, [timeRange, selectedProject, canViewAnalytics]);

  const loadRiskAnalysis = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();

      // Calculate start date based on time range
      switch (timeRange) {
        case "3m":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "12m":
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        case "all":
          startDate.setFullYear(2020, 0, 1);
          break;
      }

      // Query TRAs
      const trasRef = collection(db, `organizations/${userProfile.organizationId}/tras`);
      let q = query(
        trasRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "asc")
      );

      if (selectedProject) {
        q = query(q, where("projectId", "==", selectedProject));
      }

      const snapshot = await getDocs(q);
      const tras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TRA);

      // Calculate trend data (monthly aggregation)
      const trendMap = new Map<string, { risks: number[]; count: number; highRisk: number }>();
      tras.forEach((tra) => {
        const date =
          tra.createdAt instanceof Date ? tra.createdAt : (tra.createdAt as any).toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!trendMap.has(monthKey)) {
          trendMap.set(monthKey, { risks: [], count: 0, highRisk: 0 });
        }

        const data = trendMap.get(monthKey)!;
        data.risks.push(tra.overallRiskScore);
        data.count++;
        if (tra.overallRiskLevel === "high" || tra.overallRiskLevel === "very_high") {
          data.highRisk++;
        }
      });

      const trendDataPoints: RiskTrendDataPoint[] = Array.from(trendMap.entries())
        .map(([monthKey, data]) => ({
          date: monthKey,
          month: new Date(monthKey + "-01").toLocaleDateString("nl-NL", {
            month: "short",
            year: "numeric",
          }),
          averageRisk: data.risks.reduce((sum, r) => sum + r, 0) / data.risks.length,
          traCount: data.count,
          highRiskCount: data.highRisk,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTrendData(trendDataPoints);

      // Calculate project comparisons
      const projectMap = new Map<string, TRA[]>();
      tras.forEach((tra) => {
        if (!projectMap.has(tra.projectId)) {
          projectMap.set(tra.projectId, []);
        }
        projectMap.get(tra.projectId)!.push(tra);
      });

      const projectComps: ProjectRiskComparison[] = Array.from(projectMap.entries())
        .map(([projectId, projectTras]) => {
          const avgRisk =
            projectTras.reduce((sum, tra) => sum + tra.overallRiskScore, 0) / projectTras.length;

          // Calculate trend (compare first half vs second half)
          const midpoint = Math.floor(projectTras.length / 2);
          const firstHalfAvg =
            projectTras.slice(0, midpoint).reduce((sum, tra) => sum + tra.overallRiskScore, 0) /
            midpoint;
          const secondHalfAvg =
            projectTras.slice(midpoint).reduce((sum, tra) => sum + tra.overallRiskScore, 0) /
            (projectTras.length - midpoint);
          const trend: "up" | "down" | "stable" =
            secondHalfAvg < firstHalfAvg * 0.95
              ? "down"
              : secondHalfAvg > firstHalfAvg * 1.05
                ? "up"
                : "stable";

          // Risk distribution
          const distribution = {
            trivial: 0,
            acceptable: 0,
            possible: 0,
            substantial: 0,
            high: 0,
            very_high: 0,
          };
          projectTras.forEach((tra) => {
            distribution[tra.overallRiskLevel]++;
          });

          return {
            projectId,
            projectName: projectTras[0].projectRef?.projectName || "Unknown Project",
            averageRisk: avgRisk,
            traCount: projectTras.length,
            riskLevel:
              avgRisk <= 70
                ? "acceptable"
                : avgRisk <= 200
                  ? "possible"
                  : avgRisk <= 400
                    ? "substantial"
                    : "high",
            trend,
            riskDistribution: distribution,
          };
        })
        .sort((a, b) => b.averageRisk - a.averageRisk);

      setProjectComparisons(projectComps);

      // Calculate risk categories (by hazard type)
      const categoryMap = new Map<string, { risks: number[]; count: number }>();
      tras.forEach((tra) => {
        tra.taskSteps.forEach((step) => {
          step.hazards.forEach((hazard) => {
            const category = hazard.category || "Other";
            if (!categoryMap.has(category)) {
              categoryMap.set(category, { risks: [], count: 0 });
            }
            const data = categoryMap.get(category)!;
            data.risks.push(hazard.residualRiskScore || hazard.riskScore);
            data.count++;
          });
        });
      });

      const totalHazards = Array.from(categoryMap.values()).reduce(
        (sum, data) => sum + data.count,
        0
      );
      const categories: RiskCategory[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          count: data.count,
          averageRisk: data.risks.reduce((sum, r) => sum + r, 0) / data.risks.length,
          percentage: (data.count / totalHazards) * 100,
        }))
        .sort((a, b) => b.averageRisk - a.averageRisk);

      setRiskCategories(categories);

      // Calculate overall stats
      const totalRisk = tras.reduce((sum, tra) => sum + tra.overallRiskScore, 0);
      const avgRisk = tras.length > 0 ? totalRisk / tras.length : 0;
      const highRiskCount = tras.filter(
        (tra) => tra.overallRiskLevel === "high" || tra.overallRiskLevel === "very_high"
      ).length;
      const highRiskPct = tras.length > 0 ? (highRiskCount / tras.length) * 100 : 0;

      // Calculate improvement rate (first month vs last month)
      let improvementRate = 0;
      if (trendDataPoints.length >= 2) {
        const firstMonth = trendDataPoints[0].averageRisk;
        const lastMonth = trendDataPoints[trendDataPoints.length - 1].averageRisk;
        improvementRate = ((firstMonth - lastMonth) / firstMonth) * 100;
      }

      setOverallStats({
        totalTRAs: tras.length,
        averageRisk: avgRisk,
        highRiskPercentage: highRiskPct,
        improvementRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      trivial: "#10B981",
      acceptable: "#84CC16",
      possible: "#F59E0B",
      substantial: "#F97316",
      high: "#EF4444",
      very_high: "#DC2626",
    };
    return colors[riskLevel] || "#6B7280";
  };

  if (!canViewAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Je hebt geen toegang tot deze pagina. Alleen admins en safety managers kunnen risk
          analysis bekijken.
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
          <strong>Fout bij laden van risk analysis:</strong> {error}
        </Alert>
        <Button onClick={loadRiskAnalysis} className="mt-4">
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Risico Analyse & Trends</h1>
        <p className="text-gray-600">
          Gedetailleerde risico-analyse met trendgrafieken en projectvergelijkingen
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">Periode:</span>
          {(["3m", "6m", "12m", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "3m" && "3 Maanden"}
              {range === "6m" && "6 Maanden"}
              {range === "12m" && "12 Maanden"}
              {range === "all" && "Alles"}
            </Button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          🖨️ Print Rapport
        </Button>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Totaal TRA's</h3>
            <div className="text-3xl font-bold text-gray-900">{overallStats.totalTRAs}</div>
            <div className="text-sm text-gray-500 mt-2">In geselecteerde periode</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gemiddelde Risico</h3>
            <div
              className="text-3xl font-bold"
              style={{
                color:
                  overallStats.averageRisk <= 200
                    ? "#10B981"
                    : overallStats.averageRisk <= 400
                      ? "#F59E0B"
                      : "#EF4444",
              }}
            >
              {overallStats.averageRisk.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mt-2">Kinney & Wiruth score</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Hoog Risico %</h3>
            <div className="text-3xl font-bold text-red-600">
              {overallStats.highRiskPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-2">Hoog/Zeer hoog risico</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Verbetering</h3>
            <div
              className={`text-3xl font-bold ${overallStats.improvementRate > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {overallStats.improvementRate > 0 ? "+" : ""}
              {overallStats.improvementRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-2">Risico reductie</div>
          </div>
        </Card>
      </div>

      {/* Risk Trend Chart */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Risico Trend Over Tijd</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                yAxisId="left"
                label={{ value: "Gemiddelde Risico Score", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Aantal TRAs", angle: 90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="averageRisk"
                fill="#F59E0B"
                fillOpacity={0.3}
                stroke="#F59E0B"
                name="Gemiddelde Risico"
              />
              <Bar yAxisId="right" dataKey="traCount" fill="#3B82F6" name="Aantal TRAs" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="highRiskCount"
                stroke="#EF4444"
                strokeWidth={2}
                name="Hoog Risico TRAs"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Project Comparison */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Vergelijking</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={projectComparisons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                label={{ value: "Gemiddelde Risico Score", position: "insideBottom", offset: -5 }}
              />
              <YAxis type="category" dataKey="projectName" width={150} />
              <Tooltip />
              <Bar dataKey="averageRisk" name="Gemiddelde Risico">
                {projectComparisons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Project Details Table */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">TRAs</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Gem. Risico
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                    Niveau
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Trend</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Hoog Risico
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectComparisons.map((project, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">{project.projectName}</td>
                    <td className="py-3 px-4 text-sm text-right">{project.traCount}</td>
                    <td
                      className="py-3 px-4 text-sm text-right font-semibold"
                      style={{ color: getRiskColor(project.riskLevel) }}
                    >
                      {project.averageRisk.toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getRiskColor(project.riskLevel) + "20",
                          color: getRiskColor(project.riskLevel),
                        }}
                      >
                        {project.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-lg">
                      {project.trend === "up" && "↗️"}
                      {project.trend === "down" && "↘️"}
                      {project.trend === "stable" && "→"}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {project.riskDistribution.high + project.riskDistribution.very_high}
                      <span className="text-gray-500 ml-1">
                        (
                        {(
                          ((project.riskDistribution.high + project.riskDistribution.very_high) /
                            project.traCount) *
                          100
                        ).toFixed(0)}
                        %)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Risk Categories */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Risico per Categorie</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={riskCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis
                yAxisId="left"
                label={{ value: "Gemiddelde Risico", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Aantal Gevaren", angle: 90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="averageRisk" fill="#F59E0B" name="Gemiddelde Risico" />
              <Bar yAxisId="right" dataKey="count" fill="#3B82F6" name="Aantal Gevaren" />
            </BarChart>
          </ResponsiveContainer>

          {/* Category Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskCategories.slice(0, 6).map((category, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{category.category}</h3>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Gemiddeld:</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: getRiskColor(
                        category.averageRisk <= 70
                          ? "acceptable"
                          : category.averageRisk <= 200
                            ? "possible"
                            : category.averageRisk <= 400
                              ? "substantial"
                              : "high"
                      ),
                    }}
                  >
                    {category.averageRisk.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Aantal:</span>
                  <span className="font-semibold">{category.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Percentage:</span>
                  <span className="font-semibold">{category.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Risico analyse gegenereerd op {new Date().toLocaleString("nl-NL")}</p>
        <p className="mt-1">
          Gebaseerd op {overallStats.totalTRAs} TRA's in de geselecteerde periode
        </p>
      </div>
    </div>
  );
}
