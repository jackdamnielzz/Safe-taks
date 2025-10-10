import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SafeWork Pro - TRA & LMRA Software voor Veilig Werken",
  description:
    "Digitaliseer uw veiligheidsprocessen met SafeWork Pro. Complete oplossing voor TRA en LMRA. VCA-compliant, mobiel en offline beschikbaar.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <span className="text-xl font-bold text-gray-900">SafeWork Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                Functies
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                Prijzen
              </a>
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-orange-600 transition-colors font-medium"
              >
                Inloggen
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                Gratis Proberen
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50 -z-10"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-200 rounded-full text-orange-700 text-sm font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                VCA-Compliant & ISO 45001 Gecertificeerd
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Veilig werken begint met{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                  SafeWork Pro
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Digitaliseer uw TRA's en LMRA's. Verhoog veiligheid, verlaag risico's en blijf
                compliant. De complete oplossing voor moderne veiligheidsmanagers.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "⚡", text: "Klaar in 5 minuten - geen IT-kennis vereist" },
                  { icon: "📱", text: "Werkt offline op mobiel en tablet" },
                  { icon: "🔒", text: "GDPR-compliant en ISO 27001 beveiligd" },
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-2xl">{benefit.icon}</span>
                    <span className="text-gray-700 font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                >
                  Start 14 Dagen Gratis
                </Link>
                <button className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-300 hover:border-orange-500 hover:text-orange-600 transition-all text-center">
                  📺 Bekijk Demo
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"
                    ></div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-semibold text-gray-900">500+ bedrijven</div>
                  <div>vertrouwen op SafeWork Pro</div>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-3 h-3 bg-white rounded-full"></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">SafeWork Pro</span>
                    {/* Offline Indicator Badge */}
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-medium">Offline Mode</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Offline Queue Indicator */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900">3 items in wachtrij</div>
                      <div className="text-xs text-blue-700">
                        Wordt gesynchroniseerd bij herverbinding
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-8 bg-orange-100 rounded-lg px-4 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 font-medium">12 Actieve TRA's</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Offline LMRA",
                        value: "5",
                        icon: "📱",
                        color: "from-green-50 to-green-100",
                      },
                      {
                        label: "Pending Sync",
                        value: "3",
                        icon: "🔄",
                        color: "from-blue-50 to-blue-100",
                      },
                      {
                        label: "Cached Data",
                        value: "45 MB",
                        icon: "💾",
                        color: "from-purple-50 to-purple-100",
                      },
                      {
                        label: "Last Sync",
                        value: "2m ago",
                        icon: "✓",
                        color: "from-gray-50 to-gray-100",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`bg-gradient-to-br ${item.color} p-4 rounded-lg border border-gray-200`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{item.icon}</span>
                          <div className="text-xs text-gray-600 font-medium">{item.label}</div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Real-time sync
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2">
                📱 Werkt zonder internet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Offline Capability */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hoe werkt offline? 🤔</h2>
            <p className="text-lg text-gray-600">
              SafeWork Pro is een Progressive Web App (PWA) - installeer eenmalig en werk altijd,
              overal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
                📲
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Installeer op telefoon</h3>
              <p className="text-gray-600">
                Bezoek SafeWork Pro in uw browser en klik op "Installeren". De app wordt toegevoegd
                aan uw startscherm.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
                💾
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Data wordt gecached</h3>
              <p className="text-gray-600">
                Alle TRA's, sjablonen en instellingen worden automatisch lokaal opgeslagen op uw
                device.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
                ✈️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Werk zonder internet</h3>
              <p className="text-gray-600">
                Open de geïnstalleerde app zonder internetverbinding. LMRA's worden lokaal
                opgeslagen en later automatisch gesynchroniseerd.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">
                  Perfect voor bouwplaatsen zonder WiFi
                </h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Uw field workers installeren SafeWork Pro eenmalig op hun telefoon (met internet).
                  Daarna werkt de app volledig zonder internetverbinding. Alle LMRA's worden lokaal
                  opgeslagen en synchroniseren automatisch zodra er weer internet is.
                  <strong className="text-blue-900"> Geen dataverlies, geen wachttijden!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Alles wat u nodig heeft voor veilig werken
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SafeWork Pro biedt alle tools om uw veiligheidsprocessen te digitaliseren
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📋",
                title: "TRA Beheer",
                description:
                  "Maak, beheer en goedkeur Taak Risicoanalyses met sjablonen en Kinney & Wiruth risicobeoordeling.",
                color: "from-orange-500 to-orange-600",
              },
              {
                icon: "📱",
                title: "Mobiele LMRA",
                description:
                  "Voer Last Minute Risicoanalyses uit op locatie met GPS en offline functionaliteit.",
                color: "from-green-500 to-green-600",
              },
              {
                icon: "📊",
                title: "Rapportages",
                description:
                  "Genereer rapporten, exporteer naar PDF/Excel en deel compliance-gegevens.",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: "👥",
                title: "Team Samenwerking",
                description:
                  "Werk real-time samen, wijs rollen toe en beheer goedkeuringsworkflows.",
                color: "from-purple-500 to-purple-600",
              },
              {
                icon: "🔐",
                title: "Veilig & Compliant",
                description: "GDPR-compliant, ISO 27001 beveiligd met multi-tenant isolatie.",
                color: "from-red-500 to-red-600",
              },
              {
                icon: "⚡",
                title: "Offline Werken",
                description: "Werk zonder internet. Data synchroniseert automatisch.",
                color: "from-yellow-500 to-yellow-600",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparante prijzen voor elk bedrijf
            </h2>
            <p className="text-xl text-gray-600">
              Start met 14 dagen gratis. Geen creditcard nodig.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "49",
                features: [
                  "5 gebruikers",
                  "50 TRA per maand",
                  "100 LMRA per maand",
                  "Basis rapportages",
                  "Email support",
                ],
                popular: false,
              },
              {
                name: "Professional",
                price: "149",
                features: [
                  "25 gebruikers",
                  "Onbeperkt TRA",
                  "Onbeperkt LMRA",
                  "Geavanceerde rapportages",
                  "Prioriteit support",
                  "Custom branding",
                  "API",
                  "SSO",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "499",
                features: [
                  "Onbeperkt gebruikers",
                  "Onbeperkt alles",
                  "Custom workflows",
                  "Account manager",
                  "24/7 support",
                  "On-premise",
                  "SLA",
                ],
                popular: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all ${plan.popular ? "ring-2 ring-orange-500 scale-105" : "border border-gray-200"}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Meest Populair
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">€{plan.price}</span>
                    <span className="text-gray-600"> /maand</span>
                  </div>
                  <Link
                    href="/auth/register"
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all mb-6 ${plan.popular ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 shadow-md" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}
                  >
                    Start Gratis Trial
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Wat onze klanten zeggen</h2>
            <p className="text-xl text-gray-300">
              Meer dan 500 bedrijven vertrouwen op SafeWork Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "SafeWork Pro heeft onze veiligheidsprocessen compleet getransformeerd. Van papier naar digitaal in enkele weken.",
                author: "Jan de Vries",
                role: "Safety Manager",
                company: "BouwGroep NL",
              },
              {
                quote:
                  "De mobiele LMRA functie is onmisbaar. Direct op locatie controles uitvoeren, zelfs zonder internet.",
                author: "Maria Jansen",
                role: "Hoofd Veiligheid",
                company: "TechConstruct BV",
              },
              {
                quote:
                  "Eindelijk een systeem dat begrijpt wat we nodig hebben. VCA-compliant en gebruiksvriendelijk.",
                author: "Peter Bakker",
                role: "Operations Director",
                company: "Industriebouw Plus",
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-100 mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{t.author}</div>
                    <div className="text-sm text-gray-300">{t.role}</div>
                    <div className="text-sm text-gray-400">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Klaar om veiliger te werken?</h2>
          <p className="text-xl text-orange-50 mb-8">
            Start vandaag met SafeWork Pro. 14 dagen gratis, geen creditcard nodig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-center"
            >
              Start Gratis Trial →
            </Link>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-orange-600 transition-all">
              Plan een Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <span className="text-xl font-bold text-white">SafeWork Pro</span>
              </div>
              <p className="text-gray-400 mb-4">
                De complete digitale oplossing voor veiligheidsmanagement.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-orange-500 transition-colors">
                    Functies
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-orange-500 transition-colors">
                    Prijzen
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Bedrijf</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-orange-500 transition-colors">
                    Over Ons
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-500 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 SafeWork Pro. Alle rechten voorbehouden.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-orange-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-orange-500 transition-colors">
                Voorwaarden
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
