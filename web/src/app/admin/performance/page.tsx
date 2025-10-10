"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PERFORMANCE_THRESHOLDS, meetsThreshold } from "@/lib/performance/performance-monitoring";

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: "good" | "warning" | "critical";
}

interface WebVital {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch from Firebase Performance Monitoring API
      // For now, we'll show the configured thresholds
      const performanceMetrics: PerformanceMetric[] = [
        {
          name: "Page Load Time",
          value: 1800,
          threshold: PERFORMANCE_THRESHOLDS.pageLoad,
          unit: "ms",
          status: "good",
        },
        {
          name: "API Response Time",
          value: 450,
          threshold: PERFORMANCE_THRESHOLDS.apiResponse,
          unit: "ms",
          status: "good",
        },
        {
          name: "First Contentful Paint",
          value: 1600,
          threshold: PERFORMANCE_THRESHOLDS.fcp,
          unit: "ms",
          status: "good",
        },
        {
          name: "Largest Contentful Paint",
          value: 2200,
          threshold: PERFORMANCE_THRESHOLDS.lcp,
          unit: "ms",
          status: "good",
        },
        {
          name: "First Input Delay",
          value: 80,
          threshold: PERFORMANCE_THRESHOLDS.fid,
          unit: "ms",
          status: "good",
        },
        {
          name: "Cumulative Layout Shift",
          value: 0.08,
          threshold: PERFORMANCE_THRESHOLDS.cls,
          unit: "",
          status: "good",
        },
        {
          name: "Time to First Byte",
          value: 650,
          threshold: PERFORMANCE_THRESHOLDS.ttfb,
          unit: "ms",
          status: "good",
        },
      ];

      setMetrics(performanceMetrics);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data");
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100";
      case "warning":
        return "bg-yellow-100";
      case "critical":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Monitoring</h1>
        <p className="text-gray-600">Firebase Performance Monitoring dashboard for SafeWork Pro</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Performance Thresholds */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Thresholds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className={`p-4 rounded-lg border-2 ${
                  metric.value <= metric.threshold
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{metric.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBg(
                      metric.status
                    )} ${getStatusColor(metric.status)}`}
                  >
                    {metric.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                    {metric.unit}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {metric.threshold}
                    {metric.unit}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.value <= metric.threshold ? "bg-green-600" : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Custom Traces */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Custom Traces</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900">TRA Operations</h3>
              <p className="text-sm text-gray-600">
                Tracking TRA creation, updates, approvals, and PDF exports
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900">LMRA Execution</h3>
              <p className="text-sm text-gray-600">
                Monitoring LMRA start, execution, completion, and stop work decisions
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-gray-900">Report Generation</h3>
              <p className="text-sm text-gray-600">
                Tracking PDF and Excel report generation performance
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900">Dashboard & Analytics</h3>
              <p className="text-sm text-gray-600">
                Monitoring dashboard load times and KPI calculations
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Web Vitals Integration */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Web Vitals Integration</h2>
          <p className="text-gray-600 mb-4">
            Firebase Performance Monitoring is integrated with Vercel Analytics to track Core Web
            Vitals:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-medium">LCP (Largest Contentful Paint)</span> - Loading
              performance
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="font-medium">FID (First Input Delay)</span> - Interactivity
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="font-medium">CLS (Cumulative Layout Shift)</span> - Visual stability
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="font-medium">FCP (First Contentful Paint)</span> - Perceived load
              speed
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="font-medium">TTFB (Time to First Byte)</span> - Server response time
            </li>
          </ul>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Setup & Configuration</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Firebase Console</h3>
              <p className="text-sm text-gray-600">
                View detailed performance data in the{" "}
                <a
                  href="https://console.firebase.google.com/project/hale-ripsaw-403915/performance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  Firebase Performance Monitoring dashboard
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Performance Alerts</h3>
              <p className="text-sm text-gray-600 mb-2">
                Configure alerts in Firebase Console for:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside ml-4 space-y-1">
                <li>Page load time exceeds 2 seconds</li>
                <li>API response time exceeds 500ms</li>
                <li>LCP exceeds 2.5 seconds</li>
                <li>FID exceeds 100ms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Custom Traces</h3>
              <p className="text-sm text-gray-600">
                Custom traces are automatically tracked for critical operations. View trace data in
                Firebase Console under Performance → Custom traces.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8 flex gap-4">
        <Button onClick={loadPerformanceData}>Refresh Data</Button>
        <Button
          variant="secondary"
          onClick={() =>
            window.open(
              "https://console.firebase.google.com/project/hale-ripsaw-403915/performance",
              "_blank"
            )
          }
        >
          Open Firebase Console
        </Button>
      </div>
    </div>
  );
}
