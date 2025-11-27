/**
 * Billing & Subscription Management Page
 *
 * Allows users to view their subscription, manage payment methods, and access billing portal
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Users,
  FolderOpen,
  FileText,
  HardDrive,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface SubscriptionData {
  subscription: {
    tier: string;
    status: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  usage: {
    userCount: number;
    projectCount: number;
    traCount: number;
    storageGB: number;
  };
  limits?: {
    maxUsers: number;
    maxProjects: number;
    maxTRAs: number;
    maxStorageGB: number;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for success/cancel params from Stripe redirect
  useEffect(() => {
    if (!searchParams) return;

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success) {
      // Show success message
      alert("Abonnement succesvol geactiveerd!");
      // Clean URL
      router.replace("/billing");
    } else if (canceled) {
      // Show canceled message
      alert("Checkout geannuleerd. U kunt het later opnieuw proberen.");
      // Clean URL
      router.replace("/billing");
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch("/api/stripe/subscription", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const subscriptionData = await response.json();
      setData(subscriptionData);
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      console.error("Error creating portal session:", err);
      alert(err.message || "Er is een fout opgetreden. Probeer het opnieuw.");
      setPortalLoading(false);
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === 999999) return 0; // Unlimited
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "trial":
        return "text-blue-600 bg-blue-100";
      case "past_due":
        return "text-red-600 bg-red-100";
      case "canceled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Actief";
      case "trial":
        return "Proefperiode";
      case "past_due":
        return "Betaling Achterstallig";
      case "canceled":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case "starter":
        return "Starter";
      case "professional":
        return "Professional";
      case "enterprise":
        return "Enterprise";
      case "trial":
        return "Trial";
      default:
        return tier;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fout bij laden</h2>
          <p className="text-gray-600 mb-4">{error || "Kon abonnementsgegevens niet laden"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { subscription, usage, limits } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Facturering & Abonnement</h1>
          <p className="text-gray-600 mt-2">Beheer uw abonnement en bekijk uw gebruik</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Huidig Abonnement</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {getTierName(subscription.tier)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}
                >
                  {getStatusText(subscription.status)}
                </span>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading || !subscription.stripeCustomerId}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? (
                "Laden..."
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Beheer Abonnement
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {subscription.status === "trial" && subscription.trialEndsAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Proefperiode actief</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Uw proefperiode eindigt op{" "}
                    {new Date(subscription.trialEndsAt).toLocaleDateString("nl-NL")}. Kies een
                    abonnement om door te gaan na de proefperiode.
                  </p>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Bekijk Abonnementen →
                  </button>
                </div>
              </div>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Abonnement wordt geannuleerd</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Uw abonnement eindigt op{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("nl-NL")}. U kunt
                    het abonnement heractiveren via de billing portal.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Volgende Factuurdatum</p>
                <p className="font-medium text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("nl-NL")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Factureringsinterval</p>
                <p className="font-medium text-gray-900">Maandelijks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Gebruik</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Gebruikers</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.userCount} / {limits?.maxUsers === 999999 ? "∞" : limits?.maxUsers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${getUsagePercentage(usage.userCount, limits?.maxUsers || 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Projecten</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.projectCount} /{" "}
                  {limits?.maxProjects === 999999 ? "∞" : limits?.maxProjects}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${getUsagePercentage(usage.projectCount, limits?.maxProjects || 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* TRAs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">TRA's</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.traCount} / {limits?.maxTRAs === 999999 ? "∞" : limits?.maxTRAs}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${getUsagePercentage(usage.traCount, limits?.maxTRAs || 0)}%` }}
                />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Opslag</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.storageGB.toFixed(1)} GB / {limits?.maxStorageGB} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${getUsagePercentage(usage.storageGB, limits?.maxStorageGB || 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade prompt if approaching limits */}
          {(getUsagePercentage(usage.userCount, limits?.maxUsers || 0) >= 80 ||
            getUsagePercentage(usage.projectCount, limits?.maxProjects || 0) >= 80 ||
            getUsagePercentage(usage.traCount, limits?.maxTRAs || 0) >= 80) && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">U nadert uw limieten</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Overweeg een upgrade naar een hoger abonnement om meer capaciteit te krijgen.
                  </p>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="mt-3 text-sm font-medium text-yellow-600 hover:text-yellow-700"
                  >
                    Bekijk Upgrade Opties →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push("/pricing")}
            className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Upgrade Abonnement</h3>
            <p className="text-sm text-gray-600">
              Krijg toegang tot meer features en hogere limieten
            </p>
          </button>

          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left disabled:opacity-50"
          >
            <CreditCard className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Betaalmethode</h3>
            <p className="text-sm text-gray-600">Wijzig uw betaalmethode of bekijk facturen</p>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <CheckCircle className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Terug naar Dashboard</h3>
            <p className="text-sm text-gray-600">Ga terug naar uw hoofddashboard</p>
          </button>
        </div>
      </div>
    </div>
  );
}
