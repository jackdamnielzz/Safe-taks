"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy load LMRAWizard component for better performance
const LMRAWizard = dynamic(() => import("@/components/lmra/LMRAWizard"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-slate-600">LMRA wizard laden...</span>
    </div>
  ),
  ssr: false,
});

export default function LMRAExecutePage() {
  // TODO: Get user info from auth context
  const userId = "user-demo";
  const userName = "Jan de Vries";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Terug naar Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">LMRA Uitvoeren</h1>
            </div>
            <div className="text-sm text-gray-500">
              {userName} • {new Date().toLocaleDateString("nl-NL")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Last Minute Risicoanalyse (LMRA)
            </h2>
            <p className="text-gray-600">
              Voer een gestructureerde LMRA uit voordat u begint met de werkzaamheden. Deze analyse
              helpt bij het identificeren van mogelijke gevaren en het beoordelen van risico's ter
              plaatse.
            </p>
          </div>

          {/* LMRA Wizard */}
          <LMRAWizard userId={userId} userName={userName} />
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Tips voor een succesvolle LMRA
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Neem de tijd om elke stap grondig door te lopen</li>
            <li>• Raadpleeg collega's bij twijfel over veiligheid</li>
            <li>• Documenteer alle bevindingen en risico's</li>
            <li>• Bij gevaar: gebruik direct de Stop-Work functionaliteit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
