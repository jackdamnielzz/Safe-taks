"use client";

/**
 * Cohort Analysis Page
 * User retention and cohort tracking dashboard
 */

import { useAuth } from "@/components/AuthProvider";
import { CohortRetentionTable } from "@/components/analytics/CohortRetentionTable";
import { Alert } from "@/components/ui/Alert";

export default function CohortsPage() {
  const { userProfile } = useAuth();

  // Check if user is admin or safety manager
  const canViewCohorts = userProfile?.role === "admin" || userProfile?.role === "safety_manager";

  if (!canViewCohorts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Je hebt geen toegang tot deze pagina. Alleen admins en safety managers kunnen cohort
          analyse bekijken.
        </Alert>
      </div>
    );
  }

  if (!userProfile?.organizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">Geen organisatie gevonden. Log opnieuw in.</Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cohort Analyse</h1>
        <p className="text-gray-600">Gebruiker retentie en cohort tracking voor uw organisatie</p>
      </div>

      {/* Cohort Retention Table */}
      <CohortRetentionTable organizationId={userProfile.organizationId} period="monthly" />

      {/* Help Section */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Over Cohort Analyse</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Cohort:</strong> Een groep gebruikers die zich in dezelfde periode hebben
            geregistreerd.
          </p>
          <p>
            <strong>Dag 1 Retentie:</strong> Percentage gebruikers dat binnen 1 dag na registratie
            actief was.
          </p>
          <p>
            <strong>Dag 7 Retentie:</strong> Percentage gebruikers dat binnen 7 dagen na registratie
            actief was.
          </p>
          <p>
            <strong>Dag 30 Retentie:</strong> Percentage gebruikers dat binnen 30 dagen na
            registratie actief was.
          </p>
          <p>
            <strong>Gezondheid Score:</strong> Gewogen gemiddelde van alle retentie metrics (0-100).
          </p>
          <p className="mt-4">
            <strong>Kleuren:</strong>
            <span className="ml-2 inline-block w-3 h-3 rounded-full bg-green-500"></span> Uitstekend
            (≥80%)
            <span className="ml-2 inline-block w-3 h-3 rounded-full bg-lime-500"></span> Goed
            (60-80%)
            <span className="ml-2 inline-block w-3 h-3 rounded-full bg-orange-500"></span> Matig
            (40-60%)
            <span className="ml-2 inline-block w-3 h-3 rounded-full bg-red-500"></span> Kritiek
            (&lt;40%)
          </p>
        </div>
      </div>
    </div>
  );
}
