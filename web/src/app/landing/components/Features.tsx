import React from "react";

export const Features = () => {
  const features = [
    {
      icon: "📋",
      title: "TRA Beheer",
      description:
        "Maak, beheer en goedkeur Taak Risicoanalyses met slimme sjablonen en de Kinney & Wiruth risicobeoordeling.",
      color: "from-brand-orange-500 to-brand-orange-600",
      bg: "bg-brand-orange-50 group-hover:bg-brand-orange-100",
    },
    {
      icon: "📱",
      title: "Mobiele LMRA",
      description:
        "Voer Last Minute Risicoanalyses uit op locatie met automatische GPS verificatie en volledige offline functionaliteit.",
      color: "from-green-500 to-green-600",
      bg: "bg-green-50 group-hover:bg-green-100",
    },
    {
      icon: "📊",
      title: "Smart Rapportages",
      description:
        "Genereer professionele PDF-rapporten, exporteer naar Excel en deel real-time compliance-gegevens met auditors.",
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 group-hover:bg-blue-100",
    },
    {
      icon: "👥",
      title: "Team Samenwerking",
      description:
        "Werk real-time samen, wijs rollen toe en beheer complexe goedkeuringsworkflows met digitale handtekeningen.",
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50 group-hover:bg-purple-100",
    },
    {
      icon: "🔐",
      title: "Veilig & Compliant",
      description:
        "Ontworpen met GDPR-bewuste beveiliging. Ondersteunt VCA-audits en vaste veiligheidsprocedures.",
      color: "from-red-500 to-red-600",
      bg: "bg-red-50 group-hover:bg-red-100",
    },
    {
      icon: "⚡",
      title: "Offline First",
      description:
        "Werk zonder onderbrekingen. Data synchroniseert automatisch zodra er weer internetverbinding is.",
      color: "from-yellow-500 to-yellow-600",
      bg: "bg-yellow-50 group-hover:bg-yellow-100",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-block mb-4 px-4 py-1 bg-brand-orange-100 rounded-full">
            <span className="text-brand-orange-700 font-bold text-sm tracking-wide uppercase">
              Platform Features
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-brand-dark-900 mb-6">
            Alles wat u nodig heeft voor veilig werken
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            SafeWork Pro biedt een complete suite aan tools om uw veiligheidsprocessen te digitaliseren, van kantoor tot de bouwplaats.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 ${feature.bg}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-dark-900 mb-3 group-hover:text-brand-orange-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};