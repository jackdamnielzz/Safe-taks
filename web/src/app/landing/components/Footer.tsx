import React from "react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-[#091e42] text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff8b00] to-[#cc6f00] rounded-lg flex items-center justify-center shadow-lg">
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
              <span className="text-2xl font-bold text-white tracking-tight">SafeWork Pro</span>
            </div>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed max-w-md">
              De complete digitale oplossing voor veiligheidsmanagement. VCA-compliant, offline
              beschikbaar en gebouwd voor de moderne bouwplaats.
            </p>
            <div className="flex gap-4">
              {/* Social Media Placeholders */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-[#051228] rounded-full flex items-center justify-center hover:bg-[#ff8b00] transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 bg-white/50 rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <a href="#features" className="hover:text-[#ff8b00] transition-colors">
                  Functies
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#ff8b00] transition-colors">
                  Prijzen
                </a>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-[#ff8b00] transition-colors">
                  Start Gratis Trial
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-[#ff8b00] transition-colors">
                  Inloggen
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Bedrijf</h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="hover:text-[#ff8b00] transition-colors">
                  Over Ons
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ff8b00] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ff8b00] transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ff8b00] transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#051228] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 SafeWork Pro. Alle rechten voorbehouden.
          </p>
          <div className="flex gap-8 text-sm">
            <a href="#" className="text-gray-400 hover:text-[#ff8b00] transition-colors">
              Privacybeleid
            </a>
            <a href="#" className="text-gray-400 hover:text-[#ff8b00] transition-colors">
              Algemene Voorwaarden
            </a>
            <a href="#" className="text-gray-400 hover:text-[#ff8b00] transition-colors">
              Cookie Verklaring
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};