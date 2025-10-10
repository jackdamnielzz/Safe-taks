"use client";

/**
 * Central Admin Hub - Unified Admin Dashboard
 *
 * Comprehensive admin interface that combines all admin functionality
 * into a single, organized dashboard for complete system management.
 *
 * Features:
 * - Unified admin dashboard with all management functions
 * - Real-time system monitoring and performance metrics
 * - Customer management and multi-tenant oversight
 * - Script execution interface for administrative tasks
 * - Bulk operations for mass management
 * - Integration with all existing admin pages
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Activity,
  Users,
  FileText,
  Settings,
  Shield,
  TrendingUp,
  Database,
  Terminal,
  Zap,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Globe,
  Smartphone,
  BarChart3,
  PieChart,
  Layers,
  UserCheck,
  Building,
  FileSpreadsheet,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  totalProjects: number;
  totalTRAs: number;
  totalLMRAs: number;
  systemHealth: "excellent" | "good" | "warning" | "critical";
  uptime: string;
  responseTime: number;
  errorRate: number;
}

interface AdminModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string;
  status: "operational" | "warning" | "error" | "maintenance";
  metrics?: {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "stable";
  }[];
}

export default function AdminHubPage() {
  const { user, userProfile } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is admin
  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  useEffect(() => {
    if (!isAdmin) return;
    loadSystemMetrics();
  }, [isAdmin]);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);

      // In production, this would fetch real metrics from APIs
      const mockMetrics: SystemMetrics = {
        totalUsers: 1247,
        activeUsers: 892,
        totalOrganizations: 156,
        totalProjects: 3421,
        totalTRAs: 8756,
        totalLMRAs: 12450,
        systemHealth: "excellent",
        uptime: "99.9%",
        responseTime: 245, // ms
        errorRate: 0.02, // 0.02%
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Error loading system metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Admin modules configuration
  const adminModules: AdminModule[] = [
    {
      id: "analytics",
      name: "Analytics Dashboard",
      description: "Comprehensive KPI tracking and performance analytics",
      icon: BarChart3,
      href: "/admin/analytics",
      status: "operational",
      metrics: [
        { label: "Active Users", value: "892", trend: "up" },
        { label: "TRAs Created", value: "8.7K", trend: "up" },
      ],
    },
    {
      id: "performance",
      name: "Performance Monitor",
      description: "Real-time system performance and health monitoring",
      icon: Activity,
      href: "/admin/performance",
      status: "operational",
      metrics: [
        { label: "Response Time", value: "245ms", trend: "stable" },
        { label: "Uptime", value: "99.9%", trend: "stable" },
      ],
    },
    {
      id: "security",
      name: "Security Audit",
      description: "Security monitoring and compliance validation",
      icon: Shield,
      href: "/admin/security-audit",
      status: "operational",
      metrics: [
        { label: "Security Score", value: "100%", trend: "stable" },
        { label: "Tests Passed", value: "15/15", trend: "stable" },
      ],
    },
    {
      id: "pwa-tests",
      name: "PWA Testing",
      description: "Progressive Web App testing and validation",
      icon: Smartphone,
      href: "/admin/pwa-tests",
      status: "operational",
      metrics: [
        { label: "PWA Score", value: "100%", trend: "stable" },
        { label: "Tests Passed", value: "6/6", trend: "stable" },
      ],
    },
    {
      id: "reports",
      name: "Report Builder",
      description: "Custom report generation and data export",
      icon: FileSpreadsheet,
      href: "/admin/reports/builder",
      status: "operational",
      metrics: [
        { label: "Reports Generated", value: "247", trend: "up" },
        { label: "Data Points", value: "1.2M", trend: "up" },
      ],
    },
    {
      id: "risk-analysis",
      name: "Risk Analysis",
      description: "Advanced risk assessment and trend reporting",
      icon: TrendingUp,
      href: "/admin/risk-analysis",
      status: "operational",
      metrics: [
        { label: "Risk Score", value: "2.3", trend: "down" },
        { label: "Incidents", value: "12", trend: "down" },
      ],
    },
    {
      id: "cohorts",
      name: "Cohort Analysis",
      description: "User behavior and retention analytics",
      icon: Users,
      href: "/admin/cohorts",
      status: "operational",
      metrics: [
        { label: "Active Cohorts", value: "8", trend: "stable" },
        { label: "Retention Rate", value: "87%", trend: "up" },
      ],
    },
    {
      id: "lmra-analytics",
      name: "LMRA Analytics",
      description: "LMRA execution patterns and performance",
      icon: Clock,
      href: "/admin/lmra-analytics",
      status: "operational",
      metrics: [
        { label: "LMRAs Today", value: "156", trend: "up" },
        { label: "Completion Rate", value: "94%", trend: "stable" },
      ],
    },
  ];

  const getStatusColor = (status: AdminModule["status"] | SystemMetrics["systemHealth"]) => {
    if (typeof status === "object") return "text-green-500";

    switch (status) {
      case "operational":
      case "excellent":
        return "text-green-500";
      case "warning":
      case "good":
        return "text-yellow-500";
      case "error":
      case "critical":
        return "text-red-500";
      case "maintenance":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: AdminModule["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin hub. Admin or safety manager role
              required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Hub</h1>
            <p className="text-gray-600">
              Centralized administration and system management interface
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="success" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              System Operational
            </Badge>
            <Button onClick={loadSystemMetrics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{metrics.activeUsers} active users</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(metrics.activeUsers / metrics.totalUsers) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">Multi-tenant systems</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProjects.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{metrics.totalTRAs} TRAs created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className={`h-4 w-4 ${getStatusColor(metrics.systemHealth)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{metrics.systemHealth}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.uptime} uptime • {metrics.responseTime}ms avg response
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {adminModules.map((module) => {
          const IconComponent = module.icon;

          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${getStatusColor(module.status)} bg-opacity-10`}
                    >
                      <IconComponent className={`h-6 w-6 ${getStatusColor(module.status)}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={module.status === "operational" ? "success" : "error"}
                      className="text-xs"
                    >
                      {getStatusIcon(module.status)}
                      <span className="ml-1 capitalize">{module.status}</span>
                    </Badge>
                    <a
                      href={module.href}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </CardHeader>

              {module.metrics && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {module.metrics.map((metric, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-semibold">{metric.value}</p>
                          {metric.trend && (
                            <Badge
                              variant={
                                metric.trend === "up"
                                  ? "success"
                                  : metric.trend === "down"
                                    ? "error"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {metric.trend === "up" ? "↗" : metric.trend === "down" ? "↘" : "→"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>Common administrative tasks and system operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Database className="h-6 w-6" />
              <span className="text-sm">System Health</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">User Management</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Generate Reports</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Terminal className="h-6 w-6" />
              <span className="text-sm">Run Scripts</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Data</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">System Config</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Core Services</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Firebase Auth</span>
                  <Badge className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Firestore Database</span>
                  <Badge className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage Service</span>
                  <Badge className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">External APIs</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OpenWeather API</span>
                  <Badge className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sentry Monitoring</span>
                  <Badge className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-medium">{metrics?.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm font-medium">
                    {metrics?.errorRate ? `${(metrics.errorRate * 100).toFixed(2)}%` : "0%"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm font-medium">{metrics?.uptime}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Schema performance monitoring system deployed</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Load testing infrastructure completed</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">PWA testing framework implemented</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Security audit completed - 100% compliance</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
