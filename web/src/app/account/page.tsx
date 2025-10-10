"use client";

import React, { useState, useEffect } from "react";

/**
 * Account Page - User Dashboard
 *
 * Features:
 * - User profile overview
 * - Subscription and usage limits
 * - Quick actions
 * - Recent activity
 * - Account management
 * - Dutch localization
 */
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import {
  SUBSCRIPTION_TIER_LIMITS,
  getSubscriptionTierName,
  type Organization,
  type OrganizationUsage,
  type OrganizationLimits
} from "@/lib/types/organization";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  traApprovals: boolean;
  traRejected: boolean;
  traOverdue: boolean;
  lmraAlerts: boolean;
  lmraStopWork: boolean;
  lmraCompleted: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
  stopWorkAlerts: boolean;
  safetyIncidents: boolean;
  equipmentIssues: boolean;
  weatherAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface PrivacySettings {
  dataExportRequested: boolean;
  dataDeletionRequested: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  locationTracking: boolean;
}

export default function AccountPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const router = useRouter();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Organization data
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    traApprovals: true,
    traRejected: true,
    traOverdue: true,
    lmraAlerts: true,
    lmraStopWork: true,
    lmraCompleted: true,
    systemUpdates: false,
    weeklyReports: false,
    stopWorkAlerts: true,
    safetyIncidents: true,
    equipmentIssues: false,
    weatherAlerts: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    dataExportRequested: false,
    dataDeletionRequested: false,
    marketingEmails: false,
    analyticsTracking: true,
    locationTracking: true,
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Load user data
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || "");
      setLastName(userProfile.lastName || "");
      setEmail(userProfile.email || "");
    }
  }, [userProfile]);

  // Load organization data
  useEffect(() => {
    const loadOrganization = async () => {
      if (!userProfile?.organizationId) {
        setOrgLoading(false);
        return;
      }

      try {
        const orgRef = doc(db, "organizations", userProfile.organizationId);
        const orgSnap = await getDoc(orgRef);
        
        if (orgSnap.exists()) {
          setOrganization(orgSnap.data() as Organization);
        }
      } catch (error) {
        console.error("Error loading organization:", error);
      } finally {
        setOrgLoading(false);
      }
    };

    loadOrganization();
  }, [userProfile?.organizationId]);

  // Calculate usage percentages
  const getUsagePercentage = (current: number, max: number) => {
    if (max === 999999) return 0; // Enterprise unlimited
    return Math.round((current / max) * 100);
  };

  const usage = organization?.usage;
  const limits = organization?.limits || SUBSCRIPTION_TIER_LIMITS[organization?.subscription?.tier || 'trial'];
  const subscriptionTier = organization?.subscription?.tier || 'trial';
  const subscriptionStatus = organization?.subscription?.status || 'trial';

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        firstName,
        lastName,
        email,
      });
      // Show success message
    } catch (error) {
      console.error("Error updating profile:", error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    try {
      // TODO: Save notification settings to Firestore
      console.log("Saving notification settings:", notifications);
      // Show success message
    } catch (error) {
      console.error("Error updating notifications:", error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    setSaving(true);
    try {
      // TODO: Save privacy settings to Firestore
      console.log("Saving privacy settings:", privacy);
      // Show success message
    } catch (error) {
      console.error("Error updating privacy:", error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // TODO: Implement password change
    console.log("Password change requested");
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // TODO: Trigger GDPR data export
      const response = await fetch("/api/gdpr/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setPrivacy(prev => ({ ...prev, dataExportRequested: true }));
        setShowExportModal(false);
        // Show success message
      }
    } catch (error) {
      console.error("Error requesting data export:", error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== "VERWIJDER MIJN ACCOUNT") {
      return;
    }

    setLoading(true);
    try {
      // TODO: Trigger GDPR account deletion
      const response = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        // Sign out and redirect to home
        router.push("/");
      }
    } catch (error) {
      console.error("Error requesting account deletion:", error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const canManageOrganization = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Dashboard</h1>
        <p className="text-gray-600">
          Volledig overzicht en beheer van je SafeWork Pro account
        </p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Overview Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                {userProfile?.firstName?.[0] || "J"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {userProfile?.firstName} {userProfile?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{userProfile?.email}</p>
                <Badge
                  className={
                    userProfile?.role === "admin"
                      ? "bg-red-100 text-red-800 mt-1"
                      : userProfile?.role === "safety_manager"
                        ? "bg-orange-100 text-orange-800 mt-1"
                        : userProfile?.role === "supervisor"
                          ? "bg-blue-100 text-blue-800 mt-1"
                          : "bg-green-100 text-green-800 mt-1"
                  }
                >
                  {userProfile?.role === "admin" && "Administrator"}
                  {userProfile?.role === "safety_manager" && "Veiligheidsmanager"}
                  {userProfile?.role === "supervisor" && "Supervisor"}
                  {userProfile?.role === "field_worker" && "Veldmedewerker"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Abonnement</h3>
                <p className="text-sm text-gray-600">
                  {getSubscriptionTierName(subscriptionTier)}
                </p>
              </div>
              <Badge
                className={
                  subscriptionStatus === 'trial'
                    ? 'bg-blue-100 text-blue-800'
                    : subscriptionStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                }
              >
                {subscriptionStatus === 'trial' && 'Proefperiode'}
                {subscriptionStatus === 'active' && 'Actief'}
                {subscriptionStatus === 'past_due' && 'Achterstallig'}
                {subscriptionStatus === 'canceled' && 'Geannuleerd'}
              </Badge>
            </div>
            {subscriptionStatus === 'trial' && organization?.subscription?.trialEndsAt && (
              <p className="text-xs text-orange-600 mb-2">
                Proefperiode eindigt over {Math.ceil((new Date(organization.subscription.trialEndsAt as any).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dagen
              </p>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/billing")}
              className="w-full"
            >
              Beheer Abonnement
            </Button>
          </div>
        </Card>

        {/* Account Status Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Account Status</h3>
                <p className="text-sm text-gray-600">Actief en beveiligd</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="success" className="mb-2">Actief</Badge>
                <p className="text-xs text-gray-500">GDPR Compliant</p>
              </div>
            </div>
          </div>
        </Card>
      </div>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={() => router.push("/tras")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">Nieuwe TRA</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={() => router.push("/mobile")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">LMRA Starten</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={() => router.push("/reports")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">Rapporten</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={() => router.push("/team")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm">Team Beheer</span>
        </Button>
      </div>

      {/* Essential Settings - Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quick Profile Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Profiel</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                Geavanceerd →
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {userProfile?.firstName?.[0] || "J"}
                </div>
                <div>
                  <div className="font-medium">{userProfile?.firstName} {userProfile?.lastName}</div>
                  <div className="text-sm text-gray-600">{userProfile?.email}</div>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => router.push("/settings")}>
                  Profiel Bewerken
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Notification Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Notificaties</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                Geavanceerd →
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">E-mail Notificaties</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-orange-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Push Notificaties</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-orange-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stop Work Alerts</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-orange-600 rounded" />
              </div>

              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => router.push("/settings")}>
                  Alle Notificaties Beheren
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Links */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Beheer</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => router.push("/settings")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Gedetailleerde Instellingen</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setShowExportModal(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Gegevens Exporteren</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteModal(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm">Account Verwijderen</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recente Activiteit</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Laatste login</div>
                <div className="text-xs text-gray-600">Vandaag om 14:03</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Laatste LMRA sessie</div>
                <div className="text-xs text-gray-600">2 uur geleden - Bouwplaats Amsterdam</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Laatste TRA update</div>
                <div className="text-xs text-gray-600">Gisteren - Hoogwerkzaamheden Protocol</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Gegevens Exporteren"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            We zullen alle persoonlijke gegevens die we over je hebben verzamelen en deze
            binnen 24 uur naar je e-mailadres sturen.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Wat wordt geëxporteerd:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Persoonlijke profiel informatie</li>
              <li>• TRA's die je hebt aangemaakt</li>
              <li>• LMRA sessies die je hebt uitgevoerd</li>
              <li>• Comments en approvals</li>
              <li>• Uploads en foto's</li>
              <li>• Consent preferences</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleDataExport} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : null}
              Export Aanvragen
            </Button>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Deletion Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Account Verwijderen"
      >
        <div className="space-y-4">
          <Alert variant="error">
            <strong>Waarschuwing:</strong> Deze actie kan niet ongedaan worden gemaakt.
            Alle persoonlijke gegevens worden permanent verwijderd.
          </Alert>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Wat er gebeurt:</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Je account wordt gedeactiveerd</li>
              <li>• Persoonlijke gegevens worden na 30 dagen verwijderd</li>
              <li>• Veiligheidsgegevens blijven 7 jaar bewaard (wettelijke verplichting)</li>
              <li>• Je wordt uitgelogd van alle apparaten</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "VERWIJDER MIJN ACCOUNT" om te bevestigen:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="VERWIJDER MIJN ACCOUNT"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleAccountDeletion}
              disabled={deleteConfirmation !== "VERWIJDER MIJN ACCOUNT" || loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              Account Permanent Verwijderen
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}