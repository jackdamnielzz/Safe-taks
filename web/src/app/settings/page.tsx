"use client";

import React, { useState, useEffect } from "react";

/**
 * Settings Page - User and Organization Settings Management
 *
 * Features:
 * - User profile settings (name, email, avatar)
 * - Organization settings (for admin/safety_manager roles)
 * - Notification preferences
 * - Privacy and GDPR settings
 * - Account management (password, delete account)
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

export default function SettingsPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const router = useRouter();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        setPrivacy((prev) => ({ ...prev, dataExportRequested: true }));
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

  const canManageOrganization =
    userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instellingen</h1>
        <p className="text-gray-600">Beheer je profiel, notificaties en privacy-instellingen</p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profiel Instellingen</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Je voornaam"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Je achternaam"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mailadres</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="je@email.nl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : null}
                  Wijzigingen Opslaan
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Organization Settings */}
        {canManageOrganization && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Organisatie Instellingen</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisatie ID
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {userProfile?.organizationId || "Niet ingesteld"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Je Rol</label>
                    <Badge
                      className={
                        userProfile?.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : userProfile?.role === "safety_manager"
                            ? "bg-orange-100 text-orange-800"
                            : userProfile?.role === "supervisor"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                      }
                    >
                      {userProfile?.role === "admin" && "Administrator"}
                      {userProfile?.role === "safety_manager" && "Veiligheidsmanager"}
                      {userProfile?.role === "supervisor" && "Supervisor"}
                      {userProfile?.role === "field_worker" && "Veldmedewerker"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="secondary" onClick={() => router.push("/admin/hub")}>
                    Beheer Organisatie →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notification Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notificatie Voorkeuren</h2>

            <div className="space-y-6">
              {/* Communication Channels */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Communicatiekanalen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">E-mail Notificaties</label>
                      <p className="text-sm text-gray-600">Ontvang notificaties via e-mail</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          emailNotifications: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Push Notificaties</label>
                      <p className="text-sm text-gray-600">Ontvang push notificaties in browser</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          pushNotifications: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">SMS Notificaties</label>
                      <p className="text-sm text-gray-600">
                        Ontvang notificaties via SMS (premie functie)
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          smsNotifications: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* TRA Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">TRA Notificaties</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">TRA Goedkeuringen</label>
                      <p className="text-sm text-gray-600">Notificaties bij TRA goedkeuringen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.traApprovals}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          traApprovals: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">TRA Afgewezen</label>
                      <p className="text-sm text-gray-600">Notificaties bij afgewezen TRA's</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.traRejected}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          traRejected: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">TRA Overdue</label>
                      <p className="text-sm text-gray-600">Notificaties bij verlopen TRA's</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.traOverdue}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          traOverdue: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* LMRA Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">LMRA Notificaties</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">LMRA Alerts</label>
                      <p className="text-sm text-gray-600">Notificaties bij nieuwe LMRA sessies</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.lmraAlerts}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          lmraAlerts: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">LMRA Stop Work</label>
                      <p className="text-sm text-gray-600">Kritieke stop work meldingen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.lmraStopWork}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          lmraStopWork: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">LMRA Voltooid</label>
                      <p className="text-sm text-gray-600">Notificaties bij voltooide LMRA's</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.lmraCompleted}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          lmraCompleted: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Safety Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Veiligheidsnotificaties</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Stop Work Alerts</label>
                      <p className="text-sm text-gray-600">
                        Kritieke stop work notificaties (altijd aanbevolen)
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.stopWorkAlerts}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          stopWorkAlerts: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Veiligheidsincidenten</label>
                      <p className="text-sm text-gray-600">
                        Notificaties bij veiligheidsincidenten
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.safetyIncidents}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          safetyIncidents: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Apparatuur Problemen</label>
                      <p className="text-sm text-gray-600">Notificaties bij equipment issues</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.equipmentIssues}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          equipmentIssues: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Weer Waarschuwingen</label>
                      <p className="text-sm text-gray-600">
                        Notificaties bij extreme weercondities
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weatherAlerts}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weatherAlerts: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* System Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Systeemnotificaties</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Systeem Updates</label>
                      <p className="text-sm text-gray-600">Notificaties bij systeem updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.systemUpdates}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          systemUpdates: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Wekelijkse Rapporten</label>
                      <p className="text-sm text-gray-600">
                        Automatische wekelijkse veiligheidsrapporten
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReports}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weeklyReports: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Quiet Hours */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Rusturen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Rusturen Inschakelen</label>
                      <p className="text-sm text-gray-600">Geen notificaties tijdens rusturen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.quietHoursEnabled}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          quietHoursEnabled: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-orange-600 rounded"
                    />
                  </div>

                  {notifications.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Tijd
                        </label>
                        <input
                          type="time"
                          value={notifications.quietHoursStart}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              quietHoursStart: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Eind Tijd
                        </label>
                        <input
                          type="time"
                          value={notifications.quietHoursEnd}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              quietHoursEnd: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleNotificationSave} disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : null}
                  Notificaties Opslaan
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Privacy & GDPR</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Marketing E-mails</label>
                  <p className="text-sm text-gray-600">Ontvang marketing en product updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.marketingEmails}
                  onChange={(e) =>
                    setPrivacy((prev) => ({
                      ...prev,
                      marketingEmails: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Analytics Tracking</label>
                  <p className="text-sm text-gray-600">Help verbeter de app met gebruiksanalyse</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.analyticsTracking}
                  onChange={(e) =>
                    setPrivacy((prev) => ({
                      ...prev,
                      analyticsTracking: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Locatie Tracking</label>
                  <p className="text-sm text-gray-600">
                    Sta locatie tracking toe voor LMRA verificatie
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.locationTracking}
                  onChange={(e) =>
                    setPrivacy((prev) => ({
                      ...prev,
                      locationTracking: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-orange-600 rounded"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handlePrivacySave} disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : null}
                  Privacy Instellingen Opslaan
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* GDPR Data Management */}
        <Card className="border-red-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Gegevensbeheer (GDPR)</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Exporteer Mijn Gegevens</div>
                  <div className="text-sm text-gray-600">
                    Download alle persoonlijke gegevens in JSON/CSV formaat
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowExportModal(true)}
                  disabled={privacy.dataExportRequested}
                >
                  {privacy.dataExportRequested ? "Geëxporteerd" : "Exporteren"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-red-900">Account Verwijderen</div>
                  <div className="text-sm text-red-700">
                    Verwijder permanent je account en alle persoonlijke gegevens
                  </div>
                </div>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  Account Verwijderen
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account Beheer</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Wachtwoord Wijzigen</h3>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handlePasswordChange}>
                    Wachtwoord Wijzigen
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Actieve Sessies</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Je bent momenteel ingelogd op dit apparaat.
                </div>
                <Button variant="secondary" size="sm">
                  Alle Sessies Beëindigen
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Account Type</div>
                    <div className="text-sm text-gray-600">
                      {userProfile?.organizationId || "Persoonlijk Account"}
                    </div>
                  </div>
                  <Badge variant="info">Actief</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Gegevens Exporteren"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            We zullen alle persoonlijke gegevens die we over je hebben verzamelen en deze binnen 24
            uur naar je e-mailadres sturen.
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
            <strong>Waarschuwing:</strong> Deze actie kan niet ongedaan worden gemaakt. Alle
            persoonlijke gegevens worden permanent verwijderd.
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
