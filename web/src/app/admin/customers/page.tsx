"use client";

/**
 * Customer Management Portal - Multi-Tenant Customer Oversight Interface
 *
 * Comprehensive admin interface for managing all customers, their organizations,
 * subscriptions, and providing complete oversight of the multi-tenant system.
 *
 * Features:
 * - Customer and organization management across all tenants
 * - Subscription and billing oversight
 * - User activity and engagement monitoring
 * - Multi-tenant data isolation validation
 * - Customer support and issue tracking
 * - Usage analytics and reporting
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Building,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Download,
  RefreshCw,
  Shield,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface Customer {
  id: string;
  organizationId: string;
  organizationName: string;
  subscriptionTier: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "suspended" | "cancelled";
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTRAs: number;
  totalLMRAs: number;
  lastActivity: Date;
  createdAt: Date;
  trialEndsAt?: Date;
  mrr: number; // Monthly Recurring Revenue
  location: {
    country: string;
    city: string;
  };
  industry: string;
  primaryContact: {
    name: string;
    email: string;
    role: string;
  };
}

interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  trialCustomers: number;
  totalMRR: number;
  averageMRR: number;
  churnRate: number;
  growthRate: number;
  totalUsers: number;
  totalOrganizations: number;
}

export default function CustomerManagementPortalPage() {
  const { user, userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check if user is admin
  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  useEffect(() => {
    if (!isAdmin) return;
    loadCustomerData();
  }, [isAdmin]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // In production, this would fetch real customer data from APIs
      const mockCustomers: Customer[] = [
        {
          id: "1",
          organizationId: "org_1",
          organizationName: "BouwGroep Nederland B.V.",
          subscriptionTier: "professional",
          status: "active",
          totalUsers: 25,
          activeUsers: 22,
          totalProjects: 45,
          totalTRAs: 234,
          totalLMRAs: 567,
          lastActivity: new Date("2025-10-08T08:30:00"),
          createdAt: new Date("2024-03-15"),
          mrr: 149,
          location: { country: "Netherlands", city: "Amsterdam" },
          industry: "Construction",
          primaryContact: {
            name: "Jan de Vries",
            email: "jan@bouwgroep.nl",
            role: "Safety Manager",
          },
        },
        {
          id: "2",
          organizationId: "org_2",
          organizationName: "TechConstruct B.V.",
          subscriptionTier: "enterprise",
          status: "active",
          totalUsers: 150,
          activeUsers: 132,
          totalProjects: 89,
          totalTRAs: 456,
          totalLMRAs: 1234,
          lastActivity: new Date("2025-10-08T09:15:00"),
          createdAt: new Date("2023-11-20"),
          mrr: 499,
          location: { country: "Netherlands", city: "Rotterdam" },
          industry: "Industrial",
          primaryContact: {
            name: "Maria Jansen",
            email: "maria@techconstruct.nl",
            role: "Operations Director",
          },
        },
        {
          id: "3",
          organizationId: "org_3",
          organizationName: "Industriebouw Plus",
          subscriptionTier: "starter",
          status: "trial",
          totalUsers: 8,
          activeUsers: 7,
          totalProjects: 12,
          totalTRAs: 34,
          totalLMRAs: 78,
          lastActivity: new Date("2025-10-07T16:45:00"),
          createdAt: new Date("2025-09-25"),
          trialEndsAt: new Date("2025-10-09"),
          mrr: 49,
          location: { country: "Netherlands", city: "Eindhoven" },
          industry: "Manufacturing",
          primaryContact: {
            name: "Peter Bakker",
            email: "peter@industriebouw.nl",
            role: "Safety Coordinator",
          },
        },
      ];

      const mockMetrics: CustomerMetrics = {
        totalCustomers: 156,
        activeCustomers: 142,
        trialCustomers: 14,
        totalMRR: 28450,
        averageMRR: 182,
        churnRate: 2.3,
        growthRate: 12.5,
        totalUsers: 1247,
        totalOrganizations: 156,
      };

      setCustomers(mockCustomers);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.primaryContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = filterTier === "all" || customer.subscriptionTier === filterTier;
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesTier && matchesStatus;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "text-purple-600 bg-purple-100";
      case "professional":
        return "text-blue-600 bg-blue-100";
      case "starter":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "trial":
        return "text-blue-600";
      case "suspended":
        return "text-red-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access customer management. Admin role required.
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
          <span>Loading customer data...</span>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management Portal</h1>
            <p className="text-gray-600">
              Complete oversight of all customers and their multi-tenant organizations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
            <Button onClick={loadCustomerData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeCustomers} active, {metrics.trialCustomers} in trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalMRR)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(metrics.averageMRR)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{metrics.growthRate}%</div>
              <p className="text-xs text-muted-foreground">Monthly growth</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all organizations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold">{customer.organizationName}</h3>
                      <Badge className={getTierColor(customer.subscriptionTier)}>
                        {customer.subscriptionTier.charAt(0).toUpperCase() +
                          customer.subscriptionTier.slice(1)}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(customer.status)}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {customer.activeUsers}/{customer.totalUsers} users
                      </span>
                      <span className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {customer.totalProjects} projects
                      </span>
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {customer.totalTRAs} TRAs, {customer.totalLMRAs} LMRAs
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Last active: {formatDate(customer.lastActivity)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {customer.location.city}, {customer.location.country}
                      </span>
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {customer.primaryContact.email}
                      </span>
                      <span className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-1" />
                        {customer.primaryContact.name} ({customer.primaryContact.role})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(customer.mrr)}</div>
                    <div className="text-sm text-gray-600">MRR</div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Trial Warning */}
              {customer.status === "trial" && customer.trialEndsAt && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      Trial ends on {formatDate(customer.trialEndsAt)}(
                      {Math.ceil(
                        (customer.trialEndsAt.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days remaining)
                    </span>
                  </div>
                </div>
              )}

              {/* Usage Summary */}
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {((customer.activeUsers / customer.totalUsers) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">User Activation</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{customer.totalTRAs}</div>
                  <div className="text-xs text-gray-600">Total TRAs</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{customer.totalLMRAs}</div>
                  <div className="text-xs text-gray-600">Total LMRAs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterTier !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No customers in the system yet."}
            </p>
            {(searchTerm || filterTier !== "all" || filterStatus !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterTier("all");
                  setFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Analytics */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Customer Analytics</span>
          </CardTitle>
          <CardDescription>Overview of customer behavior and platform usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Subscription Tiers</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Starter</span>
                  </div>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Professional</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Enterprise</span>
                  </div>
                  <span className="text-sm font-medium">32%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Customer Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active</span>
                  </div>
                  <span className="text-sm font-medium">91%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Trial</span>
                  </div>
                  <span className="text-sm font-medium">9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Suspended</span>
                  </div>
                  <span className="text-sm font-medium">0%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Key Metrics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Average Users per Customer</span>
                    <span className="font-medium">8.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "64%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Average Projects per Customer</span>
                    <span className="font-medium">21.9</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Adoption</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: "94%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
