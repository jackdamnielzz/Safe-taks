import React from "react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#fff8e6]/40 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fff8e6] border border-[#ffd699] rounded-full text-[#995300] text-sm font-semibold shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Ontworpen voor VCA-processen & digitaal veiligheidsbeheer
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#091e42] leading-tight tracking-tight">
              Veilig werken begint met{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8b00] to-[#cc6f00]">
                SafeWork Pro
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
              Digitaliseer uw TRA's en LMRA's. Verhoog veiligheid, verlaag risico's en werk volgens
              herkenbare VCA-werkprocessen.
            </p>

            <div className="space-y-4">
              {[
                { icon: "⚡", text: "Klaar in 5 minuten - geen IT-kennis vereist" },
                { icon: "📱", text: "Werkt offline op mobiel en tablet" },
                { icon: "🔒", text: "GDPR-bewust ontwerp met sterke beveiliging" },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {benefit.icon}
                  </span>
                  <span className="text-gray-700 font-medium group-hover:text-brand-dark-700 transition-colors">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-gradient-to-r from-[#ff8b00] to-[#cc6f00] text-white font-bold rounded-xl hover:from-[#cc6f00] hover:to-[#995300] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
              >
                Start 14 Dagen Gratis
              </Link>
              <button className="px-8 py-4 bg-white text-[#091e42] font-semibold rounded-xl border-2 border-gray-200 hover:border-[#ff8b00] hover:text-[#cc6f00] transition-all text-center shadow-sm hover:shadow-md">
                📺 Bekijk Demo
              </button>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white shadow-sm"
                  ></div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-bold text-[#091e42]">Gemaakt voor teams</div>
                <div>in de bouw en industrie</div>
              </div>
            </div>
          </div>

          {/* Hero Visual/App Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#ff8b00] blur-[100px] opacity-20 rounded-full"></div>
            <div className="relative bg-gradient-to-br from-[#091e42] to-[#071835] rounded-2xl shadow-2xl p-2 sm:p-4 border border-[#051228] transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header of Mockup */}
                <div className="bg-gradient-to-r from-[#ff8b00] to-[#cc6f00] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white font-medium tracking-wide">
                      Live Systeem
                    </span>
                  </div>
                </div>

                {/* Content of Mockup */}
                <div className="p-6 space-y-6 bg-gray-50/50">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Actieve Projecten", value: "12", color: "text-[#cc6f00]" },
                      { label: "Veiligheidsscore", value: "98%", color: "text-green-600" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                          {stat.label}
                        </div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Activity Feed Mockup */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                      Recente Activiteit
                    </div>
                    {[
                      {
                        text: "TRA-2024-001 Goedgekeurd",
                        time: "2m geleden",
                        icon: "✓",
                        bg: "bg-green-100 text-green-700",
                      },
                      {
                        text: "Nieuw Risico Gemeld",
                        time: "15m geleden",
                        icon: "!",
                        bg: "bg-red-100 text-red-700",
                      },
                      {
                        text: "LMRA Sync Voltooid",
                        time: "1u geleden",
                        icon: "↻",
                        bg: "bg-blue-100 text-blue-700",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${item.bg}`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.text}</div>
                        </div>
                        <div className="text-xs text-gray-400">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Alles operationeel</div>
                    <div className="text-xs text-gray-500">Ondersteunt VCA-audits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};