"use client";

/**
 * LMRA Execution Analytics Page
 * Task 6.3: LMRA completion rates, timing analysis, efficiency metrics
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LMRASession, calculateDuration } from "@/lib/types/lmra";
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
  ComposedChart,
  Area,
} from "recharts";

interface LMRAAnalytics {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageDuration: number; // minutes
  medianDuration: number; // minutes
  stopWorkCount: number;
  stopWorkRate: number;
  byAssessment: {
    safe_to_proceed: number;
    proceed_with_caution: number;
    stop_work: number;
  };
  byProject: {
    projectId: string;
    projectName: string;
    sessionCount: number;
    avgDuration: number;
    completionRate: number;
  }[];
  byPerformer: {
    userId: string;
    displayName: string;
    sessionCount: number;
    avgDuration: number;
    stopWorkCount: number;
  }[];
  timeDistribution: {
    range: string;
    count: number;
  }[];
  dailyTrend: {
    date: string;
    completed: number;
    stopWork: number;
  }[];
  efficiencyMetrics: {
    fastestCompletion: number; // minutes
    slowestCompletion: number; // minutes
    avgPhotosPerSession: number;
    avgTeamSize: number;
  };
}

type PeriodType = "week" | "month" | "quarter" | "year";

export default function LMRAAnalyticsPage() {
  const { user, userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<LMRAAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>("month");

  const canViewAnalytics = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  useEffect(() => {
    if (!canViewAnalytics) return;
    loadAnalytics();
  }, [period, canViewAnalytics]);

  const getDateRange = (period: PeriodType): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const loadAnalytics = async () => {
    if (!userProfile?.organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange(period);

      // Query LMRA sessions
      const lmrasRef = collection(db, `organizations/${userProfile.organizationId}/lmraSessions`);
      const q = query(
        lmrasRef,
        where("startedAt", ">=", Timestamp.fromDate(startDate)),
        where("startedAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("startedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LMRASession);

      // Calculate analytics
      const completedSessions = sessions.filter((s) => !!s.completedAt);
      const durations = completedSessions
        .map((s) => calculateDuration(s))
        .filter((d): d is number => d !== null)
        .map((d) => d / 60); // Convert to minutes

      // Sort durations for median
      const sortedDurations = [...durations].sort((a, b) => a - b);
      const medianDuration =
        sortedDurations.length > 0
          ? sortedDurations.length % 2 === 0
            ? (sortedDurations[sortedDurations.length / 2 - 1] +
                sortedDurations[sortedDurations.length / 2]) /
              2
            : sortedDurations[Math.floor(sortedDurations.length / 2)]
          : 0;

      // By assessment
      const byAssessment = {
        safe_to_proceed: sessions.filter((s) => s.overallAssessment === "safe_to_proceed").length,
        proceed_with_caution: sessions.filter((s) => s.overallAssessment === "proceed_with_caution")
          .length,
        stop_work: sessions.filter((s) => s.overallAssessment === "stop_work").length,
      };

      // By project
      const projectMap = new Map<
        string,
        {
          projectId: string;
          projectName: string;
          sessions: LMRASession[];
        }
      >();

      sessions.forEach((session) => {
        if (!projectMap.has(session.projectId)) {
          projectMap.set(session.projectId, {
            projectId: session.projectId,
            projectName: "Project", // Would need to fetch from projects collection
            sessions: [],
          });
        }
        projectMap.get(session.projectId)!.sessions.push(session);
      });

      const byProject = Array.from(projectMap.values())
        .map((p) => {
          const completed = p.sessions.filter((s) => !!s.completedAt);
          const projectDurations = completed
            .map((s) => calculateDuration(s))
            .filter((d): d is number => d !== null);

          return {
            projectId: p.projectId,
            projectName: p.projectName,
            sessionCount: p.sessions.length,
            avgDuration:
              projectDurations.length > 0
                ? projectDurations.reduce((sum, d) => sum + d, 0) / projectDurations.length / 60
                : 0,
            completionRate:
              p.sessions.length > 0 ? (completed.length / p.sessions.length) * 100 : 0,
          };
        })
        .sort((a, b) => b.sessionCount - a.sessionCount);

      // By performer
      const performerMap = new Map<
        string,
        {
          userId: string;
          displayName: string;
          sessions: LMRASession[];
        }
      >();

      sessions.forEach((session) => {
        if (!performerMap.has(session.performedBy)) {
          performerMap.set(session.performedBy, {
            userId: session.performedBy,
            displayName: session.performedByName || "Unknown",
            sessions: [],
          });
        }
        performerMap.get(session.performedBy)!.sessions.push(session);
      });

      const byPerformer = Array.from(performerMap.values())
        .map((p) => {
          const completed = p.sessions.filter((s) => !!s.completedAt);
          const performerDurations = completed
            .map((s) => calculateDuration(s))
            .filter((d): d is number => d !== null);

          return {
            userId: p.userId,
            displayName: p.displayName,
            sessionCount: p.sessions.length,
            avgDuration:
              performerDurations.length > 0
                ? performerDurations.reduce((sum, d) => sum + d, 0) / performerDurations.length / 60
                : 0,
            stopWorkCount: p.sessions.filter((s) => s.overallAssessment === "stop_work").length,
          };
        })
        .sort((a, b) => b.sessionCount - a.sessionCount);

      // Time distribution (buckets: 0-5, 5-10, 10-15, 15-30, 30+ minutes)
      const timeDistribution = [
        { range: "0-5 min", count: 0 },
        { range: "5-10 min", count: 0 },
        { range: "10-15 min", count: 0 },
        { range: "15-30 min", count: 0 },
        { range: "30+ min", count: 0 },
      ];

      durations.forEach((d) => {
        if (d < 5) timeDistribution[0].count++;
        else if (d < 10) timeDistribution[1].count++;
        else if (d < 15) timeDistribution[2].count++;
        else if (d < 30) timeDistribution[3].count++;
        else timeDistribution[4].count++;
      });

      // Daily trend
      const dailyMap = new Map<string, { completed: number; stopWork: number }>();
      sessions.forEach((session) => {
        const date =
          session.startedAt instanceof Date
            ? session.startedAt
            : (session.startedAt as any).toDate();
        const dateKey = date.toISOString().split("T")[0];

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { completed: 0, stopWork: 0 });
        }

        const day = dailyMap.get(dateKey)!;
        if (session.completedAt) day.completed++;
        if (session.overallAssessment === "stop_work") day.stopWork++;
      });

      const dailyTrend = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Efficiency metrics
      const totalPhotos = sessions.reduce((sum, s) => sum + (s.photos?.length || 0), 0);
      const totalTeamMembers = sessions.reduce((sum, s) => sum + (s.teamMembers?.length || 0), 0);

      const analyticsData: LMRAAnalytics = {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        completionRate:
          sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
        averageDuration:
          durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
        medianDuration,
        stopWorkCount: byAssessment.stop_work,
        stopWorkRate: sessions.length > 0 ? (byAssessment.stop_work / sessions.length) * 100 : 0,
        byAssessment,
        byProject,
        byPerformer,
        timeDistribution,
        dailyTrend,
        efficiencyMetrics: {
          fastestCompletion: sortedDurations.length > 0 ? sortedDurations[0] : 0,
          slowestCompletion:
            sortedDurations.length > 0 ? sortedDurations[sortedDurations.length - 1] : 0,
          avgPhotosPerSession: sessions.length > 0 ? totalPhotos / sessions.length : 0,
          avgTeamSize: sessions.length > 0 ? totalTeamMembers / sessions.length : 0,
        },
      };

      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lmra-analytics-${period}-${new Date().toISOString().split("T")[0]}.json`;
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
          <strong>Fout bij laden van LMRA analytics:</strong> {error}
        </Alert>
        <Button onClick={loadAnalytics} className="mt-4">
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="info">Geen LMRA data beschikbaar voor deze periode.</Alert>
      </div>
    );
  }

  // Chart colors
  const COLORS = {
    safe: "#10B981",
    caution: "#F59E0B",
    stop: "#EF4444",
    primary: "#f97316",
    secondary: "#84CC16",
  };

  const assessmentData = [
    { name: "Veilig Doorgaan", value: analytics.byAssessment.safe_to_proceed, color: COLORS.safe },
    {
      name: "Voorzichtig Doorgaan",
      value: analytics.byAssessment.proceed_with_caution,
      color: COLORS.caution,
    },
    { name: "Stop Werk", value: analytics.byAssessment.stop_work, color: COLORS.stop },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LMRA Uitvoering Analytics</h1>
        <p className="text-gray-600">
          Voltooiingspercentages, timing analyse en efficiëntie metrics
        </p>
      </div>

      {/* Period Selector and Export */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {(["week", "month", "quarter", "year"] as PeriodType[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Totaal Sessies</h3>
            <div className="text-3xl font-bold text-gray-900">{analytics.totalSessions}</div>
            <div className="mt-2 text-sm text-gray-600">{analytics.completedSessions} voltooid</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Voltooiingspercentage</h3>
            <div
              className="text-3xl font-bold"
              style={{
                color:
                  analytics.completionRate >= 90
                    ? COLORS.safe
                    : analytics.completionRate >= 75
                      ? COLORS.caution
                      : COLORS.stop,
              }}
            >
              {analytics.completionRate.toFixed(1)}%
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {analytics.totalSessions - analytics.completedSessions} onvoltooid
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Gemiddelde Duur</h3>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.averageDuration.toFixed(1)} min
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Mediaan: {analytics.medianDuration.toFixed(1)} min
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Stop Werk Rate</h3>
            <div className="text-3xl font-bold" style={{ color: COLORS.stop }}>
              {analytics.stopWorkRate.toFixed(1)}%
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {analytics.stopWorkCount} stop werk gevallen
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Efficiëntie Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Snelste Voltooiing</div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.efficiencyMetrics.fastestCompletion.toFixed(1)} min
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Langzaamste Voltooiing</div>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.efficiencyMetrics.slowestCompletion.toFixed(1)} min
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Gem. Foto's per Sessie</div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.efficiencyMetrics.avgPhotosPerSession.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Gem. Teamgrootte</div>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.efficiencyMetrics.avgTeamSize.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assessment Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Beoordeling Verdeling</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assessmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                >
                  {assessmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Time Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tijdsduur Verdeling</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily Trend */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dagelijkse Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="completed"
                  fill={COLORS.secondary}
                  stroke={COLORS.secondary}
                  name="Voltooid"
                />
                <Line
                  type="monotone"
                  dataKey="stopWork"
                  stroke={COLORS.stop}
                  strokeWidth={2}
                  name="Stop Werk"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        {analytics.byPerformer.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Uitvoerders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                        Naam
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Sessies
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Gem. Tijd
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Stop Werk
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byPerformer.slice(0, 10).map((performer, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4 text-sm">{performer.displayName}</td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">
                          {performer.sessionCount}
                        </td>
                        <td className="py-2 px-4 text-sm text-right">
                          {performer.avgDuration.toFixed(1)} min
                        </td>
                        <td className="py-2 px-4 text-sm text-right">
                          <span
                            className={
                              performer.stopWorkCount > 0 ? "text-red-600 font-semibold" : ""
                            }
                          >
                            {performer.stopWorkCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Project Performance */}
        {analytics.byProject.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Prestaties</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                        Project
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Sessies
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Gem. Tijd
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Voltooiing
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byProject.slice(0, 10).map((project, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4 text-sm">{project.projectName}</td>
                        <td className="py-2 px-4 text-sm text-right font-semibold">
                          {project.sessionCount}
                        </td>
                        <td className="py-2 px-4 text-sm text-right">
                          {project.avgDuration.toFixed(1)} min
                        </td>
                        <td className="py-2 px-4 text-sm text-right">
                          <span
                            style={{
                              color:
                                project.completionRate >= 90
                                  ? COLORS.safe
                                  : project.completionRate >= 75
                                    ? COLORS.caution
                                    : COLORS.stop,
                            }}
                          >
                            {project.completionRate.toFixed(1)}%
                          </span>
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

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Laatst bijgewerkt: {new Date().toLocaleString("nl-NL")}
      </div>
    </div>
  );
}
