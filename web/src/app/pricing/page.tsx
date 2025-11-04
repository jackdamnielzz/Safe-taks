/**
 * Pricing Page
 *
 * Displays subscription tiers and allows users to start a trial or upgrade
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { Check, Zap, Building2, Crown } from 'lucide-react';

type BillingInterval = 'monthly' | 'yearly';

const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    icon: Zap,
    color: 'blue',
    description: 'Perfect voor kleine teams die net beginnen',
    monthly: 49,
    yearly: 490,
    popular: false,
    features: [
      'Tot 10 gebruikers',
      'Basis TRA/LMRA functionaliteit',
      '100 TRA\'s per maand',
      'Basis rapportages',
      'Email support',
      'Audit logs',
      'Data export',
    ],
    limits: {
      users: 10,
      projects: 5,
      tras: 100,
      storage: '10 GB',
    },
  },
  professional: {
    name: 'Professional',
    icon: Building2,
    color: 'purple',
    description: 'Voor groeiende organisaties met meer behoeften',
    monthly: 149,
    yearly: 1490,
    popular: true,
    features: [
      'Tot 50 gebruikers',
      'Alle features',
      'Onbeperkt TRA\'s',
      'Geavanceerde rapportages',
      'Priority support',
      'Custom branding',
      'API toegang',
      'Custom workflows',
      'Webhooks',
    ],
    limits: {
      users: 50,
      projects: 25,
      tras: 'Onbeperkt',
      storage: '50 GB',
    },
  },
  enterprise: {
    name: 'Enterprise',
    icon: Crown,
    color: 'gold',
    description: 'Voor grote organisaties met specifieke eisen',
    monthly: 499,
    yearly: 4990,
    popular: false,
    features: [
      'Onbeperkt gebruikers',
      'Alle Professional features',
      'Custom templates',
      'SSO integratie',
      'Dedicated support',
      'SLA garantie',
      'On-premise optie',
      'Custom integraties',
      'Training & onboarding',
    ],
    limits: {
      users: 'Onbeperkt',
      projects: 'Onbeperkt',
      tras: 'Onbeperkt',
      storage: '500 GB',
    },
  },
};

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (tier: 'starter' | 'professional' | 'enterprise') => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setLoading(tier);

    try {
      // Get ID token
      const idToken = await user.getIdToken();

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tier,
          interval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }

    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert(error.message || 'Er is een fout opgetreden. Probeer het opnieuw.');
      setLoading(null);
    }
  };

  const getYearlySavings = (monthly: number) => {
    const yearlyTotal = monthly * 12;
    const yearlyPrice = monthly * 10; // ~17% discount
    const savings = yearlyTotal - yearlyPrice;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kies het juiste plan voor uw organisatie
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start met een 14-dagen gratis proefperiode. Geen creditcard vereist.
          </p>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Maandelijks
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                interval === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jaarlijks
              <span className="ml-2 text-sm text-green-600 font-semibold">
                Bespaar ~17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(PRICING_TIERS).map(([key, tier]) => {
            const Icon = tier.icon;
            const price = interval === 'monthly' ? tier.monthly : tier.yearly;
            const isPopular = tier.popular || false;

            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Populair
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-${tier.color}-100`}>
                      <Icon className={`w-6 h-6 text-${tier.color}-600`} />
                    </div>
                    <h3 className="ml-3 text-2xl font-bold text-gray-900">
                      {tier.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">
                        €{price}
                      </span>
                      <span className="ml-2 text-gray-600">
                        /{interval === 'monthly' ? 'maand' : 'jaar'}
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <p className="text-sm text-green-600 mt-2">
                        Bespaar €{getYearlySavings(tier.monthly)} per jaar
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(key as any)}
                    disabled={loading !== null}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === key ? 'Laden...' : 'Start gratis proefperiode'}
                  </button>

                  {/* Features */}
                  <ul className="mt-8 space-y-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limits */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Limieten</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Gebruikers:</dt>
                        <dd className="font-medium text-gray-900">{tier.limits.users}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Projecten:</dt>
                        <dd className="font-medium text-gray-900">{tier.limits.projects}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">TRA's:</dt>
                        <dd className="font-medium text-gray-900">{tier.limits.tras}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Opslag:</dt>
                        <dd className="font-medium text-gray-900">{tier.limits.storage}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Veelgestelde vragen
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kan ik later upgraden of downgraden?
              </h3>
              <p className="text-gray-600">
                Ja, u kunt op elk moment upgraden of downgraden. Bij een upgrade krijgt u direct toegang tot de nieuwe features. Bij een downgrade blijven de features actief tot het einde van uw huidige facturatieperiode.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wat gebeurt er na de proefperiode?
              </h3>
              <p className="text-gray-600">
                Na 14 dagen wordt uw gekozen abonnement automatisch geactiveerd. U ontvangt vooraf een herinnering. U kunt op elk moment annuleren zonder kosten tijdens de proefperiode.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welke betaalmethoden accepteren jullie?
              </h3>
              <p className="text-gray-600">
                We accepteren alle gangbare creditcards (Visa, Mastercard, American Express), iDEAL en SEPA automatische incasso voor Nederlandse bedrijven.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is er een setup fee of verborgen kosten?
              </h3>
              <p className="text-gray-600">
                Nee, er zijn geen setup fees of verborgen kosten. U betaalt alleen het maandelijkse of jaarlijkse abonnementsbedrag.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Heeft u vragen of wilt u een demo?
          </p>
          <a
            href="mailto:sales@safeworkpro.nl"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
          >
            Neem contact op
          </a>
        </div>
      </div>
    </div>
  );
}
