/**
 * Schema Performance Monitoring Dashboard
 *
 * Interactive React dashboard for monitoring schema markup performance,
 * viewing analytics, and managing alerts across all schema types.
 *
 * Features:
 * - Real-time performance metrics visualization
 * - Rich snippet monitoring and analytics
 * - AI discoverability impact tracking
 * - Automated alerting and notification management
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings,
  RefreshCw,
  Download,
  Eye,
  MousePointer,
  Target,
  Zap,
} from "lucide-react";

import { schemaAnalytics } from "@/lib/seo/schema-analytics";
import { schemaMonitoring } from "@/lib/seo/schema-monitoring";

interface DashboardProps {
  schemaTypes?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export const SchemaPerformanceDashboard: React.FC<DashboardProps> = ({
  schemaTypes = ["article", "event", "product", "dataset", "faq", "organization"],
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState(schemaMonitoring.getStatus());

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Collect performance metrics for all schema types
      const performanceMetrics = await schemaAnalytics.collectPerformanceMetrics(schemaTypes);

      // Get current monitoring status
      const status = schemaMonitoring.getStatus();

      // Mock overall metrics for display
      const overall = {
        totalSchemas: performanceMetrics.reduce(
          (sum: number, m: any) => sum + m.schemaQuality.totalSchemas,
          0
        ),
        averageScore:
          performanceMetrics.reduce(
            (sum: number, m: any) => sum + m.schemaQuality.averageScore,
            0
          ) / performanceMetrics.length,
        totalImpressions: performanceMetrics.reduce(
          (sum: number, m: any) => sum + (m.richSnippetMetrics?.impressions || 0),
          0
        ),
        totalClicks: performanceMetrics.reduce(
          (sum: number, m: any) => sum + (m.richSnippetMetrics?.clicks || 0),
          0
        ),
        averageCTR:
          performanceMetrics.reduce(
            (sum: number, m: any) => sum + (m.richSnippetMetrics?.ctr || 0),
            0
          ) / performanceMetrics.length,
        alerts: 0, // Would come from monitoring service in production
      };

      setMetrics({
        overall,
        byType: performanceMetrics.reduce((acc: any, metric: any) => {
          acc[metric.schemaType] = metric;
          return acc;
        }, {}),
        monitoringStatus: status,
      });

      setLastUpdated(new Date());
      setMonitoringStatus(status);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [schemaTypes, autoRefresh, refreshInterval]);

  // Generate performance report
  const generateReport = async () => {
    if (!metrics) return;

    try {
      const report = await schemaAnalytics.generatePerformanceReport(schemaTypes);
      const blob = new Blob([report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schema-performance-report-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  // Format percentage
  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  // Format number with commas
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // Get trend indicator
  const getTrendIndicator = (trend: number) => {
    if (trend > 5) return { icon: TrendingUp, color: "text-green-500", label: "Improving" };
    if (trend < -5) return { icon: TrendingDown, color: "text-red-500", label: "Declining" };
    return { icon: Activity, color: "text-gray-500", label: "Stable" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading schema performance data...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load schema performance data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor schema markup performance and AI discoverability
            {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge>
            {monitoringStatus.isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
          </Badge>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schemas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overall.totalSchemas)}</div>
            <p className="text-xs text-muted-foreground">
              Avg Score: {metrics.overall.averageScore.toFixed(1)}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.overall.totalImpressions)}
            </div>
            <p className="text-xs text-muted-foreground">
              CTR: {formatPercentage(metrics.overall.averageCTR)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overall.totalClicks)}</div>
            <p className="text-xs text-muted-foreground">From rich snippets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overall.alerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Schema Performance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Performance by Type</CardTitle>
          <CardDescription>Quality scores and error rates across schema types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(metrics.byType).map(([type, data]: [string, any]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{type}</span>
                <Badge>{formatPercentage(data.schemaQuality.errorRate)} errors</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.schemaQuality.averageScore}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Score: {data.schemaQuality.averageScore.toFixed(1)}/100</span>
                <span>
                  {data.schemaQuality.validSchemas}/{data.schemaQuality.totalSchemas} valid
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rich Snippets Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Rich Snippets Performance</CardTitle>
          <CardDescription>Search appearance and click-through performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(metrics.byType).map(([type, data]: [string, any]) => (
              <div key={type} className="space-y-4">
                <h3 className="text-lg font-semibold capitalize">{type} Rich Snippets</h3>
                {data.richSnippetMetrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatNumber(data.richSnippetMetrics.impressions)}
                        </div>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {formatNumber(data.richSnippetMetrics.clicks)}
                        </div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Click-through Rate</span>
                        <span>{formatPercentage(data.richSnippetMetrics.ctr)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${data.richSnippetMetrics.ctr * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Rich Results: {data.richSnippetMetrics.richResults.total} total
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No rich snippet data available
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Recent performance changes and trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(metrics.byType).map(([type, data]: [string, any]) => {
            const trend = getTrendIndicator(data.performanceImpact.trend);
            const TrendIcon = trend.icon;

            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendIcon className={`h-4 w-4 ${trend.color}`} />
                  <span className="text-sm font-medium capitalize">{type}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {data.performanceImpact.trend >= 0 ? "+" : ""}
                    {data.performanceImpact.trend.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">{trend.label}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Monitoring Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Monitoring Controls</span>
          </CardTitle>
          <CardDescription>Configure monitoring settings and alert thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Schema Performance Monitoring</p>
              <p className="text-xs text-muted-foreground">
                Status: {monitoringStatus.isMonitoring ? "Active" : "Inactive"} • Check Interval:{" "}
                {monitoringStatus.checkInterval} minutes • Alert Rules:{" "}
                {monitoringStatus.alertRules}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemaPerformanceDashboard;
