"use client";

import { useState, useEffect } from "react";
import { Check, X, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeadCaptureForm } from "@/components/forms/LeadCaptureForm";
import { crmService } from "@/lib/services/crm-service";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Pricing page component
 * Displays subscription tiers with feature comparison matrix
 */
export default function PricingPage() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Track page view when component mounts
  useEffect(() => {
    crmService.trackPageView();

    // Track CTA clicks
    const trackCTA = (action: string) => {
      crmService.trackCTA(action);
    };

    // Add event listeners to CTA buttons
    const handleTrialClick = () => trackCTA("pricing_trial_click");
    const handleDemoClick = () => trackCTA("pricing_demo_click");

    document.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).textContent?.includes("Start Gratis Trial")) {
        handleTrialClick();
      }
      if ((e.target as HTMLElement).textContent?.includes("Plan een Demo")) {
        handleDemoClick();
      }
    });

    return () => {
      document.removeEventListener("click", handleTrialClick);
      document.removeEventListener("click", handleDemoClick);
    };
  }, []);

  const pricingTiers = [
    {
      name: "Starter",
      monthlyPrice: 49,
      yearlyPrice: 490,
      description: "Voor kleine teams die starten met veiligheid",
      features: [
        "Tot 5 gebruikers",
        "50 TRA's per maand",
        "100 LMRA's per maand",
        "Basis rapportages",
        "E-mail ondersteuning",
        "Standaard sjablonen",
        "Mobiele app toegang",
      ],
      limitations: [
        "Geen API toegang",
        "Geen aangepaste workflows",
        "Geen prioriteit ondersteuning",
      ],
      popular: false,
      cta: "Start Gratis Trial",
    },
    {
      name: "Professional",
      monthlyPrice: 149,
      yearlyPrice: 1490,
      description: "Voor groeiende organisaties met geavanceerde behoeften",
      features: [
        "Tot 25 gebruikers",
        "Onbeperkte TRA's",
        "Onbeperkte LMRA's",
        "Geavanceerde rapportages",
        "API toegang",
        "Aangepaste workflows",
        "SSO integratie",
        "Prioriteit ondersteuning",
        "Alle sjablonen",
        "White-label opties",
      ],
      limitations: [],
      popular: true,
      cta: "Start Gratis Trial",
      badge: "Meest Populair",
    },
    {
      name: "Enterprise",
      monthlyPrice: 499,
      yearlyPrice: 4990,
      description: "Voor grote organisaties met complexe veiligheidseisen",
      features: [
        "Onbeperkte gebruikers",
        "Alle Professional features",
        "Aangepaste integraties",
        "Dedicated support",
        "SLA garantie",
        "On-premise opties",
        "Geavanceerde analytics",
        "Compliance auditing",
        "Custom training",
        "24/7 telefoon ondersteuning",
      ],
      limitations: [],
      popular: false,
      cta: "Neem Contact Op",
      highlight: true,
    },
  ];

  const allFeatures = [
    { name: "Gebruikers", starter: "5", professional: "25", enterprise: "Onbeperkt" },
    { name: "TRA's per maand", starter: "50", professional: "Onbeperkt", enterprise: "Onbeperkt" },
    {
      name: "LMRA's per maand",
      starter: "100",
      professional: "Onbeperkt",
      enterprise: "Onbeperkt",
    },
    { name: "Basis rapportages", starter: true, professional: true, enterprise: true },
    { name: "Geavanceerde rapportages", starter: false, professional: true, enterprise: true },
    { name: "API toegang", starter: false, professional: true, enterprise: true },
    { name: "Aangepaste workflows", starter: false, professional: true, enterprise: true },
    { name: "SSO integratie", starter: false, professional: true, enterprise: true },
    { name: "White-label opties", starter: false, professional: true, enterprise: true },
    { name: "Dedicated support", starter: false, professional: false, enterprise: true },
    { name: "SLA garantie", starter: false, professional: false, enterprise: true },
    { name: "On-premise opties", starter: false, professional: false, enterprise: true },
    { name: "24/7 telefoon ondersteuning", starter: false, professional: false, enterprise: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transparante Prijzen voor Veiligheid
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Kies het abonnement dat past bij uw organisatie en veiligheidseisen
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Maandelijks
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Jaarlijks
              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Bespaar 17%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular ? "border-2 border-blue-500 shadow-lg" : "border border-gray-200"
              } ${tier.highlight ? "bg-gradient-to-br from-blue-50 to-indigo-50" : ""}`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">{tier.badge}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <CardDescription className="text-gray-600 mb-4">{tier.description}</CardDescription>

                <div className="mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      €{billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{billingCycle === "monthly" ? "maand" : "jaar"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-sm text-green-600 mt-1">
                      €{tier.monthlyPrice} per maand bij jaarlijkse betaling
                    </p>
                  )}
                </div>

                <Button
                  className={`w-full ${
                    tier.popular
                      ? "bg-blue-600 hover:bg-blue-700"
                      : tier.highlight
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        : ""
                  }`}
                  variant={tier.popular ? "primary" : "outline"}
                >
                  {tier.cta}
                </Button>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}

                  {tier.limitations.map((limitation, index) => (
                    <li key={`limitation-${index}`} className="flex items-start">
                      <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Feature Vergelijking</h2>
            <p className="text-gray-600 mt-1">
              Gedetailleerde vergelijking van alle functies per abonnement
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Functie
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Starter
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allFeatures.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-900">{feature.starter}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {typeof feature.professional === "boolean" ? (
                        feature.professional ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-900">{feature.professional}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-900">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Veelgestelde Vragen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kan ik van abonnement wisselen?
              </h3>
              <p className="text-gray-600">
                Ja, u kunt op elk moment upgraden of downgraden. Wijzigingen worden direct
                doorgevoerd.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is er een gratis trial periode?
              </h3>
              <p className="text-gray-600">
                Ja, alle abonnementen hebben 14 dagen gratis trial. Geen creditcard vereist.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wat is jullie refund policy?
              </h3>
              <p className="text-gray-600">
                30 dagen geld-terug garantie. Als u niet tevreden bent, krijgt u uw geld terug.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hoe zit het met data privacy?
              </h3>
              <p className="text-gray-600">
                Wij zijn volledig GDPR compliant. Uw data wordt veilig opgeslagen in Europa.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section with Lead Capture */}
        <div className="mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* CTA Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Klaar om te beginnen?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Start vandaag nog met een gratis trial van 14 dagen
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => crmService.trackCTA("pricing_trial_click")}
                >
                  Start Gratis Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => crmService.trackCTA("pricing_demo_click")}
                >
                  Plan een Demo
                </Button>
              </div>
            </div>

            {/* Lead Capture Form */}
            <div className="lg:pl-8">
              <LeadCaptureForm
                title="Ontvang een gepersonaliseerde demo"
                description="Laat uw contactgegevens achter en we nemen binnen 24 uur contact met u op voor een persoonlijke demonstratie."
                source="pricing_page"
                interests={["pricing", "demo"]}
                submitButtonText="Demo Aanvragen"
                className="shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
