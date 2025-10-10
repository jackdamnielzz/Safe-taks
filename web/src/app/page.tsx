import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Welcome Section - Modern gradient hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welkom bij SafeWork Pro
          </h1>
          <p className="text-indigo-50 text-lg max-w-3xl">
            Uw complete oplossing voor Taak Risicoanalyses (TRA) en Last Minute Risicoanalyses
            (LMRA). Beheer veiligheidsprocessen, voer risicobeoordelingen uit en genereer rapporten.
          </p>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Actions Grid - Modern card design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create TRA Card */}
        <div
          className="group bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1"
          data-tour="create-tra"
        >
          <div className="flex items-center mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/50 transition-shadow">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="ml-4 text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
              TRA Aanmaken
            </h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Maak een nieuwe Taak Risicoanalyse aan. Identificeer gevaren, beoordeel risico's en
            bepaal beheersingsmaatregelen.
          </p>
          <Link
            href="/tras/create"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Nieuwe TRA
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>

        {/* Execute LMRA Card */}
        <div
          className="group bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-2xl hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1"
          data-tour="execute-lmra"
        >
          <div className="flex items-center mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-shadow">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="ml-4 text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              LMRA Uitvoeren
            </h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Voer een Last Minute Risicoanalyse uit op de werkplek. Controleer omgevingsfactoren en
            teamgereedheid.
          </p>
          <Link
            href="/lmra/execute"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Start LMRA
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>
        </div>

        {/* View Reports Card */}
        <div
          className="group bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
          data-tour="view-reports"
        >
          <div className="flex items-center mb-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="ml-4 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Rapporten
            </h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Bekijk uitgebreide rapporten over veiligheidsprestaties, risicotrends en
            compliance-gegevens.
          </p>
          <Link
            href="/reports"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Rapporten
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Statistics Overview - Modern cards with icons */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
          Overzicht
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-orange-600">12</div>
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-orange-900">Actieve TRA's</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-green-900">Voltooide LMRA's</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-blue-900">In Beoordeling</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl font-bold text-red-600">1</div>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center animate-pulse">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-red-900">Actie Vereist</div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Modern timeline style */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></span>
          Recente Activiteit
        </h2>
        <div className="space-y-4">
          <div className="group flex items-center p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <span className="text-sm font-medium text-gray-900">
                TRA-001 "Dakwerkzaamheden" is goedgekeurd
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              2 uur geleden
            </span>
          </div>
          <div className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <span className="text-sm font-medium text-gray-900">
                LMRA uitgevoerd voor Project Alpha
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              4 uur geleden
            </span>
          </div>
          <div className="group flex items-center p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-200 hover:border-orange-300 hover:shadow-md transition-all">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <span className="text-sm font-medium text-gray-900">
                Nieuwe TRA "Elektra installatie" aangemaakt
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              6 uur geleden
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
