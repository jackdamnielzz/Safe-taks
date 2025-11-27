import React from "react";

export const OfflineCapability = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-block px-4 py-1 bg-blue-50 rounded-full">
              <span className="text-blue-600 font-bold text-sm tracking-wide uppercase">
                Progressive Web App
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-brand-dark-900 leading-tight">
              Geen internet? <br />
              <span className="text-blue-600">Geen probleem.</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              SafeWork Pro werkt volledig offline. Uw team kan LMRA's uitvoeren, TRA's raadplegen
              en foto's maken zonder actieve internetverbinding. Zodra u weer online bent,
              synchroniseert alles automatisch.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  📲
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-dark-900">Installeer als App</h3>
                  <p className="text-gray-600 mt-1">
                    Voeg SafeWork Pro toe aan het startscherm van uw telefoon of tablet. Geen App
                    Store nodig.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  💾
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-dark-900">Smart Caching</h3>
                  <p className="text-gray-600 mt-1">
                    Belangrijke data zoals projecten en sjablonen worden lokaal opgeslagen voor
                    razendsnelle toegang.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-dark-900">Auto-Sync</h3>
                  <p className="text-gray-600 mt-1">
                    Werk rustig door. Wij zorgen dat uw data veilig naar de cloud wordt verstuurd
                    zodra het kan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-10 rounded-full"></div>
            <div className="relative bg-gradient-to-br from-brand-dark-900 to-brand-dark-800 rounded-2xl shadow-2xl p-8 border border-brand-dark-700 text-white">
              {/* Phone Mockup - Offline State */}
              <div className="bg-white text-brand-dark-900 rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto">
                <div className="bg-brand-dark-900 px-4 py-3 flex items-center justify-between">
                  <span className="font-semibold text-white">LMRA Wizard</span>
                  <div className="flex items-center gap-2 bg-white/10 px-2 py-0.5 rounded text-xs text-white">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Offline
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414-1.414m-1.414 1.414L3 3m8.293 8.293l1.414 1.414"
                      />
                    </svg>
                    <span className="text-sm text-orange-800 font-medium">
                      Offline modus actief. Data wordt lokaal opgeslagen.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>

                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-3 bg-brand-dark-900 text-white rounded-lg font-semibold shadow-lg">
                    Opslaan op Apparaat
                  </button>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Data versleuteld opgeslagen
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};