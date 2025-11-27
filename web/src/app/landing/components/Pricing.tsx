import React from "react";
import Link from "next/link";

export const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "49",
      description: "Perfect voor kleine teams en ZZP'ers",
      features: [
        "5 gebruikers",
        "50 TRA's per maand",
        "100 LMRA's per maand",
        "Basis rapportages",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "149",
      description: "Voor groeiende bedrijven met meer behoeften",
      features: [
        "25 gebruikers",
        "Onbeperkt TRA's",
        "Onbeperkt LMRA's",
        "Geavanceerde rapportages",
        "Prioriteit support",
        "Eigen huisstijl",
        "API Toegang",
        "SSO Integratie",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "499",
      description: "Volledige controle en maatwerk voor grote organisaties",
      features: [
        "Onbeperkt gebruikers",
        "Onbeperkt alles",
        "Custom workflows",
        "Dedicated account manager",
        "24/7 support",
        "On-premise optie",
        "SLA garanties",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-brand-dark-900 mb-4">
            Transparante prijzen voor elk bedrijf
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kies het pakket dat bij u past. Start met 14 dagen gratis proberen, geen creditcard
            nodig.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? "ring-2 ring-brand-orange-500 scale-105 z-10 shadow-xl"
                  : "border border-gray-100 hover:shadow-xl hover:-translate-y-1"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-orange-600 to-brand-orange-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg shadow-sm uppercase tracking-wide">
                  Meest Gekozen
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-brand-dark-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6 h-10">{plan.description}</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-brand-dark-900">€{plan.price}</span>
                  <span className="text-gray-500 font-medium">/maand</span>
                </div>

                <Link
                  href="/auth/register"
                  className={`block w-full py-4 px-6 rounded-xl font-bold text-center transition-all mb-8 ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#ff8b00] to-[#cc6f00] text-white hover:from-[#cc6f00] hover:to-[#995300] shadow-md hover:shadow-lg"
                      : "bg-brand-dark-50 text-brand-dark-900 hover:bg-brand-dark-100"
                  }`}
                >
                  Start Gratis Trial
                </Link>

                <div className="space-y-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Inclusief:
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <svg
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plan.popular ? "text-brand-orange-500" : "text-green-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};